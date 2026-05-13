import { Router } from "express";
import { db, telegramConfigTable, telegramChatsTable, telegramLogsTable, workOrdersTable, preventivePlansTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import https from "https";

const router = Router();

async function callTelegramAPI(token: string, method: string, body?: object): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options: https.RequestOptions = {
      hostname: "api.telegram.org",
      port: 443,
      path: `/bot${token}/${method}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(data ? { "Content-Length": Buffer.byteLength(data).toString() } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => { raw += chunk; });
      res.on("end", () => {
        try { resolve(JSON.parse(raw)); } catch { reject(new Error("Invalid JSON")); }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

router.get("/telegram/config", async (req, res) => {
  try {
    const [cfg] = await db.select().from(telegramConfigTable);
    if (!cfg) return res.json({ configured: false });
    res.json({ configured: !!cfg.botToken, botUsername: cfg.botUsername });
    return;
  } catch (err) {
    req.log.error({ err }, "Error fetching telegram config");
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

router.put("/telegram/config", async (req, res) => {
  try {
    const { botToken } = req.body;
    if (!botToken) return res.status(400).json({ error: "botToken required" });

    const meResult = await callTelegramAPI(botToken, "getMe");
    if (!meResult.ok) return res.status(400).json({ error: "Invalid bot token" });
    const botUsername = meResult.result.username;

    const existing = await db.select().from(telegramConfigTable);
    if (existing.length === 0) {
      await db.insert(telegramConfigTable).values({ botToken, botUsername });
    } else {
      await db.update(telegramConfigTable).set({ botToken, botUsername });
    }
    res.json({ ok: true, botUsername });
    return;
  } catch (err) {
    req.log.error({ err }, "Error updating telegram config");
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

router.get("/telegram/chats", async (req, res) => {
  try {
    const chats = await db.select().from(telegramChatsTable);
    res.json(chats.map(c => ({ ...c, addedAt: c.addedAt.toISOString() })));
    return;
  } catch (err) {
    req.log.error({ err }, "Error fetching telegram chats");
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

router.post("/telegram/chats", async (req, res) => {
  try {
    const { chatId, name, type } = req.body;
    if (!chatId || !name) return res.status(400).json({ error: "chatId and name required" });
    const [chat] = await db.insert(telegramChatsTable).values({
      chatId: String(chatId), name, type: type || "private", allowed: true,
    }).returning();
    res.status(201).json({ ...chat, addedAt: chat.addedAt.toISOString() });
    return;
  } catch (err) {
    req.log.error({ err }, "Error adding telegram chat");
    res.status(400).json({ error: "Invalid request" });
    return;
  }
});

router.delete("/telegram/chats/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(telegramChatsTable).where(eq(telegramChatsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting telegram chat");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/telegram/send", async (req, res) => {
  try {
    const { chatId, message } = req.body;
    if (!chatId || !message) return res.status(400).json({ error: "chatId and message required" });
    const [cfg] = await db.select().from(telegramConfigTable);
    if (!cfg?.botToken) return res.status(400).json({ error: "Bot not configured" });

    const result = await callTelegramAPI(cfg.botToken, "sendMessage", {
      chat_id: chatId, text: message, parse_mode: "HTML",
    });

    if (result.ok) {
      await db.insert(telegramLogsTable).values({
        chatId: String(chatId), direction: "out",
        text: message, eventType: "manual_send", reply: null,
      });
      res.json({ ok: true });
    } else {
      res.status(400).json({ error: result.description || "Send failed" });
    }
    return;
  } catch (err) {
    req.log.error({ err }, "Error sending telegram message");
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

router.get("/telegram/logs", async (req, res) => {
  try {
    const logs = await db.select().from(telegramLogsTable).orderBy(telegramLogsTable.timestamp);
    res.json(logs.map(l => ({ ...l, timestamp: l.timestamp.toISOString() })));
    return;
  } catch (err) {
    req.log.error({ err }, "Error fetching telegram logs");
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

// Webhook for Telegram button callbacks (inline keyboard actions)
router.post("/telegram/webhook", async (req, res) => {
  try {
    const update = req.body;
    const [cfg] = await db.select().from(telegramConfigTable);
    const token = cfg?.botToken;

    // Handle inline keyboard callback
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message?.chat?.id;
      const data: string = cb.data || "";
      let replyText = "✅ Action enregistrée";

      // wo_status:{woId}:{status}
      if (data.startsWith("wo_status:")) {
        const parts = data.split(":");
        const woId = Number(parts[1]);
        const newStatus = parts[2];
        const validStatuses = ["in_progress", "completed", "on_hold", "cancelled", "open"];

        if (validStatuses.includes(newStatus) && !isNaN(woId)) {
          const updateData: any = { status: newStatus };
          if (newStatus === "completed") updateData.completedDate = new Date().toISOString().split("T")[0];

          const [updated] = await db.update(workOrdersTable)
            .set(updateData)
            .where(eq(workOrdersTable.id, woId))
            .returning();

          if (updated) {
            const statusLabels: Record<string, string> = {
              in_progress: "▶️ En cours", completed: "✅ Terminé",
              on_hold: "⏸ En attente", cancelled: "❌ Annulé", open: "🔵 Ouvert",
            };
            replyText = `${statusLabels[newStatus] || newStatus} — OT #${woId} mis à jour`;
          } else {
            replyText = `❌ OT #${woId} introuvable`;
          }
        }
      }

      // prev_status:{planId}:{status}
      if (data.startsWith("prev_status:")) {
        const parts = data.split(":");
        const planId = Number(parts[1]);
        const newStatus = parts[2];
        if (["active", "inactive"].includes(newStatus) && !isNaN(planId)) {
          await db.update(preventivePlansTable).set({ status: newStatus as any }).where(eq(preventivePlansTable.id, planId));
          replyText = `⏸ Plan #${planId} reporté`;
        }
      }

      // prev_execute:{planId} — handled externally, just confirm
      if (data.startsWith("prev_execute:") || data.startsWith("prev_done:")) {
        const planId = Number(data.split(":")[1]);
        if (data.startsWith("prev_done:")) {
          await db.update(preventivePlansTable).set({
            lastExecuted: new Date().toISOString().split("T")[0],
            status: "active",
          }).where(eq(preventivePlansTable.id, planId));
          replyText = `✅ Plan #${planId} marqué comme exécuté`;
        } else {
          replyText = `▶️ Pour exécuter le plan #${planId}, utilisez l'application SWAN GMAO`;
        }
      }

      // Log incoming callback
      await db.insert(telegramLogsTable).values({
        chatId: String(chatId || "unknown"),
        direction: "in",
        text: data,
        eventType: "callback",
        reply: replyText,
      });

      // Answer callback query (removes loading state on button)
      if (token) {
        await callTelegramAPI(token, "answerCallbackQuery", {
          callback_query_id: cb.id,
          text: replyText,
          show_alert: false,
        });
        // Edit the original message to show updated status
        if (cb.message?.message_id && chatId) {
          await callTelegramAPI(token, "editMessageReplyMarkup", {
            chat_id: chatId,
            message_id: cb.message.message_id,
            reply_markup: { inline_keyboard: [] },
          }).catch(() => {});
          await callTelegramAPI(token, "sendMessage", {
            chat_id: chatId,
            text: replyText,
          }).catch(() => {});
        }
      }
    }

    // Handle regular messages (log them)
    if (update.message?.text) {
      const msg = update.message;
      const chatId = String(msg.chat?.id || "");
      const text = msg.text || "";

      await db.insert(telegramLogsTable).values({
        chatId, direction: "in", text, eventType: "message", reply: null,
      }).catch(() => {});
    }

    res.json({ ok: true });
    return;
  } catch (err) {
    req.log.error({ err }, "Webhook error");
    res.json({ ok: true }); // Always return 200 to Telegram
    return;
  }
});

export default router;

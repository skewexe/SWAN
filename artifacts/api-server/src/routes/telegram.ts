import { Router } from "express";
import { db, telegramConfigTable, telegramChatsTable, telegramLogsTable } from "@workspace/db";
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
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
    });

    if (result.ok) {
      await db.insert(telegramLogsTable).values({
        chatId: String(chatId),
        direction: "out",
        text: message,
        eventType: "manual_send",
        reply: null,
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
    const logs = await db.select().from(telegramLogsTable)
      .orderBy(telegramLogsTable.timestamp);
    res.json(logs.map(l => ({ ...l, timestamp: l.timestamp.toISOString() })));
    return;
  } catch (err) {
    req.log.error({ err }, "Error fetching telegram logs");
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

export default router;

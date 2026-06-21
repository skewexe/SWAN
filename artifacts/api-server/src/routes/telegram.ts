import { Router } from "express";
import { db, telegramConfigTable, telegramChatsTable, telegramLogsTable, workOrdersTable, preventivePlansTable, techniciansTable, assetsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import https from "https";

const router = Router();

// ─── In-memory pending action state (multi-step conversations) ────────────────
type PendingAction =
  | { action: "comment"; woId: number }
  | { action: "create_ot_title" }
  | { action: "create_ot_priority"; title: string }
  | { action: "create_ot_description"; title: string; priority: string };

const pendingActions = new Map<string, PendingAction>();

// ─── Telegram API helper ──────────────────────────────────────────────────────
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

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  open: "🔵 Ouvert",
  in_progress: "▶️ En cours",
  completed: "✅ Terminé",
  on_hold: "⏸ En attente",
  cancelled: "❌ Annulé",
};

const PRIORITY_EMOJI: Record<string, string> = {
  critical: "🔴", high: "🟠", medium: "🟡", low: "🟢",
};

const TYPE_LABEL: Record<string, string> = {
  corrective: "Corrective", preventive: "Préventive",
  predictive: "Prédictive", inspection: "Inspection",
};

/** Build inline keyboard buttons for a given work order (based on current status). */
function buildWoKeyboard(woId: number, currentStatus: string): any[][] {
  const rows: any[][] = [];

  if (currentStatus === "open") {
    rows.push([
      { text: "▶️ Commencer", callback_data: `wo_status:${woId}:in_progress` },
      { text: "⏸ En attente", callback_data: `wo_status:${woId}:on_hold` },
    ]);
    rows.push([
      { text: "❌ Annuler", callback_data: `wo_status:${woId}:cancelled` },
      { text: "💬 Commenter", callback_data: `wo_comment:${woId}` },
    ]);
  } else if (currentStatus === "in_progress") {
    rows.push([
      { text: "✅ Terminer", callback_data: `wo_status:${woId}:completed` },
      { text: "⏸ En attente", callback_data: `wo_status:${woId}:on_hold` },
    ]);
    rows.push([
      { text: "🔵 Rouvrir", callback_data: `wo_status:${woId}:open` },
      { text: "💬 Commenter", callback_data: `wo_comment:${woId}` },
    ]);
    rows.push([
      { text: "❌ Annuler", callback_data: `wo_status:${woId}:cancelled` },
    ]);
  } else if (currentStatus === "on_hold") {
    rows.push([
      { text: "▶️ Reprendre", callback_data: `wo_status:${woId}:in_progress` },
      { text: "✅ Terminer", callback_data: `wo_status:${woId}:completed` },
    ]);
    rows.push([
      { text: "🔵 Rouvrir", callback_data: `wo_status:${woId}:open` },
      { text: "💬 Commenter", callback_data: `wo_comment:${woId}` },
    ]);
    rows.push([
      { text: "❌ Annuler", callback_data: `wo_status:${woId}:cancelled` },
    ]);
  } else if (currentStatus === "completed" || currentStatus === "cancelled") {
    rows.push([
      { text: "🔄 Rouvrir l'OT", callback_data: `wo_status:${woId}:open` },
      { text: "💬 Commenter", callback_data: `wo_comment:${woId}` },
    ]);
  } else {
    // fallback
    rows.push([
      { text: "▶️ Commencer", callback_data: `wo_status:${woId}:in_progress` },
      { text: "✅ Terminer", callback_data: `wo_status:${woId}:completed` },
    ]);
    rows.push([
      { text: "⏸ En attente", callback_data: `wo_status:${woId}:on_hold` },
      { text: "💬 Commenter", callback_data: `wo_comment:${woId}` },
    ]);
  }

  return rows;
}

/** Build a full OT message text for a work order. */
async function buildWoText(wo: any): Promise<string> {
  const assets = await db.select().from(assetsTable).where(eq(assetsTable.id, wo.assetId || -1));
  const asset = assets[0];
  const techs = wo.technicianId
    ? await db.select().from(techniciansTable).where(eq(techniciansTable.id, wo.technicianId))
    : [];
  const tech = techs[0];

  const lines = [
    `🔧 <b>Ordre de Travail #${wo.id}</b>`,
    ``,
    `📋 <b>${wo.title}</b>`,
    wo.description ? `📝 ${wo.description}` : null,
    ``,
    `${PRIORITY_EMOJI[wo.priority] || "⚪"} Priorité : <b>${wo.priority.toUpperCase()}</b>`,
    `📁 Type : ${TYPE_LABEL[wo.type] || wo.type}`,
    `📊 Statut : ${STATUS_LABELS[wo.status] || wo.status}`,
    asset ? `🏭 Équipement : ${asset.name}` : null,
    tech ? `👤 Technicien : ${tech.name}` : null,
    wo.scheduledDate ? `📅 Date planifiée : ${new Date(wo.scheduledDate).toLocaleDateString("fr-DZ")}` : null,
    wo.estimatedHours ? `⏱ Durée estimée : ${wo.estimatedHours}h` : null,
    wo.notes ? `\n💬 <b>Notes :</b>\n${wo.notes}` : null,
  ];
  return lines.filter(Boolean).join("\n");
}

/** Send a work order card with fresh status buttons to a chat. */
async function sendWoCard(token: string, chatId: string, wo: any): Promise<void> {
  const text = await buildWoText(wo);
  await callTelegramAPI(token, "sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: buildWoKeyboard(wo.id, wo.status) },
  });
}

/** Help message */
const HELP_TEXT = `🤖 <b>SWAN GMAO — Commandes disponibles</b>

<b>Ordres de travail :</b>
/ot <code>{id}</code> — Voir un OT et changer son statut
/mes_ot — Voir vos OTs assignés
/commentaire <code>{id}</code> <code>{texte}</code> — Ajouter un commentaire

<b>Création d'OT :</b>
/creer_ot — Créer un OT guidé (3 étapes)
/signaler <code>{titre}</code> — Ticket correctif rapide
/signaler <code>{titre}</code> | <code>{description}</code> — Avec description

<b>Navigation :</b>
/aide — Afficher ce message d'aide

<b>Boutons interactifs :</b>
Utilisez les boutons sous chaque OT pour changer le statut ou commenter. Vous pouvez changer le statut autant de fois que nécessaire.`;

// ─── Routes de configuration ──────────────────────────────────────────────────

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

function getWebhookUrl(): string {
  const domain = (process.env.REPLIT_DOMAINS || process.env.REPLIT_DEV_DOMAIN || "").split(",")[0].trim();
  return domain ? `https://${domain}/api/telegram/webhook` : "";
}

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

    const webhookUrl = getWebhookUrl();
    let webhookRegistered = false;
    if (webhookUrl) {
      const wh = await callTelegramAPI(botToken, "setWebhook", {
        url: webhookUrl,
        allowed_updates: ["message", "callback_query"],
        drop_pending_updates: true,
      });
      webhookRegistered = wh.ok;
    }

    res.json({ ok: true, botUsername, webhookRegistered, webhookUrl });
    return;
  } catch (err) {
    req.log.error({ err }, "Error updating telegram config");
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

router.get("/telegram/webhook-info", async (req, res) => {
  try {
    const [cfg] = await db.select().from(telegramConfigTable);
    if (!cfg?.botToken) return res.json({ configured: false });
    const info = await callTelegramAPI(cfg.botToken, "getWebhookInfo");
    res.json({ configured: true, ...info.result, expectedUrl: getWebhookUrl() });
    return;
  } catch (err) {
    req.log.error({ err }, "Error fetching webhook info");
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

router.post("/telegram/register-webhook", async (req, res) => {
  try {
    const [cfg] = await db.select().from(telegramConfigTable);
    if (!cfg?.botToken) return res.status(400).json({ error: "Bot not configured" });
    const webhookUrl = getWebhookUrl();
    if (!webhookUrl) return res.status(400).json({ error: "Cannot determine public domain" });

    const result = await callTelegramAPI(cfg.botToken, "setWebhook", {
      url: webhookUrl,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: true,
    });

    if (result.ok) {
      res.json({ ok: true, url: webhookUrl });
    } else {
      res.status(400).json({ error: result.description || "setWebhook failed" });
    }
    return;
  } catch (err) {
    req.log.error({ err }, "Error registering webhook");
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

// ─── Webhook principal ────────────────────────────────────────────────────────
router.post("/telegram/webhook", async (req, res) => {
  // Always respond 200 immediately to avoid Telegram retry storms
  res.json({ ok: true });

  try {
    const update = req.body;
    const [cfg] = await db.select().from(telegramConfigTable);
    const token = cfg?.botToken;
    if (!token) return;

    // ── Inline keyboard callback ──────────────────────────────────────────────
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = String(cb.message?.chat?.id || "");
      const data: string = cb.data || "";

      // Acknowledge button press immediately
      await callTelegramAPI(token, "answerCallbackQuery", {
        callback_query_id: cb.id,
        show_alert: false,
      }).catch(() => {});

      // Remove buttons from original message so it's clear it was acted on
      if (cb.message?.message_id && chatId) {
        await callTelegramAPI(token, "editMessageReplyMarkup", {
          chat_id: chatId,
          message_id: cb.message.message_id,
          reply_markup: { inline_keyboard: [] },
        }).catch(() => {});
      }

      // ── wo_status:{woId}:{status} ─────────────────────────────────────────
      if (data.startsWith("wo_status:")) {
        const [, rawId, newStatus] = data.split(":");
        const woId = Number(rawId);
        const validStatuses = ["open", "in_progress", "completed", "on_hold", "cancelled"];

        if (validStatuses.includes(newStatus) && !isNaN(woId)) {
          const updateData: any = { status: newStatus };
          if (newStatus === "completed") updateData.completedDate = new Date().toISOString().split("T")[0];

          const [updated] = await db.update(workOrdersTable)
            .set(updateData)
            .where(eq(workOrdersTable.id, woId))
            .returning();

          if (updated) {
            await db.insert(telegramLogsTable).values({
              chatId, direction: "in", text: data,
              eventType: "callback",
              reply: `Statut OT #${woId} → ${STATUS_LABELS[newStatus]}`,
            });
            // Send fresh OT card with NEW buttons for the updated status
            await sendWoCard(token, chatId, updated);
          } else {
            await callTelegramAPI(token, "sendMessage", {
              chat_id: chatId,
              text: `❌ OT #${woId} introuvable.`,
            });
          }
        }
      }

      // ── wo_comment:{woId} ─────────────────────────────────────────────────
      else if (data.startsWith("wo_comment:")) {
        const woId = Number(data.split(":")[1]);
        if (!isNaN(woId)) {
          pendingActions.set(chatId, { action: "comment", woId });
          await callTelegramAPI(token, "sendMessage", {
            chat_id: chatId,
            text: `💬 Envoyez votre commentaire pour l'OT #${woId} :`,
          });
          await db.insert(telegramLogsTable).values({
            chatId, direction: "in", text: data,
            eventType: "callback", reply: `Mode commentaire OT #${woId}`,
          });
        }
      }

      // ── prev_status:{planId}:{status} ────────────────────────────────────
      else if (data.startsWith("prev_status:")) {
        const [, rawId, newStatus] = data.split(":");
        const planId = Number(rawId);
        if (["active", "inactive"].includes(newStatus) && !isNaN(planId)) {
          await db.update(preventivePlansTable)
            .set({ status: newStatus as any })
            .where(eq(preventivePlansTable.id, planId));
          const label = newStatus === "inactive" ? "⏸ Reporté" : "✅ Activé";
          await callTelegramAPI(token, "sendMessage", {
            chat_id: chatId,
            text: `${label} — Plan préventif #${planId} mis à jour.`,
          });
          await db.insert(telegramLogsTable).values({
            chatId, direction: "in", text: data,
            eventType: "callback", reply: `Plan #${planId} → ${newStatus}`,
          });
        }
      }

      // ── prev_done:{planId} ────────────────────────────────────────────────
      else if (data.startsWith("prev_done:")) {
        const planId = Number(data.split(":")[1]);
        if (!isNaN(planId)) {
          await db.update(preventivePlansTable).set({
            lastExecuted: new Date().toISOString().split("T")[0],
            status: "active",
          }).where(eq(preventivePlansTable.id, planId));
          await callTelegramAPI(token, "sendMessage", {
            chat_id: chatId,
            text: `✅ Plan préventif #${planId} marqué comme exécuté.`,
          });
          await db.insert(telegramLogsTable).values({
            chatId, direction: "in", text: data,
            eventType: "callback", reply: `Plan #${planId} exécuté`,
          });
        }
      }

      // ── create_prio:{priority} ─────────────────────────────────────────────
      else if (data.startsWith("create_prio:")) {
        const priority = data.split(":")[1];
        const pending = pendingActions.get(chatId);
        if (pending?.action === "create_ot_priority") {
          const { title } = pending;
          pendingActions.set(chatId, { action: "create_ot_description", title, priority });
          const PRIORITY_LABELS: Record<string, string> = {
            low: "🟢 Faible", medium: "🟡 Moyenne", high: "🟠 Élevée", critical: "🔴 Critique",
          };
          await callTelegramAPI(token, "sendMessage", {
            chat_id: chatId,
            text: `✅ Priorité : <b>${PRIORITY_LABELS[priority] || priority}</b>\n\n📝 <b>Étape 3/3</b> — Envoyez une description pour l'OT :\n\n<i>Ou envoyez</i> <code>/ignorer</code> <i>pour créer l'OT sans description.</i>`,
            parse_mode: "HTML",
          });
        } else {
          await callTelegramAPI(token, "sendMessage", {
            chat_id: chatId,
            text: `⚠️ Session expirée. Recommencez avec /creer_ot`,
          });
        }
      }

      else if (data.startsWith("prev_execute:")) {
        const planId = Number(data.split(":")[1]);
        await callTelegramAPI(token, "sendMessage", {
          chat_id: chatId,
          text: `▶️ Pour exécuter le plan #${planId}, rendez-vous dans l'application SWAN GMAO.`,
        });
      }

      return;
    }

    // ── Regular text message ──────────────────────────────────────────────────
    if (update.message?.text) {
      const msg = update.message;
      const chatId = String(msg.chat?.id || "");
      const text: string = (msg.text || "").trim();

      await db.insert(telegramLogsTable).values({
        chatId, direction: "in", text, eventType: "message", reply: null,
      }).catch(() => {});

      // ── Pending multi-step actions ────────────────────────────────────────
      const pending = pendingActions.get(chatId);

      // ─ Step: waiting for comment text ─
      if (pending?.action === "comment") {
        pendingActions.delete(chatId);
        const { woId } = pending;

        // Resolve technician name for attribution
        const techs = await db.select().from(techniciansTable)
          .where(eq(techniciansTable.telegramChatId, chatId));
        const tech = techs[0];
        const authorName = tech?.name || "Telegram";

        const timestamp = new Date().toLocaleString("fr-DZ", { dateStyle: "short", timeStyle: "short" });
        const commentLine = `[${timestamp}][${authorName}] ${text}`;

        const [wo] = await db.select().from(workOrdersTable).where(eq(workOrdersTable.id, woId));
        if (wo) {
          const newNotes = wo.notes ? `${wo.notes}\n${commentLine}` : commentLine;
          const [updated] = await db.update(workOrdersTable)
            .set({ notes: newNotes })
            .where(eq(workOrdersTable.id, woId))
            .returning();

          await callTelegramAPI(token, "sendMessage", {
            chat_id: chatId,
            text: `✅ Commentaire ajouté à l'OT #${woId}.\n\nVoulez-vous changer le statut ?`,
            parse_mode: "HTML",
            reply_markup: { inline_keyboard: buildWoKeyboard(woId, updated.status) },
          });
          await db.insert(telegramLogsTable).values({
            chatId, direction: "out", text: `Commentaire OT #${woId}`,
            eventType: "comment", reply: text,
          });
        } else {
          await callTelegramAPI(token, "sendMessage", {
            chat_id: chatId, text: `❌ OT #${woId} introuvable.`,
          });
        }
        return;
      }

      // ─ Step 1: waiting for OT title ─
      if (pending?.action === "create_ot_title") {
        const title = text.trim();
        if (!title || title.startsWith("/")) {
          await callTelegramAPI(token, "sendMessage", {
            chat_id: chatId,
            text: `⚠️ Titre invalide. Envoyez simplement le titre de l'OT (ex: <code>Pompe A3 — fuite d'huile</code>)`,
            parse_mode: "HTML",
          });
          return;
        }
        pendingActions.set(chatId, { action: "create_ot_priority", title });
        await callTelegramAPI(token, "sendMessage", {
          chat_id: chatId,
          text: `📋 <b>Titre :</b> ${title}\n\n🎯 <b>Étape 2/3</b> — Choisissez la priorité :`,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "🟢 Faible", callback_data: "create_prio:low" },
                { text: "🟡 Moyenne", callback_data: "create_prio:medium" },
              ],
              [
                { text: "🟠 Élevée", callback_data: "create_prio:high" },
                { text: "🔴 Critique", callback_data: "create_prio:critical" },
              ],
            ],
          },
        });
        return;
      }

      // ─ Step 3: waiting for OT description (or /ignorer) ─
      if (pending?.action === "create_ot_description") {
        pendingActions.delete(chatId);
        const { title, priority } = pending;
        const description = (text.trim().toLowerCase() === "/ignorer" || text.trim().toLowerCase() === "/skip")
          ? null
          : text.trim();

        const techs = await db.select().from(techniciansTable)
          .where(eq(techniciansTable.telegramChatId, chatId));
        const tech = techs[0];

        const PRIORITY_LABELS: Record<string, string> = {
          low: "🟢 Faible", medium: "🟡 Moyenne", high: "🟠 Élevée", critical: "🔴 Critique",
        };

        const [wo] = await db.insert(workOrdersTable).values({
          title,
          description: description || `OT créé via Telegram par ${tech?.name || "Technicien"} (chat: ${chatId})`,
          type: "corrective",
          priority: priority as any,
          status: "open",
          technicianId: tech?.id || null,
          scheduledDate: new Date().toISOString().split("T")[0],
        }).returning();

        await callTelegramAPI(token, "sendMessage", {
          chat_id: chatId,
          text: `✅ <b>OT créé — #${wo.id}</b>\n\n📋 <b>${wo.title}</b>\n${description ? `📝 ${description}\n` : ""}${PRIORITY_LABELS[priority] || priority} | 📁 Corrective | 🔵 Ouvert${tech ? `\n👤 Assigné à : ${tech.name}` : ""}\n\nVous pouvez maintenant gérer le statut :`,
          parse_mode: "HTML",
          reply_markup: { inline_keyboard: buildWoKeyboard(wo.id, wo.status) },
        });
        await db.insert(telegramLogsTable).values({
          chatId, direction: "out", text: `/creer_ot → OT #${wo.id}`,
          eventType: "ticket_created", reply: `Titre: ${title} | Priorité: ${priority}`,
        });
        return;
      }

      // ── Command parser ────────────────────────────────────────────────────
      const lower = text.toLowerCase();

      // /aide or /help or /start
      if (lower === "/aide" || lower === "/help" || lower === "/start") {
        await callTelegramAPI(token, "sendMessage", {
          chat_id: chatId, text: HELP_TEXT, parse_mode: "HTML",
        });
        return;
      }

      // /ot {id}
      if (lower.startsWith("/ot ") || lower.startsWith("/ot@")) {
        const woId = Number(text.replace(/\D+/g, "").slice(0, 8));
        if (!isNaN(woId) && woId > 0) {
          const [wo] = await db.select().from(workOrdersTable).where(eq(workOrdersTable.id, woId));
          if (wo) {
            await sendWoCard(token, chatId, wo);
          } else {
            await callTelegramAPI(token, "sendMessage", {
              chat_id: chatId, text: `❌ OT #${woId} introuvable.`,
            });
          }
        } else {
          await callTelegramAPI(token, "sendMessage", {
            chat_id: chatId, text: `⚠️ Usage : <code>/ot 42</code>`, parse_mode: "HTML",
          });
        }
        return;
      }

      // /mes_ot — list OTs assigned to this technician (lookup by telegramChatId)
      if (lower === "/mes_ot" || lower === "/mesot") {
        const techs = await db.select().from(techniciansTable)
          .where(eq(techniciansTable.telegramChatId, chatId));
        const tech = techs[0];
        if (!tech) {
          await callTelegramAPI(token, "sendMessage", {
            chat_id: chatId,
            text: `⚠️ Votre ID Telegram (<code>${chatId}</code>) n'est associé à aucun technicien.\nDemandez à votre administrateur de le configurer dans SWAN GMAO.`,
            parse_mode: "HTML",
          });
          return;
        }
        const wos = await db.select().from(workOrdersTable)
          .where(and(
            eq(workOrdersTable.technicianId, tech.id),
          ));
        const active = wos.filter(w => w.status !== "completed" && w.status !== "cancelled");
        if (active.length === 0) {
          await callTelegramAPI(token, "sendMessage", {
            chat_id: chatId, text: `✅ Aucun OT actif assigné à <b>${tech.name}</b>.`, parse_mode: "HTML",
          });
          return;
        }
        const lines = active.map(w =>
          `${PRIORITY_EMOJI[w.priority] || "⚪"} <b>OT #${w.id}</b> — ${w.title}\n   ${STATUS_LABELS[w.status] || w.status} | /ot ${w.id}`
        );
        await callTelegramAPI(token, "sendMessage", {
          chat_id: chatId,
          text: `📋 <b>Vos OTs actifs — ${tech.name}</b>\n\n${lines.join("\n\n")}`,
          parse_mode: "HTML",
        });
        return;
      }

      // /commentaire {id} {texte}
      if (lower.startsWith("/commentaire ")) {
        const rest = text.slice("/commentaire ".length).trim();
        const match = rest.match(/^(\d+)\s+(.+)$/s);
        if (!match) {
          await callTelegramAPI(token, "sendMessage", {
            chat_id: chatId,
            text: `⚠️ Usage : <code>/commentaire 42 Votre commentaire ici</code>`,
            parse_mode: "HTML",
          });
          return;
        }
        const woId = Number(match[1]);
        const comment = match[2].trim();
        const [wo] = await db.select().from(workOrdersTable).where(eq(workOrdersTable.id, woId));
        if (!wo) {
          await callTelegramAPI(token, "sendMessage", {
            chat_id: chatId, text: `❌ OT #${woId} introuvable.`,
          });
          return;
        }
        const timestamp = new Date().toLocaleString("fr-DZ", { dateStyle: "short", timeStyle: "short" });
        const commentLine = `[${timestamp}] ${comment}`;
        const newNotes = wo.notes ? `${wo.notes}\n${commentLine}` : commentLine;
        const [updated] = await db.update(workOrdersTable)
          .set({ notes: newNotes })
          .where(eq(workOrdersTable.id, woId))
          .returning();
        await callTelegramAPI(token, "sendMessage", {
          chat_id: chatId,
          text: `✅ Commentaire ajouté à l'OT #${woId}.`,
          parse_mode: "HTML",
          reply_markup: { inline_keyboard: buildWoKeyboard(woId, updated.status) },
        });
        await db.insert(telegramLogsTable).values({
          chatId, direction: "out", text: `Commentaire OT #${woId}`,
          eventType: "comment", reply: comment,
        });
        return;
      }

      // /signaler {titre} or /signaler {titre} | {description}
      if (lower.startsWith("/signaler ")) {
        const rest = text.slice("/signaler ".length).trim();
        if (!rest) {
          await callTelegramAPI(token, "sendMessage", {
            chat_id: chatId,
            text: `⚠️ Usage : <code>/signaler Titre du problème</code>\nou avec description :\n<code>/signaler Compresseur C1 | Vibrations anormales détectées</code>`,
            parse_mode: "HTML",
          });
          return;
        }

        const parts = rest.split("|");
        const title = parts[0].trim();
        const description = parts[1]?.trim() || null;

        // Find technician by chatId to auto-assign
        const techs = await db.select().from(techniciansTable)
          .where(eq(techniciansTable.telegramChatId, chatId));
        const tech = techs[0];

        const [wo] = await db.insert(workOrdersTable).values({
          title,
          description: description || `Signalement via Telegram par ${tech?.name || "Technicien"} (chat: ${chatId})`,
          type: "corrective",
          priority: "medium",
          status: "open",
          technicianId: tech?.id || null,
          scheduledDate: new Date().toISOString().split("T")[0],
        }).returning();

        await callTelegramAPI(token, "sendMessage", {
          chat_id: chatId,
          text: `✅ <b>Ticket créé — OT #${wo.id}</b>\n\n📋 <b>${wo.title}</b>\n${description ? `📝 ${description}\n` : ""}🟡 Priorité : MEDIUM\n📁 Type : Corrective\n📊 Statut : 🔵 Ouvert\n\nVous pouvez changer le statut ou ajouter des détails :`,
          parse_mode: "HTML",
          reply_markup: { inline_keyboard: buildWoKeyboard(wo.id, wo.status) },
        });
        await db.insert(telegramLogsTable).values({
          chatId, direction: "out", text: `/signaler → OT #${wo.id}`,
          eventType: "ticket_created", reply: `Titre: ${title}`,
        });
        return;
      }

      // /creer_ot — guided multi-step OT creation
      if (lower === "/creer_ot" || lower === "/creer_ot@swangmaibot" || lower === "/creer") {
        pendingActions.set(chatId, { action: "create_ot_title" });
        await callTelegramAPI(token, "sendMessage", {
          chat_id: chatId,
          text: `📝 <b>Créer un OT — Étape 1/3</b>\n\nEnvoyez le <b>titre</b> de l'ordre de travail :\n\n<i>Exemple : Pompe centrifuge A3 — fuite d'huile détectée</i>`,
          parse_mode: "HTML",
        });
        await db.insert(telegramLogsTable).values({
          chatId, direction: "out", text: "/creer_ot démarré",
          eventType: "create_ot", reply: "Étape 1 — attente titre",
        }).catch(() => {});
        return;
      }

      // /nouveau — guided ticket creation
      if (lower === "/nouveau") {
        await callTelegramAPI(token, "sendMessage", {
          chat_id: chatId,
          text: `📝 <b>Créer un ticket de signalement</b>\n\nUtilisez la commande :\n<code>/signaler Titre du problème</code>\n\nOu avec une description :\n<code>/signaler Compresseur A3 | Fuite d'huile au niveau du joint</code>\n\nLe ticket sera créé immédiatement avec le statut <b>Ouvert</b> et vous sera assigné.`,
          parse_mode: "HTML",
        });
        return;
      }

      // Unrecognized message — gentle hint
      await callTelegramAPI(token, "sendMessage", {
        chat_id: chatId,
        text: `Tapez /aide pour voir les commandes disponibles.`,
      });
    }

  } catch (err) {
    req.log.error({ err }, "Telegram webhook error");
  }
});

export default router;

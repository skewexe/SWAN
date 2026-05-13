import { Router } from "express";
import { db, workOrdersTable, assetsTable, techniciansTable, sitesTable, zonesTable, workOrderTechniciansTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import {
  CreateWorkOrderBody,
  GetWorkOrdersQueryParams,
  GetWorkOrderParams,
  UpdateWorkOrderParams,
  UpdateWorkOrderBody,
  DeleteWorkOrderParams,
} from "@workspace/api-zod";
import https from "https";

const router = Router();

async function getTelegramToken(): Promise<string | null> {
  try {
    const { telegramConfigTable } = await import("@workspace/db");
    const [cfg] = await db.select().from(telegramConfigTable);
    return cfg?.botToken || null;
  } catch { return null; }
}

async function callTelegramAPI(token: string, method: string, body: object): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const opts: https.RequestOptions = {
      hostname: "api.telegram.org", port: 443,
      path: `/bot${token}/${method}`, method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data).toString() },
    };
    const req = https.request(opts, (r) => {
      let raw = ""; r.on("data", c => { raw += c; }); r.on("end", () => { try { resolve(JSON.parse(raw)); } catch { reject(new Error("bad json")); } });
    });
    req.on("error", reject); req.write(data); req.end();
  });
}

const enrich = async (wo: any, assets: any[], technicians: any[], sites: any[], zones: any[]) => {
  const extraTechs = await db.select().from(workOrderTechniciansTable).where(eq(workOrderTechniciansTable.workOrderId, wo.id));
  const extraTechnicianIds = extraTechs.map(t => t.technicianId);
  const extraTechnicianNames = extraTechs.map(t => technicians.find(tc => tc.id === t.technicianId)?.name).filter(Boolean);
  return {
    ...wo,
    createdAt: wo.createdAt.toISOString(),
    assetName: assets.find(a => a.id === wo.assetId)?.name,
    technicianName: technicians.find(t => t.id === wo.technicianId)?.name,
    siteName: sites.find(s => s.id === wo.siteId)?.name,
    zoneName: zones.find(z => z.id === wo.zoneId)?.name,
    extraTechnicianIds,
    extraTechnicianNames,
  };
};

const enrichBulk = async (wos: any[], assets: any[], technicians: any[], sites: any[], zones: any[]) => {
  if (wos.length === 0) return [];
  const woIds = wos.map(w => w.id);
  const allExtra = woIds.length > 0
    ? await db.select().from(workOrderTechniciansTable).where(inArray(workOrderTechniciansTable.workOrderId, woIds))
    : [];
  return wos.map(wo => {
    const extra = allExtra.filter(e => e.workOrderId === wo.id);
    return {
      ...wo,
      createdAt: wo.createdAt.toISOString(),
      assetName: assets.find(a => a.id === wo.assetId)?.name,
      technicianName: technicians.find(t => t.id === wo.technicianId)?.name,
      siteName: sites.find(s => s.id === wo.siteId)?.name,
      zoneName: zones.find(z => z.id === wo.zoneId)?.name,
      extraTechnicianIds: extra.map(e => e.technicianId),
      extraTechnicianNames: extra.map(e => technicians.find(t => t.id === e.technicianId)?.name).filter(Boolean),
    };
  });
};

router.get("/workorders", async (req, res) => {
  try {
    const params = GetWorkOrdersQueryParams.parse(req.query);
    const [assets, technicians, sites, zones] = await Promise.all([
      db.select().from(assetsTable),
      db.select().from(techniciansTable),
      db.select().from(sitesTable),
      db.select().from(zonesTable),
    ]);
    let workOrders = await db.select().from(workOrdersTable);
    if (params.status) workOrders = workOrders.filter(wo => wo.status === params.status);
    if (params.priority) workOrders = workOrders.filter(wo => wo.priority === params.priority);
    if (params.type) workOrders = workOrders.filter(wo => wo.type === params.type);
    res.json(await enrichBulk(workOrders, assets, technicians, sites, zones));
  } catch (err) {
    req.log.error({ err }, "Error fetching work orders");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/workorders", async (req, res) => {
  try {
    const { extraTechnicianIds, ...rest } = req.body as any;
    const body = CreateWorkOrderBody.parse(rest);
    const [wo] = await db.insert(workOrdersTable).values(body).returning();

    if (extraTechnicianIds && Array.isArray(extraTechnicianIds) && extraTechnicianIds.length > 0) {
      const toInsert = extraTechnicianIds
        .filter((id: number) => id !== body.technicianId)
        .map((tid: number) => ({ workOrderId: wo.id, technicianId: tid }));
      if (toInsert.length > 0) await db.insert(workOrderTechniciansTable).values(toInsert);
    }

    const [assets, technicians, sites, zones] = await Promise.all([
      db.select().from(assetsTable), db.select().from(techniciansTable),
      db.select().from(sitesTable), db.select().from(zonesTable),
    ]);
    res.status(201).json(await enrich(wo, assets, technicians, sites, zones));
  } catch (err) {
    req.log.error({ err }, "Error creating work order");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.get("/workorders/:id", async (req, res) => {
  try {
    const { id } = GetWorkOrderParams.parse({ id: Number(req.params.id) });
    const [wo] = await db.select().from(workOrdersTable).where(eq(workOrdersTable.id, id));
    if (!wo) return res.status(404).json({ error: "Work order not found" });
    const [assets, technicians, sites, zones] = await Promise.all([
      db.select().from(assetsTable), db.select().from(techniciansTable),
      db.select().from(sitesTable), db.select().from(zonesTable),
    ]);
    res.json(await enrich(wo, assets, technicians, sites, zones));
    return;
  } catch (err) {
    req.log.error({ err }, "Error fetching work order");
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

router.put("/workorders/:id", async (req, res) => {
  try {
    const { id } = UpdateWorkOrderParams.parse({ id: Number(req.params.id) });
    const { extraTechnicianIds, ...rest } = req.body as any;
    const body = UpdateWorkOrderBody.partial().parse(rest);
    const [wo] = await db.update(workOrdersTable).set(body).where(eq(workOrdersTable.id, id)).returning();
    if (!wo) return res.status(404).json({ error: "Work order not found" });

    if (extraTechnicianIds !== undefined && Array.isArray(extraTechnicianIds)) {
      await db.delete(workOrderTechniciansTable).where(eq(workOrderTechniciansTable.workOrderId, id));
      const toInsert = extraTechnicianIds
        .filter((tid: number) => tid !== wo.technicianId)
        .map((tid: number) => ({ workOrderId: id, technicianId: tid }));
      if (toInsert.length > 0) await db.insert(workOrderTechniciansTable).values(toInsert);
    }

    const [assets, technicians, sites, zones] = await Promise.all([
      db.select().from(assetsTable), db.select().from(techniciansTable),
      db.select().from(sitesTable), db.select().from(zonesTable),
    ]);
    res.json(await enrich(wo, assets, technicians, sites, zones));
    return;
  } catch (err) {
    req.log.error({ err }, "Error updating work order");
    res.status(400).json({ error: "Invalid request" });
    return;
  }
});

router.delete("/workorders/:id", async (req, res) => {
  try {
    const { id } = DeleteWorkOrderParams.parse({ id: Number(req.params.id) });
    await db.delete(workOrdersTable).where(eq(workOrdersTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting work order");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Send WO notification to technicians via Telegram
router.post("/workorders/:id/send-telegram", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [wo] = await db.select().from(workOrdersTable).where(eq(workOrdersTable.id, id));
    if (!wo) return res.status(404).json({ error: "Work order not found" });

    const token = await getTelegramToken();
    if (!token) return res.status(400).json({ error: "Telegram bot not configured" });

    const technicians = await db.select().from(techniciansTable);
    const assets = await db.select().from(assetsTable);
    const extraTechs = await db.select().from(workOrderTechniciansTable).where(eq(workOrderTechniciansTable.workOrderId, id));

    const allTechIds = [
      ...(wo.technicianId ? [wo.technicianId] : []),
      ...extraTechs.map(t => t.technicianId),
    ];
    const targets = technicians.filter(t => allTechIds.includes(t.id) && t.telegramChatId);
    if (targets.length === 0) return res.status(400).json({ error: "Aucun technicien avec Telegram ID configuré" });

    const asset = assets.find(a => a.id === wo.assetId);
    const priorityEmoji: Record<string, string> = { critical: "🔴", high: "🟠", medium: "🟡", low: "🟢" };
    const typeLabel: Record<string, string> = { corrective: "Corrective", preventive: "Préventive", predictive: "Prédictive", inspection: "Inspection" };

    const text = [
      `🔧 *Ordre de Travail #${wo.id}*`,
      ``,
      `📋 *${wo.title}*`,
      wo.description ? `${wo.description}` : null,
      ``,
      `${priorityEmoji[wo.priority] || "⚪"} Priorité: *${wo.priority.toUpperCase()}*`,
      `📁 Type: ${typeLabel[wo.type] || wo.type}`,
      asset ? `🏭 Équipement: ${asset.name}` : null,
      wo.scheduledDate ? `📅 Date: ${new Date(wo.scheduledDate).toLocaleDateString("fr-DZ")}` : null,
      wo.estimatedHours ? `⏱ Durée estimée: ${wo.estimatedHours}h` : null,
    ].filter(Boolean).join("\n");

    const inline_keyboard = [
      [
        { text: "▶️ Commencer", callback_data: `wo_status:${id}:in_progress` },
        { text: "✅ Terminer", callback_data: `wo_status:${id}:completed` },
      ],
      [
        { text: "⏸ En attente", callback_data: `wo_status:${id}:on_hold` },
        { text: "❌ Annuler", callback_data: `wo_status:${id}:cancelled` },
      ],
    ];

    const results: any[] = [];
    for (const tech of targets) {
      const r = await callTelegramAPI(token, "sendMessage", {
        chat_id: tech.telegramChatId,
        text,
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard },
      });
      results.push({ technicianId: tech.id, name: tech.name, ok: r.ok });
    }

    res.json({ sent: results.length, results });
    return;
  } catch (err) {
    req.log.error({ err }, "Error sending WO telegram");
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

export default router;

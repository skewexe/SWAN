import { Router } from "express";
import { db, preventivePlansTable, assetsTable, workOrdersTable, techniciansTable, preventivePlanTechniciansTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import {
  CreatePreventivePlanBody,
  UpdatePreventivePlanParams,
  UpdatePreventivePlanBody,
  DeletePreventivePlanParams,
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

const buildEnriched = (p: any, assets: any[], technicians: any[], extra: any[]) => ({
  ...p,
  createdAt: p.createdAt.toISOString(),
  assetName: assets.find(a => a.id === p.assetId)?.name,
  technicianName: technicians.find(t => t.id === p.technicianId)?.name,
  extraTechnicianIds: extra.filter(e => e.planId === p.id).map((e: any) => e.technicianId),
  extraTechnicianNames: extra.filter(e => e.planId === p.id).map((e: any) => technicians.find(t => t.id === e.technicianId)?.name).filter(Boolean),
});

router.get("/preventive", async (req, res) => {
  try {
    const plans = await db.select().from(preventivePlansTable);
    const [assets, technicians] = await Promise.all([
      db.select().from(assetsTable), db.select().from(techniciansTable),
    ]);
    const planIds = plans.map(p => p.id);
    const allExtra = planIds.length > 0
      ? await db.select().from(preventivePlanTechniciansTable).where(inArray(preventivePlanTechniciansTable.planId, planIds))
      : [];
    res.json(plans.map(p => buildEnriched(p, assets, technicians, allExtra)));
  } catch (err) {
    req.log.error({ err }, "Error fetching preventive plans");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/preventive", async (req, res) => {
  try {
    const parsed = CreatePreventivePlanBody.parse(req.body);
    const { extraTechnicianIds, ...planData } = parsed as any;
    const [plan] = await db.insert(preventivePlansTable).values(planData).returning();

    if (extraTechnicianIds?.length) {
      const toInsert = (extraTechnicianIds as number[])
        .filter(id => id !== plan.technicianId)
        .map(tid => ({ planId: plan.id, technicianId: tid }));
      if (toInsert.length) await db.insert(preventivePlanTechniciansTable).values(toInsert);
    }

    const [assets, technicians] = await Promise.all([db.select().from(assetsTable), db.select().from(techniciansTable)]);
    const extra = await db.select().from(preventivePlanTechniciansTable).where(eq(preventivePlanTechniciansTable.planId, plan.id));
    res.status(201).json(buildEnriched(plan, assets, technicians, extra));
  } catch (err) {
    req.log.error({ err }, "Error creating preventive plan");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.put("/preventive/:id", async (req, res) => {
  try {
    const { id } = UpdatePreventivePlanParams.parse({ id: Number(req.params.id) });
    const parsed = UpdatePreventivePlanBody.partial().parse(req.body);
    const { extraTechnicianIds, ...planData } = parsed as any;

    const [plan] = await db.update(preventivePlansTable).set(planData).where(eq(preventivePlansTable.id, id)).returning();
    if (!plan) return res.status(404).json({ error: "Plan not found" });

    if (extraTechnicianIds !== undefined) {
      await db.delete(preventivePlanTechniciansTable).where(eq(preventivePlanTechniciansTable.planId, id));
      const toInsert = (extraTechnicianIds as number[])
        .filter(tid => tid !== plan.technicianId)
        .map(tid => ({ planId: id, technicianId: tid }));
      if (toInsert.length) await db.insert(preventivePlanTechniciansTable).values(toInsert);
    }

    const [assets, technicians] = await Promise.all([db.select().from(assetsTable), db.select().from(techniciansTable)]);
    const extra = await db.select().from(preventivePlanTechniciansTable).where(eq(preventivePlanTechniciansTable.planId, id));
    res.json(buildEnriched(plan, assets, technicians, extra));
    return;
  } catch (err) {
    req.log.error({ err }, "Error updating preventive plan");
    res.status(400).json({ error: "Invalid request" });
    return;
  }
});

router.delete("/preventive/:id", async (req, res) => {
  try {
    const { id } = DeletePreventivePlanParams.parse({ id: Number(req.params.id) });
    await db.delete(preventivePlansTable).where(eq(preventivePlansTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting preventive plan");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/preventive/:id/execute", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    const [plan] = await db.select().from(preventivePlansTable).where(eq(preventivePlansTable.id, id));
    if (!plan) return res.status(404).json({ error: "Plan not found" });

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const frequencyDays: Record<string, number> = { daily: 1, weekly: 7, monthly: 30, quarterly: 91, annually: 365 };
    const daysToAdd = frequencyDays[plan.frequency] || 30;
    const nextDueStr = new Date(today.getTime() + daysToAdd * 86400000).toISOString().split("T")[0];

    const woData: any = {
      title: plan.name,
      description: plan.description || `Exécution du plan préventif: ${plan.name}`,
      type: "preventive", priority: "medium", status: "open",
      assetId: plan.assetId || null,
      estimatedHours: plan.estimatedDuration || null,
      scheduledDate: todayStr,
    };
    if (plan.technicianId) woData.technicianId = plan.technicianId;
    const [wo] = await db.insert(workOrdersTable).values(woData).returning();

    // Copy extra technicians to WO
    const extra = await db.select().from(preventivePlanTechniciansTable).where(eq(preventivePlanTechniciansTable.planId, id));
    if (extra.length) {
      const { workOrderTechniciansTable } = await import("@workspace/db");
      const toInsert = extra.filter(e => e.technicianId !== plan.technicianId).map(e => ({ workOrderId: wo.id, technicianId: e.technicianId }));
      if (toInsert.length) await db.insert(workOrderTechniciansTable).values(toInsert);
    }

    await db.update(preventivePlansTable).set({ lastExecuted: todayStr, nextDue: nextDueStr, status: "active" }).where(eq(preventivePlansTable.id, id));
    res.status(201).json({ workOrder: wo, message: `Ordre de travail créé pour "${plan.name}"` });
    return;
  } catch (err) {
    req.log.error({ err }, "Error executing preventive plan");
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

router.post("/preventive/:id/send-telegram", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [plan] = await db.select().from(preventivePlansTable).where(eq(preventivePlansTable.id, id));
    if (!plan) return res.status(404).json({ error: "Plan not found" });

    const token = await getTelegramToken();
    if (!token) return res.status(400).json({ error: "Telegram bot not configured" });

    const [technicians, assets] = await Promise.all([db.select().from(techniciansTable), db.select().from(assetsTable)]);
    const extra = await db.select().from(preventivePlanTechniciansTable).where(eq(preventivePlanTechniciansTable.planId, id));
    const allTechIds = [...(plan.technicianId ? [plan.technicianId] : []), ...extra.map(e => e.technicianId)];
    const targets = technicians.filter(t => allTechIds.includes(t.id) && t.telegramChatId);
    if (!targets.length) return res.status(400).json({ error: "Aucun technicien avec Telegram ID configuré" });

    const asset = assets.find(a => a.id === plan.assetId);
    const freqLabel: Record<string, string> = { daily: "Quotidien", weekly: "Hebdomadaire", monthly: "Mensuel", quarterly: "Trimestriel", annually: "Annuel" };

    const text = [
      `📅 *Plan de Maintenance Préventive #${plan.id}*`,
      ``,
      `📋 *${plan.name}*`,
      plan.description || null,
      ``,
      `🔁 Fréquence: *${freqLabel[plan.frequency] || plan.frequency}*`,
      asset ? `🏭 Équipement: ${asset.name}` : null,
      plan.nextDue ? `📅 Prochaine échéance: ${new Date(plan.nextDue).toLocaleDateString("fr-DZ")}` : null,
      plan.estimatedDuration ? `⏱ Durée estimée: ${plan.estimatedDuration}h` : null,
    ].filter(Boolean).join("\n");

    const inline_keyboard = [
      [{ text: "▶️ Exécuter maintenant", callback_data: `prev_execute:${id}` }],
      [{ text: "✅ Marquer comme fait", callback_data: `prev_done:${id}` }, { text: "⏸ Reporter", callback_data: `prev_status:${id}:inactive` }],
    ];

    const results: any[] = [];
    for (const tech of targets) {
      const r = await callTelegramAPI(token, "sendMessage", { chat_id: tech.telegramChatId, text, parse_mode: "Markdown", reply_markup: { inline_keyboard } });
      results.push({ technicianId: tech.id, name: tech.name, ok: r.ok });
    }
    res.json({ sent: results.length, results });
    return;
  } catch (err) {
    req.log.error({ err }, "Error sending preventive telegram");
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

export default router;

import { Router } from "express";
import { db, preventivePlansTable, assetsTable, workOrdersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreatePreventivePlanBody,
  UpdatePreventivePlanParams,
  UpdatePreventivePlanBody,
  DeletePreventivePlanParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/preventive", async (req, res) => {
  try {
    const plans = await db.select().from(preventivePlansTable);
    const assets = await db.select().from(assetsTable);

    const enriched = plans.map(p => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      assetName: assets.find(a => a.id === p.assetId)?.name,
    }));

    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Error fetching preventive plans");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/preventive", async (req, res) => {
  try {
    const body = CreatePreventivePlanBody.parse(req.body);
    const [plan] = await db.insert(preventivePlansTable).values(body).returning();
    const assets = await db.select().from(assetsTable);
    res.status(201).json({
      ...plan,
      createdAt: plan.createdAt.toISOString(),
      assetName: assets.find(a => a.id === plan.assetId)?.name,
    });
  } catch (err) {
    req.log.error({ err }, "Error creating preventive plan");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.put("/preventive/:id", async (req, res) => {
  try {
    const { id } = UpdatePreventivePlanParams.parse({ id: Number(req.params.id) });
    const body = UpdatePreventivePlanBody.parse(req.body);
    const [plan] = await db.update(preventivePlansTable).set(body).where(eq(preventivePlansTable.id, id)).returning();
    if (!plan) return res.status(404).json({ error: "Plan not found" });
    const assets = await db.select().from(assetsTable);
    res.json({
      ...plan,
      createdAt: plan.createdAt.toISOString(),
      assetName: assets.find(a => a.id === plan.assetId)?.name,
    });
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

    const asset = plan.assetId
      ? (await db.select().from(assetsTable).where(eq(assetsTable.id, plan.assetId)))[0]
      : null;

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const frequencyDays: Record<string, number> = {
      daily: 1, weekly: 7, monthly: 30, quarterly: 91, annually: 365
    };
    const daysToAdd = frequencyDays[plan.frequency] || 30;
    const nextDue = new Date(today.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    const nextDueStr = nextDue.toISOString().split("T")[0];

    const [wo] = await db.insert(workOrdersTable).values({
      title: plan.name,
      description: plan.description || `Exécution du plan préventif: ${plan.name}`,
      type: "preventive",
      priority: "medium",
      status: "open",
      assetId: plan.assetId || null,
      estimatedHours: plan.estimatedDuration || null,
      scheduledDate: todayStr,
    }).returning();

    await db.update(preventivePlansTable).set({
      lastExecuted: todayStr,
      nextDue: nextDueStr,
      status: "active",
    }).where(eq(preventivePlansTable.id, id));

    res.status(201).json({
      workOrder: wo,
      message: `Ordre de travail créé pour "${plan.name}"`,
    });
    return;
  } catch (err) {
    req.log.error({ err }, "Error executing preventive plan");
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

export default router;

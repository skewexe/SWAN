import { Router } from "express";
import { db, preventivePlansTable, assetsTable } from "@workspace/db";
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
  } catch (err) {
    req.log.error({ err }, "Error updating preventive plan");
    res.status(400).json({ error: "Invalid request" });
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

export default router;

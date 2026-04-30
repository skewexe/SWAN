import { Router } from "express";
import { db, assetsTable, workOrdersTable, inventoryItemsTable } from "@workspace/db";

const router = Router();

router.get("/reports/kpis", async (req, res) => {
  try {
    const assets = await db.select().from(assetsTable);
    const workOrders = await db.select().from(workOrdersTable);

    const assetsWithMtbf = assets.filter(a => a.mtbf != null);
    const mtbf = assetsWithMtbf.length > 0
      ? assetsWithMtbf.reduce((sum, a) => sum + (a.mtbf || 0), 0) / assetsWithMtbf.length
      : 0;

    const assetsWithMttr = assets.filter(a => a.mttr != null);
    const mttr = assetsWithMttr.length > 0
      ? assetsWithMttr.reduce((sum, a) => sum + (a.mttr || 0), 0) / assetsWithMttr.length
      : 0;

    const operationalAssets = assets.filter(a => a.status === "operational");
    const availabilityRate = assets.length > 0
      ? (operationalAssets.length / assets.length) * 100
      : 0;

    const completed = workOrders.filter(wo => wo.status === "completed").length;
    const total = workOrders.length;
    const maintenanceCostRatio = total > 0 ? (completed / total) * 100 : 0;

    const preventiveCount = workOrders.filter(wo => wo.type === "preventive").length;
    const correctiveCount = workOrders.filter(wo => wo.type === "corrective").length;
    const plannedVsUnplanned = (preventiveCount + correctiveCount) > 0
      ? (preventiveCount / (preventiveCount + correctiveCount)) * 100
      : 0;

    const assetFailures = new Map<number, number>();
    workOrders.filter(wo => wo.type === "corrective" && wo.assetId).forEach(wo => {
      assetFailures.set(wo.assetId!, (assetFailures.get(wo.assetId!) || 0) + 1);
    });

    const topFailingAssets = Array.from(assetFailures.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([assetId, failures]) => ({
        assetName: assets.find(a => a.id === assetId)?.name || `Asset ${assetId}`,
        failures,
      }));

    res.json({
      mtbf: Math.round(mtbf * 10) / 10,
      mttr: Math.round(mttr * 10) / 10,
      availabilityRate: Math.round(availabilityRate * 10) / 10,
      maintenanceCostRatio: Math.round(maintenanceCostRatio * 10) / 10,
      plannedVsUnplanned: Math.round(plannedVsUnplanned * 10) / 10,
      topFailingAssets,
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching KPI report");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/reports/costs", async (req, res) => {
  try {
    const workOrders = await db.select().from(workOrdersTable);

    const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
    const now = new Date();

    const byMonth = months.slice(Math.max(0, now.getMonth() - 5), now.getMonth() + 1).map((month, idx) => {
      const monthIdx = Math.max(0, now.getMonth() - 5) + idx;
      const monthWOs = workOrders.filter(wo => {
        const d = new Date(wo.createdAt);
        return d.getMonth() === monthIdx && d.getFullYear() === now.getFullYear();
      });

      const completedWOs = monthWOs.filter(wo => wo.status === "completed");
      const labor = completedWOs.reduce((sum, wo) => sum + (wo.actualHours || wo.estimatedHours || 0) * 3500, 0);
      const parts = completedWOs.length * 12000;
      const downtime = monthWOs.filter(wo => wo.type === "corrective").length * 25000;

      return { month, labor: Math.round(labor), parts: Math.round(parts), downtime: Math.round(downtime) };
    });

    const totalLaborCost = byMonth.reduce((sum, m) => sum + m.labor, 0);
    const totalPartsCost = byMonth.reduce((sum, m) => sum + m.parts, 0);
    const totalDowntimeCost = byMonth.reduce((sum, m) => sum + m.downtime, 0);

    res.json({
      totalLaborCost,
      totalPartsCost,
      totalDowntimeCost,
      totalCost: totalLaborCost + totalPartsCost + totalDowntimeCost,
      byMonth,
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching cost report");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

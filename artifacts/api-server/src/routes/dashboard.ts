import { Router } from "express";
import { db } from "@workspace/db";
import { assetsTable, workOrdersTable, preventivePlansTable, inventoryItemsTable } from "@workspace/db";
import { eq, and, lt, gte, sql } from "drizzle-orm";

const router = Router();

router.get("/dashboard/stats", async (req, res) => {
  try {
    const assets = await db.select().from(assetsTable);
    const workOrders = await db.select().from(workOrdersTable);
    const preventivePlans = await db.select().from(preventivePlansTable);
    const inventoryItems = await db.select().from(inventoryItemsTable);

    const totalAssets = assets.length;
    const activeWorkOrders = workOrders.filter(wo => wo.status === "open" || wo.status === "in_progress").length;
    const criticalAlerts = workOrders.filter(wo => wo.priority === "critical" && wo.status !== "completed").length;

    const operationalAssets = assets.filter(a => a.status === "operational");
    const availabilityRate = totalAssets > 0
      ? (operationalAssets.length / totalAssets) * 100
      : 0;

    const assetsWithMtbf = assets.filter(a => a.mtbf != null);
    const mtbf = assetsWithMtbf.length > 0
      ? assetsWithMtbf.reduce((sum, a) => sum + (a.mtbf || 0), 0) / assetsWithMtbf.length
      : 0;

    const assetsWithMttr = assets.filter(a => a.mttr != null);
    const mttr = assetsWithMttr.length > 0
      ? assetsWithMttr.reduce((sum, a) => sum + (a.mttr || 0), 0) / assetsWithMttr.length
      : 0;

    const lowStockItems = inventoryItems.filter(i => i.quantity <= i.minQuantity).length;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
    const plannedMaintenanceThisMonth = preventivePlans.filter(p =>
      p.nextDue && p.nextDue >= monthStart && p.nextDue <= monthEnd
    ).length;

    res.json({
      totalAssets,
      activeWorkOrders,
      criticalAlerts,
      availabilityRate: Math.round(availabilityRate * 10) / 10,
      mtbf: Math.round(mtbf * 10) / 10,
      mttr: Math.round(mttr * 10) / 10,
      lowStockItems,
      plannedMaintenanceThisMonth,
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching dashboard stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/activity", async (req, res) => {
  try {
    const workOrders = await db.select().from(workOrdersTable).limit(5);
    const preventivePlans = await db.select().from(preventivePlansTable).limit(3);
    const inventoryItems = await db.select().from(inventoryItemsTable).limit(2);

    const activities: any[] = [];
    let id = 1;

    workOrders.forEach(wo => {
      activities.push({
        id: id++,
        type: "workorder",
        message: `Ordre de travail "${wo.title}" — ${wo.status === "open" ? "Ouvert" : wo.status === "in_progress" ? "En cours" : "Complété"}`,
        timestamp: wo.createdAt.toISOString(),
        severity: wo.priority === "critical" ? "critical" : wo.priority === "high" ? "warning" : "info",
        assetName: undefined,
      });
    });

    preventivePlans.filter(p => p.status === "overdue").forEach(p => {
      activities.push({
        id: id++,
        type: "maintenance",
        message: `Plan de maintenance "${p.name}" en retard`,
        timestamp: p.createdAt.toISOString(),
        severity: "warning",
        assetName: undefined,
      });
    });

    inventoryItems.filter(i => i.quantity <= i.minQuantity).forEach(i => {
      activities.push({
        id: id++,
        type: "inventory",
        message: `Stock faible pour "${i.name}" — ${i.quantity} ${i.unit || "unités"} restantes`,
        timestamp: i.createdAt.toISOString(),
        severity: "warning",
        assetName: undefined,
      });
    });

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json(activities.slice(0, 10));
  } catch (err) {
    req.log.error({ err }, "Error fetching dashboard activity");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/chart-data", async (req, res) => {
  try {
    const workOrders = await db.select().from(workOrdersTable);
    const assets = await db.select().from(assetsTable);

    const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
    const now = new Date();

    const maintenanceByMonth = months.slice(Math.max(0, now.getMonth() - 5), now.getMonth() + 1).map((month, idx) => {
      const monthIdx = Math.max(0, now.getMonth() - 5) + idx;
      const monthWOs = workOrders.filter(wo => {
        const d = new Date(wo.createdAt);
        return d.getMonth() === monthIdx && d.getFullYear() === now.getFullYear();
      });
      return {
        month,
        corrective: monthWOs.filter(wo => wo.type === "corrective").length,
        preventive: monthWOs.filter(wo => wo.type === "preventive").length,
      };
    });

    const categoryMap = new Map<string, number>();
    assets.forEach(a => {
      categoryMap.set(a.category, (categoryMap.get(a.category) || 0) + 1);
    });
    const assetsByCategory = Array.from(categoryMap.entries()).map(([category, count]) => ({ category, count }));

    const statusMap = new Map<string, number>();
    workOrders.forEach(wo => {
      statusMap.set(wo.status, (statusMap.get(wo.status) || 0) + 1);
    });
    const workOrdersByStatus = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));

    res.json({ maintenanceByMonth, assetsByCategory, workOrdersByStatus });
  } catch (err) {
    req.log.error({ err }, "Error fetching chart data");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

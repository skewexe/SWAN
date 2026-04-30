import { Router } from "express";
import { db, assetsTable, inventoryItemsTable, preventivePlansTable, workOrdersTable } from "@workspace/db";

const router = Router();

router.get("/notifications", async (req, res) => {
  try {
    const [assets, inventory, plans, workOrders] = await Promise.all([
      db.select().from(assetsTable),
      db.select().from(inventoryItemsTable),
      db.select().from(preventivePlansTable),
      db.select().from(workOrdersTable),
    ]);

    const notifications: Array<{
      id: string;
      type: "critical" | "warning" | "info";
      title: string;
      message: string;
      timestamp: string;
      read: boolean;
    }> = [];

    // Critical: assets in breakdown
    assets
      .filter(a => a.status === "breakdown")
      .forEach(a => {
        notifications.push({
          id: `asset-breakdown-${a.id}`,
          type: "critical",
          title: "Équipement en panne",
          message: `${a.name} (${a.location || "emplacement inconnu"}) est hors service`,
          timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          read: false,
        });
      });

    // Warning: low stock items
    inventory
      .filter(i => i.quantity <= i.minQuantity)
      .slice(0, 5)
      .forEach(i => {
        notifications.push({
          id: `lowstock-${i.id}`,
          type: "warning",
          title: "Stock critique",
          message: `${i.name} — ${i.quantity} ${i.unit || "unités"} restant(es) (min: ${i.minQuantity})`,
          timestamp: new Date(Date.now() - Math.random() * 7200000).toISOString(),
          read: false,
        });
      });

    // Warning: overdue preventive plans
    const today = new Date().toISOString().split("T")[0];
    plans
      .filter(p => p.status === "active" && p.nextDue && p.nextDue < today)
      .slice(0, 3)
      .forEach(p => {
        notifications.push({
          id: `plan-overdue-${p.id}`,
          type: "warning",
          title: "Maintenance en retard",
          message: `Plan "${p.name}" était prévu le ${new Date(p.nextDue!).toLocaleDateString("fr-DZ")}`,
          timestamp: new Date(Date.now() - Math.random() * 10800000).toISOString(),
          read: false,
        });
      });

    // Info: critical priority open work orders
    workOrders
      .filter(wo => wo.priority === "critical" && (wo.status === "open" || wo.status === "in_progress"))
      .slice(0, 3)
      .forEach(wo => {
        notifications.push({
          id: `wo-critical-${wo.id}`,
          type: "critical",
          title: "OT critique en attente",
          message: `"${wo.title}" — priorité critique, statut: ${wo.status === "open" ? "ouvert" : "en cours"}`,
          timestamp: new Date(wo.createdAt).toISOString(),
          read: false,
        });
      });

    // Sort by most recent
    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json(notifications.slice(0, 10));
  } catch (err) {
    req.log.error({ err }, "Error fetching notifications");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

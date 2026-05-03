import { Router } from "express";
import { db, workOrderPartsTable, inventoryItemsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

// GET /workorders/:id/parts — list parts used on a work order
router.get("/workorders/:id/parts", async (req, res) => {
  try {
    const workOrderId = Number(req.params.id);
    if (!Number.isFinite(workOrderId)) return res.status(400).json({ error: "Invalid id" });

    const parts = await db.select().from(workOrderPartsTable).where(eq(workOrderPartsTable.workOrderId, workOrderId));
    const inventory = await db.select().from(inventoryItemsTable);

    const enriched = parts.map(p => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      itemName: inventory.find(i => i.id === p.inventoryItemId)?.name || `Article #${p.inventoryItemId}`,
      itemReference: inventory.find(i => i.id === p.inventoryItemId)?.reference,
      itemUnit: inventory.find(i => i.id === p.inventoryItemId)?.unit,
      totalCost: p.unitCostAtTime != null ? p.quantityUsed * p.unitCostAtTime : null,
    }));

    res.json(enriched);
    return;
  } catch (err) {
    req.log.error({ err }, "Error fetching work order parts");
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

// POST /workorders/:id/parts — add a part and deduct from inventory
router.post("/workorders/:id/parts", async (req, res) => {
  try {
    const workOrderId = Number(req.params.id);
    if (!Number.isFinite(workOrderId)) return res.status(400).json({ error: "Invalid id" });

    const inventoryItemId = Number(req.body.inventoryItemId);
    const quantityUsed = Number(req.body.quantityUsed);
    const note: string | undefined = req.body.note;
    if (!Number.isFinite(inventoryItemId) || inventoryItemId <= 0) return res.status(400).json({ error: "Invalid inventoryItemId" });
    if (!Number.isFinite(quantityUsed) || quantityUsed <= 0) return res.status(400).json({ error: "quantityUsed must be positive" });
    const body = { inventoryItemId, quantityUsed, note };

    // Check inventory item exists and has enough stock
    const [item] = await db.select().from(inventoryItemsTable).where(eq(inventoryItemsTable.id, body.inventoryItemId));
    if (!item) return res.status(404).json({ error: "Inventory item not found" });
    if (item.quantity < body.quantityUsed) {
      return res.status(400).json({ error: `Stock insuffisant. Disponible: ${item.quantity} ${item.unit || "unités"}` });
    }

    // Deduct from inventory
    await db
      .update(inventoryItemsTable)
      .set({ quantity: item.quantity - body.quantityUsed })
      .where(eq(inventoryItemsTable.id, body.inventoryItemId));

    // Create the work order part record
    const [part] = await db.insert(workOrderPartsTable).values({
      workOrderId,
      inventoryItemId: body.inventoryItemId,
      quantityUsed: body.quantityUsed,
      unitCostAtTime: item.unitCost ?? undefined,
      note: body.note,
    }).returning();

    const enriched = {
      ...part,
      createdAt: part.createdAt.toISOString(),
      itemName: item.name,
      itemReference: item.reference,
      itemUnit: item.unit,
      totalCost: item.unitCost != null ? body.quantityUsed * item.unitCost : null,
      newStockLevel: item.quantity - body.quantityUsed,
    };

    res.status(201).json(enriched);
    return;
  } catch (err) {
    req.log.error({ err }, "Error adding work order part");
    res.status(400).json({ error: "Invalid request" });
    return;
  }
});

// DELETE /workorders/:id/parts/:partId — remove a part and restore inventory
router.delete("/workorders/:id/parts/:partId", async (req, res) => {
  try {
    const workOrderId = Number(req.params.id);
    const partId = Number(req.params.partId);
    if (!Number.isFinite(workOrderId) || !Number.isFinite(partId)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const [part] = await db.select().from(workOrderPartsTable).where(
      and(eq(workOrderPartsTable.id, partId), eq(workOrderPartsTable.workOrderId, workOrderId))
    );
    if (!part) return res.status(404).json({ error: "Part not found" });

    // Restore inventory quantity
    const [item] = await db.select().from(inventoryItemsTable).where(eq(inventoryItemsTable.id, part.inventoryItemId));
    if (item) {
      await db
        .update(inventoryItemsTable)
        .set({ quantity: item.quantity + part.quantityUsed })
        .where(eq(inventoryItemsTable.id, part.inventoryItemId));
    }

    await db.delete(workOrderPartsTable).where(eq(workOrderPartsTable.id, partId));

    res.status(204).send();
    return;
  } catch (err) {
    req.log.error({ err }, "Error removing work order part");
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

export default router;

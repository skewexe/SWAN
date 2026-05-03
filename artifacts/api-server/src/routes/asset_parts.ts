import { Router } from "express";
import { db, assetPartsTable, inventoryItemsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const enrichPart = (part: any, inventoryItems: any[]) => {
  const item = inventoryItems.find(i => i.id === part.inventoryItemId);
  return {
    ...part,
    createdAt: part.createdAt.toISOString(),
    inventoryItemName: item?.name,
    inventoryItemQuantity: item?.quantity,
    inventoryItemUnit: item?.unit,
  };
};

router.get("/assets/:id/parts", async (req, res) => {
  try {
    const assetId = Number(req.params.id);
    if (!Number.isFinite(assetId)) return res.status(400).json({ error: "Invalid id" });
    const parts = await db.select().from(assetPartsTable).where(eq(assetPartsTable.assetId, assetId));
    const inventoryItems = await db.select().from(inventoryItemsTable);
    res.json(parts.map(p => enrichPart(p, inventoryItems)));
    return;
  } catch (err) {
    req.log.error({ err }, "Error fetching asset parts");
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

router.post("/assets/:id/parts", async (req, res) => {
  try {
    const assetId = Number(req.params.id);
    if (!Number.isFinite(assetId)) return res.status(400).json({ error: "Invalid id" });
    const { inventoryItemId, partName, reference, quantity, unit, note } = req.body;
    if (!partName) return res.status(400).json({ error: "partName is required" });
    const [part] = await db.insert(assetPartsTable).values({
      assetId,
      inventoryItemId: inventoryItemId || null,
      partName,
      reference,
      quantity: quantity ?? 1,
      unit,
      note,
    }).returning();
    const inventoryItems = await db.select().from(inventoryItemsTable);
    res.status(201).json(enrichPart(part, inventoryItems));
    return;
  } catch (err) {
    req.log.error({ err }, "Error creating asset part");
    res.status(400).json({ error: "Invalid request" });
    return;
  }
});

router.put("/assets/:id/parts/:partId", async (req, res) => {
  try {
    const partId = Number(req.params.partId);
    const { inventoryItemId, partName, reference, quantity, unit, note } = req.body;
    const update: any = {};
    if (inventoryItemId !== undefined) update.inventoryItemId = inventoryItemId;
    if (partName !== undefined) update.partName = partName;
    if (reference !== undefined) update.reference = reference;
    if (quantity !== undefined) update.quantity = quantity;
    if (unit !== undefined) update.unit = unit;
    if (note !== undefined) update.note = note;
    const [part] = await db.update(assetPartsTable).set(update).where(eq(assetPartsTable.id, partId)).returning();
    if (!part) return res.status(404).json({ error: "Part not found" });
    const inventoryItems = await db.select().from(inventoryItemsTable);
    res.json(enrichPart(part, inventoryItems));
    return;
  } catch (err) {
    req.log.error({ err }, "Error updating asset part");
    res.status(400).json({ error: "Invalid request" });
    return;
  }
});

router.delete("/assets/:id/parts/:partId", async (req, res) => {
  try {
    const partId = Number(req.params.partId);
    await db.delete(assetPartsTable).where(eq(assetPartsTable.id, partId));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting asset part");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

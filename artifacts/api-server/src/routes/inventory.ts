import { Router } from "express";
import { db, inventoryItemsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateInventoryItemBody,
  GetInventoryItemsQueryParams,
  UpdateInventoryItemParams,
  UpdateInventoryItemBody,
  DeleteInventoryItemParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/inventory", async (req, res) => {
  try {
    const params = GetInventoryItemsQueryParams.parse(req.query);
    let items = await db.select().from(inventoryItemsTable);

    if (params.lowStock) {
      items = items.filter(i => i.quantity <= i.minQuantity);
    }
    if (params.search) {
      const search = params.search.toLowerCase();
      items = items.filter(i =>
        i.name.toLowerCase().includes(search) ||
        (i.reference || "").toLowerCase().includes(search) ||
        (i.supplier || "").toLowerCase().includes(search)
      );
    }

    const enriched = items.map(i => ({
      ...i,
      createdAt: i.createdAt.toISOString(),
      isLowStock: i.quantity <= i.minQuantity,
      totalValue: i.unitCost != null ? i.quantity * i.unitCost : null,
    }));

    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Error fetching inventory");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/inventory", async (req, res) => {
  try {
    const body = CreateInventoryItemBody.parse(req.body);
    const [item] = await db.insert(inventoryItemsTable).values(body).returning();
    res.status(201).json({
      ...item,
      createdAt: item.createdAt.toISOString(),
      isLowStock: item.quantity <= item.minQuantity,
      totalValue: item.unitCost != null ? item.quantity * item.unitCost : null,
    });
  } catch (err) {
    req.log.error({ err }, "Error creating inventory item");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.put("/inventory/:id", async (req, res) => {
  try {
    const { id } = UpdateInventoryItemParams.parse({ id: Number(req.params.id) });
    const body = UpdateInventoryItemBody.parse(req.body);
    const [item] = await db.update(inventoryItemsTable).set(body).where(eq(inventoryItemsTable.id, id)).returning();
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json({
      ...item,
      createdAt: item.createdAt.toISOString(),
      isLowStock: item.quantity <= item.minQuantity,
      totalValue: item.unitCost != null ? item.quantity * item.unitCost : null,
    });
  } catch (err) {
    req.log.error({ err }, "Error updating inventory item");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.delete("/inventory/:id", async (req, res) => {
  try {
    const { id } = DeleteInventoryItemParams.parse({ id: Number(req.params.id) });
    await db.delete(inventoryItemsTable).where(eq(inventoryItemsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting inventory item");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

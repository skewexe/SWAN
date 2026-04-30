import { Router } from "express";
import { db, assetsTable } from "@workspace/db";
import { eq, ilike, and } from "drizzle-orm";
import {
  CreateAssetBody,
  GetAssetsQueryParams,
  GetAssetParams,
  UpdateAssetParams,
  UpdateAssetBody,
  DeleteAssetParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/assets", async (req, res) => {
  try {
    const params = GetAssetsQueryParams.parse(req.query);
    let assets = await db.select().from(assetsTable);

    if (params.status) {
      assets = assets.filter(a => a.status === params.status);
    }
    if (params.category) {
      assets = assets.filter(a => a.category.toLowerCase().includes(params.category!.toLowerCase()));
    }
    if (params.search) {
      const search = params.search.toLowerCase();
      assets = assets.filter(a =>
        a.name.toLowerCase().includes(search) ||
        (a.serialNumber || "").toLowerCase().includes(search) ||
        (a.location || "").toLowerCase().includes(search)
      );
    }

    res.json(assets.map(a => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Error fetching assets");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/assets", async (req, res) => {
  try {
    const body = CreateAssetBody.parse(req.body);
    const [asset] = await db.insert(assetsTable).values(body).returning();
    res.status(201).json({ ...asset, createdAt: asset.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error creating asset");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.get("/assets/:id", async (req, res) => {
  try {
    const { id } = GetAssetParams.parse({ id: Number(req.params.id) });
    const [asset] = await db.select().from(assetsTable).where(eq(assetsTable.id, id));
    if (!asset) return res.status(404).json({ error: "Asset not found" });
    res.json({ ...asset, createdAt: asset.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error fetching asset");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/assets/:id", async (req, res) => {
  try {
    const { id } = UpdateAssetParams.parse({ id: Number(req.params.id) });
    const body = UpdateAssetBody.parse(req.body);
    const [asset] = await db.update(assetsTable).set(body).where(eq(assetsTable.id, id)).returning();
    if (!asset) return res.status(404).json({ error: "Asset not found" });
    res.json({ ...asset, createdAt: asset.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error updating asset");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.delete("/assets/:id", async (req, res) => {
  try {
    const { id } = DeleteAssetParams.parse({ id: Number(req.params.id) });
    await db.delete(assetsTable).where(eq(assetsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting asset");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

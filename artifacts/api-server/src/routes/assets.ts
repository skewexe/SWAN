import { Router } from "express";
import { db, assetsTable, workOrdersTable, techniciansTable, sitesTable, zonesTable } from "@workspace/db";
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

const enrich = (asset: any, sites: any[], zones: any[]) => ({
  ...asset,
  createdAt: asset.createdAt.toISOString(),
  siteName: sites.find(s => s.id === asset.siteId)?.name,
  zoneName: zones.find(z => z.id === asset.zoneId)?.name,
});

router.get("/assets", async (req, res) => {
  try {
    const params = GetAssetsQueryParams.parse(req.query);
    let assets = await db.select().from(assetsTable);
    const sites = await db.select().from(sitesTable);
    const zones = await db.select().from(zonesTable);

    if (params.status) assets = assets.filter(a => a.status === params.status);
    if (params.category) assets = assets.filter(a => a.category.toLowerCase().includes(params.category!.toLowerCase()));
    if (params.search) {
      const search = params.search.toLowerCase();
      assets = assets.filter(a =>
        a.name.toLowerCase().includes(search) ||
        (a.serialNumber || "").toLowerCase().includes(search) ||
        (a.location || "").toLowerCase().includes(search)
      );
    }

    res.json(assets.map(a => enrich(a, sites, zones)));
  } catch (err) {
    req.log.error({ err }, "Error fetching assets");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/assets", async (req, res) => {
  try {
    const body = CreateAssetBody.parse(req.body);
    const [asset] = await db.insert(assetsTable).values(body).returning();
    const sites = await db.select().from(sitesTable);
    const zones = await db.select().from(zonesTable);
    res.status(201).json(enrich(asset, sites, zones));
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
    const sites = await db.select().from(sitesTable);
    const zones = await db.select().from(zonesTable);
    res.json(enrich(asset, sites, zones));
    return;
  } catch (err) {
    req.log.error({ err }, "Error fetching asset");
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

router.put("/assets/:id", async (req, res) => {
  try {
    const { id } = UpdateAssetParams.parse({ id: Number(req.params.id) });
    const body = UpdateAssetBody.parse(req.body);
    const [asset] = await db.update(assetsTable).set(body).where(eq(assetsTable.id, id)).returning();
    if (!asset) return res.status(404).json({ error: "Asset not found" });
    const sites = await db.select().from(sitesTable);
    const zones = await db.select().from(zonesTable);
    res.json(enrich(asset, sites, zones));
    return;
  } catch (err) {
    req.log.error({ err }, "Error updating asset");
    res.status(400).json({ error: "Invalid request" });
    return;
  }
});

router.get("/assets/:id/workorders", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const technicians = await db.select().from(techniciansTable);
    const sites = await db.select().from(sitesTable);
    const zones = await db.select().from(zonesTable);
    const workOrders = await db.select().from(workOrdersTable).where(eq(workOrdersTable.assetId, id));
    const enriched = workOrders.map(wo => ({
      ...wo,
      createdAt: wo.createdAt.toISOString(),
      technicianName: technicians.find(t => t.id === wo.technicianId)?.name,
      siteName: sites.find(s => s.id === wo.siteId)?.name,
      zoneName: zones.find(z => z.id === wo.zoneId)?.name,
    }));
    res.json(enriched);
    return;
  } catch (err) {
    req.log.error({ err }, "Error fetching asset work orders");
    res.status(500).json({ error: "Internal server error" });
    return;
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

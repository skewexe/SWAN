import { Router } from "express";
import { db, workOrdersTable, assetsTable, techniciansTable, sitesTable, zonesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateWorkOrderBody,
  GetWorkOrdersQueryParams,
  GetWorkOrderParams,
  UpdateWorkOrderParams,
  UpdateWorkOrderBody,
  DeleteWorkOrderParams,
} from "@workspace/api-zod";

const router = Router();

const enrich = (wo: any, assets: any[], technicians: any[], sites: any[], zones: any[]) => ({
  ...wo,
  createdAt: wo.createdAt.toISOString(),
  assetName: assets.find(a => a.id === wo.assetId)?.name,
  technicianName: technicians.find(t => t.id === wo.technicianId)?.name,
  siteName: sites.find(s => s.id === wo.siteId)?.name,
  zoneName: zones.find(z => z.id === wo.zoneId)?.name,
});

router.get("/workorders", async (req, res) => {
  try {
    const params = GetWorkOrdersQueryParams.parse(req.query);
    const assets = await db.select().from(assetsTable);
    const technicians = await db.select().from(techniciansTable);
    const sites = await db.select().from(sitesTable);
    const zones = await db.select().from(zonesTable);
    let workOrders = await db.select().from(workOrdersTable);

    if (params.status) workOrders = workOrders.filter(wo => wo.status === params.status);
    if (params.priority) workOrders = workOrders.filter(wo => wo.priority === params.priority);
    if (params.type) workOrders = workOrders.filter(wo => wo.type === params.type);

    res.json(workOrders.map(wo => enrich(wo, assets, technicians, sites, zones)));
  } catch (err) {
    req.log.error({ err }, "Error fetching work orders");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/workorders", async (req, res) => {
  try {
    const body = CreateWorkOrderBody.parse(req.body);
    const [wo] = await db.insert(workOrdersTable).values(body).returning();
    const assets = await db.select().from(assetsTable);
    const technicians = await db.select().from(techniciansTable);
    const sites = await db.select().from(sitesTable);
    const zones = await db.select().from(zonesTable);
    res.status(201).json(enrich(wo, assets, technicians, sites, zones));
  } catch (err) {
    req.log.error({ err }, "Error creating work order");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.get("/workorders/:id", async (req, res) => {
  try {
    const { id } = GetWorkOrderParams.parse({ id: Number(req.params.id) });
    const [wo] = await db.select().from(workOrdersTable).where(eq(workOrdersTable.id, id));
    if (!wo) return res.status(404).json({ error: "Work order not found" });
    const assets = await db.select().from(assetsTable);
    const technicians = await db.select().from(techniciansTable);
    const sites = await db.select().from(sitesTable);
    const zones = await db.select().from(zonesTable);
    res.json(enrich(wo, assets, technicians, sites, zones));
    return;
  } catch (err) {
    req.log.error({ err }, "Error fetching work order");
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

router.put("/workorders/:id", async (req, res) => {
  try {
    const { id } = UpdateWorkOrderParams.parse({ id: Number(req.params.id) });
    const body = UpdateWorkOrderBody.partial().parse(req.body);
    const [wo] = await db.update(workOrdersTable).set(body).where(eq(workOrdersTable.id, id)).returning();
    if (!wo) return res.status(404).json({ error: "Work order not found" });
    const assets = await db.select().from(assetsTable);
    const technicians = await db.select().from(techniciansTable);
    const sites = await db.select().from(sitesTable);
    const zones = await db.select().from(zonesTable);
    res.json(enrich(wo, assets, technicians, sites, zones));
    return;
  } catch (err) {
    req.log.error({ err }, "Error updating work order");
    res.status(400).json({ error: "Invalid request" });
    return;
  }
});

router.delete("/workorders/:id", async (req, res) => {
  try {
    const { id } = DeleteWorkOrderParams.parse({ id: Number(req.params.id) });
    await db.delete(workOrdersTable).where(eq(workOrdersTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting work order");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

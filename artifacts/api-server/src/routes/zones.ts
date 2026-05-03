import { Router } from "express";
import { db, zonesTable, sitesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/zones", async (req, res) => {
  try {
    const siteIdParam = req.query.siteId ? Number(req.query.siteId) : undefined;
    let zones = await db.select().from(zonesTable);
    const sites = await db.select().from(sitesTable);
    if (siteIdParam) zones = zones.filter(z => z.siteId === siteIdParam);
    res.json(zones.map(z => ({
      ...z,
      createdAt: z.createdAt.toISOString(),
      siteName: sites.find(s => s.id === z.siteId)?.name,
    })));
  } catch (err) {
    req.log.error({ err }, "Error fetching zones");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/zones", async (req, res) => {
  try {
    const { name, siteId, description } = req.body;
    if (!name) { res.status(400).json({ error: "name is required" }); return; }
    const [zone] = await db.insert(zonesTable).values({ name, siteId: siteId || null, description }).returning();
    const sites = await db.select().from(sitesTable);
    res.status(201).json({
      ...zone,
      createdAt: zone.createdAt.toISOString(),
      siteName: sites.find(s => s.id === zone.siteId)?.name,
    });
    return;
  } catch (err) {
    req.log.error({ err }, "Error creating zone");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.put("/zones/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, siteId, description } = req.body;
    const update: any = {};
    if (name !== undefined) update.name = name;
    if (siteId !== undefined) update.siteId = siteId;
    if (description !== undefined) update.description = description;
    const [zone] = await db.update(zonesTable).set(update).where(eq(zonesTable.id, id)).returning();
    if (!zone) return res.status(404).json({ error: "Zone not found" });
    const sites = await db.select().from(sitesTable);
    res.json({ ...zone, createdAt: zone.createdAt.toISOString(), siteName: sites.find(s => s.id === zone.siteId)?.name });
    return;
  } catch (err) {
    req.log.error({ err }, "Error updating zone");
    res.status(400).json({ error: "Invalid request" });
    return;
  }
});

router.delete("/zones/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(zonesTable).where(eq(zonesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting zone");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

import { Router } from "express";
import { db, sitesTable, zonesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/sites", async (req, res) => {
  try {
    const sites = await db.select().from(sitesTable);
    const zones = await db.select().from(zonesTable);
    res.json(sites.map(s => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
      zoneCount: zones.filter(z => z.siteId === s.id).length,
    })));
  } catch (err) {
    req.log.error({ err }, "Error fetching sites");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/sites", async (req, res) => {
  try {
    const { name, location, city, country } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    const [site] = await db.insert(sitesTable).values({ name, location, city, country }).returning();
    res.status(201).json({ ...site, createdAt: site.createdAt.toISOString(), zoneCount: 0 });
    return;
  } catch (err) {
    req.log.error({ err }, "Error creating site");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.put("/sites/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, location, city, country } = req.body;
    const update: any = {};
    if (name !== undefined) update.name = name;
    if (location !== undefined) update.location = location;
    if (city !== undefined) update.city = city;
    if (country !== undefined) update.country = country;
    const [site] = await db.update(sitesTable).set(update).where(eq(sitesTable.id, id)).returning();
    if (!site) return res.status(404).json({ error: "Site not found" });
    const zones = await db.select().from(zonesTable);
    res.json({ ...site, createdAt: site.createdAt.toISOString(), zoneCount: zones.filter(z => z.siteId === site.id).length });
    return;
  } catch (err) {
    req.log.error({ err }, "Error updating site");
    res.status(400).json({ error: "Invalid request" });
    return;
  }
});

router.delete("/sites/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(sitesTable).where(eq(sitesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting site");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

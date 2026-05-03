import { Router } from "express";
import { db, techniciansTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateTechnicianBody,
  UpdateTechnicianParams,
  UpdateTechnicianBody,
  DeleteTechnicianParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/technicians", async (req, res) => {
  try {
    const technicians = await db.select().from(techniciansTable);
    res.json(technicians.map(t => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Error fetching technicians");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/technicians", async (req, res) => {
  try {
    const body = CreateTechnicianBody.parse(req.body);
    const [technician] = await db.insert(techniciansTable).values(body).returning();
    res.status(201).json({ ...technician, createdAt: technician.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error creating technician");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.put("/technicians/:id", async (req, res) => {
  try {
    const { id } = UpdateTechnicianParams.parse({ id: Number(req.params.id) });
    const body = UpdateTechnicianBody.parse(req.body);
    const [technician] = await db.update(techniciansTable).set(body).where(eq(techniciansTable.id, id)).returning();
    if (!technician) return res.status(404).json({ error: "Technician not found" });
    res.json({ ...technician, createdAt: technician.createdAt.toISOString() });
    return;
  } catch (err) {
    req.log.error({ err }, "Error updating technician");
    res.status(400).json({ error: "Invalid request" });
    return;
  }
});

router.delete("/technicians/:id", async (req, res) => {
  try {
    const { id } = DeleteTechnicianParams.parse({ id: Number(req.params.id) });
    await db.delete(techniciansTable).where(eq(techniciansTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting technician");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

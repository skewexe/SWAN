import { Router } from "express";
import { db, subcontractorsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const serialize = (s: any) => ({
  ...s,
  createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
});

router.get("/subcontractors", async (req, res) => {
  try {
    const list = await db.select().from(subcontractorsTable);
    res.json(list.map(serialize));
  } catch (err) {
    req.log.error({ err }, "Error fetching subcontractors");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/subcontractors", async (req, res) => {
  try {
    const { name, specialty, contactName, phone, email, address, city, rating, status, contractStart, contractEnd, contractRef, notes } = req.body;
    if (!name || !specialty) return res.status(400).json({ error: "name and specialty are required" });
    const [s] = await db.insert(subcontractorsTable).values({
      name, specialty,
      contactName: contactName || null,
      phone: phone || null,
      email: email || null,
      address: address || null,
      city: city || null,
      rating: rating ? Number(rating) : null,
      status: status || "active",
      contractStart: contractStart || null,
      contractEnd: contractEnd || null,
      contractRef: contractRef || null,
      notes: notes || null,
    }).returning();
    res.status(201).json(serialize(s));
    return;
  } catch (err) {
    req.log.error({ err }, "Error creating subcontractor");
    res.status(400).json({ error: "Invalid request" });
    return;
  }
});

router.put("/subcontractors/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const { name, specialty, contactName, phone, email, address, city, rating, status, contractStart, contractEnd, contractRef, notes } = req.body;
    const update: any = {};
    if (name !== undefined) update.name = name;
    if (specialty !== undefined) update.specialty = specialty;
    if (contactName !== undefined) update.contactName = contactName;
    if (phone !== undefined) update.phone = phone;
    if (email !== undefined) update.email = email;
    if (address !== undefined) update.address = address;
    if (city !== undefined) update.city = city;
    if (rating !== undefined) update.rating = Number(rating);
    if (status !== undefined) update.status = status;
    if (contractStart !== undefined) update.contractStart = contractStart;
    if (contractEnd !== undefined) update.contractEnd = contractEnd;
    if (contractRef !== undefined) update.contractRef = contractRef;
    if (notes !== undefined) update.notes = notes;
    const [s] = await db.update(subcontractorsTable).set(update).where(eq(subcontractorsTable.id, id)).returning();
    if (!s) return res.status(404).json({ error: "Not found" });
    res.json(serialize(s));
    return;
  } catch (err) {
    req.log.error({ err }, "Error updating subcontractor");
    res.status(400).json({ error: "Invalid request" });
    return;
  }
});

router.delete("/subcontractors/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(subcontractorsTable).where(eq(subcontractorsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting subcontractor");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

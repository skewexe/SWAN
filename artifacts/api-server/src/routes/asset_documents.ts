import { Router } from "express";
import { db, assetDocumentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/assets/:id/documents", async (req, res) => {
  try {
    const assetId = Number(req.params.id);
    if (!Number.isFinite(assetId)) return res.status(400).json({ error: "Invalid id" });
    const docs = await db.select().from(assetDocumentsTable).where(eq(assetDocumentsTable.assetId, assetId));
    res.json(docs.map(d => ({ ...d, uploadedAt: d.uploadedAt.toISOString() })));
    return;
  } catch (err) {
    req.log.error({ err }, "Error fetching asset documents");
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

router.post("/assets/:id/documents", async (req, res) => {
  try {
    const assetId = Number(req.params.id);
    if (!Number.isFinite(assetId)) return res.status(400).json({ error: "Invalid id" });
    const { name, type, url, description } = req.body;
    if (!name || !url) return res.status(400).json({ error: "name and url are required" });
    const [doc] = await db.insert(assetDocumentsTable).values({
      assetId, name, type: type || "manual", url, description,
    }).returning();
    res.status(201).json({ ...doc, uploadedAt: doc.uploadedAt.toISOString() });
    return;
  } catch (err) {
    req.log.error({ err }, "Error creating asset document");
    res.status(400).json({ error: "Invalid request" });
    return;
  }
});

router.delete("/assets/:id/documents/:docId", async (req, res) => {
  try {
    const docId = Number(req.params.docId);
    await db.delete(assetDocumentsTable).where(eq(assetDocumentsTable.id, docId));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting asset document");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

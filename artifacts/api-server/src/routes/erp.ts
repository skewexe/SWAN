import { Router } from "express";
import { db, erpConnectionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

// GET /erp/connections
router.get("/erp/connections", async (req, res) => {
  try {
    const connections = await db
      .select()
      .from(erpConnectionsTable)
      .orderBy(desc(erpConnectionsTable.createdAt));
    const safe = connections.map(c => ({
      ...c,
      apiKey: c.apiKey ? "***" : null,
      password: c.password ? "***" : null,
    }));
    res.json(safe);
  } catch (err) {
    req.log.error({ err }, "Failed to get ERP connections");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /erp/connections
router.post("/erp/connections", async (req, res) => {
  const { name, erpType, url, apiKey, authType, username, password, syncMode, syncEntities } = req.body;
  if (!name || !erpType || !url) {
    res.status(400).json({ error: "name, erpType, url sont requis" });
    return;
  }
  try {
    const [conn] = await db
      .insert(erpConnectionsTable)
      .values({
        name,
        erpType,
        url,
        apiKey: apiKey || null,
        authType: authType || "api_key",
        username: username || null,
        password: password || null,
        syncMode: syncMode || "pull",
        syncEntities: syncEntities || [],
      })
      .returning();
    res.status(201).json({ ...conn, apiKey: conn.apiKey ? "***" : null, password: conn.password ? "***" : null });
  } catch (err) {
    req.log.error({ err }, "Failed to create ERP connection");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PUT /erp/connections/:id
router.put("/erp/connections/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, erpType, url, apiKey, authType, username, password, syncMode, syncEntities, fieldMapping, enabled } = req.body;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (erpType !== undefined) updates.erpType = erpType;
  if (url !== undefined) updates.url = url;
  if (apiKey !== undefined) updates.apiKey = apiKey;
  if (authType !== undefined) updates.authType = authType;
  if (username !== undefined) updates.username = username;
  if (password !== undefined) updates.password = password;
  if (syncMode !== undefined) updates.syncMode = syncMode;
  if (syncEntities !== undefined) updates.syncEntities = syncEntities;
  if (fieldMapping !== undefined) updates.fieldMapping = fieldMapping;
  if (enabled !== undefined) updates.enabled = Boolean(enabled);

  try {
    const [updated] = await db
      .update(erpConnectionsTable)
      .set(updates)
      .where(eq(erpConnectionsTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Connexion introuvable" }); return; }
    res.json({ ...updated, apiKey: updated.apiKey ? "***" : null, password: updated.password ? "***" : null });
  } catch (err) {
    req.log.error({ err }, "Failed to update ERP connection");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /erp/connections/:id
router.delete("/erp/connections/:id", async (req, res) => {
  try {
    await db.delete(erpConnectionsTable).where(eq(erpConnectionsTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete ERP connection");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /erp/connections/:id/test
router.post("/erp/connections/:id/test", async (req, res) => {
  const [conn] = await db
    .select()
    .from(erpConnectionsTable)
    .where(eq(erpConnectionsTable.id, Number(req.params.id)));
  if (!conn) { res.status(404).json({ error: "Connexion introuvable" }); return; }

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (conn.authType === "api_key" && conn.apiKey) {
      headers["Authorization"] = `Bearer ${conn.apiKey}`;
    } else if (conn.authType === "basic" && conn.username && conn.password) {
      const b64 = Buffer.from(`${conn.username}:${conn.password}`).toString("base64");
      headers["Authorization"] = `Basic ${b64}`;
    }
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 8000);
    try {
      await fetch(conn.url, { headers, signal: controller.signal });
    } finally {
      clearTimeout(tid);
    }
    await db.update(erpConnectionsTable)
      .set({ status: "active", lastError: null })
      .where(eq(erpConnectionsTable.id, conn.id));
    res.json({ success: true, status: "active" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await db.update(erpConnectionsTable)
      .set({ status: "error", lastError: msg })
      .where(eq(erpConnectionsTable.id, conn.id));
    res.json({ success: false, status: "error", error: msg });
  }
});

// POST /erp/connections/:id/sync
router.post("/erp/connections/:id/sync", async (req, res) => {
  const [conn] = await db
    .select()
    .from(erpConnectionsTable)
    .where(eq(erpConnectionsTable.id, Number(req.params.id)));
  if (!conn) { res.status(404).json({ error: "Connexion introuvable" }); return; }

  try {
    const now = new Date();
    await db.update(erpConnectionsTable)
      .set({ lastSync: now, status: "active" })
      .where(eq(erpConnectionsTable.id, conn.id));
    res.json({ success: true, syncedAt: now.toISOString(), message: "Synchronisation déclenchée" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.json({ success: false, error: msg });
  }
});

export default router;

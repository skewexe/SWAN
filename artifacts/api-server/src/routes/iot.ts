import { Router } from "express";
import { db, iotDevicesTable, iotRulesTable, iotEventsTable, workOrdersTable, assetsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

const router = Router();

// ── Devices ──────────────────────────────────────────────────────────────────

router.get("/iot/devices", async (req, res) => {
  try {
    const devices = await db.select().from(iotDevicesTable).orderBy(desc(iotDevicesTable.createdAt));
    const enriched = await Promise.all(devices.map(async (d) => {
      let assetName: string | null = null;
      if (d.assetId) {
        const [asset] = await db.select({ name: assetsTable.name }).from(assetsTable).where(eq(assetsTable.id, d.assetId));
        assetName = asset?.name ?? null;
      }
      const lastEvent = await db.select().from(iotEventsTable).where(eq(iotEventsTable.deviceId, d.id)).orderBy(desc(iotEventsTable.ts)).limit(1);
      return {
        ...d,
        assetName,
        lastSeen: d.lastSeen?.toISOString() ?? null,
        createdAt: d.createdAt.toISOString(),
        lastMetric: lastEvent[0] ? { metric: lastEvent[0].metric, value: lastEvent[0].value, unit: lastEvent[0].unit, ts: lastEvent[0].ts.toISOString() } : null,
      };
    }));
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Error fetching IoT devices");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/iot/devices", async (req, res) => {
  try {
    const { name, deviceId, protocol, assetId, ipAddress, port, mqttTopic, modbusSlaveId, opcuaNodeId, webhookUrl, description } = req.body;
    if (!name || !deviceId || !protocol) {
      res.status(400).json({ error: "name, deviceId, protocol requis" });
      return;
    }
    const [device] = await db.insert(iotDevicesTable).values({
      name, deviceId, protocol, status: "offline",
      assetId: assetId ? Number(assetId) : null,
      ipAddress: ipAddress || null,
      port: port ? Number(port) : null,
      mqttTopic: mqttTopic || null,
      modbusSlaveId: modbusSlaveId ? Number(modbusSlaveId) : null,
      opcuaNodeId: opcuaNodeId || null,
      webhookUrl: webhookUrl || null,
      description: description || null,
    }).returning();
    res.status(201).json({ ...device, createdAt: device.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error creating IoT device");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/iot/devices/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, assetId, status, ipAddress, port, mqttTopic, modbusSlaveId, opcuaNodeId, webhookUrl, description, firmwareVersion } = req.body;
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (assetId !== undefined) updates.assetId = assetId ? Number(assetId) : null;
    if (status !== undefined) updates.status = status;
    if (ipAddress !== undefined) updates.ipAddress = ipAddress;
    if (port !== undefined) updates.port = port ? Number(port) : null;
    if (mqttTopic !== undefined) updates.mqttTopic = mqttTopic;
    if (modbusSlaveId !== undefined) updates.modbusSlaveId = modbusSlaveId ? Number(modbusSlaveId) : null;
    if (opcuaNodeId !== undefined) updates.opcuaNodeId = opcuaNodeId;
    if (webhookUrl !== undefined) updates.webhookUrl = webhookUrl;
    if (description !== undefined) updates.description = description;
    if (firmwareVersion !== undefined) updates.firmwareVersion = firmwareVersion;
    const [updated] = await db.update(iotDevicesTable).set(updates).where(eq(iotDevicesTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Device introuvable" }); return; }
    res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error updating IoT device");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/iot/devices/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(iotRulesTable).where(eq(iotRulesTable.deviceId, id));
    await db.delete(iotEventsTable).where(eq(iotEventsTable.deviceId, id));
    await db.delete(iotDevicesTable).where(eq(iotDevicesTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Error deleting IoT device");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Rules ─────────────────────────────────────────────────────────────────────

router.get("/iot/rules", async (req, res) => {
  try {
    const { deviceId } = req.query;
    let rules = await db.select().from(iotRulesTable).orderBy(desc(iotRulesTable.createdAt));
    if (deviceId) rules = rules.filter(r => r.deviceId === Number(deviceId));
    res.json(rules.map(r => ({ ...r, createdAt: r.createdAt.toISOString(), lastFiredAt: r.lastFiredAt?.toISOString() ?? null })));
  } catch (err) {
    req.log.error({ err }, "Error fetching IoT rules");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/iot/rules", async (req, res) => {
  try {
    const { deviceId, name, metric, condition, threshold, unit, durationMinutes, action, actionCreateWoPriority, actionAlertChannels } = req.body;
    if (!deviceId || !name || !metric || !condition || threshold === undefined || !action) {
      res.status(400).json({ error: "Champs requis manquants" });
      return;
    }
    const [rule] = await db.insert(iotRulesTable).values({
      deviceId: Number(deviceId), name, metric, condition, threshold: Number(threshold),
      unit: unit || null,
      durationMinutes: durationMinutes ? Number(durationMinutes) : 0,
      action,
      actionCreateWoPriority: actionCreateWoPriority || null,
      actionAlertChannels: actionAlertChannels || null,
      enabled: true,
    }).returning();
    res.status(201).json({ ...rule, createdAt: rule.createdAt.toISOString(), lastFiredAt: null });
  } catch (err) {
    req.log.error({ err }, "Error creating IoT rule");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/iot/rules/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { enabled, name, metric, condition, threshold, unit, durationMinutes, action, actionCreateWoPriority, actionAlertChannels } = req.body;
    const updates: Record<string, unknown> = {};
    if (enabled !== undefined) updates.enabled = Boolean(enabled);
    if (name !== undefined) updates.name = name;
    if (metric !== undefined) updates.metric = metric;
    if (condition !== undefined) updates.condition = condition;
    if (threshold !== undefined) updates.threshold = Number(threshold);
    if (unit !== undefined) updates.unit = unit;
    if (durationMinutes !== undefined) updates.durationMinutes = Number(durationMinutes);
    if (action !== undefined) updates.action = action;
    if (actionCreateWoPriority !== undefined) updates.actionCreateWoPriority = actionCreateWoPriority;
    if (actionAlertChannels !== undefined) updates.actionAlertChannels = actionAlertChannels;
    const [updated] = await db.update(iotRulesTable).set(updates).where(eq(iotRulesTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Règle introuvable" }); return; }
    res.json({ ...updated, createdAt: updated.createdAt.toISOString(), lastFiredAt: updated.lastFiredAt?.toISOString() ?? null });
  } catch (err) {
    req.log.error({ err }, "Error updating IoT rule");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/iot/rules/:id", async (req, res) => {
  try {
    await db.delete(iotRulesTable).where(eq(iotRulesTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Error deleting IoT rule");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Events / Ingestion ────────────────────────────────────────────────────────

router.post("/iot/events", async (req, res) => {
  try {
    const { asset_id, device_id, metric, value, unit, ts, raw } = req.body;
    if (!device_id || !metric || value === undefined) {
      res.status(400).json({ error: "device_id, metric, value requis" });
      return;
    }

    // resolve device
    const [device] = await db.select().from(iotDevicesTable).where(eq(iotDevicesTable.deviceId, String(device_id)));
    if (!device) { res.status(404).json({ error: "Device introuvable" }); return; }

    const numVal = Number(value);
    const assetId = asset_id ? Number(asset_id) : device.assetId;
    const eventTs = ts ? new Date(ts) : new Date();

    // evaluate rules
    const rules = await db.select().from(iotRulesTable).where(and(eq(iotRulesTable.deviceId, device.id), eq(iotRulesTable.enabled, true)));
    let rulesFired = 0;
    let woCreatedId: number | null = null;
    const actionsTaken: string[] = [];
    let thresholdStatus: "normal" | "warning" | "critical" = "normal";

    for (const rule of rules) {
      if (rule.metric !== metric) continue;
      let triggered = false;
      if (rule.condition === "above" && numVal > rule.threshold) triggered = true;
      if (rule.condition === "below" && numVal < rule.threshold) triggered = true;
      if (!triggered) continue;

      rulesFired++;
      thresholdStatus = "warning";

      // mark rule fired
      await db.update(iotRulesTable).set({ lastFiredAt: new Date() }).where(eq(iotRulesTable.id, rule.id));

      if (rule.action === "create_wo" && assetId) {
        const [wo] = await db.insert(workOrdersTable).values({
          title: `[IoT] ${rule.name} — ${metric} = ${numVal} ${unit ?? ""}`,
          description: `Règle déclenchée : ${metric} ${rule.condition === "above" ? ">" : "<"} ${rule.threshold} ${unit ?? ""}. Valeur mesurée : ${numVal}.`,
          type: "predictive",
          priority: (rule.actionCreateWoPriority as "low" | "medium" | "high" | "critical") || "high",
          status: "open",
          assetId: Number(assetId),
        }).returning();
        woCreatedId = wo.id;
        actionsTaken.push("ot_created");
      }
      if (rule.action === "alert" || rule.action === "alert_and_wo") {
        actionsTaken.push("alert_sent");
      }
    }

    // store event
    const [event] = await db.insert(iotEventsTable).values({
      deviceId: device.id,
      assetId: assetId ? Number(assetId) : null,
      metric,
      value: numVal,
      unit: unit ?? null,
      quality: "good",
      thresholdStatus,
      ruleId: null,
      woCreatedId,
      rawPayload: raw ?? null,
      ts: eventTs,
    }).returning();

    // update device lastSeen
    await db.update(iotDevicesTable).set({ lastSeen: new Date(), status: "online" }).where(eq(iotDevicesTable.id, device.id));

    res.json({
      received: true,
      eventId: event.id,
      rules_evaluated: rules.filter(r => r.metric === metric).length,
      rules_fired: rulesFired,
      actions: actionsTaken,
      ot_id: woCreatedId ?? undefined,
    });
  } catch (err) {
    req.log.error({ err }, "Error ingesting IoT event");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/iot/events", async (req, res) => {
  try {
    const { deviceId, limit: limitQ } = req.query;
    const limitN = Math.min(Number(limitQ) || 200, 500);
    let events = await db.select().from(iotEventsTable).orderBy(desc(iotEventsTable.ts)).limit(limitN);
    if (deviceId) events = events.filter(e => e.deviceId === Number(deviceId));
    res.json(events.map(e => ({ ...e, ts: e.ts.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "Error fetching IoT events");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Device Twin ───────────────────────────────────────────────────────────────

router.get("/iot/devices/:id/twin", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [device] = await db.select().from(iotDevicesTable).where(eq(iotDevicesTable.id, id));
    if (!device) { res.status(404).json({ error: "Device introuvable" }); return; }

    const events = await db.select().from(iotEventsTable).where(eq(iotEventsTable.deviceId, id)).orderBy(desc(iotEventsTable.ts)).limit(500);

    // build twin: last known value per metric
    const metricsMap: Record<string, { value: number; unit: string | null; ts: string; thresholdStatus: string }> = {};
    for (const e of events) {
      if (!metricsMap[e.metric]) {
        metricsMap[e.metric] = { value: e.value, unit: e.unit, ts: e.ts.toISOString(), thresholdStatus: e.thresholdStatus };
      }
    }

    // history last 50 events per metric for sparklines
    const history: Record<string, { value: number; ts: string }[]> = {};
    for (const e of [...events].reverse()) {
      if (!history[e.metric]) history[e.metric] = [];
      if (history[e.metric].length < 50) history[e.metric].push({ value: e.value, ts: e.ts.toISOString() });
    }

    res.json({
      device: { ...device, lastSeen: device.lastSeen?.toISOString() ?? null, createdAt: device.createdAt.toISOString() },
      metrics: metricsMap,
      history,
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching device twin");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Stats ─────────────────────────────────────────────────────────────────────

router.get("/iot/stats", async (req, res) => {
  try {
    const devices = await db.select().from(iotDevicesTable);
    const rules = await db.select().from(iotRulesTable);
    const events = await db.select().from(iotEventsTable).orderBy(desc(iotEventsTable.ts)).limit(1000);
    const online = devices.filter(d => d.status === "online").length;
    const offline = devices.filter(d => d.status === "offline").length;
    const alerts = events.filter(e => e.thresholdStatus !== "normal").length;
    const eventsByMetric: Record<string, number> = {};
    for (const e of events) { eventsByMetric[e.metric] = (eventsByMetric[e.metric] || 0) + 1; }
    res.json({ totalDevices: devices.length, online, offline, totalRules: rules.length, activeRules: rules.filter(r => r.enabled).length, recentAlerts: alerts, eventsByMetric });
  } catch (err) {
    req.log.error({ err }, "Error fetching IoT stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

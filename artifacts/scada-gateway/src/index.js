'use strict';
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const pino = require('pino');
const MqttAdapter = require('./protocols/mqtt-adapter');
const ModbusAdapter = require('./protocols/modbus-adapter');
const OpcUaAdapter = require('./protocols/opcua-adapter');
const LoRaWANAdapter = require('./protocols/lorawan-adapter');

const logger = pino({ level: process.env.LOG_LEVEL || 'info', transport: { target: 'pino-pretty' } });

const PORT = parseInt(process.env.PORT || '8100', 10);
const SWAN_API_URL = process.env.SWAN_API_URL || 'http://localhost:80/api';
const POLL_DEVICES_MS = parseInt(process.env.POLL_DEVICES_MS || '30000', 10);

// ─── Map flat DB fields → connectionConfig expected by adapters ────────────────
function normalizeDevice(device) {
  const cfg = {};
  const proto = (device.protocol || '').toLowerCase();

  switch (proto) {
    case 'mqtt':
      cfg.brokerUrl = device.ipAddress
        ? `mqtt://${device.ipAddress}:${device.port || 1883}`
        : 'mqtt://localhost:1883';
      cfg.topic = device.mqttTopic || `swan/devices/${device.deviceId}/#`;
      cfg.qos = 1;
      break;
    case 'modbus':
    case 'modbus_tcp':
      cfg.host = device.ipAddress || '127.0.0.1';
      cfg.port = device.port || 502;
      cfg.unitId = device.modbusSlaveId || 1;
      cfg.pollIntervalMs = 5000;
      cfg.registers = [{ address: 40001, count: 1, type: 'holding', metric: 'process_value', scale: 1, unit: '' }];
      break;
    case 'modbus_rtu':
      cfg.host = device.ipAddress || '/dev/ttyUSB0';
      cfg.port = device.port || 9600;
      cfg.unitId = device.modbusSlaveId || 1;
      cfg.pollIntervalMs = 10000;
      cfg.registers = [{ address: 40001, count: 1, type: 'holding', metric: 'process_value', scale: 1, unit: '' }];
      break;
    case 'opc_ua':
    case 'opcua':
    case 'opc-ua':
      cfg.endpoint = `opc.tcp://${device.ipAddress || 'localhost'}:${device.port || 4840}`;
      cfg.nodeIds = device.opcuaNodeId
        ? [{ nodeId: device.opcuaNodeId, metric: 'process_value', unit: '' }]
        : [];
      cfg.subscriptionInterval = 1000;
      break;
    case 'lorawan':
    case 'lora':
      cfg.serverUrl = device.webhookUrl || '';
      cfg.appId = device.mqttTopic || device.deviceId || '';
      break;
    case 'rest':
    case 'http':
      cfg.webhookUrl = device.webhookUrl || '';
      break;
    default:
      break;
  }

  return { ...device, connectionConfig: cfg };
}

// ─── Event forwarder ──────────────────────────────────────────────────────────
// deviceId = device.deviceId string (e.g. "sensor-temp-001"), NOT numeric id
async function forwardEvent({ deviceId, metric, value, unit, rawPayload, source }) {
  try {
    await axios.post(`${SWAN_API_URL}/iot/events`, {
      device_id: deviceId,
      metric,
      value,
      unit: unit || '',
      raw: rawPayload || null,
    }, { timeout: 5000 });
    logger.debug({ deviceId, metric, value }, 'Event forwarded');
  } catch (err) {
    logger.warn({ err: err.message, deviceId, metric }, 'Failed to forward event');
  }
}

// ─── Adapters ─────────────────────────────────────────────────────────────────
const ctx = { logger, forwardEvent };
const mqttAdapter    = new MqttAdapter(ctx);
const modbusAdapter  = new ModbusAdapter(ctx);
const opcuaAdapter   = new OpcUaAdapter(ctx);
const lorawanAdapter = new LoRaWANAdapter(ctx);

const connectedDevices = new Map(); // numeric id → protocol string

// ─── Device sync ──────────────────────────────────────────────────────────────
async function syncDevices() {
  let rawDevices;
  try {
    const res = await axios.get(`${SWAN_API_URL}/iot/devices`, { timeout: 5000 });
    rawDevices = res.data?.devices || res.data || [];
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to fetch devices from Swan API');
    return;
  }

  const activeIds = new Set(rawDevices.map(d => d.id));

  // Remove stale connections
  for (const [id, proto] of connectedDevices) {
    if (!activeIds.has(id)) {
      disconnectDevice(id, proto);
      connectedDevices.delete(id);
      logger.info({ deviceId: id }, 'Device removed — disconnected');
    }
  }

  // Connect / update all devices (no status filter — connect everything with valid config)
  for (const raw of rawDevices) {
    const device = normalizeDevice(raw);
    const proto = (device.protocol || '').toLowerCase();

    const current = connectedDevices.get(device.id);
    if (current === proto) continue; // already connected with same protocol
    if (current) disconnectDevice(device.id, current);

    try {
      switch (proto) {
        case 'mqtt':
          mqttAdapter.connect(device);
          connectedDevices.set(device.id, proto);
          break;
        case 'modbus':
        case 'modbus_tcp':
        case 'modbus_rtu':
          modbusAdapter.connect(device);
          connectedDevices.set(device.id, 'modbus');
          break;
        case 'opc_ua':
        case 'opcua':
        case 'opc-ua':
          await opcuaAdapter.connect(device);
          connectedDevices.set(device.id, 'opcua');
          break;
        case 'lorawan':
        case 'lora':
          lorawanAdapter.register(device);
          connectedDevices.set(device.id, 'lorawan');
          break;
        case 'rest':
        case 'http':
          connectedDevices.set(device.id, 'rest');
          logger.info({ deviceId: device.id, deviceStrId: device.deviceId }, 'REST device registered — awaiting POST /webhook/rest/:deviceId');
          break;
        default:
          logger.warn({ proto, deviceId: device.id }, 'Unknown protocol — skipping');
      }
    } catch (err) {
      logger.error({ err: err.message, deviceId: device.id, proto }, 'Failed to connect device');
    }
  }

  logger.debug({ total: rawDevices.length, connected: connectedDevices.size }, 'Sync complete');
}

function disconnectDevice(deviceId, proto) {
  switch (proto) {
    case 'mqtt':    mqttAdapter.disconnect(deviceId); break;
    case 'modbus':  modbusAdapter.disconnect(deviceId); break;
    case 'opcua':   opcuaAdapter.disconnect(deviceId).catch(() => {}); break;
    case 'lorawan': lorawanAdapter.unregister(deviceId); break;
  }
}

// ─── Express ──────────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// LoRaWAN webhooks
lorawanAdapter.attachRoutes(app);

// REST/HTTP webhook: POST /webhook/rest/:deviceId
app.post('/webhook/rest/:deviceId', async (req, res) => {
  const { deviceId } = req.params;
  const body = req.body;
  const promises = [];
  for (const [field, val] of Object.entries(body)) {
    if (typeof val === 'object') continue;
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    promises.push(forwardEvent({
      deviceId,
      metric: field,
      value: isNaN(num) ? 0 : num,
      unit: '',
      rawPayload: body,
      source: 'rest',
    }));
  }
  await Promise.allSettled(promises);
  res.json({ ok: true, deviceId, fields: Object.keys(body).length });
});

// Health / status
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    swanApiUrl: SWAN_API_URL,
    connectedDevices: connectedDevices.size,
    protocols: {
      mqtt:    mqttAdapter.status(),
      modbus:  modbusAdapter.status(),
      opcua:   opcuaAdapter.status(),
      lorawan: lorawanAdapter.status(),
    },
  });
});

// Manual sync
app.post('/sync', async (req, res) => {
  await syncDevices();
  res.json({ ok: true, connectedDevices: connectedDevices.size });
});

// Inject test event (dev/testing)
app.post('/inject', async (req, res) => {
  const { deviceId, metric, value, unit } = req.body;
  if (!deviceId || !metric || value === undefined) {
    return res.status(400).json({ error: 'deviceId, metric, value requis' });
  }
  await forwardEvent({ deviceId, metric, value: Number(value), unit: unit || '', source: 'inject' });
  res.json({ ok: true });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info({ port: PORT, swanApiUrl: SWAN_API_URL }, 'Swan SCADA Gateway started');
  syncDevices();
  setInterval(syncDevices, POLL_DEVICES_MS);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM — graceful shutdown');
  mqttAdapter.disconnectAll();
  modbusAdapter.disconnectAll();
  await opcuaAdapter.disconnectAll().catch(() => {});
  process.exit(0);
});

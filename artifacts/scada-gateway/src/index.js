'use strict';
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const pino = require('pino');
const MqttAdapter = require('./protocols/mqtt-adapter');
const ModbusAdapter = require('./protocols/modbus-adapter');
const OpcUaAdapter = require('./protocols/opcua-adapter');
const LoRaWANAdapter = require('./protocols/lorawan-adapter');

// ─── Logger ──────────────────────────────────────────────────────────────────
const logger = pino({ level: process.env.LOG_LEVEL || 'info', transport: { target: 'pino-pretty' } });

// ─── Config ───────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '8100', 10);
const SWAN_API_URL = process.env.SWAN_API_URL || 'http://localhost:80/api';
const POLL_DEVICES_MS = parseInt(process.env.POLL_DEVICES_MS || '30000', 10);

// ─── Event forwarder ──────────────────────────────────────────────────────────
async function forwardEvent({ deviceId, metric, value, unit, rawPayload, source, topic }) {
  try {
    await axios.post(`${SWAN_API_URL}/iot/events`, {
      deviceId,
      metric,
      value,
      unit: unit || '',
      source: source || 'scada',
      metadata: { rawPayload, topic },
    }, { timeout: 5000 });
    logger.debug({ deviceId, metric, value }, 'Event forwarded to Swan API');
  } catch (err) {
    logger.warn({ err: err.message, deviceId, metric }, 'Failed to forward event — will retry next cycle');
  }
}

// ─── Protocol adapters ────────────────────────────────────────────────────────
const ctx = { logger, forwardEvent };
const mqttAdapter    = new MqttAdapter(ctx);
const modbusAdapter  = new ModbusAdapter(ctx);
const opcuaAdapter   = new OpcUaAdapter(ctx);
const lorawanAdapter = new LoRaWANAdapter(ctx);

// Track which devices are currently connected
const connectedDevices = new Map(); // deviceId → protocol

// ─── Device sync from Swan API ────────────────────────────────────────────────
async function syncDevices() {
  let devices;
  try {
    const res = await axios.get(`${SWAN_API_URL}/iot/devices`, { timeout: 5000 });
    devices = res.data?.devices || res.data || [];
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to fetch devices from Swan API');
    return;
  }

  const activeIds = new Set(devices.map(d => d.id));

  // Disconnect removed devices
  for (const [id, protocol] of connectedDevices) {
    if (!activeIds.has(id)) {
      logger.info({ deviceId: id, protocol }, 'Device removed — disconnecting');
      disconnectDevice(id, protocol);
      connectedDevices.delete(id);
    }
  }

  // Connect/update active devices
  for (const device of devices) {
    if (device.status !== 'active' && device.status !== 'online') continue;
    const protocol = (device.protocol || '').toLowerCase();
    const alreadyConnected = connectedDevices.get(device.id);

    if (alreadyConnected === protocol) continue; // already connected with same protocol

    // Disconnect old protocol if changed
    if (alreadyConnected) disconnectDevice(device.id, alreadyConnected);

    // Connect with new protocol
    try {
      switch (protocol) {
        case 'mqtt':
          mqttAdapter.connect(device);
          connectedDevices.set(device.id, 'mqtt');
          break;
        case 'modbus':
        case 'modbus_tcp':
          modbusAdapter.connect(device);
          connectedDevices.set(device.id, 'modbus');
          break;
        case 'opcua':
        case 'opc-ua':
        case 'opc_ua':
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
          // REST devices receive data via webhook — no active connection needed
          connectedDevices.set(device.id, 'rest');
          break;
        default:
          logger.warn({ deviceId: device.id, protocol }, 'Unknown protocol — skipping');
      }
    } catch (err) {
      logger.error({ err: err.message, deviceId: device.id, protocol }, 'Failed to connect device');
    }
  }

  logger.debug({ count: connectedDevices.size }, 'Device sync complete');
}

function disconnectDevice(deviceId, protocol) {
  switch (protocol) {
    case 'mqtt':     mqttAdapter.disconnect(deviceId); break;
    case 'modbus':   modbusAdapter.disconnect(deviceId); break;
    case 'opcua':    opcuaAdapter.disconnect(deviceId).catch(() => {}); break;
    case 'lorawan':  lorawanAdapter.unregister(deviceId); break;
  }
}

// ─── Express app ──────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Attach LoRaWAN webhook routes
lorawanAdapter.attachRoutes(app);

// REST / Generic webhook: POST /webhook/rest/:deviceId
app.post('/webhook/rest/:deviceId', async (req, res) => {
  const { deviceId } = req.params;
  const body = req.body;

  // Map body fields to events
  for (const [field, value] of Object.entries(body)) {
    if (typeof value === 'object') continue;
    const numericValue = typeof value === 'number' ? value : parseFloat(String(value));
    await forwardEvent({
      deviceId,
      metric: field,
      value: isNaN(numericValue) ? value : numericValue,
      unit: '',
      rawPayload: body,
      source: 'rest',
    });
  }

  res.status(200).json({ ok: true, deviceId });
});

// Health + status endpoint
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

// Manual trigger to sync devices
app.post('/sync', async (req, res) => {
  await syncDevices();
  res.json({ ok: true, connectedDevices: connectedDevices.size });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info({ port: PORT, swanApiUrl: SWAN_API_URL }, 'Swan SCADA Gateway started');

  // Initial sync + periodic refresh
  syncDevices();
  setInterval(syncDevices, POLL_DEVICES_MS);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received — shutting down');
  mqttAdapter.disconnectAll();
  modbusAdapter.disconnectAll();
  await opcuaAdapter.disconnectAll();
  process.exit(0);
});

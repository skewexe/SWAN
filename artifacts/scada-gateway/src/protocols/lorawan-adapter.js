'use strict';

/**
 * LoRaWAN Adapter — HTTP webhook receiver for ChirpStack and The Things Network (TTN).
 *
 * This adapter registers Express routes that receive uplink payloads from:
 *   - ChirpStack v4: POST /webhook/lorawan/chirpstack
 *   - TTN / The Things Stack: POST /webhook/lorawan/ttn
 *   - Generic (any POST with devEUI + payload): POST /webhook/lorawan/generic
 *
 * Device matching is done by devEUI stored in device.connectionConfig.devEui.
 *
 * ChirpStack payload example:
 *   { deviceInfo: { devEui: "0102030405060708" }, object: { temperature: 22.3, humidity: 65 } }
 *
 * TTN payload example:
 *   { end_device_ids: { dev_eui: "0102030405060708" }, uplink_message: { decoded_payload: { temperature: 22.3 } } }
 */
class LoRaWANAdapter {
  constructor({ logger, forwardEvent }) {
    this.logger = logger;
    this.forwardEvent = forwardEvent;
    this.devicesByEui = new Map(); // devEui → device
  }

  register(device) {
    const cfg = device.connectionConfig || {};
    const devEui = (cfg.devEui || '').toLowerCase().replace(/[^0-9a-f]/g, '');
    if (!devEui) {
      this.logger.warn({ deviceId: device.id }, 'LoRaWAN device has no devEui — skipping');
      return;
    }
    this.devicesByEui.set(devEui, device);
    this.logger.info({ deviceId: device.id, devEui }, 'LoRaWAN device registered');
  }

  unregister(deviceId) {
    for (const [eui, dev] of this.devicesByEui) {
      if (dev.id === deviceId) {
        this.devicesByEui.delete(eui);
        this.logger.info({ deviceId }, 'LoRaWAN device unregistered');
        break;
      }
    }
  }

  /** Attach webhook routes to an Express app */
  attachRoutes(app) {
    // ChirpStack v4 uplink
    app.post('/webhook/lorawan/chirpstack', (req, res) => {
      try {
        const body = req.body;
        const devEui = (body?.deviceInfo?.devEui || '').toLowerCase();
        const payload = body?.object || {};
        this._processPayload(devEui, payload, 'chirpstack', body);
        res.status(200).json({ ok: true });
      } catch (err) {
        this.logger.error({ err: err.message }, 'ChirpStack webhook error');
        res.status(400).json({ error: err.message });
      }
    });

    // The Things Network / The Things Stack v3
    app.post('/webhook/lorawan/ttn', (req, res) => {
      try {
        const body = req.body;
        const devEui = (body?.end_device_ids?.dev_eui || '').toLowerCase().replace(/[^0-9a-f]/g, '');
        const payload = body?.uplink_message?.decoded_payload || {};
        this._processPayload(devEui, payload, 'ttn', body);
        res.status(200).json({ ok: true });
      } catch (err) {
        this.logger.error({ err: err.message }, 'TTN webhook error');
        res.status(400).json({ error: err.message });
      }
    });

    // Generic LoRaWAN webhook
    app.post('/webhook/lorawan/generic', (req, res) => {
      try {
        const body = req.body;
        const devEui = (body?.devEui || body?.dev_eui || '').toLowerCase().replace(/[^0-9a-f]/g, '');
        const payload = body?.payload || body?.data || body;
        this._processPayload(devEui, payload, 'lorawan', body);
        res.status(200).json({ ok: true });
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });

    this.logger.info('LoRaWAN webhook routes attached: /webhook/lorawan/{chirpstack,ttn,generic}');
  }

  _processPayload(devEui, payload, source, rawBody) {
    const device = this.devicesByEui.get(devEui);
    if (!device) {
      this.logger.debug({ devEui }, 'LoRaWAN uplink from unknown device — ignoring');
      return;
    }

    const cfg = device.connectionConfig || {};
    const metricMap = cfg.metricMap || {}; // { fieldName: { metric, unit } }

    for (const [field, value] of Object.entries(payload)) {
      if (typeof value === 'object') continue; // skip nested
      const numericValue = typeof value === 'number' ? value : parseFloat(String(value));
      const mapped = metricMap[field] || {};

      this.forwardEvent({
        deviceId: device.id,
        metric: mapped.metric || field,
        value: isNaN(numericValue) ? value : numericValue,
        unit: mapped.unit || '',
        rawPayload: rawBody,
        source,
      });
    }
  }

  status() {
    return Array.from(this.devicesByEui.entries()).map(([eui, dev]) => ({
      deviceId: dev.id, devEui: eui, protocol: 'lorawan',
    }));
  }
}

module.exports = LoRaWANAdapter;

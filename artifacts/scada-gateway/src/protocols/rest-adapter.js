'use strict';

/**
 * REST Adapter — HTTP webhook receiver for generic REST/HTTP devices.
 * Devices push data to: POST /webhook/rest/:deviceId
 * Format: { metric: value, ... } or { field: value, unit: 'x' }
 * 
 * Also supports batch events:
 * { events: [{ metric, value, unit }, ...] }
 *
 * This adapter just manages the device registry — routes are in index.js.
 */
class RestAdapter {
  constructor({ logger, forwardEvent }) {
    this.logger = logger;
    this.forwardEvent = forwardEvent;
    this.devices = new Map(); // deviceId → device
  }

  register(device) {
    this.devices.set(device.id, device);
    this.logger.info({ deviceId: device.id }, 'REST device registered — webhook ready');
  }

  unregister(deviceId) {
    this.devices.delete(deviceId);
  }

  getDevice(deviceId) {
    return this.devices.get(deviceId);
  }

  /** Attach REST webhook routes to Express app */
  attachRoutes(app) {
    // Single metric push
    app.post('/webhook/rest/:deviceId', async (req, res) => {
      const { deviceId } = req.params;
      const body = req.body;

      if (!body) return res.status(400).json({ error: 'Empty body' });

      const device = this.devices.get(deviceId);
      const cfg = device?.connectionConfig || {};

      // Batch events format
      if (Array.isArray(body.events)) {
        for (const ev of body.events) {
          await this.forwardEvent({
            deviceId,
            metric: ev.metric || ev.name || 'value',
            value: parseFloat(ev.value) || 0,
            unit: ev.unit || '',
            rawPayload: ev,
            source: 'rest',
          });
        }
        return res.json({ ok: true, count: body.events.length });
      }

      // Key-value format: { temperature: 22.3, pressure: 1.013 }
      const metricMap = cfg.metricMap || {};
      let count = 0;
      for (const [field, value] of Object.entries(body)) {
        if (typeof value === 'object') continue;
        const numericValue = typeof value === 'number' ? value : parseFloat(String(value));
        const mapped = metricMap[field] || {};
        await this.forwardEvent({
          deviceId,
          metric: mapped.metric || field,
          value: isNaN(numericValue) ? value : numericValue,
          unit: mapped.unit || '',
          rawPayload: body,
          source: 'rest',
        });
        count++;
      }

      res.json({ ok: true, deviceId, eventsForwarded: count });
    });

    this.logger.info('REST webhook routes attached: POST /webhook/rest/:deviceId');
  }

  status() {
    return Array.from(this.devices.keys()).map(id => ({
      deviceId: id, protocol: 'rest',
    }));
  }
}

module.exports = RestAdapter;

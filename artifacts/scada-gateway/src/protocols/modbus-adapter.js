'use strict';
const ModbusRTU = require('modbus-serial');

/**
 * Modbus TCP Adapter — periodically polls Modbus TCP/RTU slaves.
 * Supports Holding Registers (FC03), Input Registers (FC04),
 * Coils (FC01), Discrete Inputs (FC02).
 *
 * Device config example:
 *   connectionConfig: {
 *     host: '192.168.1.10', port: 502, unitId: 1,
 *     pollIntervalMs: 5000,
 *     registers: [
 *       { address: 40001, count: 2, type: 'holding', metric: 'temperature', scale: 0.1, unit: '°C' },
 *       { address: 10001, count: 1, type: 'input',   metric: 'pressure',    scale: 0.01, unit: 'bar' }
 *     ]
 *   }
 */
class ModbusAdapter {
  constructor({ logger, forwardEvent }) {
    this.logger = logger;
    this.forwardEvent = forwardEvent;
    this.pollers = new Map(); // deviceId → { client, intervalId, device }
  }

  connect(device) {
    if (this.pollers.has(device.id)) this.disconnect(device.id);

    const cfg = device.connectionConfig || {};
    const host = cfg.host || '127.0.0.1';
    const port = cfg.port || 502;
    const unitId = cfg.unitId || 1;
    const pollMs = cfg.pollIntervalMs || 5000;
    const registers = cfg.registers || [];

    const client = new ModbusRTU();
    let connected = false;

    const connect = async () => {
      try {
        await client.connectTCP(host, { port });
        client.setID(unitId);
        client.setTimeout(3000);
        connected = true;
        this.logger.info({ deviceId: device.id, host, port, unitId }, 'Modbus TCP connected');
      } catch (err) {
        connected = false;
        this.logger.warn({ err: err.message, deviceId: device.id }, 'Modbus TCP connect failed — will retry');
      }
    };

    const poll = async () => {
      if (!connected) {
        await connect();
        if (!connected) return;
      }

      for (const reg of registers) {
        try {
          let data;
          const addr = reg.address - 40001 >= 0 ? reg.address - 40001 : reg.address; // normalize
          switch (reg.type) {
            case 'holding': data = await client.readHoldingRegisters(addr, reg.count || 1); break;
            case 'input':   data = await client.readInputRegisters(addr, reg.count || 1); break;
            case 'coil':    data = await client.readCoils(addr, reg.count || 1); break;
            case 'discrete': data = await client.readDiscreteInputs(addr, reg.count || 1); break;
            default:         data = await client.readHoldingRegisters(addr, reg.count || 1);
          }

          let rawValue = (reg.type === 'coil' || reg.type === 'discrete')
            ? (data.data[0] ? 1 : 0)
            : data.data[0];

          // Combine two 16-bit registers into a 32-bit float if requested
          if (reg.count === 2 && reg.type !== 'coil') {
            const buf = Buffer.alloc(4);
            buf.writeUInt16BE(data.data[0], 0);
            buf.writeUInt16BE(data.data[1], 2);
            rawValue = buf.readFloatBE(0);
          }

          const scaled = (reg.scale || 1) * rawValue + (reg.offset || 0);

          this.forwardEvent({
            deviceId: device.id,
            metric: reg.metric || `reg_${reg.address}`,
            value: parseFloat(scaled.toFixed(4)),
            unit: reg.unit || '',
            rawPayload: { address: reg.address, raw: rawValue },
            source: 'modbus',
          });
        } catch (err) {
          this.logger.warn({ err: err.message, deviceId: device.id, reg: reg.address }, 'Modbus read error');
          connected = false; // force reconnect on next cycle
          break;
        }
      }
    };

    connect().then(() => {});
    const intervalId = setInterval(poll, pollMs);
    this.pollers.set(device.id, { client, intervalId, device });
  }

  disconnect(deviceId) {
    const entry = this.pollers.get(deviceId);
    if (entry) {
      clearInterval(entry.intervalId);
      try { entry.client.close(); } catch {}
      this.pollers.delete(deviceId);
      this.logger.info({ deviceId }, 'Modbus disconnected');
    }
  }

  disconnectAll() {
    for (const id of this.pollers.keys()) this.disconnect(id);
  }

  status() {
    return Array.from(this.pollers.keys()).map(id => ({
      deviceId: id, protocol: 'modbus',
    }));
  }
}

module.exports = ModbusAdapter;

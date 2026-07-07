'use strict';
const mqtt = require('mqtt');

/**
 * MQTT Adapter — subscribe to device topics and forward events to Swan API.
 * Supports QoS 0/1/2, TLS, username/password and anonymous brokers.
 *
 * Topic convention: swan/devices/{deviceId}/{metric}
 * Or custom topic mapping stored in device.mqttTopicPattern.
 */
class MqttAdapter {
  constructor({ logger, forwardEvent }) {
    this.logger = logger;
    this.forwardEvent = forwardEvent;
    this.clients = new Map();   // deviceId → mqtt.Client
    this.devices = new Map();   // deviceId → device config
  }

  /** Add or update a device subscription */
  connect(device) {
    if (this.clients.has(device.id)) this.disconnect(device.id);

    const cfg = device.connectionConfig || {};
    const brokerUrl = cfg.brokerUrl || 'mqtt://localhost:1883';
    const topic = cfg.topic || `swan/devices/${device.id}/#`;

    const options = {
      clientId: `swan-gateway-${device.id}-${Date.now()}`,
      keepalive: 60,
      reconnectPeriod: 5000,
      connectTimeout: 10000,
      clean: true,
    };
    if (cfg.username) options.username = cfg.username;
    if (cfg.password) options.password = cfg.password;
    if (cfg.useTls) options.protocol = 'mqtts';

    const client = mqtt.connect(brokerUrl, options);

    client.on('connect', () => {
      this.logger.info({ deviceId: device.id, broker: brokerUrl, topic }, 'MQTT connected');
      client.subscribe(topic, { qos: cfg.qos ?? 1 }, (err) => {
        if (err) this.logger.error({ err, deviceId: device.id }, 'MQTT subscribe error');
      });
    });

    client.on('message', (incomingTopic, payload) => {
      this._handleMessage(device, incomingTopic, payload);
    });

    client.on('error', (err) => {
      this.logger.warn({ err: err.message, deviceId: device.id }, 'MQTT error');
    });

    client.on('offline', () => {
      this.logger.warn({ deviceId: device.id }, 'MQTT offline — will reconnect');
    });

    this.clients.set(device.id, client);
    this.devices.set(device.id, device);
  }

  disconnect(deviceId) {
    const client = this.clients.get(deviceId);
    if (client) {
      client.end(true);
      this.clients.delete(deviceId);
      this.devices.delete(deviceId);
      this.logger.info({ deviceId }, 'MQTT disconnected');
    }
  }

  disconnectAll() {
    for (const id of this.clients.keys()) this.disconnect(id);
  }

  _handleMessage(device, topic, payload) {
    let data;
    try {
      data = JSON.parse(payload.toString());
    } catch {
      data = { raw: payload.toString() };
    }

    // Extract metric name from topic suffix: swan/devices/{id}/{metric}
    const parts = topic.split('/');
    const metric = parts[parts.length - 1] || 'value';

    const value = data.value ?? data[metric] ?? data;
    const numericValue = typeof value === 'number' ? value : parseFloat(String(value));

    this.forwardEvent({
      deviceId: device.id,
      metric,
      value: isNaN(numericValue) ? value : numericValue,
      unit: data.unit || device.unit || '',
      rawPayload: data,
      source: 'mqtt',
      topic,
    });
  }

  status() {
    const result = [];
    for (const [id, client] of this.clients) {
      result.push({ deviceId: id, connected: client.connected, protocol: 'mqtt' });
    }
    return result;
  }
}

module.exports = MqttAdapter;

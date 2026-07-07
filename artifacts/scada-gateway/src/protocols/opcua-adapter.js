'use strict';
const {
  OPCUAClient,
  MessageSecurityMode,
  SecurityPolicy,
  AttributeIds,
  ClientSubscription,
  TimestampsToReturn,
  MonitoringParametersOptions,
  ReadValueIdOptions,
  ClientMonitoredItem,
  DataValue,
} = require('node-opcua');

/**
 * OPC-UA Adapter — subscribes to OPC-UA nodes using UA subscriptions.
 * Supports anonymous, username/password, and certificate auth.
 *
 * Device config example:
 *   connectionConfig: {
 *     endpointUrl: 'opc.tcp://192.168.1.10:4840',
 *     username: 'user',   // optional
 *     password: 'pass',   // optional
 *     securityMode: 'None',   // None | Sign | SignAndEncrypt
 *     securityPolicy: 'None', // None | Basic256Sha256
 *     samplingIntervalMs: 1000,
 *     nodes: [
 *       { nodeId: 'ns=1;s=Temperature', metric: 'temperature', unit: '°C' },
 *       { nodeId: 'ns=1;s=Pressure',    metric: 'pressure',    unit: 'bar' }
 *     ]
 *   }
 */
class OpcUaAdapter {
  constructor({ logger, forwardEvent }) {
    this.logger = logger;
    this.forwardEvent = forwardEvent;
    this.connections = new Map(); // deviceId → { client, session, subscription }
  }

  async connect(device) {
    if (this.connections.has(device.id)) await this.disconnect(device.id);

    const cfg = device.connectionConfig || {};
    const endpointUrl = cfg.endpointUrl || 'opc.tcp://localhost:4840';
    const samplingInterval = cfg.samplingIntervalMs || 1000;
    const nodes = cfg.nodes || [];

    const securityMode = MessageSecurityMode[cfg.securityMode || 'None'];
    const securityPolicy = SecurityPolicy[cfg.securityPolicy || 'None'];

    const clientOptions = {
      applicationName: 'Swan GMAO SCADA Gateway',
      connectionStrategy: {
        initialDelay: 1000,
        maxRetry: 10,
        maxDelay: 30000,
      },
      securityMode,
      securityPolicy,
      endpointMustExist: false,
    };

    const client = OPCUAClient.create(clientOptions);

    client.on('connection_reestablished', () => {
      this.logger.info({ deviceId: device.id }, 'OPC-UA reconnected');
    });

    client.on('connection_lost', () => {
      this.logger.warn({ deviceId: device.id }, 'OPC-UA connection lost');
    });

    try {
      await client.connect(endpointUrl);
      this.logger.info({ deviceId: device.id, endpointUrl }, 'OPC-UA connected');

      const userIdentity = cfg.username
        ? { type: 1, userName: cfg.username, password: cfg.password }
        : { type: 0 }; // anonymous

      const session = await client.createSession(userIdentity);

      const subscription = ClientSubscription.create(session, {
        requestedPublishingInterval: samplingInterval,
        requestedMaxKeepAliveCount: 10,
        maxNotificationsPerPublish: 100,
        publishingEnabled: true,
        priority: 10,
      });

      subscription.on('started', () => {
        this.logger.info({ deviceId: device.id, id: subscription.subscriptionId }, 'OPC-UA subscription started');
      });

      for (const node of nodes) {
        const itemToMonitor = {
          nodeId: node.nodeId,
          attributeId: AttributeIds.Value,
        };

        const monitoringParameters = {
          samplingInterval,
          discardOldest: true,
          queueSize: 10,
        };

        const monitoredItem = ClientMonitoredItem.create(
          subscription,
          itemToMonitor,
          monitoringParameters,
          TimestampsToReturn.Both
        );

        monitoredItem.on('changed', (dataValue) => {
          if (!dataValue || dataValue.value === null) return;
          const raw = dataValue.value.value;
          const numericValue = typeof raw === 'number' ? raw : parseFloat(String(raw));

          this.forwardEvent({
            deviceId: device.id,
            metric: node.metric || node.nodeId,
            value: isNaN(numericValue) ? raw : numericValue,
            unit: node.unit || '',
            rawPayload: {
              nodeId: node.nodeId,
              statusCode: dataValue.statusCode?.toString(),
              sourceTimestamp: dataValue.sourceTimestamp,
            },
            source: 'opcua',
          });
        });
      }

      this.connections.set(device.id, { client, session, subscription });
    } catch (err) {
      this.logger.error({ err: err.message, deviceId: device.id }, 'OPC-UA connect failed');
      try { await client.disconnect(); } catch {}
    }
  }

  async disconnect(deviceId) {
    const entry = this.connections.get(deviceId);
    if (entry) {
      try {
        await entry.subscription.terminate();
        await entry.session.close();
        await entry.client.disconnect();
      } catch {}
      this.connections.delete(deviceId);
      this.logger.info({ deviceId }, 'OPC-UA disconnected');
    }
  }

  async disconnectAll() {
    for (const id of this.connections.keys()) await this.disconnect(id);
  }

  status() {
    return Array.from(this.connections.keys()).map(id => ({
      deviceId: id, protocol: 'opcua',
    }));
  }
}

module.exports = OpcUaAdapter;

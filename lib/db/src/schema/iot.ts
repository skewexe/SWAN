import { pgTable, serial, text, timestamp, real, integer, boolean, jsonb } from "drizzle-orm/pg-core";

export const iotDevicesTable = pgTable("iot_devices", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  deviceId: text("device_id").notNull(),
  protocol: text("protocol").notNull(),
  assetId: integer("asset_id"),
  status: text("status").notNull().default("offline"),
  ipAddress: text("ip_address"),
  port: integer("port"),
  mqttTopic: text("mqtt_topic"),
  modbusSlaveId: integer("modbus_slave_id"),
  opcuaNodeId: text("opcua_node_id"),
  webhookUrl: text("webhook_url"),
  description: text("description"),
  firmwareVersion: text("firmware_version"),
  lastSeen: timestamp("last_seen"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const iotRulesTable = pgTable("iot_rules", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id").notNull(),
  name: text("name").notNull(),
  metric: text("metric").notNull(),
  condition: text("condition").notNull(),
  threshold: real("threshold").notNull(),
  unit: text("unit"),
  durationMinutes: integer("duration_minutes").notNull().default(0),
  action: text("action").notNull(),
  actionCreateWoPriority: text("action_create_wo_priority"),
  actionAlertChannels: text("action_alert_channels"),
  enabled: boolean("enabled").notNull().default(true),
  lastFiredAt: timestamp("last_fired_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const iotEventsTable = pgTable("iot_events", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id").notNull(),
  assetId: integer("asset_id"),
  metric: text("metric").notNull(),
  value: real("value").notNull(),
  unit: text("unit"),
  quality: text("quality").notNull().default("good"),
  thresholdStatus: text("threshold_status").notNull().default("normal"),
  ruleId: integer("rule_id"),
  woCreatedId: integer("wo_created_id"),
  rawPayload: jsonb("raw_payload"),
  ts: timestamp("ts").notNull().defaultNow(),
});

export type IotDevice = typeof iotDevicesTable.$inferSelect;
export type IotRule = typeof iotRulesTable.$inferSelect;
export type IotEvent = typeof iotEventsTable.$inferSelect;

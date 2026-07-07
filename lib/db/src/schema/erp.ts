import { pgTable, serial, text, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";

export const erpConnectionsTable = pgTable("erp_connections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  erpType: text("erp_type").notNull(),
  url: text("url").notNull(),
  apiKey: text("api_key"),
  authType: text("auth_type").notNull().default("api_key"),
  username: text("username"),
  password: text("password"),
  syncMode: text("sync_mode").notNull().default("pull"),
  syncEntities: jsonb("sync_entities").$type<string[]>(),
  fieldMapping: jsonb("field_mapping").$type<Record<string, string>>(),
  status: text("status").notNull().default("inactive"),
  enabled: boolean("enabled").notNull().default(true),
  lastSync: timestamp("last_sync"),
  lastError: text("last_error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ErpConnection = typeof erpConnectionsTable.$inferSelect;

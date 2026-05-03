import { pgTable, serial, text, timestamp, real, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const assetStatusEnum = pgEnum("asset_status", ["operational", "maintenance", "breakdown", "decommissioned"]);
export const assetCriticalityEnum = pgEnum("asset_criticality", ["low", "medium", "high", "critical"]);

export const assetsTable = pgTable("assets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  serialNumber: text("serial_number"),
  location: text("location"),
  status: assetStatusEnum("status").notNull().default("operational"),
  manufacturer: text("manufacturer"),
  model: text("model"),
  installDate: text("install_date"),
  lastMaintenanceDate: text("last_maintenance_date"),
  mtbf: real("mtbf"),
  mttr: real("mttr"),
  availabilityRate: real("availability_rate"),
  criticality: assetCriticalityEnum("criticality").notNull().default("medium"),
  siteId: integer("site_id"),
  zoneId: integer("zone_id"),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAssetSchema = createInsertSchema(assetsTable).omit({ id: true, createdAt: true });
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Asset = typeof assetsTable.$inferSelect;

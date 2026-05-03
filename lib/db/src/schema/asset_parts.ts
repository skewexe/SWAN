import { pgTable, serial, integer, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const assetPartsTable = pgTable("asset_parts", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").notNull(),
  inventoryItemId: integer("inventory_item_id"),
  partName: text("part_name").notNull(),
  reference: text("reference"),
  quantity: real("quantity").notNull().default(1),
  unit: text("unit"),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAssetPartSchema = createInsertSchema(assetPartsTable).omit({ id: true, createdAt: true });
export type InsertAssetPart = z.infer<typeof insertAssetPartSchema>;
export type AssetPart = typeof assetPartsTable.$inferSelect;

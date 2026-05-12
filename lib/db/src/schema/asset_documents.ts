import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const assetDocumentsTable = pgTable("asset_documents", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull().default("manual"),
  url: text("url").notNull(),
  description: text("description"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export type AssetDocument = typeof assetDocumentsTable.$inferSelect;

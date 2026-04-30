import { pgTable, serial, integer, real, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const workOrderPartsTable = pgTable("work_order_parts", {
  id: serial("id").primaryKey(),
  workOrderId: integer("work_order_id").notNull(),
  inventoryItemId: integer("inventory_item_id").notNull(),
  quantityUsed: real("quantity_used").notNull().default(1),
  unitCostAtTime: real("unit_cost_at_time"),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWorkOrderPartSchema = createInsertSchema(workOrderPartsTable).omit({ id: true, createdAt: true });
export type InsertWorkOrderPart = z.infer<typeof insertWorkOrderPartSchema>;
export type WorkOrderPart = typeof workOrderPartsTable.$inferSelect;

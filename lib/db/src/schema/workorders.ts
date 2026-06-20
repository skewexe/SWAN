import { pgTable, serial, text, timestamp, real, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const workOrderTypeEnum = pgEnum("work_order_type", ["corrective", "preventive", "predictive", "inspection"]);
export const workOrderPriorityEnum = pgEnum("work_order_priority", ["low", "medium", "high", "critical"]);
export const workOrderStatusEnum = pgEnum("work_order_status", ["open", "in_progress", "completed", "cancelled", "on_hold"]);
export const workOrderAssignmentModeEnum = pgEnum("work_order_assignment_mode", ["by_technician", "by_zone", "by_machine", "by_type"]);

export const workOrdersTable = pgTable("work_orders", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: workOrderTypeEnum("type").notNull(),
  priority: workOrderPriorityEnum("priority").notNull(),
  status: workOrderStatusEnum("status").notNull().default("open"),
  assetId: integer("asset_id"),
  technicianId: integer("technician_id"),
  estimatedHours: real("estimated_hours"),
  actualHours: real("actual_hours"),
  scheduledDate: text("scheduled_date"),
  completedDate: text("completed_date"),
  siteId: integer("site_id"),
  zoneId: integer("zone_id"),
  assignmentMode: workOrderAssignmentModeEnum("assignment_mode").default("by_technician"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWorkOrderSchema = createInsertSchema(workOrdersTable).omit({ id: true, createdAt: true });
export type InsertWorkOrder = z.infer<typeof insertWorkOrderSchema>;
export type WorkOrder = typeof workOrdersTable.$inferSelect;

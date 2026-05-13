import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const workOrderTechniciansTable = pgTable("work_order_technicians", {
  id: serial("id").primaryKey(),
  workOrderId: integer("work_order_id").notNull(),
  technicianId: integer("technician_id").notNull(),
  role: text("role").notNull().default("assistant"),
  addedAt: timestamp("added_at").notNull().defaultNow(),
});

export type WorkOrderTechnician = typeof workOrderTechniciansTable.$inferSelect;

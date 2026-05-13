import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const preventivePlanTechniciansTable = pgTable("preventive_plan_technicians", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull(),
  technicianId: integer("technician_id").notNull(),
  role: text("role").notNull().default("assistant"),
  addedAt: timestamp("added_at").notNull().defaultNow(),
});

export type PreventivePlanTechnician = typeof preventivePlanTechniciansTable.$inferSelect;

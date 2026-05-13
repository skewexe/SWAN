import { pgTable, serial, text, timestamp, real, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const preventiveFrequencyEnum = pgEnum("preventive_frequency", ["daily", "weekly", "monthly", "quarterly", "annually"]);
export const preventiveStatusEnum = pgEnum("preventive_status", ["active", "inactive", "overdue"]);

export const preventivePlansTable = pgTable("preventive_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  assetId: integer("asset_id"),
  technicianId: integer("technician_id"),
  frequency: preventiveFrequencyEnum("frequency").notNull(),
  lastExecuted: text("last_executed"),
  nextDue: text("next_due"),
  status: preventiveStatusEnum("status").notNull().default("active"),
  estimatedDuration: real("estimated_duration"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPreventivePlanSchema = createInsertSchema(preventivePlansTable).omit({ id: true, createdAt: true });
export type InsertPreventivePlan = z.infer<typeof insertPreventivePlanSchema>;
export type PreventivePlan = typeof preventivePlansTable.$inferSelect;

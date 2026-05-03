import { pgTable, serial, text, timestamp, integer, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const technicianStatusEnum = pgEnum("technician_status", ["available", "busy", "off", "leave"]);

export const techniciansTable = pgTable("technicians", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  specialization: text("specialization").notNull(),
  skills: text("skills").array(),
  status: technicianStatusEnum("status").notNull().default("available"),
  activeWorkOrders: integer("active_work_orders").notNull().default(0),
  completedThisMonth: integer("completed_this_month").notNull().default(0),
  avgRating: real("avg_rating"),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTechnicianSchema = createInsertSchema(techniciansTable).omit({ id: true, createdAt: true });
export type InsertTechnician = z.infer<typeof insertTechnicianSchema>;
export type Technician = typeof techniciansTable.$inferSelect;

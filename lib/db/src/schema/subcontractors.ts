import { pgTable, serial, text, timestamp, real, integer, pgEnum } from "drizzle-orm/pg-core";

export const subcontractorStatusEnum = pgEnum("subcontractor_status", ["active", "inactive", "suspended"]);

export const subcontractorsTable = pgTable("subcontractors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  specialty: text("specialty").notNull(),
  contactName: text("contact_name"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  city: text("city"),
  rating: real("rating"),
  status: subcontractorStatusEnum("status").notNull().default("active"),
  contractStart: text("contract_start"),
  contractEnd: text("contract_end"),
  contractRef: text("contract_ref"),
  notes: text("notes"),
  completedJobs: integer("completed_jobs").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Subcontractor = typeof subcontractorsTable.$inferSelect;

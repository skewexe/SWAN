import { pgTable, serial, text, timestamp, pgEnum, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const whatsappGatewayStatusEnum = pgEnum("whatsapp_gateway_status", ["disconnected", "initializing", "qr_ready", "connected"]);
export const whatsappMessageDirectionEnum = pgEnum("whatsapp_message_direction", ["inbound", "outbound"]);
export const whatsappMessageTypeEnum = pgEnum("whatsapp_message_type", ["help", "status_query", "ticket_created", "blocked", "error", "unknown", "manual"]);

export const whatsappAllowedNumbersTable = pgTable("whatsapp_allowed_numbers", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  addedAt: timestamp("added_at").notNull().defaultNow(),
});

export const whatsappGatewayStateTable = pgTable("whatsapp_gateway_state", {
  id: serial("id").primaryKey(),
  status: whatsappGatewayStatusEnum("status").notNull().default("disconnected"),
  qrText: text("qr_text"),
  qrImage: text("qr_image"),
  lastConnectedAt: timestamp("last_connected_at"),
  lastDisconnectedAt: timestamp("last_disconnected_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const whatsappMessagesTable = pgTable("whatsapp_messages", {
  id: serial("id").primaryKey(),
  direction: whatsappMessageDirectionEnum("direction").notNull(),
  messageType: whatsappMessageTypeEnum("message_type").notNull().default("manual"),
  phone: text("phone").notNull(),
  text: text("text").notNull(),
  reply: text("reply"),
  workOrderId: integer("work_order_id"),
  statusCode: integer("status_code"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWhatsappAllowedNumberSchema = createInsertSchema(whatsappAllowedNumbersTable).omit({ id: true, addedAt: true });
export type InsertWhatsappAllowedNumber = z.infer<typeof insertWhatsappAllowedNumberSchema>;
export type WhatsappAllowedNumber = typeof whatsappAllowedNumbersTable.$inferSelect;

export const insertWhatsappGatewayStateSchema = createInsertSchema(whatsappGatewayStateTable).omit({ id: true, updatedAt: true });
export type InsertWhatsappGatewayState = z.infer<typeof insertWhatsappGatewayStateSchema>;
export type WhatsappGatewayState = typeof whatsappGatewayStateTable.$inferSelect;

export const insertWhatsappMessageSchema = createInsertSchema(whatsappMessagesTable).omit({ id: true, createdAt: true });
export type InsertWhatsappMessage = z.infer<typeof insertWhatsappMessageSchema>;
export type WhatsappMessage = typeof whatsappMessagesTable.$inferSelect;

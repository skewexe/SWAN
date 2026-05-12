import { pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const telegramConfigTable = pgTable("telegram_config", {
  id: serial("id").primaryKey(),
  botToken: text("bot_token"),
  botUsername: text("bot_username"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const telegramChatsTable = pgTable("telegram_chats", {
  id: serial("id").primaryKey(),
  chatId: text("chat_id").notNull().unique(),
  name: text("name").notNull(),
  type: text("type").notNull().default("private"),
  allowed: boolean("allowed").notNull().default(true),
  addedAt: timestamp("added_at").notNull().defaultNow(),
});

export const telegramLogsTable = pgTable("telegram_logs", {
  id: serial("id").primaryKey(),
  chatId: text("chat_id").notNull(),
  direction: text("direction").notNull().default("in"),
  text: text("text").notNull(),
  eventType: text("event_type").notNull().default("message"),
  reply: text("reply"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export type TelegramConfig = typeof telegramConfigTable.$inferSelect;
export type TelegramChat = typeof telegramChatsTable.$inferSelect;
export type TelegramLog = typeof telegramLogsTable.$inferSelect;

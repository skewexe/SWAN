'use strict';

const pg = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const { eq, desc } = require('drizzle-orm');
const { whatsappAllowedNumbersTable, whatsappGatewayStateTable, whatsappMessagesTable } = require('../../../lib/db/src/schema/whatsapp.ts');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required for WhatsApp Gateway');
}

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema: { whatsappAllowedNumbersTable, whatsappGatewayStateTable, whatsappMessagesTable } });

async function listAllowedNumbers() {
  return db.select().from(whatsappAllowedNumbersTable).where(eq(whatsappAllowedNumbersTable.isActive, true)).orderBy(desc(whatsappAllowedNumbersTable.addedAt));
}

async function addAllowedNumber(phone, name) {
  const [entry] = await db.insert(whatsappAllowedNumbersTable).values({ phone, name, isActive: true }).returning();
  return entry;
}

async function removeAllowedNumber(phone) {
  const [entry] = await db.update(whatsappAllowedNumbersTable).set({ isActive: false }).where(eq(whatsappAllowedNumbersTable.phone, phone)).returning();
  return entry;
}

async function upsertGatewayState(payload) {
  const rows = await db.select().from(whatsappGatewayStateTable).limit(1);
  if (rows.length) {
    const [row] = await db.update(whatsappGatewayStateTable).set({ ...payload, updatedAt: new Date() }).where(eq(whatsappGatewayStateTable.id, rows[0].id)).returning();
    return row;
  }
  const [row] = await db.insert(whatsappGatewayStateTable).values({ ...payload, updatedAt: new Date() }).returning();
  return row;
}

async function getGatewayState() {
  const rows = await db.select().from(whatsappGatewayStateTable).limit(1);
  return rows[0] || null;
}

async function logMessage(entry) {
  const [row] = await db.insert(whatsappMessagesTable).values(entry).returning();
  return row;
}

async function listMessages() {
  return db.select().from(whatsappMessagesTable).orderBy(desc(whatsappMessagesTable.createdAt)).limit(100);
}

module.exports = { listAllowedNumbers, addAllowedNumber, removeAllowedNumber, upsertGatewayState, getGatewayState, logMessage, listMessages };

'use strict';

const express = require('express');
const { loadNumbers, saveNumbers } = require('./config');
const { getStatus, getQRImage, sendMessage, getLogs } = require('./whatsapp');

const router = express.Router();

// GET /whatsapp/status
router.get('/status', (req, res) => {
  res.json({ status: getStatus(), timestamp: new Date().toISOString() });
});

// GET /whatsapp/qr — returns base64 PNG of QR code
router.get('/qr', (req, res) => {
  const qr = getQRImage();
  res.json({ qr: qr || null, status: getStatus() });
});

// GET /whatsapp/numbers — list allowed numbers
router.get('/numbers', (req, res) => {
  res.json(loadNumbers());
});

// POST /whatsapp/numbers — add { phone, name }
router.post('/numbers', (req, res) => {
  const { phone, name } = req.body;
  if (!phone) { res.status(400).json({ error: 'phone is required' }); return; }

  const clean = String(phone).replace(/\D/g, '');
  if (!clean) { res.status(400).json({ error: 'Invalid phone number' }); return; }

  const numbers = loadNumbers();
  if (numbers.some(n => n.phone === clean)) {
    res.status(409).json({ error: 'Ce numéro est déjà autorisé' });
    return;
  }
  const entry = { phone: clean, name: (name || clean).trim(), addedAt: new Date().toISOString() };
  numbers.push(entry);
  saveNumbers(numbers);
  console.log(`[Gateway] Authorized number added: +${clean} (${entry.name})`);
  res.status(201).json(entry);
});

// DELETE /whatsapp/numbers/:phone
router.delete('/numbers/:phone', (req, res) => {
  const clean = req.params.phone.replace(/\D/g, '');
  const before = loadNumbers();
  const after = before.filter(n => n.phone !== clean);
  saveNumbers(after);
  console.log(`[Gateway] Authorized number removed: +${clean}`);
  res.json({ success: true, removed: before.length - after.length });
});

// POST /whatsapp/send — { phone, message }
router.post('/send', async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) {
    res.status(400).json({ error: 'phone and message are required' });
    return;
  }
  try {
    await sendMessage(String(phone), String(message));
    res.json({ success: true });
  } catch (e) {
    res.status(503).json({ error: e.message });
  }
});

// GET /whatsapp/logs — recent message log
router.get('/logs', (req, res) => {
  res.json(getLogs());
});

// GET /whatsapp/healthz
router.get('/healthz', (req, res) => {
  res.json({ ok: true, service: 'whatsapp-gateway', status: getStatus() });
});

module.exports = router;

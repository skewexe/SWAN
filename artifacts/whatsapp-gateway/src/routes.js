'use strict';

const express = require('express');
const { listAllowedNumbers, addAllowedNumber, removeAllowedNumber, getGatewayState, listMessages } = require('./db');
const { getStatus, getQRImage, sendMessage } = require('./whatsapp');

const router = express.Router();

router.get('/status', async (req, res) => {
  const state = await getGatewayState();
  res.json({ status: state?.status || (await getStatus()), timestamp: new Date().toISOString() });
});

router.get('/qr', async (req, res) => {
  const state = await getGatewayState();
  res.json({ qr: state?.qrImage || (await getQRImage()) || null, status: state?.status || (await getStatus()) });
});

router.get('/numbers', async (req, res) => {
  res.json(await listAllowedNumbers());
});

router.post('/numbers', async (req, res) => {
  const { phone, name } = req.body;
  if (!phone) { res.status(400).json({ error: 'phone is required' }); return; }
  const clean = String(phone).replace(/\D/g, '');
  if (!clean) { res.status(400).json({ error: 'Invalid phone number' }); return; }
  try {
    const entry = await addAllowedNumber(clean, (name || clean).trim());
    res.status(201).json(entry);
  } catch (e) {
    res.status(409).json({ error: 'Ce numéro est déjà autorisé' });
  }
});

router.delete('/numbers/:phone', async (req, res) => {
  const clean = req.params.phone.replace(/\D/g, '');
  await removeAllowedNumber(clean);
  res.json({ success: true });
});

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

router.get('/logs', async (req, res) => {
  res.json(await listMessages());
});

router.get('/healthz', async (req, res) => {
  res.json({ ok: true, service: 'whatsapp-gateway', status: await getStatus() });
});

module.exports = router;

'use strict';

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const { loadNumbers } = require('./config');
const { createWorkOrder, getWorkOrder } = require('./gmaoService');

// --- State ---
let client = null;
let currentQRString = null;
let currentQRImage = null;
let status = 'disconnected'; // disconnected | initializing | qr_ready | connected
const messageLogs = [];

// --- Keyword detection ---
const ISSUE_KEYWORDS = [
  'panne', 'hs', 'ma tkhdemch', 'ne marche pas', 'arrêt', 'défaut',
  'problème', 'pb', 'hors service', 'bloqué', 'bloque', 'en panne',
  'défaillance', 'cassé', 'casse', 'brisé', 'fuite', 'surchauffe',
];
const URGENT_KEYWORDS = [
  'urgent', 'urgence', 'critique', 'immédiat', 'immédiatement', 'vite',
  'danger', 'risque', 'accident',
];

function addLog(type, phone, text, reply) {
  messageLogs.unshift({ type, phone, text, reply, timestamp: new Date().toISOString() });
  if (messageLogs.length > 100) messageLogs.pop();
}

async function processMessage(message) {
  const rawPhone = message.from; // e.g. "213551234567@c.us"
  const phone = rawPhone.replace('@c.us', '');
  const rawText = message.body.trim();
  const text = rawText.toLowerCase();

  // Check authorization
  const allowedNumbers = loadNumbers();
  const isAllowed = allowedNumbers.some(n => n.phone === phone || n.phone === rawPhone);

  if (!isAllowed) {
    const reply = '⛔ Numéro non autorisé. Veuillez contacter votre administrateur SWAN GMAO.';
    await message.reply(reply).catch(() => {});
    addLog('blocked', phone, rawText, reply);
    console.log(`[WhatsApp] Blocked unknown number: +${phone}`);
    return;
  }

  console.log(`[WhatsApp] Authorized message from +${phone}: ${rawText}`);

  // --- Help ---
  if (text === 'aide' || text === 'help' || text === '?') {
    const reply =
      '📋 *SWAN GMAO — Commandes*\n\n' +
      '• Signaler une panne :\n  _"panne pompe 2 atelier A"_\n\n' +
      '• Urgence :\n  _"urgent hs compresseur ligne 3"_\n\n' +
      '• Consulter un OT :\n  _"status 42"_\n\n' +
      '• Cette aide :\n  _"aide"_';
    await message.reply(reply).catch(() => {});
    addLog('help', phone, rawText, reply);
    return;
  }

  // --- Status query: "status 42" or "statut 42" ---
  if (text.startsWith('status ') || text.startsWith('statut ')) {
    const parts = rawText.trim().split(/\s+/);
    const id = parts[1];
    if (!id || isNaN(Number(id))) {
      const reply = '❗ Usage : *status <numéro_OT>*\nEx : _status 42_';
      await message.reply(reply).catch(() => {});
      addLog('status_query', phone, rawText, reply);
      return;
    }
    try {
      const wo = await getWorkOrder(id);
      const statusMap = {
        open: 'Ouvert', in_progress: 'En cours', completed: 'Terminé',
        on_hold: 'En attente', cancelled: 'Annulé',
      };
      const reply =
        `🛠 *OT #${wo.id}*\n` +
        `📋 ${wo.title}\n` +
        `📊 Statut : *${statusMap[wo.status] || wo.status}*\n` +
        `👷 Technicien : ${wo.technicianName || 'Non assigné'}\n` +
        `📅 Créé : ${new Date(wo.createdAt).toLocaleDateString('fr-DZ')}`;
      await message.reply(reply).catch(() => {});
      addLog('status_query', phone, rawText, reply);
    } catch (e) {
      const reply = `⚠️ OT #${id} introuvable ou erreur système.\n_Réessayez plus tard._`;
      await message.reply(reply).catch(() => {});
      addLog('status_query', phone, rawText, reply);
    }
    return;
  }

  // --- Issue / fault report ---
  const isIssue = ISSUE_KEYWORDS.some(kw => text.includes(kw));
  const isUrgent = URGENT_KEYWORDS.some(kw => text.includes(kw));

  if (isIssue || isUrgent) {
    try {
      const wo = await createWorkOrder({
        description: rawText,
        phone,
        priority: isUrgent ? 'high' : 'medium',
      });
      const priorityLabel = isUrgent ? '🔴 HAUTE' : '🟡 Normale';
      const reply =
        `✅ *Ticket créé avec succès !*\n\n` +
        `📋 OT #${wo.id}\n` +
        `📝 ${rawText.substring(0, 100)}\n` +
        `⚡ Priorité : ${priorityLabel}\n\n` +
        `Suivre : _status ${wo.id}_`;
      await message.reply(reply).catch(() => {});
      addLog('ticket_created', phone, rawText, reply);
      console.log(`[WhatsApp] Work order #${wo.id} created from +${phone} (priority: ${isUrgent ? 'high' : 'medium'})`);
    } catch (e) {
      console.error('[WhatsApp] Error creating work order:', e.message);
      const reply = '⚠️ Erreur système, veuillez réessayer plus tard.\n_Contactez votre administrateur si le problème persiste._';
      await message.reply(reply).catch(() => {});
      addLog('error', phone, rawText, reply);
    }
    return;
  }

  // --- Unknown ---
  const reply =
    '❗ Message non reconnu.\n\n' +
    'Exemples :\n' +
    '• _"panne pompe 2"_\n' +
    '• _"urgent hs compresseur"_\n' +
    '• _"status 42"_\n' +
    '• _"aide"_ pour la liste complète';
  await message.reply(reply).catch(() => {});
  addLog('unknown', phone, rawText, reply);
}

// --- Client lifecycle ---
function initClient() {
  if (client) return; // already initialized
  status = 'initializing';
  console.log('[WhatsApp] Initializing client...');

  client = new Client({
    authStrategy: new LocalAuth({ clientId: 'swan-gmao', dataPath: '.wwebjs_auth' }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
      ],
    },
  });

  client.on('qr', async (qr) => {
    status = 'qr_ready';
    currentQRString = qr;
    // Print to terminal
    qrcodeTerminal.generate(qr, { small: true });
    console.log('\n[WhatsApp] QR code ready — scan with WhatsApp to connect.\n');
    // Generate base64 image for the admin UI
    try {
      currentQRImage = await qrcode.toDataURL(qr);
    } catch (e) {
      console.error('[WhatsApp] QR image generation error:', e.message);
    }
  });

  client.on('ready', () => {
    status = 'connected';
    currentQRString = null;
    currentQRImage = null;
    console.log('[WhatsApp] ✅ Client connected and ready!');
  });

  client.on('authenticated', () => {
    console.log('[WhatsApp] Session authenticated.');
  });

  client.on('auth_failure', (msg) => {
    status = 'disconnected';
    currentQRImage = null;
    console.error('[WhatsApp] Auth failure:', msg);
  });

  client.on('disconnected', (reason) => {
    status = 'disconnected';
    currentQRImage = null;
    client = null;
    console.log('[WhatsApp] Disconnected:', reason);
    // Auto-reconnect after 10s
    console.log('[WhatsApp] Will attempt reconnect in 10 seconds...');
    setTimeout(initClient, 10000);
  });

  client.on('message', async (message) => {
    if (message.isGroupMsg || message.from === 'status@broadcast') return;
    try {
      await processMessage(message);
    } catch (e) {
      console.error('[WhatsApp] Unhandled error processing message:', e.message);
    }
  });

  client.initialize().catch((e) => {
    console.error('[WhatsApp] Initialization error:', e.message);
    status = 'disconnected';
    client = null;
  });
}

async function sendMessage(phone, text) {
  if (!client || status !== 'connected') {
    throw new Error('WhatsApp non connecté — veuillez scanner le QR code d\'abord.');
  }
  const chatId = phone.includes('@c.us') ? phone : `${phone.replace(/\D/g, '')}@c.us`;
  await client.sendMessage(chatId, text);
  console.log(`[WhatsApp] Message sent to ${chatId}`);
}

function getStatus() { return status; }
function getQRImage() { return currentQRImage; }
function getLogs() { return messageLogs; }

module.exports = { initClient, sendMessage, getStatus, getQRImage, getLogs };

'use strict';

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const { createWorkOrder, getWorkOrder } = require('./gmaoService');
const {
  listAllowedNumbers,
  upsertGatewayState,
  getGatewayState,
  logMessage,
  listMessages,
} = require('./db');

let client = null;
let currentQRString = null;
let currentQRImage = null;
let status = 'disconnected';

const ISSUE_KEYWORDS = [
  'panne', 'hs', 'ma tkhdemch', 'ne marche pas', 'arrêt', 'défaut',
  'problème', 'pb', 'hors service', 'bloqué', 'bloque', 'en panne',
  'défaillance', 'cassé', 'casse', 'brisé', 'fuite', 'surchauffe',
];
const URGENT_KEYWORDS = [
  'urgent', 'urgence', 'critique', 'immédiat', 'immédiatement', 'vite',
  'danger', 'risque', 'accident',
];

async function persistState(patch) {
  await upsertGatewayState({
    status,
    qrText: currentQRString,
    qrImage: currentQRImage,
    ...patch,
  });
}

async function addLog(type, phone, text, reply, extra = {}) {
  await logMessage({
    direction: 'inbound',
    messageType: type,
    phone,
    text,
    reply: reply || null,
    workOrderId: extra.workOrderId || null,
    statusCode: extra.statusCode || null,
  });
}

async function processMessage(message) {
  const rawPhone = message.from;
  const phone = rawPhone.replace('@c.us', '');
  const rawText = message.body.trim();
  const text = rawText.toLowerCase();

  const allowedNumbers = await listAllowedNumbers();
  const isAllowed = allowedNumbers.some(n => n.phone === phone || n.phone === rawPhone);

  if (!isAllowed) {
    const reply = '⛔ Numéro non autorisé. Veuillez contacter votre administrateur SWAN GMAO.';
    await message.reply(reply).catch(() => {});
    await addLog('blocked', phone, rawText, reply, { statusCode: 403 });
    return;
  }

  if (text === 'aide' || text === 'help' || text === '?') {
    const reply =
      '📋 *SWAN GMAO — Commandes*\n\n' +
      '• Signaler une panne :\n  _"panne pompe 2 atelier A"_\n\n' +
      '• Urgence :\n  _"urgent hs compresseur ligne 3"_\n\n' +
      '• Consulter un OT :\n  _"status 42"_\n\n' +
      '• Cette aide :\n  _"aide"_';
    await message.reply(reply).catch(() => {});
    await addLog('help', phone, rawText, reply);
    return;
  }

  if (text.startsWith('status ') || text.startsWith('statut ')) {
    const parts = rawText.trim().split(/\s+/);
    const id = parts[1];
    if (!id || isNaN(Number(id))) {
      const reply = '❗ Usage : *status <numéro_OT>*\nEx : _status 42_';
      await message.reply(reply).catch(() => {});
      await addLog('status_query', phone, rawText, reply, { statusCode: 400 });
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
      await addLog('status_query', phone, rawText, reply, { workOrderId: wo.id });
    } catch (e) {
      const reply = `⚠️ OT #${id} introuvable ou erreur système.\n_Réessayez plus tard._`;
      await message.reply(reply).catch(() => {});
      await addLog('status_query', phone, rawText, reply, { statusCode: 404 });
    }
    return;
  }

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
      await addLog('ticket_created', phone, rawText, reply, { workOrderId: wo.id });
    } catch (e) {
      const reply = '⚠️ Erreur système, veuillez réessayer plus tard.\n_Contactez votre administrateur si le problème persiste._';
      await message.reply(reply).catch(() => {});
      await addLog('error', phone, rawText, reply, { statusCode: 503 });
    }
    return;
  }

  const reply =
    '❗ Message non reconnu.\n\n' +
    'Exemples :\n' +
    '• _"panne pompe 2"_\n' +
    '• _"urgent hs compresseur"_\n' +
    '• _"status 42"_\n' +
    '• _"aide"_ pour la liste complète';
  await message.reply(reply).catch(() => {});
  await addLog('unknown', phone, rawText, reply, { statusCode: 400 });
}

function initClient() {
  if (client) return;
  status = 'initializing';
  persistState({ lastDisconnectedAt: new Date() }).catch(() => {});

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
    qrcodeTerminal.generate(qr, { small: true });
    try {
      currentQRImage = await qrcode.toDataURL(qr);
    } catch {}
    await persistState({ qrText: qr, qrImage: currentQRImage }).catch(() => {});
  });

  client.on('ready', async () => {
    status = 'connected';
    currentQRString = null;
    currentQRImage = null;
    await persistState({ lastConnectedAt: new Date(), qrText: null, qrImage: null }).catch(() => {});
  });

  client.on('authenticated', () => {
    persistState({ lastConnectedAt: new Date() }).catch(() => {});
  });

  client.on('auth_failure', () => {
    status = 'disconnected';
    currentQRImage = null;
    currentQRString = null;
    persistState({ lastDisconnectedAt: new Date(), qrText: null, qrImage: null }).catch(() => {});
  });

  client.on('disconnected', () => {
    status = 'disconnected';
    currentQRImage = null;
    currentQRString = null;
    client = null;
    persistState({ lastDisconnectedAt: new Date(), qrText: null, qrImage: null }).catch(() => {});
    setTimeout(initClient, 10000);
  });

  client.on('message', async (message) => {
    if (message.isGroupMsg || message.from === 'status@broadcast') return;
    try {
      await processMessage(message);
    } catch (e) {
      await addLog('error', message.from.replace('@c.us', ''), message.body || '', 'Erreur interne', { statusCode: 500 });
    }
  });

  client.initialize().catch(async () => {
    status = 'disconnected';
    client = null;
    await persistState({ lastDisconnectedAt: new Date(), qrText: null, qrImage: null }).catch(() => {});
  });
}

async function sendMessage(phone, text) {
  if (!client || status !== 'connected') {
    throw new Error('WhatsApp non connecté — veuillez scanner le QR code d\'abord.');
  }
  const chatId = phone.includes('@c.us') ? phone : `${phone.replace(/\D/g, '')}@c.us`;
  await client.sendMessage(chatId, text);
  await logMessage({
    direction: 'outbound',
    messageType: 'manual',
    phone: phone.replace(/\D/g, ''),
    text,
    reply: null,
    workOrderId: null,
    statusCode: 200,
  });
}

async function getStatus() {
  const state = await getGatewayState();
  return state?.status || status;
}

async function getQRImage() {
  const state = await getGatewayState();
  return state?.qrImage || currentQRImage;
}

async function getLogs() {
  return listMessages();
}

module.exports = { initClient, sendMessage, getStatus, getQRImage, getLogs };

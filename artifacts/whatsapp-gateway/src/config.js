'use strict';

const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const NUMBERS_FILE = path.join(DATA_DIR, 'allowed_numbers.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadNumbers() {
  ensureDataDir();
  try {
    if (fs.existsSync(NUMBERS_FILE)) {
      return JSON.parse(fs.readFileSync(NUMBERS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('[Config] Error loading numbers:', e.message);
  }
  return [];
}

function saveNumbers(numbers) {
  ensureDataDir();
  try {
    fs.writeFileSync(NUMBERS_FILE, JSON.stringify(numbers, null, 2));
  } catch (e) {
    console.error('[Config] Error saving numbers:', e.message);
  }
}

const config = {
  port: parseInt(process.env.PORT || '8099', 10),
  gmaoApiUrl: process.env.GMAO_API_URL || 'http://localhost:8080/api',
  basePath: '/whatsapp',
};

module.exports = { config, loadNumbers, saveNumbers };

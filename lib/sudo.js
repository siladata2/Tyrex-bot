/**
 * TYREX-KSH-MD - Sudo System
 * Persistent sudo-user store, kept separate from settings.js so the
 * list can be managed at runtime with .sudo add / .sudo del / .sudo list
 */

const fs = require('fs');
const settings = require('../settings');

const dataPath = './data/sudo.json';

function cleanNumber(num) {
  if (!num) return '';
  return String(num).split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
}

function ensureDataDir() {
  if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
}

function readStore() {
  try {
    ensureDataDir();
    if (fs.existsSync(dataPath)) {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      if (Array.isArray(data.sudo)) return data;
    }
  } catch (e) {
    console.log('[SUDO] Read failed:', e.message);
  }
  return { sudo: [] };
}

function writeStore(data) {
  try {
    ensureDataDir();
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.log('[SUDO] Write failed:', e.message);
  }
}

// ─────────────────────────────────────────────
// BASE SUDO LIST FROM settings.js (always sudo, can't be removed here)
// ─────────────────────────────────────────────
function getBaseSudoNumbers() {
  const list = new Set();
  if (Array.isArray(settings.sudoUsers)) {
    settings.sudoUsers.forEach(u => {
      const c = cleanNumber(u);
      if (c) list.add(c);
    });
  }
  return list;
}

// ─────────────────────────────────────────────
// FULL SUDO LIST (settings.js base + runtime additions)
// ─────────────────────────────────────────────
function getSudoNumbers() {
  const list = getBaseSudoNumbers();
  const store = readStore();
  store.sudo.forEach(u => {
    const c = cleanNumber(u);
    if (c) list.add(c);
  });
  return [...list];
}

function isSudo(sender) {
  if (!sender) return false;
  const senderNum = cleanNumber(sender);
  if (!senderNum) return false;
  return getSudoNumbers().includes(senderNum);
}

function isRuntimeSudo(sender) {
  if (!sender) return false;
  const senderNum = cleanNumber(sender);
  if (!senderNum) return false;
  const store = readStore();
  return store.sudo.some(u => cleanNumber(u) === senderNum);
}

// ─────────────────────────────────────────────
// ADD / DEL — only affects the runtime store, never settings.js
// ─────────────────────────────────────────────
function addSudo(number) {
  const num = cleanNumber(number);
  if (!num) return { ok: false, reason: 'invalid' };

  if (getBaseSudoNumbers().has(num)) {
    return { ok: false, reason: 'already-base' };
  }

  const store = readStore();
  if (store.sudo.some(u => cleanNumber(u) === num)) {
    return { ok: false, reason: 'already-sudo' };
  }

  store.sudo.push(num);
  writeStore(store);
  return { ok: true };
}

function removeSudo(number) {
  const num = cleanNumber(number);
  if (!num) return { ok: false, reason: 'invalid' };

  if (getBaseSudoNumbers().has(num)) {
    return { ok: false, reason: 'protected-base' };
  }

  const store = readStore();
  const before = store.sudo.length;
  store.sudo = store.sudo.filter(u => cleanNumber(u) !== num);

  if (store.sudo.length === before) {
    return { ok: false, reason: 'not-found' };
  }

  writeStore(store);
  return { ok: true };
}

function listSudo() {
  const base = [...getBaseSudoNumbers()].map(n => ({ number: n, source: 'settings.js' }));
  const store = readStore();
  const runtime = store.sudo
    .map(cleanNumber)
    .filter(Boolean)
    .filter(n => !getBaseSudoNumbers().has(n))
    .map(n => ({ number: n, source: 'sudo store' }));
  return [...base, ...runtime];
}

module.exports = {
  cleanNumber,
  isSudo,
  isRuntimeSudo,
  addSudo,
  removeSudo,
  listSudo,
  getSudoNumbers
};

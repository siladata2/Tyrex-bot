/**
 * NEXORA MD - Prefix Manager
 * Persists a custom command prefix and an optional "prefixless" mode
 * (bot responds to commands even with no prefix at all) to disk, so
 * the setting survives restarts — same pattern as lib/mode.js.
 */

const fs = require('fs');

const PREFIX_FILE = './data/prefix.json';

function ensureDir() {
  if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data', { recursive: true });
  }
}

function readState() {
  try {
    if (fs.existsSync(PREFIX_FILE)) {
      return JSON.parse(fs.readFileSync(PREFIX_FILE, 'utf8'));
    }
  } catch (e) {}
  return {};
}

function writeState(state) {
  ensureDir();
  fs.writeFileSync(PREFIX_FILE, JSON.stringify(state, null, 2));
}

function getPrefix(fallback) {
  const state = readState();
  if (typeof state.prefix === 'string' && state.prefix.length > 0) {
    return state.prefix;
  }
  return fallback || '.';
}

function setPrefix(newPrefix) {
  if (typeof newPrefix !== 'string' || newPrefix.length === 0 || newPrefix.length > 5) return false;
  try {
    const state = readState();
    state.prefix = newPrefix;
    writeState(state);
    global.prefix = newPrefix;
    return true;
  } catch (e) {
    return false;
  }
}

function isPrefixless() {
  const state = readState();
  return state.prefixless === true;
}

function setPrefixless(enabled) {
  try {
    const state = readState();
    state.prefixless = !!enabled;
    writeState(state);
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = { getPrefix, setPrefix, isPrefixless, setPrefixless };

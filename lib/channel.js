/**
 * TYREX MD - Global Channel Branding
 * Wraps sendMessage so every text/image/video message gets the channel block
 * Channel name shows as TYREX MD (from settings.channelName)
 */

const fs = require('fs');
const _settings = require('../settings');

// ── folded-in bot constants + notify helpers (required by plugins/misc/misc.js) ──
const BOT_NAME = _settings.botName;
const BOT_VERSION = '1.0.0';

// ── on/off switch for the branding, controlled by .channelbrand on|off ──
const _brandDataPath = './data/channelbrand.json';

function isBrandingEnabled() {
  try {
    if (fs.existsSync(_brandDataPath)) {
      const store = JSON.parse(fs.readFileSync(_brandDataPath, 'utf8'));
      return store.enabled !== false;
    }
  } catch (e) {}
  return true; // default: on, same as the original behaviour
}

async function _notify(conn, jid, text) {
  try { if (jid && conn) await conn.sendMessage(jid, { text }); } catch (e) {}
}
async function notifyChannel(conn, text) { return _notify(conn, _settings.channelId, text); }
async function notifyGroup(conn, jid, text) { return _notify(conn, jid, text); }
async function notifyOwner(conn, text) { return _notify(conn, _settings.ownerNumber + '@s.whatsapp.net', text); }

function enableChannelBranding(sock, settings) {
  if (!sock || typeof sock.sendMessage !== 'function') {
    console.log('[CHANNEL] Invalid socket, skipping branding');
    return;
  }

  const original = sock.sendMessage.bind(sock);

  sock.sendMessage = async function(jid, content, options = {}) {
    try {
      // Only wrap real content messages — skip reactions, deletes, edits, polls
      const shouldWrap =
        content &&
        typeof content === 'object' &&
        !content.react &&
        !content.delete &&
        !content.protocolMessage &&
        !content.poll &&
        !content.pollCreationMessage &&
        !content.pollUpdateMessage &&
        (content.text || content.image || content.video ||
         content.audio || content.document || content.caption);

      if (shouldWrap && isBrandingEnabled()) {
        content.contextInfo = {
          ...(content.contextInfo || {}),
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: settings.channelId,
            newsletterName: settings.channelName || 'TYREX MD',
            serverMessageId: 1
          }
        };
      }
    } catch (e) {
      console.log('[CHANNEL] Wrap failed:', e.message);
    }

    return original(jid, content, options);
  };

  console.log('[CHANNEL] Branding enabled for TYREX MD');
}

module.exports = {
  enableChannelBranding,
  BOT_NAME,
  BOT_VERSION,
  notifyChannel,
  notifyGroup,
  notifyOwner
};
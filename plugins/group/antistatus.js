/**
 * TYREX-KSH-MD - Anti-Status Protection
 * When someone tags/mentions this group in their personal WhatsApp status,
 * WhatsApp drops a "status mention" message into the group chat. When
 * enabled, the bot deletes that message from the group automatically.
 *
 * Note: this only removes the mention notice that lands in the group chat —
 * WhatsApp gives no API to delete someone else's actual status update.
 */

const fs = require('fs');
const settings = require('../../settings');
const { isSenderAdmin, isBotAdmin, cleanNum } = require('../../lib/groupAdmin');

const dataPath = './data/antistatus.json';

if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, JSON.stringify({}));

function readStore() {
  try { return JSON.parse(fs.readFileSync(dataPath, 'utf8')); }
  catch (e) { return {}; }
}

function writeStore(data) {
  try { fs.writeFileSync(dataPath, JSON.stringify(data, null, 2)); }
  catch (e) { console.log('[ANTISTATUS] Write failed:', e.message); }
}

// ─────────────────────────────────────────────
// DETECT A "STATUS MENTION" MESSAGE
// ─────────────────────────────────────────────
function isStatusMentionMessage(mek) {
  try {
    const msg = mek.message;
    if (!msg) return false;

    if (msg.groupStatusMentionMessage || msg.statusMentionMessage) return true;

    const contextInfo =
      msg.extendedTextMessage?.contextInfo ||
      msg.imageMessage?.contextInfo ||
      msg.videoMessage?.contextInfo ||
      msg.conversation?.contextInfo;

    if (contextInfo && contextInfo.isGroupStatus === true) return true;
    if (contextInfo && contextInfo.statusAttributions) return true;

    // Defensive fallback: scan serialized keys for a status-mention marker
    const raw = JSON.stringify(msg);
    if (/statusMention/i.test(raw)) return true;

    return false;
  } catch (e) {
    return false;
  }
}

// ─────────────────────────────────────────────
// COMMAND
// ─────────────────────────────────────────────
module.exports = {
  name: 'antistatus',
  aliases: ['antistatusmention', 'as'],
  category: 'group',
  description: 'Delete status-mention notices posted into the group',
  usage: '.antistatus on | .antistatus off',
  groupOnly: true,
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {
      const isGroup = chatId.endsWith('@g.us');
      if (!isGroup) {
        await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } });
        await conn.sendMessage(chatId, { text: `This command is for groups only.\n\n${settings.footer}` });
        return;
      }

      const sender = mek.key.participant || mek.key.remoteJid;
      const senderIsAdmin = await isSenderAdmin(conn, chatId, sender);

      if (!senderIsAdmin && !isOwner) {
        await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } });
        await conn.sendMessage(chatId, {
          text: `Admin or owner access required.\n\n${settings.footer}`
        });
        return;
      }

      const botIsAdmin = await isBotAdmin(conn, chatId);
      if (!botIsAdmin) {
        await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } });
        await conn.sendMessage(chatId, {
          text: `I need to be an admin to use this feature.\n\n${settings.footer}`
        });
        return;
      }

      const store = readStore();
      const choice = (args[0] || '').toLowerCase();

      if (choice === 'on') {
        store[chatId] = { enabled: true };
        writeStore(store);
        await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
        await conn.sendMessage(chatId, {
          text:
            `ANTI-STATUS ENABLED\n\n` +
            `Status-mention notices posted into this group will be deleted automatically.\n\n` +
            `${settings.footer}`
        });
        return;
      }

      if (choice === 'off') {
        store[chatId] = { enabled: false };
        writeStore(store);
        await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
        await conn.sendMessage(chatId, {
          text: `ANTI-STATUS DISABLED\n\n${settings.footer}`
        });
        return;
      }

      const current = store[chatId];
      const status = current?.enabled ? 'ENABLED' : 'DISABLED';

      await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
      await conn.sendMessage(chatId, {
        text:
          `ANTI-STATUS PROTECTION\n\n` +
          `Status: ${status}\n\n` +
          `Usage:\n` +
          `  ${settings.prefix || '.'}antistatus on   - delete status-mention notices\n` +
          `  ${settings.prefix || '.'}antistatus off  - leave them alone\n\n` +
          `${settings.footer}`
      });

    } catch (error) {
      console.log('[ANTISTATUS] Command error:', error.message);
      try { await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } }); } catch (e) {}
      try {
        await conn.sendMessage(chatId, {
          text: `Error: ${error.message}\n\n${settings.footer}`
        });
      } catch (e) {}
    }
  }
};

// ─────────────────────────────────────────────
// WATCHER - called from main.js for every group message
// ─────────────────────────────────────────────
async function antiStatusWatcher(conn, mek, chatId) {
  try {
    if (!chatId || !chatId.endsWith('@g.us')) return;
    if (!isStatusMentionMessage(mek)) return;

    const store = readStore();
    if (!store[chatId] || !store[chatId].enabled) return;

    const botIsAdmin = await isBotAdmin(conn, chatId);
    if (!botIsAdmin) return;

    try {
      await conn.sendMessage(chatId, { delete: mek.key });
      console.log('[ANTISTATUS] Deleted status-mention message in', chatId);
    } catch (e) {
      console.log('[ANTISTATUS] Delete failed:', e.message);
    }
  } catch (error) {
    console.log('[ANTISTATUS] Watcher error:', error.message);
  }
}

module.exports.antiStatusWatcher = antiStatusWatcher;

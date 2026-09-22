/**
 * TYREX-KSH-MD - Anti-Demote Protection
 * Only the bot owner/sudo may demote an admin.
 * If anyone else demotes an admin, the bot immediately re-promotes them.
 */

const fs = require('fs');
const settings = require('../../settings');
const owner = require('../../lib/owner');
const { isBotAdmin, isSenderAdmin, cleanNum } = require('../../lib/groupAdmin');

const dataPath = './data/antidemote.json';

if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, JSON.stringify({}));

function readStore() {
  try { return JSON.parse(fs.readFileSync(dataPath, 'utf8')); }
  catch (e) { return {}; }
}

function writeStore(data) {
  try { fs.writeFileSync(dataPath, JSON.stringify(data, null, 2)); }
  catch (e) { console.log('[ANTIDEMOTE] Write failed:', e.message); }
}

// ─────────────────────────────────────────────
// COMMAND
// ─────────────────────────────────────────────
module.exports = {
  name: 'antidemote',
  aliases: ['ad'],
  category: 'group',
  description: 'Only owner/sudo can demote admins',
  usage: '.antidemote on | .antidemote off',
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
            `ANTI-DEMOTE ENABLED\n\n` +
            `Only the bot owner/sudo can demote admins. ` +
            `Any other demotion will be reversed automatically.\n\n` +
            `${settings.footer}`
        });
        return;
      }

      if (choice === 'off') {
        store[chatId] = { enabled: false };
        writeStore(store);
        await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
        await conn.sendMessage(chatId, {
          text: `ANTI-DEMOTE DISABLED\n\n${settings.footer}`
        });
        return;
      }

      const current = store[chatId];
      const status = current?.enabled ? 'ENABLED' : 'DISABLED';

      await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
      await conn.sendMessage(chatId, {
        text:
          `ANTI-DEMOTE PROTECTION\n\n` +
          `Status: ${status}\n\n` +
          `Usage:\n` +
          `  ${settings.prefix || '.'}antidemote on   - restrict demotions to owner/sudo\n` +
          `  ${settings.prefix || '.'}antidemote off  - allow normal admin demotions\n\n` +
          `${settings.footer}`
      });

    } catch (error) {
      console.log('[ANTIDEMOTE] Command error:', error.message);
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
// WATCHER - called from main.js on action === 'demote'
// ─────────────────────────────────────────────
async function antiDemoteWatcher(conn, update) {
  try {
    const { id: groupId, participants, action, author } = update;
    if (!groupId || !groupId.endsWith('@g.us')) return;
    if (action !== 'demote') return;

    const store = readStore();
    if (!store[groupId] || !store[groupId].enabled) return;

    // Can't verify who did it — don't act to avoid false positives.
    if (!author) return;

    // Authorized (owner/sudo) — allow it.
    if (owner.isOwner(author, conn)) return;

    const botIsAdmin = await isBotAdmin(conn, groupId);
    if (!botIsAdmin) return;

    try {
      await conn.groupParticipantsUpdate(groupId, participants, 'promote');
    } catch (e) {
      console.log('[ANTIDEMOTE] Re-promote failed:', e.message);
      return;
    }

    try {
      const names = participants.map(j => '@' + cleanNum(j)).join(', ');
      const authorName = '@' + cleanNum(author);
      await conn.sendMessage(groupId, {
        text:
          `ANTI-DEMOTE\n\n` +
          `${authorName} demoted ${names} without owner/sudo access. Reverted.\n\n` +
          `${settings.footer}`,
        mentions: [...participants, author]
      });
    } catch (e) {}

  } catch (error) {
    console.log('[ANTIDEMOTE] Watcher error:', error.message);
  }
}

module.exports.antiDemoteWatcher = antiDemoteWatcher;

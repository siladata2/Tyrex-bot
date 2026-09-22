/**
 * TYREX-KSH-MD - Anti-Promote Protection
 * Only the bot owner/sudo may promote members to admin.
 * If anyone else promotes someone, the bot immediately demotes them back.
 */

const fs = require('fs');
const settings = require('../../settings');
const owner = require('../../lib/owner');
const { isBotAdmin, idsMatch, cleanNum } = require('../../lib/groupAdmin');

const dataPath = './data/antipromote.json';

if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, JSON.stringify({}));

function readStore() {
  try { return JSON.parse(fs.readFileSync(dataPath, 'utf8')); }
  catch (e) { return {}; }
}

function writeStore(data) {
  try { fs.writeFileSync(dataPath, JSON.stringify(data, null, 2)); }
  catch (e) { console.log('[ANTIPROMOTE] Write failed:', e.message); }
}

// ─────────────────────────────────────────────
// COMMAND
// ─────────────────────────────────────────────
module.exports = {
  name: 'antipromote',
  aliases: ['antiadmin', 'ap'],
  category: 'group',
  description: 'Only owner/sudo can promote members to admin',
  usage: '.antipromote on | .antipromote off',
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
      const { isSenderAdmin } = require('../../lib/groupAdmin');
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
            `ANTI-PROMOTE ENABLED\n\n` +
            `Only the bot owner/sudo can promote members to admin. ` +
            `Any other promotion will be reversed automatically.\n\n` +
            `${settings.footer}`
        });
        return;
      }

      if (choice === 'off') {
        store[chatId] = { enabled: false };
        writeStore(store);
        await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
        await conn.sendMessage(chatId, {
          text: `ANTI-PROMOTE DISABLED\n\n${settings.footer}`
        });
        return;
      }

      const current = store[chatId];
      const status = current?.enabled ? 'ENABLED' : 'DISABLED';

      await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
      await conn.sendMessage(chatId, {
        text:
          `ANTI-PROMOTE PROTECTION\n\n` +
          `Status: ${status}\n\n` +
          `Usage:\n` +
          `  ${settings.prefix || '.'}antipromote on   - restrict promotions to owner/sudo\n` +
          `  ${settings.prefix || '.'}antipromote off  - allow normal admin promotions\n\n` +
          `${settings.footer}`
      });

    } catch (error) {
      console.log('[ANTIPROMOTE] Command error:', error.message);
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
// WATCHER - called from main.js on action === 'promote'
// ─────────────────────────────────────────────
async function antiPromoteWatcher(conn, update) {
  try {
    const { id: groupId, participants, action, author } = update;
    if (!groupId || !groupId.endsWith('@g.us')) return;
    if (action !== 'promote') return;

    const store = readStore();
    if (!store[groupId] || !store[groupId].enabled) return;

    // Can't verify who did it — don't act to avoid false positives.
    if (!author) return;

    // Authorized (owner/sudo) — allow it.
    if (owner.isOwner(author, conn)) return;

    const botIsAdmin = await isBotAdmin(conn, groupId);
    if (!botIsAdmin) return;

    try {
      await conn.groupParticipantsUpdate(groupId, participants, 'demote');
    } catch (e) {
      console.log('[ANTIPROMOTE] Demote-back failed:', e.message);
      return;
    }

    try {
      const names = participants.map(j => '@' + cleanNum(j)).join(', ');
      const authorName = '@' + cleanNum(author);
      await conn.sendMessage(groupId, {
        text:
          `ANTI-PROMOTE\n\n` +
          `${authorName} promoted ${names} without owner/sudo access. Reverted.\n\n` +
          `${settings.footer}`,
        mentions: [...participants, author]
      });
    } catch (e) {}

  } catch (error) {
    console.log('[ANTIPROMOTE] Watcher error:', error.message);
  }
}

module.exports.antiPromoteWatcher = antiPromoteWatcher;

/**
 * NEXORA MD - Group Events Toggle
 * Usage:
 *   .groupevents on      → enable welcome/goodbye/promote/demote + group-change alerts
 *   .groupevents off     → disable
 *   .groupevents         → show current status
 *
 * Note: this resets to OFF automatically whenever the bot restarts.
 */

const settings = require('../../settings');
const { isSenderAdmin, isBotAdmin } = require('../../lib/groupAdmin');
const groupEvents = require('../../lib/groupevents');

module.exports = {
  name: 'groupevents',
  aliases: ['gevents', 'ge', 'grouplogs'],
  category: 'group',
  description: 'Toggle group join/leave/promote/demote and group-change notifications',
  usage: '.groupevents on | off | status',
  groupOnly: true,
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {
      const isGroup = chatId.endsWith('@g.us');
      if (!isGroup) {
        await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } });
        await conn.sendMessage(chatId, {
          text: `This command is for groups only.\n\n${settings.footer}`
        });
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

      const choice = (args[0] || '').toLowerCase();

      if (choice === 'on') {
        const botIsAdmin = await isBotAdmin(conn, chatId);
        if (!botIsAdmin) {
          await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } });
          await conn.sendMessage(chatId, {
            text: `I need to be an admin to announce group changes reliably.\n\n${settings.footer}`
          });
          return;
        }

        groupEvents.enable(chatId);
        await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
        await conn.sendMessage(chatId, {
          text:
            `GROUP EVENTS ENABLED\n\n` +
            `I'll now announce:\n` +
            `- member joins / leaves\n` +
            `- promotions / demotions\n` +
            `- group name / description changes\n` +
            `- group icon changes\n` +
            `- "admins only" message & edit settings\n\n` +
            `Note: this turns back OFF automatically if the bot restarts.\n\n` +
            `${settings.footer}`
        });
        return;
      }

      if (choice === 'off') {
        groupEvents.disable(chatId);
        await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
        await conn.sendMessage(chatId, {
          text: `GROUP EVENTS DISABLED\n\n${settings.footer}`
        });
        return;
      }

      const status = groupEvents.getStatus(chatId);
      await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
      await conn.sendMessage(chatId, {
        text:
          `GROUP EVENTS\n\n` +
          `Status: ${status}\n\n` +
          `Usage:\n` +
          `  ${settings.prefix || '.'}groupevents on\n` +
          `  ${settings.prefix || '.'}groupevents off\n\n` +
          `${settings.footer}`
      });

    } catch (error) {
      console.log('[GROUPEVENTS] Command error:', error.message);
      try { await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } }); } catch (e) {}
      try {
        await conn.sendMessage(chatId, { text: `Error: ${error.message}\n\n${settings.footer}` });
      } catch (e) {}
    }
  }
};

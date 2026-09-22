/**
 * TYREX-KSH-MD - Sudo System
 * Manage extra numbers that get owner-level access, without touching settings.js
 *
 * Usage:
 *   .sudo add @user | .sudo add 255712345678
 *   .sudo del @user | .sudo del 255712345678
 *   .sudo list
 */

const settings = require('../../settings');
const owner = require('../../lib/owner');
const sudo = require('../../lib/sudo');

function extractTarget(mek, args) {
  const contextInfo = mek.message?.extendedTextMessage?.contextInfo;
  const mentioned = contextInfo?.mentionedJid || [];
  const quoted = contextInfo?.participant;

  if (mentioned[0]) return mentioned[0];
  if (quoted) return quoted;

  if (args[0]) {
    const num = String(args[0]).replace(/[^0-9]/g, '');
    if (num.length >= 8) return num + '@s.whatsapp.net';
  }

  return null;
}

module.exports = {
  name: 'sudo',
  aliases: ['setsudo', 'sudomanage'],
  category: 'owner',
  description: 'Manage sudo (owner-level) users',
  usage: `${'.'}sudo add @user | ${'.'}sudo del @user | ${'.'}sudo list`,
  ownerOnly: true,
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {
      const sender = mek.key.participant || mek.key.remoteJid;
      const senderIsRealOwner = owner.isRealOwner(sender, conn);
      const sub = (args[0] || '').toLowerCase();
      const rest = args.slice(1);

      // ─────────────────────────────────────
      // LIST — any owner/sudo can view
      // ─────────────────────────────────────
      if (sub === 'list' || sub === 'ls' || !sub) {
        const list = sudo.listSudo();

        if (list.length === 0) {
          await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
          await conn.sendMessage(chatId, {
            text: `No sudo users configured.\n\n${settings.footer}`
          });
          return;
        }

        let text = `SUDO USERS\n\n`;
        list.forEach((u, i) => {
          text += `${i + 1}. ${u.number} (${u.source})\n`;
        });
        text +=
          `\nUsage:\n` +
          `  ${settings.prefix || '.'}sudo add @user   - grant sudo\n` +
          `  ${settings.prefix || '.'}sudo del @user   - revoke sudo\n` +
          `  ${settings.prefix || '.'}sudo list        - show sudo users\n\n` +
          `${settings.footer}`;

        await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
        await conn.sendMessage(chatId, { text });
        return;
      }

      // ─────────────────────────────────────
      // ADD / DEL — real owner only, not sudo users
      // ─────────────────────────────────────
      if (sub === 'add' || sub === 'del' || sub === 'remove' || sub === 'rm') {
        if (!senderIsRealOwner) {
          await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } });
          await conn.sendMessage(chatId, {
            text:
              `OWNER ONLY\n\n` +
              `This command is for the bot owner only. Managing sudo users is restricted ` +
              `to the real owner, even sudo users can't grant or revoke sudo access.\n\n` +
              `${settings.footer}`
          });
          return;
        }

        const target = extractTarget(mek, rest);
        if (!target) {
          await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } });
          await conn.sendMessage(chatId, {
            text:
              `Tag or reply to a user, or give a number.\n` +
              `Usage: ${settings.prefix || '.'}sudo ${sub} @user OR ${settings.prefix || '.'}sudo ${sub} 255712345678\n\n` +
              `${settings.footer}`
          });
          return;
        }

        if (sub === 'add') {
          const result = sudo.addSudo(target);
          const num = String(target).split('@')[0];

          if (!result.ok && result.reason === 'already-base') {
            await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } });
            await conn.sendMessage(chatId, {
              text: `@${num} is already sudo (from settings.js).\n\n${settings.footer}`,
              mentions: [target]
            });
            return;
          }

          if (!result.ok && result.reason === 'already-sudo') {
            await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } });
            await conn.sendMessage(chatId, {
              text: `@${num} is already sudo.\n\n${settings.footer}`,
              mentions: [target]
            });
            return;
          }

          await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
          await conn.sendMessage(chatId, {
            text: `SUDO ADDED\n\n@${num} now has owner-level access.\n\n${settings.footer}`,
            mentions: [target]
          });
          return;
        }

        // del / remove / rm
        const result = sudo.removeSudo(target);
        const num = String(target).split('@')[0];

        if (!result.ok && result.reason === 'protected-base') {
          await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } });
          await conn.sendMessage(chatId, {
            text:
              `@${num} is a sudo user from settings.js and can't be removed with this command. ` +
              `Edit sudoUsers in settings.js to remove them.\n\n${settings.footer}`,
            mentions: [target]
          });
          return;
        }

        if (!result.ok && result.reason === 'not-found') {
          await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } });
          await conn.sendMessage(chatId, {
            text: `@${num} is not a sudo user.\n\n${settings.footer}`,
            mentions: [target]
          });
          return;
        }

        await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
        await conn.sendMessage(chatId, {
          text: `SUDO REMOVED\n\n@${num} no longer has owner-level access.\n\n${settings.footer}`,
          mentions: [target]
        });
        return;
      }

      // ─────────────────────────────────────
      // UNKNOWN SUBCOMMAND
      // ─────────────────────────────────────
      await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } });
      await conn.sendMessage(chatId, {
        text:
          `SUDO\n\n` +
          `Usage:\n` +
          `  ${settings.prefix || '.'}sudo add @user   - grant sudo\n` +
          `  ${settings.prefix || '.'}sudo del @user   - revoke sudo\n` +
          `  ${settings.prefix || '.'}sudo list        - show sudo users\n\n` +
          `${settings.footer}`
      });

    } catch (error) {
      console.log('[SUDO] Error:', error.message);
      try { await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } }); } catch (e) {}
      try {
        await conn.sendMessage(chatId, {
          text: `Error: ${error.message}\n\n${settings.footer}`
        });
      } catch (e) {}
    }
  }
};

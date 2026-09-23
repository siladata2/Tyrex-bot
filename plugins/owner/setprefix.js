/**
 *  MD - Set Prefix
 * Usage:
 *   .setprefix !          → change prefix to "!"
 *   .setprefix none       → enable prefixless mode (commands work with no prefix)
 *   .setprefix reset      → back to default "." and prefixless off
 *   .setprefix            → show current prefix / status
 */

const settings = require('../../settings');
const prefixLib = require('../../lib/prefix');

module.exports = {
  name: 'setprefix',
  aliases: ['prefix', 'changeprefix'],
  category: 'owner',
  description: 'Change the bot command prefix, or enable prefixless mode',
  usage: '.setprefix <symbol> | none | reset',
  ownerOnly: true,
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {
      if (!isOwner) {
        await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } });
        return;
      }

      const input = (args[0] || '').trim();
      const currentPrefix = prefixLib.getPrefix(settings.prefix || '.');
      const currentPrefixless = prefixLib.isPrefixless();

      if (!input) {
        await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
        await conn.sendMessage(chatId, {
          text:
            `PREFIX SETTINGS\n\n` +
            `Current prefix: ${currentPrefix}\n` +
            `Prefixless mode: ${currentPrefixless ? 'ON (works with or without prefix)' : 'OFF'}\n\n` +
            `Usage:\n` +
            `${currentPrefix}setprefix <symbol>   → e.g. ${currentPrefix}setprefix !\n` +
            `${currentPrefix}setprefix none        → respond with or without prefix\n` +
            `${currentPrefix}setprefix reset       → back to default "."\n\n` +
            `${settings.footer}`
        });
        return;
      }

      const lower = input.toLowerCase();

      if (lower === 'none' || lower === 'off') {
        prefixLib.setPrefixless(true);
        await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
        await conn.sendMessage(chatId, {
          text:
            `PREFIXLESS MODE ENABLED\n\n` +
            `Commands now work with or without "${currentPrefix}" in front.\n\n` +
            `${settings.footer}`
        });
        return;
      }

      if (lower === 'reset') {
        prefixLib.setPrefix(settings.prefix || '.');
        prefixLib.setPrefixless(false);
        await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
        await conn.sendMessage(chatId, {
          text:
            `PREFIX RESET\n\n` +
            `Prefix: ${settings.prefix || '.'}\n` +
            `Prefixless mode: OFF\n\n` +
            `${settings.footer}`
        });
        return;
      }

      if (input.length > 5 || /\s/.test(input)) {
        await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } });
        await conn.sendMessage(chatId, {
          text: `Prefix must be 1–5 characters with no spaces.\n\n${settings.footer}`
        });
        return;
      }

      const ok = prefixLib.setPrefix(input);
      if (!ok) {
        await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } });
        await conn.sendMessage(chatId, {
          text: `Failed to set prefix.\n\n${settings.footer}`
        });
        return;
      }

      prefixLib.setPrefixless(false);

      await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
      await conn.sendMessage(chatId, {
        text:
          `PREFIX CHANGED\n\n` +
          `New prefix: ${input}\n` +
          `Example: ${input}menu\n\n` +
          `${settings.footer}`
      });

    } catch (error) {
      console.log('[SETPREFIX] Error:', error.message);
      try { await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } }); } catch (e) {}
      try {
        await conn.sendMessage(chatId, { text: `Error: ${error.message}\n\n${settings.footer}` });
      } catch (e) {}
    }
  }
};

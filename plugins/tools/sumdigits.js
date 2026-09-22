/**
 * TYREX-KSH-MD - Sum of Digits
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'sumdigits',
  aliases: ["digitsum"],
  category: 'tools',
  description: 'Add up all digits of a number',
  usage: '.sumdigits <n>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const raw = (args[0] || '').replace(/[^0-9]/g, '');
      if (!raw) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}sumdigits <n>`);
      const sum = raw.split('').reduce((s, d) => s + parseInt(d), 0);
      await reply(conn, mek, chatId, `SUM OF DIGITS\n\n${raw} → ${sum}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

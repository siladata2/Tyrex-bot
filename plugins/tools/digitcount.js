/**
 * TYREX-KSH-MD - Digit Count
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'digitcount',
  aliases: ["countdigits"],
  category: 'tools',
  description: 'Count the number of digits in a number',
  usage: '.digitcount <n>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const raw = (args[0] || '').replace(/[^0-9]/g, '');
      if (!raw) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}digitcount <n>`);
      await reply(conn, mek, chatId, `DIGIT COUNT\n\n${raw} has ${raw.length} digit(s)`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

/**
 * TYREX-KSH-MD - Number Checker
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'numbercheck',
  aliases: ["isnumber"],
  category: 'tools',
  description: 'Check if a value is a valid number, and whether it\'s an integer',
  usage: '.numbercheck <value>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const raw = args[0];
      if (raw === undefined) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}numbercheck <value>`);
      const n = Number(raw);
      const valid = raw.trim() !== '' && !isNaN(n);
      if (!valid) { await reply(conn, mek, chatId, `NUMBER CHECK\n\n"${raw}" is NOT a valid number.`); return; }
      await reply(conn, mek, chatId, `NUMBER CHECK\n\n"${raw}" is a valid number.\nInteger: ${Number.isInteger(n) ? 'yes' : 'no'}\nPositive: ${n > 0 ? 'yes' : 'no'}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

/**
 * TYREX-KSH-MD - Days Between Dates
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'daysbetween',
  aliases: ["datediff"],
  category: 'tools',
  description: 'Calculate the number of days between two dates',
  usage: '.daysbetween <YYYY-MM-DD> <YYYY-MM-DD>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const a = args[0], b = args[1];
      if (!a || !b || !/^\d{4}-\d{2}-\d{2}$/.test(a) || !/^\d{4}-\d{2}-\d{2}$/.test(b)) {
        return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}daysbetween <YYYY-MM-DD> <YYYY-MM-DD>`);
      }
      const d1 = new Date(a + 'T00:00:00Z'), d2 = new Date(b + 'T00:00:00Z');
      if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return usageReply(conn, mek, chatId, `One of those dates is invalid.`);
      const diff = Math.round(Math.abs(d2 - d1) / 86400000);
      await reply(conn, mek, chatId, `DAYS BETWEEN\n\n${a} ↔ ${b}\n${diff} day(s)`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

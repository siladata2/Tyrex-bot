/**
 * TYREX-KSH-MD - Countdown to a Date
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'countdown',
  aliases: ["daysuntil"],
  category: 'tools',
  description: 'Count how many days remain until a future date',
  usage: '.countdown <YYYY-MM-DD>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const raw = args[0];
      if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}countdown <YYYY-MM-DD>`);
      const target = new Date(raw + 'T00:00:00Z');
      if (isNaN(target.getTime())) return usageReply(conn, mek, chatId, `That is not a valid date.`);
      const now = new Date();
      const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
      const diff = Math.round((target.getTime() - nowUTC) / 86400000);
      if (diff > 0) await reply(conn, mek, chatId, `COUNTDOWN\n\n${diff} day(s) until ${raw}`);
      else if (diff === 0) await reply(conn, mek, chatId, `COUNTDOWN\n\n${raw} is today!`);
      else await reply(conn, mek, chatId, `COUNTDOWN\n\n${raw} was ${Math.abs(diff)} day(s) ago.`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

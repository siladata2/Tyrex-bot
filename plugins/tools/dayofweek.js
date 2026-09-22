/**
 * TYREX-KSH-MD - Day of Week Finder
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'dayofweek',
  aliases: ["whatday"],
  category: 'tools',
  description: 'Find what day of the week a date falls on',
  usage: '.dayofweek <YYYY-MM-DD>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const raw = args[0];
      if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}dayofweek <YYYY-MM-DD>`);
      const d = new Date(raw + 'T00:00:00Z');
      if (isNaN(d.getTime())) return usageReply(conn, mek, chatId, `That is not a valid date.`);
      const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      await reply(conn, mek, chatId, `DAY OF WEEK\n\n${raw} is a ${DAYS[d.getUTCDay()]}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

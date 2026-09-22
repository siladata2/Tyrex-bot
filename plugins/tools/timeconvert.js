/**
 * TYREX-KSH-MD - Seconds to H:M:S
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'timeconvert',
  aliases: ["secondsconvert"],
  category: 'tools',
  description: 'Convert a number of seconds into hours/minutes/seconds',
  usage: '.timeconvert <seconds>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const total = parseInt(args[0]);
      if (isNaN(total) || total < 0) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}timeconvert <seconds>`);
      const h = Math.floor(total / 3600);
      const m = Math.floor((total % 3600) / 60);
      const s = total % 60;
      await reply(conn, mek, chatId, `TIME CONVERTER\n\n${total} seconds = ${h}h ${m}m ${s}s`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

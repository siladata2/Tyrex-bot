/**
 * TYREX-KSH-MD - Percentage Calculator
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'percentage',
  aliases: ["percentof"],
  category: 'tools',
  description: 'Calculate X% of Y',
  usage: '.percentage <X> <Y>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const x = parseFloat(args[0]);
      const y = parseFloat(args[1]);
      if (isNaN(x) || isNaN(y)) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}percentage <X> <Y>\nExample: ${settings.prefix || '.'}percentage 20 150  →  20% of 150`);
      const out = (x / 100) * y;
      await reply(conn, mek, chatId, `PERCENTAGE\n\n${x}% of ${y} = ${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

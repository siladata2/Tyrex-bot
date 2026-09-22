/**
 * TYREX-KSH-MD - Percentage Change
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'percentagechange',
  aliases: ["pctchange"],
  category: 'tools',
  description: 'Calculate the percentage change between two numbers',
  usage: '.percentagechange <old> <new>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const oldV = parseFloat(args[0]);
      const newV = parseFloat(args[1]);
      if (isNaN(oldV) || isNaN(newV)) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}percentagechange <old> <new>`);
      if (oldV === 0) return usageReply(conn, mek, chatId, `Old value can't be zero.`);
      const change = ((newV - oldV) / Math.abs(oldV)) * 100;
      const dir = change >= 0 ? 'increase' : 'decrease';
      await reply(conn, mek, chatId, `PERCENTAGE CHANGE\n\n${oldV} → ${newV}\n${Math.abs(change).toFixed(2)}% ${dir}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

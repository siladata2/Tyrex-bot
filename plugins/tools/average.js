/**
 * TYREX-KSH-MD - Average
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'average',
  aliases: ["mean"],
  category: 'tools',
  description: 'Calculate the average (mean) of a list of numbers',
  usage: '.average <n1> <n2> ...',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const nums = args.map(Number).filter(n => !isNaN(n));
      if (nums.length === 0) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}average <n1> <n2> <n3> ...`);
      const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
      await reply(conn, mek, chatId, `AVERAGE\n\nNumbers: ${nums.join(', ')}\nAverage: ${avg}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

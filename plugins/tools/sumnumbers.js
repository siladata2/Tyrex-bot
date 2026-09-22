/**
 * TYREX-KSH-MD - Sum Numbers
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'sumnumbers',
  aliases: ["sumnums", "addnumbers"],
  category: 'tools',
  description: 'Add up a list of numbers',
  usage: '.sumnumbers <n1> <n2> ...',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const nums = args.map(Number).filter(n => !isNaN(n));
      if (nums.length === 0) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}sumnumbers <n1> <n2> <n3> ...`);
      const total = nums.reduce((a, b) => a + b, 0);
      await reply(conn, mek, chatId, `SUM\n\nNumbers: ${nums.join(', ')}\nTotal: ${total}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

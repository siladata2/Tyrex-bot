/**
 * TYREX-KSH-MD - Square Root
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'squareroot',
  aliases: ["sqrt"],
  category: 'tools',
  description: 'Calculate the square root of a number',
  usage: '.squareroot <n>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const n = parseFloat(args[0]);
      if (isNaN(n) || n < 0) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}squareroot <n>  (n must be 0 or positive)`);
      await reply(conn, mek, chatId, `SQUARE ROOT\n\n√${n} = ${Math.sqrt(n)}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

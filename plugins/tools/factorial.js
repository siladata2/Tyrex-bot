/**
 * TYREX-KSH-MD - Factorial
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'factorial',
  aliases: ["fact_"],
  category: 'tools',
  description: 'Calculate the factorial of a number',
  usage: '.factorial <n>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const n = parseInt(args[0]);
      if (isNaN(n) || n < 0) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}factorial <n>  (n must be 0 or a positive integer)`);
      if (n > 170) return usageReply(conn, mek, chatId, `Number too large (max 170).`);
      let result = 1n;
      for (let i = 2; i <= n; i++) result *= BigInt(i);
      await reply(conn, mek, chatId, `FACTORIAL\n\n${n}! = ${result.toString()}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

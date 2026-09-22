/**
 * TYREX-KSH-MD - Fibonacci Sequence
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'fibonacci',
  aliases: ["fib"],
  category: 'tools',
  description: 'Generate the first N Fibonacci numbers',
  usage: '.fibonacci <n>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      let n = parseInt(args[0]);
      if (isNaN(n) || n < 1) n = 10;
      if (n > 50) n = 50;
      const seq = [0, 1];
      for (let i = 2; i < n; i++) seq.push(seq[i - 1] + seq[i - 2]);
      await reply(conn, mek, chatId, `FIBONACCI (first ${n})\n\n${seq.slice(0, n).join(', ')}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

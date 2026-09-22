/**
 * TYREX-KSH-MD - Prime Number Check
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'isprime',
  aliases: ["primecheck"],
  category: 'tools',
  description: 'Check whether a number is prime',
  usage: '.isprime <n>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const n = parseInt(args[0]);
      if (isNaN(n)) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}isprime <n>`);
      let prime = n > 1;
      for (let i = 2; i * i <= n; i++) { if (n % i === 0) { prime = false; break; } }
      await reply(conn, mek, chatId, `PRIME CHECK\n\n${n} is ${prime ? 'a PRIME number' : 'NOT a prime number'}.`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

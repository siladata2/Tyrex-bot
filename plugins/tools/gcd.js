/**
 * TYREX-KSH-MD - Greatest Common Divisor
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'gcd',
  aliases: ["hcf"],
  category: 'tools',
  description: 'Find the GCD of two numbers',
  usage: '.gcd <a> <b>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      let a = parseInt(args[0]), b = parseInt(args[1]);
      if (isNaN(a) || isNaN(b)) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}gcd <a> <b>`);
      a = Math.abs(a); b = Math.abs(b);
      let x = a, y = b;
      while (y) { [x, y] = [y, x % y]; }
      await reply(conn, mek, chatId, `GCD\n\nGCD(${a}, ${b}) = ${x}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

/**
 * TYREX-KSH-MD - Least Common Multiple
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'lcm',
  aliases: ["lcmcalc"],
  category: 'tools',
  description: 'Find the LCM of two numbers',
  usage: '.lcm <a> <b>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      let a = parseInt(args[0]), b = parseInt(args[1]);
      if (isNaN(a) || isNaN(b)) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}lcm <a> <b>`);
      a = Math.abs(a); b = Math.abs(b);
      let x = a, y = b;
      while (y) { [x, y] = [y, x % y]; }
      const gcd = x || 1;
      const lcm = (a * b) / gcd;
      await reply(conn, mek, chatId, `LCM\n\nLCM(${a}, ${b}) = ${lcm}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

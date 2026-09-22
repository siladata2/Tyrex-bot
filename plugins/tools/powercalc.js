/**
 * TYREX-KSH-MD - Power / Exponent
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'powercalc',
  aliases: ["power", "exponent"],
  category: 'tools',
  description: 'Calculate base raised to an exponent',
  usage: '.powercalc <base> <exponent>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const base = parseFloat(args[0]);
      const exp = parseFloat(args[1]);
      if (isNaN(base) || isNaN(exp)) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}powercalc <base> <exponent>`);
      const out = Math.pow(base, exp);
      await reply(conn, mek, chatId, `POWER\n\n${base} ^ ${exp} = ${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

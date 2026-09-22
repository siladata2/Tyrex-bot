/**
 * TYREX-KSH-MD - Integer to Roman Numeral
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'inttoroman',
  aliases: ["toroman"],
  category: 'tools',
  description: 'Convert an integer (1-3999) to a Roman numeral',
  usage: '.inttoroman <n>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const n = parseInt(args[0]);
      if (isNaN(n) || n < 1 || n > 3999) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}inttoroman <n>  (1 to 3999)`);
      const VALUES = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
      const SYMBOLS = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
      let num = n, out = '';
      for (let i = 0; i < VALUES.length; i++) {
        while (num >= VALUES[i]) { out += SYMBOLS[i]; num -= VALUES[i]; }
      }
      await reply(conn, mek, chatId, `INTEGER TO ROMAN\n\n${n} → ${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

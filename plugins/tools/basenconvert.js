/**
 * TYREX-KSH-MD - Number Base Converter
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'basenconvert',
  aliases: ["baseconvert"],
  category: 'tools',
  description: 'Convert a number between bases (2-36)',
  usage: '.basenconvert <number> <fromBase> <toBase>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const numStr = args[0];
      const fromBase = parseInt(args[1]);
      const toBase = parseInt(args[2]);
      if (!numStr || isNaN(fromBase) || isNaN(toBase) || fromBase < 2 || fromBase > 36 || toBase < 2 || toBase > 36) {
        return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}basenconvert <number> <fromBase> <toBase>\nExample: ${settings.prefix || '.'}basenconvert 255 10 16`);
      }
      const value = parseInt(numStr, fromBase);
      if (isNaN(value)) return usageReply(conn, mek, chatId, `"${numStr}" is not valid in base ${fromBase}.`);
      const out = value.toString(toBase);
      await reply(conn, mek, chatId, `BASE CONVERTER\n\n${numStr} (base ${fromBase}) = ${out} (base ${toBase})`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

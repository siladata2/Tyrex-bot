/**
 * TYREX-KSH-MD - Data Size Converter
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'datasizeconvert',
  aliases: ["dataconv"],
  category: 'tools',
  description: 'Convert between bytes, KB, MB, GB, TB',
  usage: '.datasizeconvert <value> <from> <to>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const FACTORS = { b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3, tb: 1024 ** 4 };
      const value = parseFloat(args[0]);
      const from = (args[1] || '').toLowerCase();
      const to = (args[2] || '').toLowerCase();
      if (isNaN(value) || !FACTORS[from] || !FACTORS[to]) {
        return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}datasizeconvert <value> <unit> <unit>\nUnits: b, kb, mb, gb, tb\nExample: ${settings.prefix || '.'}datasizeconvert 1500 mb gb`);
      }
      const out = (value * FACTORS[from]) / FACTORS[to];
      await reply(conn, mek, chatId, `DATA SIZE CONVERTER\n\n${value} ${from.toUpperCase()} = ${out.toFixed(4)} ${to.toUpperCase()}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

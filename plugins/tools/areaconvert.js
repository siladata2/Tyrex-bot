/**
 * TYREX-KSH-MD - Area Converter
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'areaconvert',
  aliases: ["areaconv"],
  category: 'tools',
  description: 'Convert between m2, km2, ha, acre, ft2, mi2',
  usage: '.areaconvert <value> <from> <to>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const FACTORS = { m2: 1, km2: 1000000, ha: 10000, acre: 4046.86, ft2: 0.092903, mi2: 2589988.11 };
      const value = parseFloat(args[0]);
      const from = (args[1] || '').toLowerCase();
      const to = (args[2] || '').toLowerCase();
      if (isNaN(value) || !FACTORS[from] || !FACTORS[to]) {
        return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}areaconvert <value> <unit> <unit>\nUnits: m2, km2, ha, acre, ft2, mi2\nExample: ${settings.prefix || '.'}areaconvert 5 ha acre`);
      }
      const out = (value * FACTORS[from]) / FACTORS[to];
      await reply(conn, mek, chatId, `AREA CONVERTER\n\n${value} ${from} = ${out.toFixed(4)} ${to}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

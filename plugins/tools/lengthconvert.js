/**
 * TYREX-KSH-MD - Length Converter
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'lengthconvert',
  aliases: ["lengthconv"],
  category: 'tools',
  description: 'Convert between m, km, cm, mm, mi, yd, ft, in',
  usage: '.lengthconvert <value> <from> <to>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const FACTORS = { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254 };
      const value = parseFloat(args[0]);
      const from = (args[1] || '').toLowerCase();
      const to = (args[2] || '').toLowerCase();
      if (isNaN(value) || !FACTORS[from] || !FACTORS[to]) {
        return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}lengthconvert <value> <unit> <unit>\nUnits: m, km, cm, mm, mi, yd, ft, in\nExample: ${settings.prefix || '.'}lengthconvert 5 km mi`);
      }
      const out = (value * FACTORS[from]) / FACTORS[to];
      await reply(conn, mek, chatId, `LENGTH CONVERTER\n\n${value} ${from} = ${out.toFixed(4)} ${to}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

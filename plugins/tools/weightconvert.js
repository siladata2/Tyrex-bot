/**
 * TYREX-KSH-MD - Weight Converter
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'weightconvert',
  aliases: ["weightconv"],
  category: 'tools',
  description: 'Convert between kg, g, mg, lb, oz, ton',
  usage: '.weightconvert <value> <from> <to>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const FACTORS = { kg: 1, g: 0.001, mg: 0.000001, lb: 0.453592, oz: 0.0283495, ton: 1000 };
      const value = parseFloat(args[0]);
      const from = (args[1] || '').toLowerCase();
      const to = (args[2] || '').toLowerCase();
      if (isNaN(value) || !FACTORS[from] || !FACTORS[to]) {
        return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}weightconvert <value> <unit> <unit>\nUnits: kg, g, mg, lb, oz, ton\nExample: ${settings.prefix || '.'}weightconvert 10 kg lb`);
      }
      const out = (value * FACTORS[from]) / FACTORS[to];
      await reply(conn, mek, chatId, `WEIGHT CONVERTER\n\n${value} ${from} = ${out.toFixed(4)} ${to}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

/**
 * TYREX-KSH-MD - Volume Converter
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'volumeconvert',
  aliases: ["volumeconv"],
  category: 'tools',
  description: 'Convert between l, ml, gal, qt, pt, cup, floz',
  usage: '.volumeconvert <value> <from> <to>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const FACTORS = { l: 1, ml: 0.001, gal: 3.78541, qt: 0.946353, pt: 0.473176, cup: 0.24, floz: 0.0295735 };
      const value = parseFloat(args[0]);
      const from = (args[1] || '').toLowerCase();
      const to = (args[2] || '').toLowerCase();
      if (isNaN(value) || !FACTORS[from] || !FACTORS[to]) {
        return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}volumeconvert <value> <unit> <unit>\nUnits: l, ml, gal, qt, pt, cup, floz\nExample: ${settings.prefix || '.'}volumeconvert 2 l gal`);
      }
      const out = (value * FACTORS[from]) / FACTORS[to];
      await reply(conn, mek, chatId, `VOLUME CONVERTER\n\n${value} ${from} = ${out.toFixed(4)} ${to}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

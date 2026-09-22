/**
 * TYREX-KSH-MD - Speed Converter
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'speedconvert',
  aliases: ["speedconv"],
  category: 'tools',
  description: 'Convert between km/h, mph, m/s, knot',
  usage: '.speedconvert <value> <from> <to>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const FACTORS = { kmh: 1, mph: 1.60934, ms: 3.6, knot: 1.852 };
      const value = parseFloat(args[0]);
      const from = (args[1] || '').toLowerCase();
      const to = (args[2] || '').toLowerCase();
      if (isNaN(value) || !FACTORS[from] || !FACTORS[to]) {
        return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}speedconvert <value> <unit> <unit>\nUnits: kmh, mph, ms, knot\nExample: ${settings.prefix || '.'}speedconvert 100 kmh mph`);
      }
      const out = (value * FACTORS[from]) / FACTORS[to];
      await reply(conn, mek, chatId, `SPEED CONVERTER\n\n${value} ${from} = ${out.toFixed(4)} ${to}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

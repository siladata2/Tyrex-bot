/**
 * TYREX-KSH-MD - Temperature Converter
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'tempconvert',
  aliases: ["temperature"],
  category: 'tools',
  description: 'Convert between Celsius, Fahrenheit and Kelvin',
  usage: '.tempconvert <value> <from> <to>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const value = parseFloat(args[0]);
      const from = (args[1] || '').toLowerCase();
      const to = (args[2] || '').toLowerCase();
      const units = ['c', 'f', 'k'];
      if (isNaN(value) || !units.includes(from) || !units.includes(to)) {
        return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}tempconvert <value> <c|f|k> <c|f|k>\nExample: ${settings.prefix || '.'}tempconvert 100 c f`);
      }
      let celsius;
      if (from === 'c') celsius = value;
      else if (from === 'f') celsius = (value - 32) * 5 / 9;
      else celsius = value - 273.15;
      let out;
      if (to === 'c') out = celsius;
      else if (to === 'f') out = celsius * 9 / 5 + 32;
      else out = celsius + 273.15;
      await reply(conn, mek, chatId, `TEMPERATURE CONVERTER\n\n${value}°${from.toUpperCase()} = ${out.toFixed(2)}°${to.toUpperCase()}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

/**
 * TYREX-KSH-MD - Angle Converter
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'angleconvert',
  aliases: ["angleconv"],
  category: 'tools',
  description: 'Convert between degrees and radians',
  usage: '.angleconvert <value> <deg|rad>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const value = parseFloat(args[0]);
      const unit = (args[1] || '').toLowerCase();
      if (isNaN(value) || !['deg', 'rad'].includes(unit)) {
        return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}angleconvert <value> <deg|rad>\nExample: ${settings.prefix || '.'}angleconvert 180 deg`);
      }
      if (unit === 'deg') {
        const rad = value * (Math.PI / 180);
        await reply(conn, mek, chatId, `ANGLE CONVERTER\n\n${value}° = ${rad.toFixed(6)} rad`);
      } else {
        const deg = value * (180 / Math.PI);
        await reply(conn, mek, chatId, `ANGLE CONVERTER\n\n${value} rad = ${deg.toFixed(6)}°`);
      }
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

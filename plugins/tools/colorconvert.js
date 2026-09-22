/**
 * TYREX-KSH-MD - Color Converter (HEX <-> RGB)
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'colorconvert',
  aliases: ["hextorgb"],
  category: 'tools',
  description: 'Convert a color between HEX and RGB',
  usage: '.colorconvert <#hex OR r,g,b>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args).trim();
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}colorconvert #ff0000  OR  ${settings.prefix || '.'}colorconvert 255,0,0`);
      if (input.startsWith('#') || /^[0-9a-fA-F]{6}$/.test(input)) {
        const hex = input.replace('#', '');
        if (!/^[0-9a-fA-F]{6}$/.test(hex)) return usageReply(conn, mek, chatId, `That is not a valid 6-digit hex color.`);
        const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
        await reply(conn, mek, chatId, `COLOR CONVERTER\n\n#${hex.toUpperCase()} = rgb(${r}, ${g}, ${b})`);
      } else if (/^\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}$/.test(input)) {
        const [r, g, b] = input.split(',').map(n => Math.min(255, Math.max(0, parseInt(n.trim()))));
        const hex = [r, g, b].map(n => n.toString(16).padStart(2, '0')).join('');
        await reply(conn, mek, chatId, `COLOR CONVERTER\n\nrgb(${r}, ${g}, ${b}) = #${hex.toUpperCase()}`);
      } else {
        await usageReply(conn, mek, chatId, `Give a hex color (#ff0000) or RGB (255,0,0).`);
      }
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

/**
 * TYREX-KSH-MD - URL Decode
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'urldecode',
  aliases: ["urldec"],
  category: 'tools',
  description: 'Decode a percent-encoded URL string',
  usage: '.urldecode <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}urldecode <text>`);
      const out = decodeURIComponent(input);
      await reply(conn, mek, chatId, `URL DECODE\n\nInput: ${input.slice(0, 300)}\nOutput: ${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

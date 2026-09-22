/**
 * TYREX-KSH-MD - URL Encode
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'urlencode',
  aliases: ["urlenc"],
  category: 'tools',
  description: 'Percent-encode text for use in a URL',
  usage: '.urlencode <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}urlencode <text>`);
      const out = encodeURIComponent(input);
      await reply(conn, mek, chatId, `URL ENCODE\n\nInput: ${input.slice(0, 300)}\nOutput: ${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

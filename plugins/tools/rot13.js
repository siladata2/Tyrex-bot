/**
 * TYREX-KSH-MD - ROT13 Cipher
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'rot13',
  aliases: ["rot13cipher"],
  category: 'tools',
  description: 'Encode/decode text with the ROT13 cipher (self-inverse)',
  usage: '.rot13 <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}rot13 <text>`);
      const out = input.replace(/[a-zA-Z]/g, c => {
        const base = c <= 'Z' ? 65 : 97;
        return String.fromCharCode((c.charCodeAt(0) - base + 13) % 26 + base);
      });
      await reply(conn, mek, chatId, `ROT13\n\nInput: ${input.slice(0, 300)}\nOutput: ${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

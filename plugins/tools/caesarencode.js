/**
 * TYREX-KSH-MD - Caesar Cipher Encode
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'caesarencode',
  aliases: ["caesarcipher"],
  category: 'tools',
  description: 'Shift letters by N positions (default 3)',
  usage: '.caesarencode <text> | <shift>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      let input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}caesarencode <text> | <shift>\nExample: ${settings.prefix || '.'}caesarencode hello | 4`);
      let shift = 3;
      if (input.includes('|')) {
        const parts = input.split('|');
        input = parts[0].trim();
        const n = parseInt(parts[1]);
        if (!isNaN(n)) shift = ((n % 26) + 26) % 26;
      }
      const out = input.replace(/[a-zA-Z]/g, c => {
        const base = c <= 'Z' ? 65 : 97;
        return String.fromCharCode((c.charCodeAt(0) - base + shift) % 26 + base);
      });
      await reply(conn, mek, chatId, `CAESAR ENCODE (shift ${shift})\n\nInput: ${input.slice(0, 300)}\nOutput: ${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

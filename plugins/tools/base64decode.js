/**
 * TYREX-KSH-MD - Base64 Decode
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'base64decode',
  aliases: ["b64decode", "frombase64"],
  category: 'tools',
  description: 'Decode a Base64 string back to text',
  usage: '.base64decode <base64>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}base64decode <base64>`);
      const out = Buffer.from(input, 'base64').toString('utf8');
      await reply(conn, mek, chatId, `BASE64 DECODE\n\nInput: ${input.slice(0, 300)}\nOutput: ${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

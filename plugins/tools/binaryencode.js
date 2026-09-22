/**
 * TYREX-KSH-MD - Text to Binary
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'binaryencode',
  aliases: ["tobinary", "text2binary"],
  category: 'tools',
  description: 'Convert text to binary (8-bit per character)',
  usage: '.binaryencode <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}binaryencode <text>`);
      const out = input.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
      await reply(conn, mek, chatId, `TEXT TO BINARY\n\nInput: ${input.slice(0, 200)}\nOutput: ${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

/**
 * TYREX-KSH-MD - Hex Encode
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'hexencode',
  aliases: ["tohex"],
  category: 'tools',
  description: 'Encode text to hexadecimal',
  usage: '.hexencode <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}hexencode <text>`);
      const out = Buffer.from(input, 'utf8').toString('hex');
      await reply(conn, mek, chatId, `HEX ENCODE\n\nInput: ${input.slice(0, 300)}\nOutput: ${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

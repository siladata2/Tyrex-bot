/**
 * TYREX-KSH-MD - Hex Decode
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'hexdecode',
  aliases: ["fromhex"],
  category: 'tools',
  description: 'Decode a hexadecimal string back to text',
  usage: '.hexdecode <hex>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args).replace(/\s+/g, '');
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}hexdecode <hex>`);
      if (!/^[0-9a-fA-F]+$/.test(input)) return usageReply(conn, mek, chatId, `That is not valid hex.`);
      const out = Buffer.from(input, 'hex').toString('utf8');
      await reply(conn, mek, chatId, `HEX DECODE\n\nInput: ${input.slice(0, 300)}\nOutput: ${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

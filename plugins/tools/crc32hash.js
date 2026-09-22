/**
 * TYREX-KSH-MD - CRC32 Hash
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'crc32hash',
  aliases: ["crc32"],
  category: 'tools',
  description: 'Generate a CRC32 checksum of text',
  usage: '.crc32hash <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}crc32hash <text>`);
      let crc = 0xFFFFFFFF;
      for (let i = 0; i < input.length; i++) {
        crc ^= input.charCodeAt(i);
        for (let j = 0; j < 8; j++) {
          crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
        }
      }
      const out = ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).padStart(8, '0');
      await reply(conn, mek, chatId, `CRC32 HASH\n\nInput: ${input.slice(0, 300)}\nHash: ${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

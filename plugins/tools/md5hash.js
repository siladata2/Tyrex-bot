/**
 * TYREX-KSH-MD - MD5 Hash
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'md5hash',
  aliases: ["md5"],
  category: 'tools',
  description: 'Generate an MD5 hash of text',
  usage: '.md5hash <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const crypto = require('crypto');
      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}md5hash <text>`);
      const out = crypto.createHash('md5').update(input, 'utf8').digest('hex');
      await reply(conn, mek, chatId, `MD5 HASH\n\nInput: ${input.slice(0, 300)}\nHash: ${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

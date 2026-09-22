/**
 * TYREX-KSH-MD - SHA256 Hash
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'sha256hash',
  aliases: ["sha256"],
  category: 'tools',
  description: 'Generate an SHA256 hash of text',
  usage: '.sha256hash <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const crypto = require('crypto');
      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}sha256hash <text>`);
      const out = crypto.createHash('sha256').update(input, 'utf8').digest('hex');
      await reply(conn, mek, chatId, `SHA256 HASH\n\nInput: ${input.slice(0, 300)}\nHash: ${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

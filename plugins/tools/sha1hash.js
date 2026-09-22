/**
 * TYREX-KSH-MD - SHA1 Hash
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'sha1hash',
  aliases: ["sha1"],
  category: 'tools',
  description: 'Generate an SHA1 hash of text',
  usage: '.sha1hash <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const crypto = require('crypto');
      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}sha1hash <text>`);
      const out = crypto.createHash('sha1').update(input, 'utf8').digest('hex');
      await reply(conn, mek, chatId, `SHA1 HASH\n\nInput: ${input.slice(0, 300)}\nHash: ${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

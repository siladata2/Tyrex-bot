/**
 * TYREX-KSH-MD - SHA512 Hash
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'sha512hash',
  aliases: ["sha512"],
  category: 'tools',
  description: 'Generate an SHA512 hash of text',
  usage: '.sha512hash <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const crypto = require('crypto');
      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}sha512hash <text>`);
      const out = crypto.createHash('sha512').update(input, 'utf8').digest('hex');
      await reply(conn, mek, chatId, `SHA512 HASH\n\nInput: ${input.slice(0, 300)}\nHash: ${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

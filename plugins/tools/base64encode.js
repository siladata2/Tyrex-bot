/**
 * TYREX-KSH-MD - Base64 Encode
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'base64encode',
  aliases: ["b64encode", "tobase64"],
  category: 'tools',
  description: 'Encode text to Base64',
  usage: '.base64encode <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}base64encode <text>`);
      const out = Buffer.from(input, 'utf8').toString('base64');
      await reply(conn, mek, chatId, `BASE64 ENCODE\n\nInput: ${input.slice(0, 300)}\nOutput: ${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

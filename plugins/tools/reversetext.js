/**
 * TYREX-KSH-MD - Reverse Text
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'reversetext',
  aliases: ["revtext"],
  category: 'tools',
  description: 'Reverse the characters of text',
  usage: '.reversetext <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}reversetext <text>`);
      const out = input.split('').reverse().join('');
      await reply(conn, mek, chatId, `REVERSE TEXT\n\n${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

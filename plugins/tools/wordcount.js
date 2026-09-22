/**
 * TYREX-KSH-MD - Word Count
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'wordcount',
  aliases: ["countwords"],
  category: 'tools',
  description: 'Count the number of words in text',
  usage: '.wordcount <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}wordcount <text>`);
      const count = input.trim().split(/\s+/).filter(Boolean).length;
      await reply(conn, mek, chatId, `WORD COUNT\n\n${count} word(s)`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

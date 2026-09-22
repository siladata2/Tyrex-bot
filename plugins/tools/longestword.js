/**
 * TYREX-KSH-MD - Longest Word
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'longestword',
  aliases: ["findlongestword"],
  category: 'tools',
  description: 'Find the longest word in text',
  usage: '.longestword <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}longestword <text>`);
      const words = input.trim().split(/\s+/).filter(Boolean);
      const longest = words.reduce((a, b) => b.length > a.length ? b : a, '');
      await reply(conn, mek, chatId, `LONGEST WORD\n\n"${longest}" (${longest.length} letters)`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

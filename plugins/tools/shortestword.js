/**
 * TYREX-KSH-MD - Shortest Word
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'shortestword',
  aliases: ["findshortestword"],
  category: 'tools',
  description: 'Find the shortest word in text',
  usage: '.shortestword <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}shortestword <text>`);
      const words = input.trim().split(/\s+/).filter(Boolean);
      const shortest = words.reduce((a, b) => b.length < a.length ? b : a, words[0] || '');
      await reply(conn, mek, chatId, `SHORTEST WORD\n\n"${shortest}" (${shortest.length} letters)`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

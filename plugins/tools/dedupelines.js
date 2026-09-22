/**
 * TYREX-KSH-MD - Deduplicate Lines
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'dedupelines',
  aliases: ["uniquelines"],
  category: 'tools',
  description: 'Remove duplicate lines, keep the first occurrence',
  usage: '.dedupelines <line1\\nline2...>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}dedupelines <text with lines>`);
      const seen = new Set();
      const out = input.split('\n').filter(l => {
        const key = l.trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).join('\n');
      await reply(conn, mek, chatId, `DEDUPLICATE LINES\n\n${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

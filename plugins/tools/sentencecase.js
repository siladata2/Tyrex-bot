/**
 * TYREX-KSH-MD - Sentence Case
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'sentencecase',
  aliases: ["tosentence"],
  category: 'tools',
  description: 'Capitalize only the first letter of each sentence',
  usage: '.sentencecase <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}sentencecase <text>`);
      const lower = input.toLowerCase();
      const out = lower.replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase());
      await reply(conn, mek, chatId, `SENTENCE CASE\n\n${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

/**
 * TYREX-KSH-MD - Average Word Length
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'avgwordlength',
  aliases: ["averagewordlength"],
  category: 'tools',
  description: 'Calculate the average word length in text',
  usage: '.avgwordlength <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}avgwordlength <text>`);
      const words = input.trim().split(/\s+/).filter(Boolean);
      const avg = words.length ? (words.reduce((s, w) => s + w.length, 0) / words.length) : 0;
      await reply(conn, mek, chatId, `AVERAGE WORD LENGTH\n\n${avg.toFixed(2)} characters per word (${words.length} words)`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

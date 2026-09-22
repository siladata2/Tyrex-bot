/**
 * TYREX-KSH-MD - Reverse Words
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'reversewords',
  aliases: ["revwords"],
  category: 'tools',
  description: 'Reverse the order of words in a sentence',
  usage: '.reversewords <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}reversewords <text>`);
      const out = input.trim().split(/\s+/).reverse().join(' ');
      await reply(conn, mek, chatId, `REVERSE WORDS\n\n${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

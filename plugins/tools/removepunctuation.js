/**
 * TYREX-KSH-MD - Remove Punctuation
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'removepunctuation',
  aliases: ["nopunct"],
  category: 'tools',
  description: 'Strip all punctuation from text',
  usage: '.removepunctuation <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}removepunctuation <text>`);
      const out = input.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()\[\]"'?<>!@\\|]/g, '');
      await reply(conn, mek, chatId, `REMOVE PUNCTUATION\n\n${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

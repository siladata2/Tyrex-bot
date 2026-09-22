/**
 * TYREX-KSH-MD - Vowel Count
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'vowelcount',
  aliases: ["countvowels"],
  category: 'tools',
  description: 'Count the vowels in text',
  usage: '.vowelcount <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}vowelcount <text>`);
      const count = (input.match(/[aeiouAEIOU]/g) || []).length;
      await reply(conn, mek, chatId, `VOWEL COUNT\n\n${count} vowel(s)`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

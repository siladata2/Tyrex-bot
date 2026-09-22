/**
 * TYREX-KSH-MD - Anagram Checker
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'anagramcheck',
  aliases: ["isanagram"],
  category: 'tools',
  description: 'Check if two words/phrases are anagrams of each other',
  usage: '.anagramcheck <text1> | <text2>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input || !input.includes('|')) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}anagramcheck <text1> | <text2>\nExample: ${settings.prefix || '.'}anagramcheck listen | silent`);
      const [a, b] = input.split('|').map(s => s.trim().toLowerCase().replace(/[^a-z0-9]/g, '').split('').sort().join(''));
      const same = a === b && a.length > 0;
      await reply(conn, mek, chatId, `ANAGRAM CHECK\n\nThese are ${same ? '' : 'NOT '}anagrams of each other.`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

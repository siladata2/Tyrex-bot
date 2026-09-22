/**
 * TYREX-KSH-MD - Palindrome Checker
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'palindromecheck',
  aliases: ["ispalindrome"],
  category: 'tools',
  description: 'Check if text reads the same forwards and backwards',
  usage: '.palindromecheck <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}palindromecheck <text>`);
      const clean = input.toLowerCase().replace(/[^a-z0-9]/g, '');
      const isPal = clean === clean.split('').reverse().join('');
      await reply(conn, mek, chatId, `PALINDROME CHECK\n\n"${input}" is ${isPal ? 'a PALINDROME' : 'NOT a palindrome'}.`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

/**
 * TYREX-KSH-MD - Number to Words
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'numbertowords',
  aliases: ["num2words"],
  category: 'tools',
  description: 'Spell out a number in English (0 - 999,999,999)',
  usage: '.numbertowords <n>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
        'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
      const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
      function chunk(n) {
        let s = '';
        if (n >= 100) { s += ONES[Math.floor(n / 100)] + ' hundred '; n %= 100; }
        if (n >= 20) { s += TENS[Math.floor(n / 10)] + ' '; n %= 10; }
        if (n > 0) s += ONES[n] + ' ';
        return s.trim();
      }
      const n = parseInt(args[0]);
      if (isNaN(n) || n < 0 || n > 999999999) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}numbertowords <n>  (0 to 999,999,999)`);
      if (n === 0) { await reply(conn, mek, chatId, `NUMBER TO WORDS\n\n0 → zero`); return; }
      let num = n, parts = [];
      const millions = Math.floor(num / 1000000); num %= 1000000;
      const thousands = Math.floor(num / 1000); num %= 1000;
      if (millions) parts.push(chunk(millions) + ' million');
      if (thousands) parts.push(chunk(thousands) + ' thousand');
      if (num) parts.push(chunk(num));
      await reply(conn, mek, chatId, `NUMBER TO WORDS\n\n${n} → ${parts.join(' ').trim()}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

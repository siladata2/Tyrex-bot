/**
 * TYREX-KSH-MD - Random Quote
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'randomquote',
  aliases: ["quote"],
  category: 'tools',
  description: 'Get a random inspirational quote',
  usage: '.randomquote',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const QUOTES = [
        "The only way to do great work is to love what you do. - Steve Jobs",
        "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
        "Believe you can and you're halfway there. - Theodore Roosevelt",
        "It always seems impossible until it's done. - Nelson Mandela",
        "Hard work beats talent when talent doesn't work hard. - Tim Notke",
        "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
        "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
        "Start where you are. Use what you have. Do what you can. - Arthur Ashe",
        "Small steps every day add up to big results. - Unknown",
        "Discipline is choosing between what you want now and what you want most. - Abraham Lincoln"
      ];
      const out = QUOTES[Math.floor(Math.random() * QUOTES.length)];
      await reply(conn, mek, chatId, `RANDOM QUOTE\n\n"${out}"`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

/**
 * TYREX-KSH-MD - Leap Year Check
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'leapyearcheck',
  aliases: ["isleapyear"],
  category: 'tools',
  description: 'Check whether a year is a leap year',
  usage: '.leapyearcheck <year>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const y = parseInt(args[0]);
      if (isNaN(y)) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}leapyearcheck <year>`);
      const isLeap = (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
      await reply(conn, mek, chatId, `LEAP YEAR CHECK\n\n${y} is ${isLeap ? 'a leap year' : 'NOT a leap year'}.`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

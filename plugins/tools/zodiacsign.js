/**
 * TYREX-KSH-MD - Zodiac Sign Finder
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'zodiacsign',
  aliases: ["zodiac"],
  category: 'tools',
  description: 'Find the western zodiac sign for a birth date (MM-DD)',
  usage: '.zodiacsign <MM-DD>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const raw = args[0];
      if (!raw || !/^\d{2}-\d{2}$/.test(raw)) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}zodiacsign <MM-DD>\nExample: ${settings.prefix || '.'}zodiacsign 04-21`);
      const [mm, dd] = raw.split('-').map(Number);
      const SIGNS = [
        [1,19,'Capricorn'],[2,18,'Aquarius'],[3,20,'Pisces'],[4,19,'Aries'],[5,20,'Taurus'],[6,20,'Gemini'],
        [7,22,'Cancer'],[8,22,'Leo'],[9,22,'Virgo'],[10,22,'Libra'],[11,21,'Scorpio'],[12,21,'Sagittarius'],[12,31,'Capricorn']
      ];
      let sign = 'Capricorn';
      for (const [month, day, name] of SIGNS) {
        if (mm < month || (mm === month && dd <= day)) { sign = name; break; }
      }
      await reply(conn, mek, chatId, `ZODIAC SIGN\n\n${raw} → ${sign}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

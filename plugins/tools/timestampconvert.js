/**
 * TYREX-KSH-MD - Unix Timestamp Converter
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'timestampconvert',
  aliases: ["unixtime"],
  category: 'tools',
  description: 'Convert a Unix timestamp to a readable date, or a date to a timestamp',
  usage: '.timestampconvert <timestamp OR YYYY-MM-DD HH:MM>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args).trim();
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}timestampconvert <unix timestamp>  OR  ${settings.prefix || '.'}timestampconvert <YYYY-MM-DD HH:MM>`);
      if (/^\d{10,13}$/.test(input)) {
        const ms = input.length === 13 ? parseInt(input) : parseInt(input) * 1000;
        const d = new Date(ms);
        if (isNaN(d.getTime())) return usageReply(conn, mek, chatId, `Invalid timestamp.`);
        await reply(conn, mek, chatId, `TIMESTAMP CONVERTER\n\n${input} → ${d.toISOString().replace('T', ' ').slice(0, 19)} UTC`);
      } else {
        const d = new Date(input.replace(' ', 'T') + 'Z');
        if (isNaN(d.getTime())) return usageReply(conn, mek, chatId, `Could not parse that date/time.`);
        await reply(conn, mek, chatId, `TIMESTAMP CONVERTER\n\n${input} → ${Math.floor(d.getTime() / 1000)} (unix seconds)`);
      }
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

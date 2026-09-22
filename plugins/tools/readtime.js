/**
 * TYREX-KSH-MD - Reading Time Estimate
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'readtime',
  aliases: ["readingtime"],
  category: 'tools',
  description: 'Estimate how long text takes to read (200 wpm)',
  usage: '.readtime <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}readtime <text>`);
      const words = input.trim().split(/\s+/).filter(Boolean).length;
      const minutes = words / 200;
      const label = minutes < 1 ? `${Math.ceil(minutes * 60)} sec` : `${minutes.toFixed(1)} min`;
      await reply(conn, mek, chatId, `READING TIME\n\n${words} words → approx. ${label} at 200 wpm`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

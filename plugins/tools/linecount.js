/**
 * TYREX-KSH-MD - Line Count
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'linecount',
  aliases: ["countlines"],
  category: 'tools',
  description: 'Count the number of lines in text',
  usage: '.linecount <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}linecount <text>`);
      const count = input.split('\n').length;
      await reply(conn, mek, chatId, `LINE COUNT\n\n${count} line(s)`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

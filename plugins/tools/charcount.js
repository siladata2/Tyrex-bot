/**
 * TYREX-KSH-MD - Character Count
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'charcount',
  aliases: ["countchars"],
  category: 'tools',
  description: 'Count characters, with and without spaces',
  usage: '.charcount <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}charcount <text>`);
      const withSpaces = input.length;
      const withoutSpaces = input.replace(/\s/g, '').length;
      await reply(conn, mek, chatId, `CHARACTER COUNT\n\nWith spaces: ${withSpaces}\nWithout spaces: ${withoutSpaces}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

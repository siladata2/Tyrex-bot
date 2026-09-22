/**
 * TYREX-KSH-MD - Lowercase
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'lowercase',
  aliases: ["lower"],
  category: 'tools',
  description: 'Convert text to lowercase',
  usage: '.lowercase <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}lowercase <text>`);
      await reply(conn, mek, chatId, `lowercase\n\n${input.toLowerCase()}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

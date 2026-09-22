/**
 * TYREX-KSH-MD - snake_case
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'snakecase',
  aliases: ["tosnake"],
  category: 'tools',
  description: 'Convert text to snake_case',
  usage: '.snakecase <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}snakecase <text>`);
      const out = input.trim().split(/[\s\-]+/).filter(Boolean).join('_').toLowerCase();
      await reply(conn, mek, chatId, `SNAKE_CASE\n\n${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

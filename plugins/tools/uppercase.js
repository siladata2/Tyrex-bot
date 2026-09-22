/**
 * TYREX-KSH-MD - Uppercase
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'uppercase',
  aliases: ["upper"],
  category: 'tools',
  description: 'Convert text to UPPERCASE',
  usage: '.uppercase <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}uppercase <text>`);
      await reply(conn, mek, chatId, `UPPERCASE\n\n${input.toUpperCase()}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

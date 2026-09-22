/**
 * TYREX-KSH-MD - kebab-case
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'kebabcase',
  aliases: ["tokebab"],
  category: 'tools',
  description: 'Convert text to kebab-case',
  usage: '.kebabcase <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}kebabcase <text>`);
      const out = input.trim().split(/[\s_]+/).filter(Boolean).join('-').toLowerCase();
      await reply(conn, mek, chatId, `KEBAB-CASE\n\n${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

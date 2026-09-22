/**
 * TYREX-KSH-MD - Remove Spaces
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'removespaces',
  aliases: ["nospaces"],
  category: 'tools',
  description: 'Strip all whitespace from text',
  usage: '.removespaces <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}removespaces <text>`);
      const out = input.replace(/\s+/g, '');
      await reply(conn, mek, chatId, `REMOVE SPACES\n\n${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

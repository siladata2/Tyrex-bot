/**
 * TYREX-KSH-MD - Title Case
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'titlecase',
  aliases: ["totitle"],
  category: 'tools',
  description: 'Capitalize the First Letter Of Each Word',
  usage: '.titlecase <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}titlecase <text>`);
      const out = input.toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase());
      await reply(conn, mek, chatId, `TITLE CASE\n\n${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

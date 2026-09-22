/**
 * TYREX-KSH-MD - PascalCase
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'pascalcase',
  aliases: ["topascal"],
  category: 'tools',
  description: 'Convert text to PascalCase',
  usage: '.pascalcase <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}pascalcase <text>`);
      const words = input.trim().split(/[\s_\-]+/).filter(Boolean);
      const out = words.map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join('');
      await reply(conn, mek, chatId, `PASCALCASE\n\n${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

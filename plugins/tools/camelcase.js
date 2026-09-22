/**
 * TYREX-KSH-MD - camelCase
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'camelcase',
  aliases: ["tocamel"],
  category: 'tools',
  description: 'Convert text to camelCase',
  usage: '.camelcase <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}camelcase <text>`);
      const words = input.trim().split(/[\s_\-]+/).filter(Boolean);
      const out = words.map((w, i) => i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()).join('');
      await reply(conn, mek, chatId, `CAMELCASE\n\n${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

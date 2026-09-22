/**
 * TYREX-KSH-MD - Slugify
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'slugify',
  aliases: ["makeslug"],
  category: 'tools',
  description: 'Convert text into a URL-friendly slug',
  usage: '.slugify <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}slugify <text>`);
      const out = input.toLowerCase().trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      await reply(conn, mek, chatId, `SLUGIFY\n\n${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

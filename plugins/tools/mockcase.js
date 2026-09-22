/**
 * TYREX-KSH-MD - Mocking Case
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'mockcase',
  aliases: ["spongebobcase"],
  category: 'tools',
  description: 'aLtErNaTiNg cApS, sPoNgEbOb sTyLe',
  usage: '.mockcase <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}mockcase <text>`);
      const out = input.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join('');
      await reply(conn, mek, chatId, `MOCKING CASE\n\n${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

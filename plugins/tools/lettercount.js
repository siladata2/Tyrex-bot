/**
 * TYREX-KSH-MD - Specific Letter Count
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'lettercount',
  aliases: ["countletter"],
  category: 'tools',
  description: 'Count how many times a letter appears in text',
  usage: '.lettercount <letter> | <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input || !input.includes('|')) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}lettercount <letter> | <text>\nExample: ${settings.prefix || '.'}lettercount a | banana`);
      const [letterPart, ...rest] = input.split('|');
      const letter = letterPart.trim().toLowerCase();
      const text = rest.join('|').trim();
      if (!letter) return usageReply(conn, mek, chatId, `Give a letter to count.`);
      const count = (text.toLowerCase().match(new RegExp(letter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      await reply(conn, mek, chatId, `LETTER COUNT\n\n"${letter}" appears ${count} time(s) in the text.`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

/**
 * TYREX-KSH-MD - Sentence Count
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'sentencecount',
  aliases: ["countsentences"],
  category: 'tools',
  description: 'Count the number of sentences in text',
  usage: '.sentencecount <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}sentencecount <text>`);
      const count = (input.match(/[^.!?]+[.!?]+/g) || [input]).filter(s => s.trim()).length;
      await reply(conn, mek, chatId, `SENTENCE COUNT\n\n${count} sentence(s)`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

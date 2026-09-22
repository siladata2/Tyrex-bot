/**
 * TYREX-KSH-MD - Consonant Count
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'consonantcount',
  aliases: ["countconsonants"],
  category: 'tools',
  description: 'Count the consonants in text',
  usage: '.consonantcount <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}consonantcount <text>`);
      const count = (input.match(/[b-df-hj-np-tv-zB-DF-HJ-NP-TV-Z]/g) || []).length;
      await reply(conn, mek, chatId, `CONSONANT COUNT\n\n${count} consonant(s)`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

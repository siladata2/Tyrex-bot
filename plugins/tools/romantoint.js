/**
 * TYREX-KSH-MD - Roman Numeral to Integer
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'romantoint',
  aliases: ["fromroman"],
  category: 'tools',
  description: 'Convert a Roman numeral to an integer',
  usage: '.romantoint <roman>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const raw = (args[0] || '').toUpperCase();
      if (!raw || !/^[IVXLCDM]+$/.test(raw)) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}romantoint <roman>\nExample: ${settings.prefix || '.'}romantoint MCMXCIV`);
      const MAP = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
      let total = 0;
      for (let i = 0; i < raw.length; i++) {
        const cur = MAP[raw[i]], next = MAP[raw[i + 1]];
        if (next && cur < next) total -= cur; else total += cur;
      }
      await reply(conn, mek, chatId, `ROMAN TO INTEGER\n\n${raw} → ${total}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

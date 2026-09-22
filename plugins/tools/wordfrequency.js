/**
 * TYREX-KSH-MD - Word Frequency
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'wordfrequency',
  aliases: ["wordfreq"],
  category: 'tools',
  description: 'Show how often each word appears in text',
  usage: '.wordfrequency <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}wordfrequency <text>`);
      const words = input.toLowerCase().replace(/[^\w\s]/g, '').trim().split(/\s+/).filter(Boolean);
      const freq = {};
      words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
      const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 15);
      const out = sorted.map(([w, c]) => `${w}: ${c}`).join('\n');
      await reply(conn, mek, chatId, `WORD FREQUENCY (top 15)\n\n${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

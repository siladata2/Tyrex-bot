/**
 * TYREX-KSH-MD - Text Diff
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'textdiff',
  aliases: ["comparetext"],
  category: 'tools',
  description: 'Compare two texts line by line and show differences',
  usage: '.textdiff <text1> | <text2>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input || !input.includes('|')) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}textdiff <text1> | <text2>`);
      const [aRaw, bRaw] = input.split('|');
      const a = aRaw.trim().split('\n');
      const b = bRaw.trim().split('\n');
      const max = Math.max(a.length, b.length);
      let diffs = [];
      for (let i = 0; i < max; i++) {
        const la = a[i] !== undefined ? a[i] : '(none)';
        const lb = b[i] !== undefined ? b[i] : '(none)';
        if (la !== lb) diffs.push(`Line ${i + 1}:\n- ${la}\n+ ${lb}`);
      }
      if (diffs.length === 0) { await reply(conn, mek, chatId, `TEXT DIFF\n\nThe two texts are identical.`); return; }
      await reply(conn, mek, chatId, `TEXT DIFF (${diffs.length} difference(s))\n\n${diffs.slice(0, 10).join('\n\n')}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

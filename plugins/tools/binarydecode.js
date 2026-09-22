/**
 * TYREX-KSH-MD - Binary to Text
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'binarydecode',
  aliases: ["frombinary", "binary2text"],
  category: 'tools',
  description: 'Convert space-separated binary back to text',
  usage: '.binarydecode <binary>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}binarydecode <binary>`);
      const parts = input.trim().split(/\s+/);
      if (!parts.every(p => /^[01]+$/.test(p))) return usageReply(conn, mek, chatId, `That is not valid space-separated binary.`);
      const out = parts.map(b => String.fromCharCode(parseInt(b, 2))).join('');
      await reply(conn, mek, chatId, `BINARY TO TEXT\n\nInput: ${input.slice(0, 300)}\nOutput: ${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

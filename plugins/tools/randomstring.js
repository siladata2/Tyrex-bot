/**
 * TYREX-KSH-MD - Random String Generator
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'randomstring',
  aliases: ["randstr"],
  category: 'tools',
  description: 'Generate a random alphanumeric string',
  usage: '.randomstring <length>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      let len = parseInt(args[0]);
      if (isNaN(len) || len < 1) len = 12;
      if (len > 256) len = 256;
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let out = '';
      for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
      await reply(conn, mek, chatId, `RANDOM STRING (${len} chars)\n\n${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

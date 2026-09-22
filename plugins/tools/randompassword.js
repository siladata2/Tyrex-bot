/**
 * TYREX-KSH-MD - Random Password Generator
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'randompassword',
  aliases: ["genpass", "randpass"],
  category: 'tools',
  description: 'Generate a strong random password',
  usage: '.randompassword <length>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      let len = parseInt(args[0]);
      if (isNaN(len) || len < 4) len = 16;
      if (len > 128) len = 128;
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+';
      let out = '';
      for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
      await reply(conn, mek, chatId, `RANDOM PASSWORD (${len} chars)\n\n${out}\n\nDon't reuse this anywhere sensitive without saving it in a password manager.`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

/**
 * TYREX-KSH-MD - UUID Generator
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'uuidgen',
  aliases: ["genuuid", "uuid"],
  category: 'tools',
  description: 'Generate a random UUID v4',
  usage: '.uuidgen',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const crypto = require('crypto');
      const out = crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      await reply(conn, mek, chatId, `UUID V4\n\n${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

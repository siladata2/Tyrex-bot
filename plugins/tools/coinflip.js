/**
 * TYREX-KSH-MD - Coin Flip
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'coinflip',
  aliases: ["flipcoin"],
  category: 'tools',
  description: 'Flip a coin — Heads or Tails',
  usage: '.coinflip',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const out = Math.random() < 0.5 ? 'Heads' : 'Tails';
      await reply(conn, mek, chatId, `COIN FLIP\n\n${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

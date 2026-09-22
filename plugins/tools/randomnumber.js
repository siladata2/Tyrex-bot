/**
 * TYREX-KSH-MD - Random Number Generator
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'randomnumber',
  aliases: ["randnum"],
  category: 'tools',
  description: 'Generate a random number in a range',
  usage: '.randomnumber <min> <max>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      let min = parseInt(args[0]);
      let max = parseInt(args[1]);
      if (isNaN(min) || isNaN(max)) { min = 1; max = 100; }
      if (min > max) { const t = min; min = max; max = t; }
      const out = Math.floor(Math.random() * (max - min + 1)) + min;
      await reply(conn, mek, chatId, `RANDOM NUMBER\n\nRange: ${min} - ${max}\nResult: ${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

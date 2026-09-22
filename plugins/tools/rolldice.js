/**
 * TYREX-KSH-MD - Dice Roller
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'rolldice',
  aliases: ["dice"],
  category: 'tools',
  description: 'Roll one or more dice (default 1 six-sided die)',
  usage: '.rolldice <count>d<sides>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      let count = 1, sides = 6;
      const m = (args[0] || '').match(/^(\d+)?d(\d+)$/i);
      if (m) {
        count = m[1] ? parseInt(m[1]) : 1;
        sides = parseInt(m[2]);
      }
      if (count < 1) count = 1;
      if (count > 20) count = 20;
      if (sides < 2) sides = 6;
      const rolls = [];
      for (let i = 0; i < count; i++) rolls.push(Math.floor(Math.random() * sides) + 1);
      const total = rolls.reduce((a, b) => a + b, 0);
      await reply(conn, mek, chatId, `DICE ROLL (${count}d${sides})\n\nRolls: ${rolls.join(', ')}\nTotal: ${total}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

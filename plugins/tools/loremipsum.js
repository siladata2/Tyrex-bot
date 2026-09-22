/**
 * TYREX-KSH-MD - Lorem Ipsum Generator
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'loremipsum',
  aliases: ["lorem"],
  category: 'tools',
  description: 'Generate placeholder Lorem Ipsum text',
  usage: '.loremipsum <paragraphs>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const WORDS = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat".split(' ');
      let n = parseInt(args[0]);
      if (isNaN(n) || n < 1) n = 1;
      if (n > 5) n = 5;
      const paras = [];
      for (let p = 0; p < n; p++) {
        let sentence = [];
        for (let i = 0; i < 30; i++) sentence.push(WORDS[Math.floor(Math.random() * WORDS.length)]);
        let text = sentence.join(' ');
        text = text[0].toUpperCase() + text.slice(1) + '.';
        paras.push(text);
      }
      await reply(conn, mek, chatId, `LOREM IPSUM\n\n${paras.join('\n\n')}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

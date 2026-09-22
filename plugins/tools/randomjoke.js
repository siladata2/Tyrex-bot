/**
 * TYREX-KSH-MD - Random Joke
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'randomjoke',
  aliases: ["joke"],
  category: 'tools',
  description: 'Get a random short joke',
  usage: '.randomjoke',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const JOKES = [
        "Why don't scientists trust atoms? Because they make up everything.",
        "I told my computer I needed a break, and it said no problem — it froze immediately.",
        "Why do programmers prefer dark mode? Because light attracts bugs.",
        "I would tell you a UDP joke, but you might not get it.",
        "Why did the developer go broke? Because he used up all his cache.",
        "There are 10 types of people: those who understand binary and those who don't.",
        "Why do Java developers wear glasses? Because they don't C#.",
        "A SQL query walks into a bar, walks up to two tables and asks: 'Can I join you?'",
        "My code doesn't work, I have no idea why. My code works, I have no idea why.",
        "Why was the JavaScript developer sad? Because he didn't Node how to Express himself."
      ];
      const out = JOKES[Math.floor(Math.random() * JOKES.length)];
      await reply(conn, mek, chatId, `RANDOM JOKE\n\n${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

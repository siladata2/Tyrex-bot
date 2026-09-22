/**
 * TYREX-KSH-MD - Random Fact
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'randomfact',
  aliases: ["fact"],
  category: 'tools',
  description: 'Get a random interesting fact',
  usage: '.randomfact',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const FACTS = [
        "Honey never spoils — archaeologists have found edible honey in ancient Egyptian tombs.",
        "A group of flamingos is called a 'flamboyance'.",
        "Octopuses have three hearts and blue blood.",
        "Bananas are berries, but strawberries aren't.",
        "The Eiffel Tower can grow more than 6 inches taller during the summer heat.",
        "A day on Venus is longer than a year on Venus.",
        "Sharks existed before trees.",
        "The shortest war in history lasted about 38 minutes (Britain vs Zanzibar, 1896).",
        "Wombat droppings are cube-shaped.",
        "Hot water can freeze faster than cold water under certain conditions (Mpemba effect)."
      ];
      const out = FACTS[Math.floor(Math.random() * FACTS.length)];
      await reply(conn, mek, chatId, `RANDOM FACT\n\n${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

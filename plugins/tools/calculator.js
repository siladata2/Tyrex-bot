/**
 * TYREX-KSH-MD - Calculator
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'calculator',
  aliases: ["calc", "math"],
  category: 'tools',
  description: 'Evaluate a basic math expression (+ - * / % parentheses)',
  usage: '.calculator <expression>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}calculator <expression>\nExample: ${settings.prefix || '.'}calculator (5 + 3) * 2`);
      if (!/^[0-9+\-*/%.()\s]+$/.test(input)) {
        return usageReply(conn, mek, chatId, `Only numbers and + - * / % ( ) are allowed.`);
      }
      let result;
      try { result = Function(`"use strict"; return (${input})`)(); }
      catch (e) { return usageReply(conn, mek, chatId, `That expression could not be evaluated.`); }
      if (typeof result !== 'number' || !isFinite(result)) return usageReply(conn, mek, chatId, `That expression did not produce a valid number.`);
      await reply(conn, mek, chatId, `CALCULATOR\n\n${input} = ${result}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

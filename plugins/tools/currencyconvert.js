/**
 * TYREX-KSH-MD - Currency Converter
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'currencyconvert',
  aliases: ["curconv", "fx"],
  category: 'tools',
  description: 'Convert between currencies using live exchange rates',
  usage: '.currencyconvert <amount> <from> <to>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const axios = require('axios');
      const amount = parseFloat(args[0]);
      const from = (args[1] || '').toUpperCase();
      const to = (args[2] || '').toUpperCase();
      if (isNaN(amount) || !from || !to) {
        return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}currencyconvert <amount> <from> <to>\nExample: ${settings.prefix || '.'}currencyconvert 100 USD KES`);
      }
      try {
        const res = await axios.get(`https://api.exchangerate-api.com/v4/latest/${from}`, { timeout: 15000 });
        const rate = res.data && res.data.rates ? res.data.rates[to] : null;
        if (!rate) return usageReply(conn, mek, chatId, `Could not find a rate for ${from} → ${to}.`);
        const out = amount * rate;
        await reply(conn, mek, chatId, `CURRENCY CONVERTER\n\n${amount} ${from} = ${out.toFixed(2)} ${to}\n(Rate: 1 ${from} = ${rate} ${to})`);
      } catch (e) {
        await usageReply(conn, mek, chatId, `Currency service is unreachable right now. Try again later.`);
      }
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

/**
 * TYREX-KSH-MD - Text to Morse Code
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'morseencode',
  aliases: ["tomorse"],
  category: 'tools',
  description: 'Convert text to morse code',
  usage: '.morseencode <text>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const MORSE = {a:'.-',b:'-...',c:'-.-.',d:'-..',e:'.',f:'..-.',g:'--.',h:'....',i:'..',j:'.---',
        k:'-.-',l:'.-..',m:'--',n:'-.',o:'---',p:'.--.',q:'--.-',r:'.-.',s:'...',t:'-',u:'..-',v:'...-',
        w:'.--',x:'-..-',y:'-.--',z:'--..','0':'-----','1':'.----','2':'..---','3':'...--','4':'....-',
        '5':'.....','6':'-....','7':'--...','8':'---..','9':'----.'};
      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}morseencode <text>`);
      const out = input.toLowerCase().split('').map(c => c === ' ' ? '/' : (MORSE[c] || c)).join(' ');
      await reply(conn, mek, chatId, `TEXT TO MORSE\n\nInput: ${input.slice(0, 200)}\nOutput: ${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

/**
 * TYREX-KSH-MD - Morse Code to Text
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'morsedecode',
  aliases: ["frommorse"],
  category: 'tools',
  description: 'Convert morse code back to text',
  usage: '.morsedecode <morse>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const MORSE_REV = {'.-':'a','-...':'b','-.-.':'c','-..':'d','.':'e','..-.':'f','--.':'g','....':'h',
        '..':'i','.---':'j','-.-':'k','.-..':'l','--':'m','-.':'n','---':'o','.--.':'p','--.-':'q',
        '.-.':'r','...':'s','-':'t','..-':'u','...-':'v','.--':'w','-..-':'x','-.--':'y','--..':'z',
        '-----':'0','.----':'1','..---':'2','...--':'3','....-':'4','.....':'5','-....':'6','--...':'7',
        '---..':'8','----.':'9'};
      const input = getText(mek, args);
      if (!input) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}morsedecode <morse>`);
      const out = input.trim().split(' ').map(t => t === '/' ? ' ' : (MORSE_REV[t] || t)).join('');
      await reply(conn, mek, chatId, `MORSE TO TEXT\n\nInput: ${input.slice(0, 300)}\nOutput: ${out}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

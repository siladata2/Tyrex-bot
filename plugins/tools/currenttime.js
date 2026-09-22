/**
 * TYREX-KSH-MD - Current Time
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'currenttime',
  aliases: ["nowtime", "timenow"],
  category: 'tools',
  description: 'Show the current UTC time and offset examples',
  usage: '.currenttime',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const now = new Date();
      await reply(conn, mek, chatId, `CURRENT TIME (UTC)\n\n${now.toISOString().replace('T', ' ').slice(0, 19)} UTC\nUnix: ${Math.floor(now.getTime() / 1000)}`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

/** TYREX_KSH-MD - converted from cat-13-search bundle (MEGA-BOT -> Tyrex). */
const settings = require('../../settings');
const { channelInfo } = require('../../lib/messageConfig');
function _rawText(mek){return (mek.message&&mek.message.conversation)||(mek.message&&mek.message.extendedTextMessage&&mek.message.extendedTextMessage.text)||(mek.message&&mek.message.imageMessage&&mek.message.imageMessage.caption)||(mek.message&&mek.message.videoMessage&&mek.message.videoMessage.caption)||'';}
const _plugin = (function () {
  const module = { exports: {} }; const exports = module.exports;
    const Qasim = require('api-qasim');

module.exports = {
  command: 'trends',
  aliases: ['trend', 'trending'],
  category: 'info',
  description: 'Get trending topics from a country.',
  usage: '.trends <country-name>',
  
  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    try {
      const country = args.join(' ').trim();

      if (!country) {
        await sock.sendMessage(chatId, {
          text: '*Please provide a country name.*\nExample: .trends Pakistan or .trends South-Africa'
        }, { quoted: message });
        return;
      }

      const result = await Qasim.trendtwit(country);

      if (!result) {
        throw new Error('No data received');
      }

      let output = `*Trending topics in ${country}:*\n\n`;

      if (typeof result === 'string') {
        output += result;
      } else if (result.result && Array.isArray(result.result) && result.result.length) {
        result.result.forEach((trend, i) => {
          if (trend.hastag && trend.tweet) {
            output += `${i + 1}. ${trend.hastag} - ${trend.tweet}\n`;
          }
        });
      } else {
        throw new Error('No trending data found');
      }

      await sock.sendMessage(chatId, {
        text: output
      }, { quoted: message });

    } catch (error) {
      console.error('Error in trendsCommand:', error);
      await sock.sendMessage(chatId, {
        text: '❌ Failed to fetch trending topics. Please try again later.'
      }, { quoted: message });
    }
  }
};

  return module.exports;
})();
const _list = Array.isArray(_plugin) ? _plugin : [_plugin];
module.exports = _list.filter(function (p) { return p && p.command && typeof p.handler === 'function'; }).map(function (p) {
  return {
    name: p.command,
    aliases: p.aliases || [],
    category: p.category || 'search',
    description: p.description || '',
    usage: p.usage || '',
    async execute(conn, mek, args, chatId, isOwner) {
      const context = { chatId, channelInfo, rawText: _rawText(mek), args, isOwner, prefix: settings.prefix || '.' };
      try { await p.handler(conn, mek, args, context); }
      catch (e) { console.error('[' + p.command + '] error:', e.message); try { await conn.sendMessage(chatId, { text: '⚠️ Error: ' + e.message, ...channelInfo }); } catch (_) {} }
    }
  };
});

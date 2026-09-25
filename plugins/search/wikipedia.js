/** TYREX_KSH-MD - converted from cat-13-search bundle (MEGA-BOT -> Tyrex). */
const settings = require('../../settings');
const { channelInfo } = require('../../lib/messageConfig');
function _rawText(mek){return (mek.message&&mek.message.conversation)||(mek.message&&mek.message.extendedTextMessage&&mek.message.extendedTextMessage.text)||(mek.message&&mek.message.imageMessage&&mek.message.imageMessage.caption)||(mek.message&&mek.message.videoMessage&&mek.message.videoMessage.caption)||'';}
const _plugin = (function () {
  const module = { exports: {} }; const exports = module.exports;
    const axios = require('axios');
const { channelInfo } = require('../../lib/messageConfig');

module.exports = {
  command: 'wiki',
  aliases: ['wikipedia'],
  category: 'search',
  description: 'Search Wikipedia for a topic!',
  usage: '.wiki <query>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const query = args.join(' ').trim();

    if (!query) {
      return await sock.sendMessage(chatId, {
        text: "*Enter what you want to search for on Wikipedia.*\nExample: .wiki Pakistan",
        ...channelInfo
      }, { quoted: message });
    }

    const formattedQuery = query.replace(/ /g, "_");

    try {
      const res = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(formattedQuery)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MEGA-BOT/1.0',
          'Accept-Language': 'en'
        }
      });

      const data = res.data;

      if (data.extract) {
        await sock.sendMessage(chatId, {
          text: `▢ *Wikipedia*\n\n‣ Search: ${data.title}\n\n${data.extract}\n\nRead more: ${data.content_urls.desktop.page}`,
          ...channelInfo
        }, { quoted: message });
      } else {
        await sock.sendMessage(chatId, {
          text: "⚠️ No results found.",
          ...channelInfo
        }, { quoted: message });
      }
    } catch (e) {
      console.error('Wikipedia plugin error:', e.message || e);
      await sock.sendMessage(chatId, {
        text: "⚠️ No results found or Wikipedia blocked the request.",
        ...channelInfo
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

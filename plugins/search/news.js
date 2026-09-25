/** TYREX_KSH-MD - converted from cat-13-search bundle (MEGA-BOT -> Tyrex). */
const settings = require('../../settings');
const { channelInfo } = require('../../lib/messageConfig');
function _rawText(mek){return (mek.message&&mek.message.conversation)||(mek.message&&mek.message.extendedTextMessage&&mek.message.extendedTextMessage.text)||(mek.message&&mek.message.imageMessage&&mek.message.imageMessage.caption)||(mek.message&&mek.message.videoMessage&&mek.message.videoMessage.caption)||'';}
const _plugin = (function () {
  const module = { exports: {} }; const exports = module.exports;
    const axios = require('axios');

module.exports = {
  command: 'news',
  aliases: ['headlines', 'latestnews'],
  category: 'info',
  description: 'Get the latest top 5 news headlines from the US',
  usage: '.news',
  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    try {
      const apiKey = 'dcd720a6f1914e2d9dba9790c188c08c';
      const response = await axios.get(`https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`);
      if (!response.data || !response.data.articles) throw 'Invalid API response';
      const articles = response.data.articles.slice(0, 5);
      if (articles.length === 0) {
        await sock.sendMessage(chatId, {
          text: '❌ No news found at the moment. Please try again later.',
          quoted: message
        });
        return;
      }
      let newsMessage = '📰 *Latest News*:\n\n';
      articles.forEach((article, index) => {
        newsMessage += `${index + 1}. *${article.title}*\n${article.description || 'No description'}\n\n`;
      });
      await sock.sendMessage(chatId, {
        text: newsMessage.trim(),
        quoted: message
      });
    } catch (error) {
      console.error('News Command Error:', error);
      await sock.sendMessage(chatId, {
        text: '❌ Sorry, I could not fetch news right now. Please try again later.',
        quoted: message
      });
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

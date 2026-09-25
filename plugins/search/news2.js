/** TYREX_KSH-MD - converted from cat-13-search bundle (MEGA-BOT -> Tyrex). */
const settings = require('../../settings');
const { channelInfo } = require('../../lib/messageConfig');
function _rawText(mek){return (mek.message&&mek.message.conversation)||(mek.message&&mek.message.extendedTextMessage&&mek.message.extendedTextMessage.text)||(mek.message&&mek.message.imageMessage&&mek.message.imageMessage.caption)||(mek.message&&mek.message.videoMessage&&mek.message.videoMessage.caption)||'';}
const _plugin = (function () {
  const module = { exports: {} }; const exports = module.exports;
    // plugins/news2.js
const axios = require('axios');

function formatNews(data, source) {
  let text = `📰 *${source} News* ──────────\n\n`;
  data.slice(0, 5).forEach((item, i) => {
    text += `${i+1}. *${item.title}*\n   🔗 ${item.link}\n\n`;
  });
  return text;
}

module.exports = [
  {
    command: 'antara',
    aliases: ['newsid2'],
    category: 'news2',
    description: 'Latest news from Antara (Indonesia)',
    usage: '.antara',

    async handler(sock, message, args, context) {
      const { chatId } = context;
      try {
        const { data } = await axios.get('https://api.deline.web.id/berita/antara', { timeout: 10000 });
        if (!data.status) throw new Error('No news');
        const text = formatNews(data.data, 'ANTARA');
        await sock.sendMessage(chatId, { text }, { quoted: message });
      } catch (err) {
        sock.sendMessage(chatId, { text: `❌ Failed to fetch news: ${err.message}` }, { quoted: message });
      }
    }
  },
  {
    command: 'cnbc',
    aliases: ['cnbcnews'],
    category: 'news',
    description: 'Latest news from CNBC Indonesia',
    usage: '.cnbc',

    async handler(sock, message, args, context) {
      const { chatId } = context;
      try {
        const { data } = await axios.get('https://api.deline.web.id/berita/cnbc', { timeout: 10000 });
        if (!data.status) throw new Error('No news');
        const text = formatNews(data.data, 'CNBC Indonesia');
        await sock.sendMessage(chatId, { text }, { quoted: message });
      } catch (err) {
        sock.sendMessage(chatId, { text: `❌ Failed to fetch news: ${err.message}` }, { quoted: message });
      }
    }
  }
];

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

/** TYREX_KSH-MD - converted from cat-13-search bundle (MEGA-BOT -> Tyrex). */
const settings = require('../../settings');
const { channelInfo } = require('../../lib/messageConfig');
function _rawText(mek){return (mek.message&&mek.message.conversation)||(mek.message&&mek.message.extendedTextMessage&&mek.message.extendedTextMessage.text)||(mek.message&&mek.message.imageMessage&&mek.message.imageMessage.caption)||(mek.message&&mek.message.videoMessage&&mek.message.videoMessage.caption)||'';}
const _plugin = (function () {
  const module = { exports: {} }; const exports = module.exports;
    const fetch = require('node-fetch');

module.exports = {
  command: 'imdb',
  aliases: [],
  category: 'info',
  description: 'Get detailed information about a movie or series from IMDB',
  usage: '.imdb <movie/series title>',
  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const text = args.join(' ').trim();

    if (!text) {
      await sock.sendMessage(chatId, { 
        text: '*Please provide a movie or series title.*\nExample: `.imdb Inception`', 
        quoted: message 
      });
      return;
    }
    try {
      const res = await fetch(`https://api.popcat.xyz/imdb?q=${encodeURIComponent(text)}`);
      if (!res.ok) throw new Error(`API request failed with status ${res.status}`);
      const json = await res.json();
      const ratings = (json.ratings || [])
        .map(r => `⭐ *${r.source}:* ${r.value}`)
        .join('\n') || 'No ratings available';

      const movieInfo = `
🎬 *${json.title || 'N/A'}* (${json.year || 'N/A'})
🎭 *Genres:* ${json.genres || 'N/A'}
📺 *Type:* ${json.type || 'N/A'}
📝 *Plot:* ${json.plot || 'N/A'}
⭐ *IMDB Rating:* ${json.rating || 'N/A'} (${json.votes || 'N/A'} votes)
🏆 *Awards:* ${json.awards || 'N/A'}
🎬 *Director:* ${json.director || 'N/A'}
✍️ *Writer:* ${json.writer || 'N/A'}
👨‍👩‍👧‍👦 *Actors:* ${json.actors || 'N/A'}
⏱️ *Runtime:* ${json.runtime || 'N/A'}
📅 *Released:* ${json.released || 'N/A'}
🌐 *Country:* ${json.country || 'N/A'}
🗣️ *Languages:* ${json.languages || 'N/A'}
💰 *Box Office:* ${json.boxoffice || 'N/A'}
💽 *DVD Release:* ${json.dvd || 'N/A'}
🏢 *Production:* ${json.production || 'N/A'}
🔗 *Website:* ${json.website || 'N/A'}

*Ratings:*
${ratings}
      `.trim();
      if (json.poster) {
        await sock.sendMessage(chatId, { 
          image: { url: json.poster }, 
          caption: movieInfo, 
          quoted: message 
        });
      } else {
        await sock.sendMessage(chatId, { text: movieInfo, quoted: message });
      }
    } catch (error) {
      console.error('IMDB Command Error:', error);
      await sock.sendMessage(chatId, { 
        text: '❌ Failed to fetch movie information. Please try again later.', 
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

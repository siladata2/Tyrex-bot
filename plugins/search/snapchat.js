/** TYREX_KSH-MD - converted from cat-13-search bundle (MEGA-BOT -> Tyrex). */
const settings = require('../../settings');
const { channelInfo } = require('../../lib/messageConfig');
function _rawText(mek){return (mek.message&&mek.message.conversation)||(mek.message&&mek.message.extendedTextMessage&&mek.message.extendedTextMessage.text)||(mek.message&&mek.message.imageMessage&&mek.message.imageMessage.caption)||(mek.message&&mek.message.videoMessage&&mek.message.videoMessage.caption)||'';}
const _plugin = (function () {
  const module = { exports: {} }; const exports = module.exports;
    
const axios = require('axios');

module.exports = {
  command: 'snapchat',
  aliases: ['scspot', 'snapdl'],
  category: 'download',
  description: 'Download media (video or image) from Snapchat Spotlight URL',
  usage: '.snapchat <Snapchat URL>',

  async handler(sock, message, args, context) {
    const { chatId, channelInfo, rawText } = context;
    
    const prefix = context.rawText.match(/^[.!#]/)?.[0] || '.';
    const commandPart = rawText.slice(prefix.length).trim();
    const parts = commandPart.split(/\s+/);
    const url = parts.slice(1).join(' ').trim();

    if (!url) {
      return await sock.sendMessage(chatId, { 
        text: 'Please provide a Snapchat Spotlight URL.\nExample: .snapchat https://www.snapchat.com/spotlight/...',
        ...channelInfo
      }, { quoted: message });
    }

    try {
      await sock.sendMessage(chatId, { 
        text: '⏳ Fetching Snapchat media...',
        ...channelInfo
      }, { quoted: message });

      const apiUrl = `https://discardapi.dpdns.org/api/dl/snapchat?apikey=guru&url=${encodeURIComponent(url)}`;
      
      console.log('Requesting URL:', apiUrl);
      console.log('Original URL:', url);
      
      const { data } = await axios.get(apiUrl, { 
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      console.log('Snapchat API Response:', JSON.stringify(data, null, 2));

      if (!data || data.status !== true || !data.result || !Array.isArray(data.result) || data.result.length === 0) {
        return await sock.sendMessage(chatId, { 
          text: '❌ No media found for this Snapchat Spotlight URL.',
          ...channelInfo
        }, { quoted: message });
      }

      for (let mediaItem of data.result) {
        if (mediaItem.video) {
          await sock.sendMessage(chatId, { 
            video: { url: mediaItem.video }, 
            caption: '📹 Snapchat Spotlight Video',
            ...channelInfo
          }, { quoted: message });
        }
        if (mediaItem.image) {
          await sock.sendMessage(chatId, { 
            image: { url: mediaItem.image }, 
            caption: '🖼 Snapchat Spotlight Image',
            ...channelInfo
          }, { quoted: message });
        }
      }

    } catch (error) {
      console.error('Snapchat plugin error:', error.message);
      
      await sock.sendMessage(chatId, { 
        text: `❌ Failed to fetch Snapchat media.\nError: ${error.message}`,
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

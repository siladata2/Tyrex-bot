/** TYREX_KSH-MD - converted from cat-13-search bundle (MEGA-BOT -> Tyrex). */
const settings = require('../../settings');
const { channelInfo } = require('../../lib/messageConfig');
function _rawText(mek){return (mek.message&&mek.message.conversation)||(mek.message&&mek.message.extendedTextMessage&&mek.message.extendedTextMessage.text)||(mek.message&&mek.message.imageMessage&&mek.message.imageMessage.caption)||(mek.message&&mek.message.videoMessage&&mek.message.videoMessage.caption)||'';}
const _plugin = (function () {
  const module = { exports: {} }; const exports = module.exports;
    const axios = require('axios');
const { channelInfo } = require('../../lib/messageConfig');

module.exports = {
  command: 'weather',
  aliases: ['climate'],
  category: 'info',
  description: 'Get the current weather for a specific city!',
  usage: '.weather <city>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const city = args.join(' ').trim();

    if (!city) {
      return await sock.sendMessage(chatId, {
        text: "*Please provide a place to search.*\nExample: .weather Karachi",
        ...channelInfo
      }, { quoted: message });
    }

    try {
      const apiKey = '060a6bcfa19809c2cd4d97a212b19273';
      const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`);
      const weather = response.data;

      const weatherText = 
        `ʜᴇʀᴇ ɪs ʏᴏᴜʀ ᴘʟᴀᴄᴇ ᴡᴇᴀᴛʜᴇʀ\n\n` +
        `「 🌅 」ᴘʟᴀᴄᴇ: ${weather.name}\n` +
        `「 🗺️ 」ᴄᴏᴜɴᴛʀʏ: ${weather.sys.country}\n` +
        `「 🌤️ 」ᴠɪᴇᴡ: ${weather.weather[0].description}\n` +
        `「 🌡️ 」ᴛᴇᴍᴘᴇʀᴀᴛᴜʀᴇ: ${weather.main.temp}°C\n` +
        `「 💠 」ᴍɪɴɪᴍᴜᴍ ᴛᴇᴍᴘᴇʀᴀᴛᴜʀᴇ: ${weather.main.temp_min}°C\n` +
        `「 🔥 」ᴍᴀxɪᴍᴜᴍ ᴛᴇᴍᴘᴇʀᴀᴛᴜʀᴇ: ${weather.main.temp_max}°C\n` +
        `「 💦 」ʜᴜᴍɪᴅɪᴛʏ: ${weather.main.humidity}%\n` +
        `「 🌬️ 」ᴡɪɴᴅ sᴘᴇᴇᴅ: ${weather.wind.speed} km/h`;

      await sock.sendMessage(chatId, {
        text: weatherText,
        ...channelInfo
      }, { quoted: message });

    } catch (error) {
      console.error('Weather plugin error:', error);
      await sock.sendMessage(chatId, {
        text: '❌ Sorry, I could not fetch the weather. Make sure the place name is correct.',
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

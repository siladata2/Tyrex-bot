/** TYREX_KSH-MD - converted from cat-13-search bundle (MEGA-BOT -> Tyrex). */
const settings = require('../../settings');
const { channelInfo } = require('../../lib/messageConfig');
function _rawText(mek){return (mek.message&&mek.message.conversation)||(mek.message&&mek.message.extendedTextMessage&&mek.message.extendedTextMessage.text)||(mek.message&&mek.message.imageMessage&&mek.message.imageMessage.caption)||(mek.message&&mek.message.videoMessage&&mek.message.videoMessage.caption)||'';}
const _plugin = (function () {
  const module = { exports: {} }; const exports = module.exports;
    // plugins/prayer.js
const axios = require('axios');

module.exports = {
  command: 'jadwalsholat',
  aliases: ['prayer', 'sholat'],
  category: 'info',
  description: 'Get daily prayer times for a city (pakistan)',
  usage: '.jadwalsholat <city> (default: Jakarta)',

  async handler(sock, message, args, context) {
    const { chatId } = context;
    let city = args.join(' ') || 'Jakarta';
    try {
      const url = `https://api.deline.web.id/info/jadwalsholat?kota=${encodeURIComponent(city)}`;
      const { data } = await axios.get(url, { timeout: 10000 });
      if (!data.status) throw new Error(data.error || 'City not found');
      const r = data.result;
      const text = `🕌 *Jadwal Sholat* – ${r.lokasi}\n📅 ${r.tanggal} (${r.hijri})\n\n` +
        `🕋 Imsak : ${r.waktu.Imsak}\n` +
        `🌅 Subuh : ${r.waktu.Fajr}\n` +
        `☀️ Dhuhr : ${r.waktu.Dhuhr}\n` +
        `🌇 Asr   : ${r.waktu.Asr}\n` +
        `🌙 Maghrib: ${r.waktu.Maghrib}\n` +
        `🌃 Isha  : ${r.waktu.Isha}\n`;
      await sock.sendMessage(chatId, { text }, { quoted: message });
    } catch (err) {
      sock.sendMessage(chatId, { text: `❌ Could not fetch prayer times: ${err.message}` }, { quoted: message });
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

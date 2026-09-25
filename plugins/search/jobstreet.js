/** TYREX_KSH-MD - converted from cat-13-search bundle (MEGA-BOT -> Tyrex). */
const settings = require('../../settings');
const { channelInfo } = require('../../lib/messageConfig');
function _rawText(mek){return (mek.message&&mek.message.conversation)||(mek.message&&mek.message.extendedTextMessage&&mek.message.extendedTextMessage.text)||(mek.message&&mek.message.imageMessage&&mek.message.imageMessage.caption)||(mek.message&&mek.message.videoMessage&&mek.message.videoMessage.caption)||'';}
const _plugin = (function () {
  const module = { exports: {} }; const exports = module.exports;
    const axios = require('axios');

module.exports = {
    command: 'jobstreet',
    aliases: ['jobs'],
    category: 'search',
    description: 'Search jobs on JobStreet',
    usage: '.jobstreet <job title> [city]',
    async handler(sock, message, args, context) {
        const { chatId, channelInfo } = context;
        let city = 'Jakarta';
        let query = args.join(' ');
        if (args.length > 1 && args[args.length-1].match(/^[A-Z]/)) {
            city = args.pop();
            query = args.join(' ');
        }
        if (!query) return sock.sendMessage(chatId, { text: 'Provide job title.' }, { quoted: message });
        const statusMsg = await sock.sendMessage(chatId, { text: '⏳ Searching jobs...' }, { quoted: message });
        try {
            const { data } = await axios.get(`https://api.deline.web.id/search/jobstreet?q=${encodeURIComponent(query)}&city=${encodeURIComponent(city)}`, { timeout: 20000 });
            if (!data.status || !data.result.length) throw new Error('No jobs found');
            let reply = `💼 *JobStreet: ${query} in ${city}*\n━━━━━━━━━━━━━━━━━━━\n`;
            data.result.slice(0, 5).forEach((job, i) => {
                reply += `\n${i+1}. *${job.judul}*\n🏢 ${job.perusahaan}\n📍 ${job.lokasi}\n💰 ${job.gaji}\n🔗 ${job.link}\n`;
            });
            await sock.sendMessage(chatId, { text: reply, ...channelInfo }, { quoted: message });
            await sock.sendMessage(chatId, { delete: statusMsg.key });
        } catch (err) {
            await sock.sendMessage(chatId, { text: `❌ ${err.message}` }, { quoted: message });
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

/** TYREX_KSH-MD - converted from cat-13-search bundle (MEGA-BOT -> Tyrex). */
const settings = require('../../settings');
const { channelInfo } = require('../../lib/messageConfig');
function _rawText(mek){return (mek.message&&mek.message.conversation)||(mek.message&&mek.message.extendedTextMessage&&mek.message.extendedTextMessage.text)||(mek.message&&mek.message.imageMessage&&mek.message.imageMessage.caption)||(mek.message&&mek.message.videoMessage&&mek.message.videoMessage.caption)||'';}
const _plugin = (function () {
  const module = { exports: {} }; const exports = module.exports;
    const fetch = require('node-fetch');

module.exports = {
  command: 'pokedex',
  aliases: ['pokemon', 'poke'],
  category: 'info',
  description: 'Get information about a Pokémon',
  usage: '.pokedex <pokemon name>',
  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const text = args.join(' ').trim();
    if (!text) {
      return await sock.sendMessage(chatId, {
        text: '*Please provide a Pokémon name to search for.*\nExample: `.pokedex pikachu`'
      }, { quoted: message });
    }

    try {
      const url = `https://some-random-api.com/pokemon/pokedex?pokemon=${encodeURIComponent(text)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw json.error || 'Unknown error';

      const messageText = `
*≡ Name:* ${json.name}
*≡ ID:* ${json.id}
*≡ Type:* ${Array.isArray(json.type) ? json.type.join(', ') : json.type}
*≡ Abilities:* ${Array.isArray(json.abilities) ? json.abilities.join(', ') : json.abilities}
*≡ Species:* ${Array.isArray(json.species) ? json.species.join(', ') : json.species}
*≡ Height:* ${json.height}
*≡ Weight:* ${json.weight}
*≡ Experience:* ${json.base_experience}
*≡ Description:* ${json.description}
      `.trim();
      await sock.sendMessage(chatId, { text: messageText, quoted: message });
    } catch (error) {
      console.error('Pokedex Command Error:', error);
      await sock.sendMessage(chatId, { text: `❌ Error: ${error}` }, { quoted: message });
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

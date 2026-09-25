/** TYREX_KSH-MD - converted from cat-13-search bundle (MEGA-BOT -> Tyrex). */
const settings = require('../../settings');
const { channelInfo } = require('../../lib/messageConfig');
function _rawText(mek){return (mek.message&&mek.message.conversation)||(mek.message&&mek.message.extendedTextMessage&&mek.message.extendedTextMessage.text)||(mek.message&&mek.message.imageMessage&&mek.message.imageMessage.caption)||(mek.message&&mek.message.videoMessage&&mek.message.videoMessage.caption)||'';}
const _plugin = (function () {
  const module = { exports: {} }; const exports = module.exports;
    // commands/npm.js
const axios = require('axios');

module.exports = {
    command: 'npm',
    aliases: ['npmpkg'],
    category: 'search',
    description: 'Search for NPM packages',
    usage: '.npm <package name>',

    async handler(sock, message, args, context) {
        const { chatId, channelInfo } = context;
        const query = args.join(' ').trim();

        if (!query) {
            return sock.sendMessage(chatId, {
                text: '📦 *NPM Package Search*\n\nEnter a package name.\nExample: `.npm axios`',
                ...channelInfo
            }, { quoted: message });
        }

        const statusMsg = await sock.sendMessage(chatId, {
            text: `🔍 Searching NPM for "${query}"...`,
            ...channelInfo
        }, { quoted: message });

        try {
            const apiUrl = `https://api.deline.web.id/search/npm?q=${encodeURIComponent(query)}`;
            const { data } = await axios.get(apiUrl, { timeout: 20000 });

            if (!data.status || !data.result || data.result.length === 0) {
                throw new Error('No packages found');
            }

            let reply = `📦 *NPM Search: "${query}"*\n━━━━━━━━━━━━━━━━━━━\n`;
            data.result.slice(0, 5).forEach((pkg, i) => {
                reply += `\n${i+1}. *${pkg.name}* v${pkg.version}\n`;
                reply += `   📝 ${pkg.description?.substring(0, 100) || 'No description'}\n`;
                if (pkg.links?.npm) reply += `   🔗 ${pkg.links.npm}\n`;
            });
            reply += `\n━━━━━━━━━━━━━━━━━━━\n_Results from npm registry_`;

            await sock.sendMessage(chatId, {
                text: reply,
                ...channelInfo
            }, { quoted: message });

            await sock.sendMessage(chatId, { delete: statusMsg.key });
        } catch (error) {
            console.error('[NPM]', error.message);
            await sock.sendMessage(chatId, {
                text: `❌ Search failed: ${error.message}`,
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

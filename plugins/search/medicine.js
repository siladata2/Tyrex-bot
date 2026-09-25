/** TYREX_KSH-MD - converted from cat-13-search bundle (MEGA-BOT -> Tyrex). */
const settings = require('../../settings');
const { channelInfo } = require('../../lib/messageConfig');
function _rawText(mek){return (mek.message&&mek.message.conversation)||(mek.message&&mek.message.extendedTextMessage&&mek.message.extendedTextMessage.text)||(mek.message&&mek.message.imageMessage&&mek.message.imageMessage.caption)||(mek.message&&mek.message.videoMessage&&mek.message.videoMessage.caption)||'';}
const _plugin = (function () {
  const module = { exports: {} }; const exports = module.exports;
/* Powerd By TYREX_KSH TECH */

const axios = require('axios');

module.exports = {
    command: 'medicine',
    aliases: ['drug', 'medinfo', 'druginfo', 'med'],
    category: 'info',
    description: 'Get medicine/drug info: uses, side effects, warnings',
    usage: '.medicine aspirin\n.medicine paracetamol',

    async handler(sock, message, args, context = {}) {
        const chatId = context.chatId || message.key.remoteJid;
        const channelInfo = context.channelInfo || {};
        const query = args.join(' ').trim();

        if (!query) {
            return await sock.sendMessage(chatId, {
                text: `💊 *Medicine Info*\n\n` +
                      `*Usage:* \`.medicine <name>\`\n\n` +
                      `*Examples:*\n` +
                      `• \`.medicine aspirin\`\n` +
                      `• \`.medicine paracetamol\`\n` +
                      `• \`.medicine amoxicillin\`\n` +
                      `• \`.medicine ibuprofen\`\n` +
                      `• \`.medicine metformin\`\n\n` +
                      `⚠️ _Information is from FDA database. Always consult a doctor._`,
                ...channelInfo
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, { text: `🔍 Looking up *${query}*...`, ...channelInfo }, { quoted: message });

        try {
            const res = await axios.get(
                `https://api.fda.gov/drug/label.json?search=${encodeURIComponent(query)}&limit=1`,
                { timeout: 15000 }
            );

            const result = res.data.results?.[0];
            if (!result) {
                return await sock.sendMessage(chatId, {
                    text: `❌ No information found for: *${query}*\n\nTry the generic name (e.g. paracetamol instead of Panadol)`,
                    ...channelInfo
                }, { quoted: message });
            }

            const openfda = result.openfda || {};
            const brandName = openfda.brand_name?.[0] || query;
            const genericName = openfda.generic_name?.[0] || 'N/A';
            const manufacturer = openfda.manufacturer_name?.[0] || 'N/A';
            const route = openfda.route?.[0] || 'N/A';
            const substanceName = openfda.substance_name?.[0] || 'N/A';

            const clean = (text, maxLen = 400) => {
                if (!text) return 'N/A';
                const str = Array.isArray(text) ? text[0] : text;
                const cleaned = str.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
                return cleaned.length > maxLen ? cleaned.substring(0, maxLen) + '...' : cleaned;
            };

            const purpose     = clean(result.purpose, 300);
            const indications = clean(result.indications_and_usage, 400);
            const warnings    = clean(result.warnings, 400);
            const sideEffects = clean(result.adverse_reactions, 400);
            const dosage      = clean(result.dosage_and_administration, 300);
            const storage     = clean(result.storage_and_handling, 200);

            let text = `💊 *${brandName}*\n`;
            if (genericName !== 'N/A') text += `_(${genericName})_\n`;
            text += `\n`;
            if (substanceName !== 'N/A') text += `🧪 *Active Substance:* ${substanceName}\n`;
            text += `🏭 *Manufacturer:* ${manufacturer}\n`;
            text += `💉 *Route:* ${route}\n\n`;
            if (purpose !== 'N/A') text += `🎯 *Purpose:*\n${purpose}\n\n`;
            if (indications !== 'N/A') text += `✅ *Uses:*\n${indications}\n\n`;
            if (dosage !== 'N/A') text += `📏 *Dosage:*\n${dosage}\n\n`;
            if (warnings !== 'N/A') text += `⚠️ *Warnings:*\n${warnings}\n\n`;
            if (sideEffects !== 'N/A') text += `🔴 *Side Effects:*\n${sideEffects}\n\n`;
            if (storage !== 'N/A') text += `📦 *Storage:* ${storage}\n\n`;
            text += `⚕️ _Always consult a qualified doctor before taking any medication._`;

            await sock.sendMessage(chatId, { text, ...channelInfo }, { quoted: message });

        } catch (error) {
            if (error.response?.status === 404) {
                return await sock.sendMessage(chatId, {
                    text: `❌ Medicine not found: *${query}*\n\nTry using the generic/scientific name.`,
                    ...channelInfo
                }, { quoted: message });
            }
            await sock.sendMessage(chatId, {
                text: `❌ Failed: ${error.message}`,
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

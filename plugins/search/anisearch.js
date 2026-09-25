/** TYREX_KSH-MD - converted from cat-13-search bundle (MEGA-BOT -> Tyrex). */
const settings = require('../../settings');
const { channelInfo } = require('../../lib/messageConfig');
function _rawText(mek){return (mek.message&&mek.message.conversation)||(mek.message&&mek.message.extendedTextMessage&&mek.message.extendedTextMessage.text)||(mek.message&&mek.message.imageMessage&&mek.message.imageMessage.caption)||(mek.message&&mek.message.videoMessage&&mek.message.videoMessage.caption)||'';}
const _plugin = (function () {
  const module = { exports: {} }; const exports = module.exports;
/* Powerd By TYREX_KSH TECH */

'use strict';

const axios = require('axios');
const { generateWAMessageFromContent, generateWAMessageContent } = require('@whiskeysockets/baileys');

/* ─── config ────────────────────────────────────────────────────────────── */
const JIKAN_BASE = 'https://api.jikan.moe/v4';
const MAL_LINK   = 'https://myanimelist.net/anime/';

/* ─── fetch anime ───────────────────────────────────────────────────────── */
async function searchAnime(query) {
    const res = await axios.get(`${JIKAN_BASE}/anime`, {
        params: { q: query, limit: 10, sfw: true, order_by: 'score', sort: 'desc' },
        timeout: 10000
    });
    return (res.data?.data || []).filter(a => a.images?.jpg?.large_image_url);
}

/* ─── helpers ───────────────────────────────────────────────────────────── */
function starRating(score) {
    if (!score) return '☆☆☆☆☆';
    const stars = Math.round((score / 10) * 5);
    return '⭐'.repeat(Math.max(0, stars)) + '☆'.repeat(Math.max(0, 5 - stars));
}

function formatStatus(status) {
    const map = {
        'Finished Airing':   '✅ Finished',
        'Currently Airing':  '📡 Airing',
        'Not yet aired':     '🔜 Upcoming'
    };
    return map[status] || status || 'N/A';
}

function trimSynopsis(text, max = 150) {
    if (!text) return 'No synopsis available.';
    return text.length > max ? text.substring(0, max).trimEnd() + '…' : text;
}

/* ─── build carousel ────────────────────────────────────────────────────── */
async function buildAnimeCarousel(sock, chatId, animes, query) {
    const cards = [];

    for (const anime of animes.slice(0, 8)) {
        try {
            const posterUrl = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;
            const imgContent = await generateWAMessageContent(
                { image: { url: posterUrl } },
                { upload: sock.waUploadToServer }
            );
            if (!imgContent?.imageMessage) continue;

            const score      = anime.score || 0;
            const episodes   = anime.episodes ? `${anime.episodes} eps` : '? eps';
            const genres     = (anime.genres || []).slice(0, 3).map(g => g.name).join(' · ') || 'N/A';
            const year       = anime.year || anime.aired?.from?.split('-')[0] || 'N/A';
            const type       = anime.type || 'N/A';
            const malId      = anime.mal_id;

            cards.push({
                header: {
                    title:              `${anime.title}`.substring(0, 60),
                    hasMediaAttachment: true,
                    imageMessage:       imgContent.imageMessage
                },
                body: {
                    text: `${starRating(score)} ${score}/10\n` +
                          `📺 ${type} · ${episodes} · ${year}\n` +
                          `${formatStatus(anime.status)}\n` +
                          `🎭 ${genres}\n\n` +
                          trimSynopsis(anime.synopsis)
                },
                footer: { text: '🌸 TYREX_KSH MD Anime Search' },
                nativeFlowMessage: {
                    buttons: [
                        {
                            name:             'cta_url',
                            buttonParamsJson: JSON.stringify({
                                display_text: '🔗 View on MAL',
                                url:          `${MAL_LINK}${malId}`,
                                merchant_url: `${MAL_LINK}${malId}`
                            })
                        }
                    ]
                }
            });
        } catch { continue; }
    }

    if (!cards.length) throw new Error('No cards built');

    const msg = generateWAMessageFromContent(chatId, {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    body:            { text: `🌸 *Anime Search:* ${query}\n✨ ${cards.length} results found` },
                    footer:          { text: 'Swipe ◀️▶️ • Powered by Jikan/MAL' },
                    carouselMessage: { cards }
                }
            }
        }
    }, {});

    await sock.relayMessage(chatId, msg.message, { messageId: msg.key.id });
    return cards.length;
}

/* ─── fallback text list ─────────────────────────────────────────────────── */
async function sendFallbackList(sock, chatId, animes, query, message) {
    const lines = animes.slice(0, 6).map((a, i) =>
        `${i + 1}. *${a.title}* (${a.year || 'N/A'})\n` +
        `   ⭐ ${a.score || '?'}/10 · ${a.type || 'N/A'} · ${a.episodes || '?'} eps\n` +
        `   ${trimSynopsis(a.synopsis, 80)}\n` +
        `   🔗 ${MAL_LINK}${a.mal_id}`
    ).join('\n\n');

    await sock.sendMessage(chatId, {
        text: `🌸 *Anime Search: "${query}"*\n\n${lines}\n\n_Powered by Jikan · MyAnimeList_`
    }, { quoted: message });
}

/* ─── command export ────────────────────────────────────────────────────── */
module.exports = {
    command:     'anisearch',
    aliases: ['anime', 'anim', 'animes', 'mal'],
    category:    'search',
    description: 'Search anime with sliding carousel (Jikan/MAL, no API key needed)',
    usage:       '.anisearch <title>',

    async handler(sock, message, args, context = {}) {
        const chatId = context.chatId || message.key.remoteJid;
        const query  = args.join(' ').trim();

        if (!query) {
            return sock.sendMessage(chatId, {
                text: `*🌸 ANIME SEARCH v1.0*\n\n` +
                      `Usage: \`.anisearch <title>\`\n\n` +
                      `Examples:\n` +
                      `• \`.anisearch Naruto\`\n` +
                      `• \`.anisearch Attack on Titan\`\n` +
                      `• \`.anisearch Death Note\`\n` +
                      `• \`.anisearch One Piece\`\n\n` +
                      `_No API key needed — powered by Jikan/MyAnimeList_`
            }, { quoted: message });
        }

        const react = (e) => sock.sendMessage(chatId, { react: { text: e, key: message.key } }).catch(() => {});
        await react('🔍');

        const waitMsg = await sock.sendMessage(chatId,
            { text: `🌸 Searching anime for *"${query}"*…` }, { quoted: message });

        try {
            const animes = await searchAnime(query);

            if (!animes.length) {
                await react('❌');
                await sock.sendMessage(chatId, { delete: waitMsg.key }).catch(() => {});
                return sock.sendMessage(chatId,
                    { text: `❌ No anime found for *"${query}"*` }, { quoted: message });
            }

            try {
                await buildAnimeCarousel(sock, chatId, animes, query);
                await react('✅');
            } catch {
                await sendFallbackList(sock, chatId, animes, query, message);
                await react('✅');
            }

            await sock.sendMessage(chatId, { delete: waitMsg.key }).catch(() => {});

        } catch (e) {
            await react('❌');
            console.error('[ANISEARCH] error:', e.message);
            await sock.sendMessage(chatId, { delete: waitMsg.key }).catch(() => {});
            await sock.sendMessage(chatId,
                { text: `❌ Anime search failed: ${e.message}` }, { quoted: message });
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

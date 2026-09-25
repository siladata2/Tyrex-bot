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

/* ─── API config ───────────────────────────────────────────────────────── */
const PEXELS_KEY     = process.env.PEXELS_KEY || '';
const PIXABAY_KEY    = process.env.PIXABAY_KEY || '';
const RESULTS_COUNT  = 8;

/* ─── fetch images from Pexels ─────────────────────────────────────────── */
async function fetchPexels(query) {
    const res = await axios.get('https://api.pexels.com/v1/search', {
        params: { query, per_page: RESULTS_COUNT, orientation: 'landscape' },
        headers: { Authorization: PEXELS_KEY },
        timeout: 8000
    });
    return (res.data?.photos || []).map(p => ({
        title:       p.alt || query,
        imageUrl:    p.src?.large || p.src?.original,
        thumb:       p.src?.medium,
        photographer: p.photographer,
        link:        p.url,
        width:       p.width,
        height:      p.height
    })).filter(p => p.imageUrl);
}

/* ─── fetch images from Pixabay (fallback) ─────────────────────────────── */
async function fetchPixabay(query) {
    const res = await axios.get('https://pixabay.com/api/', {
        params: { key: PIXABAY_KEY, q: query, per_page: RESULTS_COUNT,
                  image_type: 'photo', safesearch: 'true' },
        timeout: 8000
    });
    return (res.data?.hits || []).map(p => ({
        title:        p.tags?.split(',')[0]?.trim() || query,
        imageUrl:     p.webformatURL,
        thumb:        p.previewURL,
        photographer: p.user,
        link:         p.pageURL,
        width:        p.webformatWidth,
        height:       p.webformatHeight
    })).filter(p => p.imageUrl);
}

/* ─── build carousel ────────────────────────────────────────────────────── */
async function buildCarousel(sock, chatId, photos, query) {
    const cards = [];

    for (const photo of photos.slice(0, 8)) {
        try {
            const imageContent = await generateWAMessageContent(
                { image: { url: photo.imageUrl } },
                { upload: sock.waUploadToServer }
            );
            if (!imageContent?.imageMessage) continue;

            cards.push({
                header: {
                    title:              photo.title.substring(0, 60),
                    hasMediaAttachment: true,
                    imageMessage:       imageContent.imageMessage
                },
                body: {
                    text: `📸 By: ${photo.photographer || 'Unknown'}\n` +
                          `📐 ${photo.width}×${photo.height}`
                },
                footer: { text: '🖼 TYREX_KSH MD Image Search' },
                nativeFlowMessage: {
                    buttons: [
                        {
                            name:             'cta_url',
                            buttonParamsJson: JSON.stringify({
                                display_text: '🔗 Open Full',
                                url:          photo.link,
                                merchant_url: photo.link
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
                    body:            { text: `🔍 *Image Search:* ${query}\n📦 ${cards.length} results` },
                    footer:          { text: 'Swipe ◀️▶️ • TYREX_KSH MD' },
                    carouselMessage: { cards }
                }
            }
        }
    }, {});

    await sock.relayMessage(chatId, msg.message, { messageId: msg.key.id });
    return cards.length;
}

/* ─── fallback: send as album ───────────────────────────────────────────── */
async function sendFallbackAlbum(sock, chatId, photos, message) {
    for (const photo of photos.slice(0, 5)) {
        await sock.sendMessage(chatId, {
            image:   { url: photo.imageUrl },
            caption: `*${photo.title}*\nBy: ${photo.photographer || 'Unknown'}\n${photo.link}`
        }, { quoted: message }).catch(() => {});
    }
}

/* ─── command export ────────────────────────────────────────────────────── */
module.exports = {
    command:     'gsearch',
    aliases: ['imgsearch', 'imgs', 'pexels', 'pixabay', 'gimage'],
    category:    'search',
    description: 'Search images with sliding carousel (Pexels / Pixabay)',
    usage:       '.gsearch <query>',

    async handler(sock, message, args, context = {}) {
        const chatId    = context.chatId || message.key.remoteJid;
        const query     = args.join(' ').trim();

        if (!query) {
            return sock.sendMessage(chatId, {
                text: `*🖼 IMAGE SEARCH v1.0*\n\n` +
                      `Usage: \`.gsearch <query>\`\n\n` +
                      `Examples:\n` +
                      `• \`.gsearch sunset beach\`\n` +
                      `• \`.gsearch mountain landscape 4k\`\n` +
                      `• \`.gsearch cute cats\`\n\n` +
                      `*API:* ${PEXELS_KEY ? '✅ Pexels' : PIXABAY_KEY ? '✅ Pixabay' : '❌ No API key set!'}\n` +
                      `Set \`PEXELS_KEY\` or \`PIXABAY_KEY\` in .env`
            }, { quoted: message });
        }

        if (!PEXELS_KEY && !PIXABAY_KEY) {
            return sock.sendMessage(chatId, {
                text: `❌ *No API key configured!*\n\n` +
                      `Add to .env:\n\`PEXELS_KEY=your_key\`\nOR\n\`PIXABAY_KEY=your_key\`\n\n` +
                      `Get free keys:\n• https://www.pexels.com/api/\n• https://pixabay.com/api/docs/`
            }, { quoted: message });
        }

        const react  = (emoji) => sock.sendMessage(chatId, { react: { text: emoji, key: message.key } }).catch(() => {});
        await react('🔍');

        const waitMsg = await sock.sendMessage(chatId, {
            text: `🔍 Searching images for *"${query}"*…`
        }, { quoted: message });

        try {
            let photos = [];

            if (PEXELS_KEY) {
                photos = await fetchPexels(query);
            }
            if (!photos.length && PIXABAY_KEY) {
                photos = await fetchPixabay(query);
            }

            if (!photos.length) {
                await react('❌');
                return sock.sendMessage(chatId, {
                    text: `❌ No images found for *"${query}"*\nTry different keywords.`
                }, { quoted: message });
            }

            try {
                const count = await buildCarousel(sock, chatId, photos, query);
                await react('✅');
                await sock.sendMessage(chatId, { delete: waitMsg.key }).catch(() => {});
            } catch {
                /* carousel failed → fallback album */
                await sendFallbackAlbum(sock, chatId, photos, message);
                await react('✅');
                await sock.sendMessage(chatId, { delete: waitMsg.key }).catch(() => {});
            }

        } catch (e) {
            await react('❌');
            console.error('[GSEARCH] error:', e.message);
            await sock.sendMessage(chatId, {
                text: `❌ Image search failed: ${e.message}`
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

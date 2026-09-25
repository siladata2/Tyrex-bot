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
const GBOOKS_BASE  = 'https://www.googleapis.com/books/v1/volumes';
const GBOOKS_KEY   = process.env.GBOOKS_KEY || '';           // optional; increases quota
const PLACEHOLDER  = 'https://via.placeholder.com/400x600/1a1a2e/ffffff?text=📚+BOOK';

/* ─── fetch books ───────────────────────────────────────────────────────── */
async function searchBooks(query, maxResults = 10) {
    const params = {
        q:          query,
        maxResults,
        printType:  'books',
        langRestrict: 'en',
        orderBy:    'relevance'
    };
    if (GBOOKS_KEY) params.key = GBOOKS_KEY;

    const res = await axios.get(GBOOKS_BASE, { params, timeout: 8000 });
    return (res.data?.items || []).map(item => {
        const info = item.volumeInfo || {};
        const sale = item.saleInfo  || {};
        return {
            id:          item.id,
            title:       info.title     || 'Unknown Title',
            authors:     (info.authors  || ['Unknown']).join(', '),
            publisher:   info.publisher || '',
            publishedAt: info.publishedDate || '',
            description: info.description  || '',
            categories:  (info.categories  || []).slice(0, 2).join(' · '),
            pages:       info.pageCount   || null,
            rating:      info.averageRating  || null,
            ratingCount: info.ratingsCount   || 0,
            language:    (info.language || 'en').toUpperCase(),
            imageUrl:    info.imageLinks?.thumbnail?.replace('http:', 'https:') ||
                         info.imageLinks?.smallThumbnail?.replace('http:', 'https:') ||
                         PLACEHOLDER,
            previewLink: info.previewLink || `https://books.google.com/books?id=${item.id}`,
            infoLink:    info.infoLink    || `https://books.google.com/books?id=${item.id}`,
            buyLink:     sale.buyLink     || null,
            price:       sale.listPrice   || null,
            maturity:    info.maturityRating || ''
        };
    });
}

/* ─── helpers ───────────────────────────────────────────────────────────── */
function starRating(score, max = 5) {
    if (!score) return '☆☆☆☆☆';
    const stars = Math.round(score);
    return '⭐'.repeat(Math.min(stars, 5)) + '☆'.repeat(Math.max(0, 5 - stars));
}

function trimDesc(text, max = 150) {
    if (!text) return 'No description available.';
    const clean = text.replace(/<[^>]*>/g, '');   // strip any HTML tags
    return clean.length > max ? clean.substring(0, max).trimEnd() + '…' : clean;
}

function fmtYear(date) {
    return date?.substring(0, 4) || 'N/A';
}

/* ─── build carousel ────────────────────────────────────────────────────── */
async function buildBookCarousel(sock, chatId, books, query) {
    const cards = [];

    for (const book of books.slice(0, 8)) {
        try {
            const imgContent = await generateWAMessageContent(
                { image: { url: book.imageUrl } },
                { upload: sock.waUploadToServer }
            );
            if (!imgContent?.imageMessage) continue;

            const ratingLine = book.rating
                ? `${starRating(book.rating)} ${book.rating}/5 (${book.ratingCount} reviews)\n`
                : '';
            const pagesLine  = book.pages   ? `📄 ${book.pages} pages · ` : '';
            const catLine    = book.categories ? `🏷️ ${book.categories}\n` : '';
            const priceStr   = book.price
                ? `💰 ${book.price.currencyCode} ${book.price.amount}`
                : 'Price: N/A';

            const bodyText =
                `✍️ ${book.authors}\n` +
                (book.publisher ? `🏢 ${book.publisher} · ` : '') +
                `📅 ${fmtYear(book.publishedAt)}\n` +
                ratingLine +
                `${pagesLine}🌐 ${book.language}\n` +
                catLine +
                `\n${trimDesc(book.description)}`;

            const btns = [
                {
                    name:             'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📖 Preview Book',
                        url:          book.previewLink,
                        merchant_url: book.previewLink
                    })
                }
            ];

            if (book.buyLink) {
                btns.push({
                    name:             'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: `🛒 Buy (${priceStr})`,
                        url:          book.buyLink,
                        merchant_url: book.buyLink
                    })
                });
            }

            cards.push({
                header: {
                    title:              book.title.substring(0, 60),
                    hasMediaAttachment: true,
                    imageMessage:       imgContent.imageMessage
                },
                body:   { text: bodyText },
                footer: { text: '📚 TYREX_KSH MD Book Search' },
                nativeFlowMessage: { buttons: btns }
            });
        } catch { continue; }
    }

    if (!cards.length) throw new Error('No cards built');

    const msg = generateWAMessageFromContent(chatId, {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    body:            { text: `📚 *Book Search:* ${query}\n📖 ${cards.length} books found` },
                    footer:          { text: 'Swipe ◀️▶️ • Powered by Google Books' },
                    carouselMessage: { cards }
                }
            }
        }
    }, {});

    await sock.relayMessage(chatId, msg.message, { messageId: msg.key.id });
    return cards.length;
}

/* ─── fallback text list ────────────────────────────────────────────────── */
async function sendFallbackList(sock, chatId, books, query, message) {
    const lines = books.slice(0, 6).map((b, i) =>
        `${i + 1}. *${b.title}* (${fmtYear(b.publishedAt)})\n` +
        `   ✍️ ${b.authors}\n` +
        `   ${b.rating ? `⭐${b.rating}/5 · ` : ''}${b.pages ? `📄${b.pages}pp · ` : ''}${b.language}\n` +
        `   ${trimDesc(b.description, 80)}\n` +
        `   🔗 ${b.previewLink}`
    ).join('\n\n');

    await sock.sendMessage(chatId, {
        text: `📚 *Books: "${query}"*\n\n${lines}\n\n_Powered by Google Books_`
    }, { quoted: message });
}

/* ─── command export ────────────────────────────────────────────────────── */
module.exports = {
    command:     'booksearch',
    aliases: ['book', 'books', 'gbooks', 'readbook'],
    category:    'search',
    description: 'Search books with sliding carousel (Google Books, no API key needed)',
    usage:       '.booksearch <title or author>',

    async handler(sock, message, args, context = {}) {
        const chatId = context.chatId || message.key.remoteJid;
        const query  = args.join(' ').trim();

        if (!query) {
            return sock.sendMessage(chatId, {
                text: `*📚 BOOK SEARCH v1.0*\n\n` +
                      `Usage: \`.booksearch <title or author>\`\n\n` +
                      `Examples:\n` +
                      `• \`.booksearch Atomic Habits\`\n` +
                      `• \`.booksearch author:Malcolm Gladwell\`\n` +
                      `• \`.booksearch Python programming\`\n` +
                      `• \`.booksearch Harry Potter\`\n\n` +
                      `_No API key needed — powered by Google Books_\n` +
                      `_Optional: Set \`GBOOKS_KEY\` for higher quota_`
            }, { quoted: message });
        }

        const react = (e) => sock.sendMessage(chatId, { react: { text: e, key: message.key } }).catch(() => {});
        await react('📚');

        const waitMsg = await sock.sendMessage(chatId,
            { text: `📚 Searching books for *"${query}"*…` }, { quoted: message });

        try {
            const books = await searchBooks(query);

            if (!books.length) {
                await react('❌');
                await sock.sendMessage(chatId, { delete: waitMsg.key }).catch(() => {});
                return sock.sendMessage(chatId,
                    { text: `❌ No books found for *"${query}"*` }, { quoted: message });
            }

            try {
                await buildBookCarousel(sock, chatId, books, query);
                await react('✅');
            } catch {
                await sendFallbackList(sock, chatId, books, query, message);
                await react('✅');
            }

            await sock.sendMessage(chatId, { delete: waitMsg.key }).catch(() => {});

        } catch (e) {
            await react('❌');
            console.error('[BOOKSEARCH] error:', e.message);
            await sock.sendMessage(chatId, { delete: waitMsg.key }).catch(() => {});
            await sock.sendMessage(chatId,
                { text: `❌ Book search failed: ${e.message}` }, { quoted: message });
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

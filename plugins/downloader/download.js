'use strict';
/* TYREX_KSH MD - Download commands (single file)
 * Powered by TYREX_KSH TECH
 *
 * Commands: tiktok, instagram, twitter, facebook
 * Exports commands in the format index.js expects:
 * { name, aliases, execute(conn, mek, args, chatId, isOwner) }
 */

const path = require('path');
const axios = require('axios');

/* ===================== HELPERS ===================== */
const chatOf = (message, context = {}) => context.chatId || message.key.remoteJid;
const say = (sock, chatId, message, text) => sock.sendMessage(chatId, { text }, { quoted: message });

// Optional shared downloader (lib/jawadDownloader.js). Your bot does not have
// this file yet, so this step is simply skipped unless you add it.
async function jawad(url) {
  let mod;
  try {
    mod = require(path.join(process.cwd(), 'lib', 'jawadDownloader'));
  } catch {
    throw new Error('lib/jawadDownloader.js not installed');
  }
  return mod.jawadDownload(url);
}

/* ===================== TIKTOK ===================== */
const MAX_VIDEO_SIZE = 60 * 1024 * 1024;

async function downloadBuffer(url, timeout = 90000) {
  const r = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0',
      Referer: 'https://www.tiktok.com/'
    }
  });
  return Buffer.from(r.data);
}

async function tryTikwm(url) {
  const params = new URLSearchParams({ url, hd: '1' });
  const { data } = await axios.post('https://www.tikwm.com/api/', params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'TikTok 26.2.0' },
    timeout: 30000
  });
  if (data.code !== 0 || !data.data) throw new Error(data.msg || 'tikwm error');
  const d = data.data;
  const videoUrl = d.hdplay || d.play;
  if (!videoUrl) throw new Error('No video URL from tikwm');
  return { url: videoUrl, title: d.title, author: d.author?.nickname, quality: d.hdplay ? 'HD' : 'SD' };
}

async function tryDiscardApi(url) {
  const { data } = await axios.get('https://discardapi.onrender.com/api/dl/tiktok', {
    params: { apikey: 'guru', url },
    timeout: 45000,
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  if (!data?.status || !data?.result) throw new Error('Invalid API response');
  const res = data.result;
  const hd = res.data?.find((v) => v.type === 'nowatermark_hd');
  const noWm = res.data?.find((v) => v.type === 'nowatermark');
  const videoUrl = hd?.url || noWm?.url;
  if (!videoUrl) throw new Error('No downloadable video');
  return {
    url: videoUrl,
    title: res.title,
    author: res.author?.nickname,
    quality: hd ? 'HD No Watermark' : 'No Watermark',
    stats: res.stats,
    music: res.music_info?.title
  };
}

async function tryMrnima(url) {
  const tiktok = require('@mrnima/tiktok-downloader'); // optional package
  const res = await tiktok(url);
  const videoUrl = res?.nowm || res?.video || res?.result?.video;
  if (!videoUrl) throw new Error('No URL from @mrnima');
  return { url: videoUrl, title: res?.title || 'TikTok Video', author: res?.author };
}

async function tryRuhend(url) {
  const { ttdl } = require('ruhend-scraper');
  const res = await ttdl(url);
  const videoUrl = res?.data?.play || res?.data?.video;
  if (!videoUrl) throw new Error('No URL from ruhend');
  return { url: videoUrl, title: res?.data?.title };
}

async function tryJawadTiktok(url) {
  const { media } = await jawad(url);
  const best = media.find((m) => m.type === 'video') || media[0];
  if (!best?.url) throw new Error('No URL from jawad-tech');
  return { url: best.url, title: best.title || 'TikTok Video' };
}

const TIKTOK_METHODS = [
  { name: 'tikwm', fn: tryTikwm },
  { name: 'discardapi', fn: tryDiscardApi },
  { name: 'mrnima', fn: tryMrnima },
  { name: 'ruhend', fn: tryRuhend },
  { name: 'jawad-tech', fn: tryJawadTiktok }
];

/* ===================== INSTAGRAM ===================== */
// Detect the real media type instead of trusting the file extension
async function resolveIsVideo(item) {
  const t = (item.type || item.mediaType || '').toString().toLowerCase();
  if (t.includes('video') || t === 'reel') return true;
  if (t.includes('image') || t === 'photo') return false;
  if (/\.(mp4|mov|m4v)(\?|$)/i.test(item.url)) return true;
  if (/\.(jpg|jpeg|png|webp)(\?|$)/i.test(item.url)) return false;
  try {
    const head = await axios.head(item.url, { timeout: 8000 });
    return (head.headers['content-type'] || '').includes('video');
  } catch {
    return false;
  }
}

async function nexrayDownload(url) {
  const { data } = await axios.get('https://api.nexray.eu.cc/downloader/instagram', {
    params: { url },
    timeout: 25000
  });
  const list = data?.result?.data || data?.result || data?.data || [];
  const arr = Array.isArray(list) ? list : [list];
  const media = arr
    .map((m) => ({ url: m.url || m.download_url || m.link, type: m.type || m.mediaType }))
    .filter((m) => m.url);
  if (!media.length) throw new Error('nexray returned no media');
  return media;
}

/* ===================== FACEBOOK ===================== */
async function facebookFallback(url) {
  const { media } = await jawad(url);
  const best = media.find((m) => m.type === 'video') || media[0];
  return best?.url;
}

/* ===================== COMMANDS ===================== */
const COMMANDS = [
  /* ---------- .tiktok ---------- */
  {
    command: 'tiktok',
    aliases: ['tt', 'ttdl', 'tiktokdl'],
    category: 'download',
    description: 'Download TikTok video (no watermark, HD)',
    usage: '.tiktok <TikTok URL>',
    async handler(sock, message, args, context = {}) {
      const chatId = chatOf(message, context);
      const url = args.join(' ').trim();
      if (!url) return say(sock, chatId, message, '🎵 *TikTok Downloader*\n\nUsage: .tiktok <TikTok URL>');

      await say(sock, chatId, message, '⏳ Downloading TikTok...');
      let lastErr;
      for (const m of TIKTOK_METHODS) {
        try {
          const info = await m.fn(url);
          const buf = await downloadBuffer(info.url);
          let caption = `🎵 *TikTok by ${info.author || 'Unknown'}*\n✨ Quality: ${info.quality || 'No Watermark'}\n🎶 ${info.music || ''}`.trim();
          if (info.stats) caption += `\n❤️ ${info.stats.likes} | 👀 ${info.stats.views}`;

          if (buf.length > MAX_VIDEO_SIZE) {
            await sock.sendMessage(chatId, { document: buf, mimetype: 'video/mp4', fileName: 'tiktok_video.mp4', caption }, { quoted: message });
          } else {
            await sock.sendMessage(chatId, { video: buf, mimetype: 'video/mp4', caption }, { quoted: message });
          }
          return;
        } catch (e) {
          lastErr = e;
          console.log(`[TIKTOK] ${m.name} failed: ${e.message}`);
        }
      }
      await say(sock, chatId, message, `❌ All TikTok methods failed: ${lastErr?.message}`);
    }
  },

  /* ---------- .instagram ---------- */
  {
    command: 'instagram',
    aliases: ['ig', 'igdl', 'insta'],
    category: 'download',
    description: 'Download Instagram posts, reels, stories & videos',
    usage: '.ig <instagram link>',
    async handler(sock, message, args, context = {}) {
      const chatId = chatOf(message, context);
      const url = args.join(' ').trim()
        || message.message?.conversation
        || message.message?.extendedTextMessage?.text
        || '';
      if (!url) return say(sock, chatId, message, '📸 *Instagram Downloader*\n\nUsage: .ig <post | reel | story | video link>');

      const igRegex = /https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/(p|reel|tv|stories)\//i;
      if (!igRegex.test(url)) return say(sock, chatId, message, '❌ Invalid Instagram link.');

      await sock.sendMessage(chatId, { react: { text: '🔄', key: message.key } });

      let media = null;
      let lastErr = null;

      // 1) nexray
      try {
        media = await nexrayDownload(url);
      } catch (e) { lastErr = e; }

      // 2) ruhend-scraper
      if (!media) {
        try {
          const { igdl } = require('ruhend-scraper');
          const res = await igdl(url);
          if (!res?.data?.length) throw new Error('empty result');
          const seen = new Set();
          media = res.data.filter((m) => {
            if (!m?.url || seen.has(m.url)) return false;
            seen.add(m.url);
            return true;
          });
        } catch (e) { lastErr = e; }
      }

      // 3) jawad-tech (optional)
      if (!media) {
        try {
          media = (await jawad(url)).media;
        } catch (e) { lastErr = e; }
      }

      if (!media || !media.length) {
        return say(sock, chatId, message,
          `❌ Failed to fetch: ${lastErr?.message || 'no providers returned media (link may be private/expired)'}`);
      }

      try {
        for (const item of media.slice(0, 5)) {
          const isVideo = await resolveIsVideo(item);
          if (isVideo) await sock.sendMessage(chatId, { video: { url: item.url }, caption: '📸 Instagram Video' }, { quoted: message });
          else await sock.sendMessage(chatId, { image: { url: item.url }, caption: '📸 Instagram Photo' }, { quoted: message });
        }
      } catch (e) {
        await say(sock, chatId, message, `❌ Failed to send media: ${e.message}`);
      }
    }
  },

  /* ---------- .twitter ---------- */
  {
    command: 'twitter',
    aliases: ['xtweet', 'twitterdl', 'xdl'],
    category: 'download',
    description: 'Download video/image from X/Twitter',
    usage: '.twitter <Tweet URL>',
    async handler(sock, message, args, context = {}) {
      const chatId = chatOf(message, context);
      const url = args.join(' ').trim();
      if (!url) return say(sock, chatId, message, '🐦 *Twitter/X Downloader*\n\nUsage: .twitter <tweet URL>');

      try {
        const { data } = await axios.get('https://discardapi.dpdns.org/api/dl/twitter', {
          params: { apikey: 'guru', url },
          timeout: 20000
        });
        if (!data?.status || !data.result?.media?.length) throw new Error('empty result');

        const tweet = data.result;
        const caption = `🐦 @${tweet.authorUsername} (${tweet.authorName})\n${tweet.text}\n\n❤️ ${tweet.likes} | 🔁 ${tweet.retweets} | 💬 ${tweet.replies}`.trim();
        for (const item of tweet.media) {
          if (item.type === 'video') await sock.sendMessage(chatId, { video: { url: item.url }, caption }, { quoted: message });
          else if (item.type === 'image') await sock.sendMessage(chatId, { image: { url: item.url }, caption }, { quoted: message });
        }
      } catch (e) {
        // fallback: jawad-tech (optional)
        try {
          const { media } = await jawad(url);
          for (const item of media.slice(0, 5)) {
            if (item.type === 'video') await sock.sendMessage(chatId, { video: { url: item.url }, caption: '🐦 X/Twitter' }, { quoted: message });
            else await sock.sendMessage(chatId, { image: { url: item.url }, caption: '🐦 X/Twitter' }, { quoted: message });
          }
        } catch (e2) {
          await say(sock, chatId, message, `❌ Failed: ${e.message}`);
        }
      }
    }
  },

  /* ---------- .facebook ---------- */
  {
    command: 'facebook',
    aliases: ['fb', 'fbdl'],
    category: 'download',
    description: 'Download Facebook video',
    usage: '.fb <facebook video URL>',
    async handler(sock, message, args, context = {}) {
      const chatId = chatOf(message, context);
      const url = args.join(' ').trim();
      if (!url) return say(sock, chatId, message, '📘 *Facebook Downloader*\n\nUsage: .fb <Facebook video URL>');

      await say(sock, chatId, message, '⏳ Fetching Facebook video...');

      let videoUrl = null;
      let title = '';
      let lastErr = null;

      // 1) @mrnima/facebook-downloader (optional package, exports a named `facebook` function)
      try {
        const fbdl = require('@mrnima/facebook-downloader').facebook;
        if (typeof fbdl !== 'function') throw new Error('@mrnima/facebook-downloader not installed');
        const res = await fbdl(url);
        const links = res?.result?.links || res?.links || {};
        videoUrl = links.HD || links.hd || links.SD || links.sd
          || res?.result?.hd || res?.result?.sd || res?.hd || res?.sd || res?.url;
        title = res?.result?.title || res?.title || '';
        if (!videoUrl) throw new Error('No video URL in response');
      } catch (e) { lastErr = e; }

      // 2) jawad-tech (optional)
      if (!videoUrl) {
        try { videoUrl = await facebookFallback(url); }
        catch (e) { lastErr = e; }
      }

      if (!videoUrl) {
        return say(sock, chatId, message,
          `❌ Failed: ${lastErr?.message || 'No video URL found'}\n\nThe link may be private/expired, or the download providers are temporarily down. Try again in a bit.`);
      }

      try {
        await sock.sendMessage(chatId, { video: { url: videoUrl }, caption: `📘 *Facebook Video*\n${title}`.trim() }, { quoted: message });
      } catch (e) {
        await say(sock, chatId, message, `❌ Failed to send video: ${e.message}`);
      }
    }
  }
];

/* ===================== ADAPTER (bot loader format) ===================== */
const toBotFormat = (c) => ({
  name: c.command,
  aliases: c.aliases || [],
  category: c.category,
  description: c.description,
  usage: c.usage,
  async execute(conn, mek, args, chatId, isOwner) {
    return c.handler(conn, mek, args, { chatId, isOwner });
  }
});

module.exports = COMMANDS.map(toBotFormat);

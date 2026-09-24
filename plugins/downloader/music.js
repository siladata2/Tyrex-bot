'use strict';
/* TYREX_KSH MD - Music commands (deduplicated, single file)
 * Powered by TYREX_KSH TECH
 *
 * Commands: play, play2, song, mp3, audio, video, lyrics, trending, radio,
 *           shazam, spotify, ringtone, soundcloud
 *
 * Optional environment variables:
 *   QASIM_KEY, ACRCLOUD_KEY, ACRCLOUD_SECRET, AUDD_API_KEY
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

/* ===================== CONFIG ===================== */
const QASIM_API = 'https://api.qasimdev.dpdns.org/api/loaderto/download';
const QASIM_KEY = process.env.QASIM_KEY || 'qasim-dev';
const DEFAULT_COUNTRY = 'US'; // used by .trending when no country is given
const YT_RE = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([a-zA-Z0-9_-]{11})/;

/* ===================== HELPERS ===================== */
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const chatOf = (message, context = {}) => context.chatId || message.key.remoteJid;
const say = (sock, chatId, message, text) => sock.sendMessage(chatId, { text }, { quoted: message });

async function downloadWithRetry(url, format = 'mp3', retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const { data } = await axios.get(QASIM_API, {
        params: { apiKey: QASIM_KEY, format, url },
        timeout: format === 'mp3' ? 90000 : 120000
      });
      if (data?.data?.downloadUrl) return data.data;
      throw new Error(data?.message || 'No download URL from API');
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`[YTDL] Attempt ${i + 1} failed, retry in 5s... (${err.message})`);
      await wait(5000);
    }
  }
}

async function cobaltFallback(url, isAudio = true) {
  const { data } = await axios.post('https://api.cobalt.tools/', {
    url,
    downloadMode: isAudio ? 'audio' : 'auto',
    audioFormat: isAudio ? 'mp3' : undefined
  }, {
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    timeout: 30000
  });
  if (data.status === 'error') throw new Error(data.error?.code || 'cobalt error');
  const dl = data.url || data.picker?.[0]?.url;
  if (!dl) throw new Error('No URL from cobalt');
  return { downloadUrl: dl, title: 'Song' };
}

async function siputzxFallback(url, isAudio = true) {
  const ep = isAudio ? 'https://api.siputzx.my.id/api/d/ytmp3' : 'https://api.siputzx.my.id/api/d/ytmp4';
  const { data } = await axios.get(ep, { params: { url }, timeout: 60000 });
  const dl = data?.data?.dl || data?.data?.url || data?.data?.download || data?.result?.download;
  if (!dl) throw new Error('siputzx: no url');
  return { downloadUrl: dl, title: data?.data?.title || 'audio' };
}

// audio only
async function vredenFallback(url) {
  let res;
  try {
    res = await axios.get('https://api.vreden.my.id/api/ytmp3', { params: { url }, timeout: 60000 });
  } catch {
    res = await axios.get('https://api.zenzxz.dpdns.org/downloader/ytmp3', { params: { url }, timeout: 60000 });
  }
  const d = res.data;
  const dl = d?.result?.download?.url || d?.result?.url || d?.download || d?.result?.audio;
  if (!dl) throw new Error('vreden: no url');
  return { downloadUrl: dl, title: d?.result?.title || 'audio' };
}

async function downloadAny(url, format = 'mp3') {
  const isAudio = format === 'mp3';
  const chain = [
    { name: 'qasimdev', fn: () => downloadWithRetry(url, format, 2) },
    { name: 'siputzx', fn: () => siputzxFallback(url, isAudio) },
    ...(isAudio ? [{ name: 'vreden', fn: () => vredenFallback(url) }] : []),
    { name: 'cobalt', fn: () => cobaltFallback(url, isAudio) }
  ];
  let lastErr = null;
  for (const step of chain) {
    try {
      const r = await step.fn();
      if (r?.downloadUrl) return r;
    } catch (e) {
      lastErr = e;
      console.log(`[YTDL] ${step.name} failed: ${e.message}`);
    }
  }
  throw lastErr || new Error('All download sources failed');
}

async function ytSearch(query) {
  const yts = require('yt-search');
  const { videos } = await yts(query);
  if (!videos?.length) throw new Error('No YouTube results found.');
  return videos[0];
}

// Search by name, or look up a YouTube link
async function resolveVideo(query) {
  const m = query.match(YT_RE);
  if (m) {
    try {
      const yts = require('yt-search');
      const v = await yts({ videoId: m[1] });
      if (v?.url) return v;
    } catch {}
    return { url: query, title: 'song', timestamp: '?', author: { name: '' }, thumbnail: null };
  }
  return ytSearch(query);
}

// Download through the remote API chain and send as audio
async function sendSong(sock, message, chatId, video) {
  const d = await downloadAny(video.url, 'mp3');
  await sock.sendMessage(chatId, {
    audio: { url: d.downloadUrl },
    mimetype: 'audio/mpeg',
    fileName: `${(d.title || video.title || 'song').slice(0, 60)}.mp3`,
    ptt: false
  }, { quoted: message });
}

/* ===================== RADIO STATIONS ===================== */
// Edit / add your own stations here
const STATIONS = {
  lofi:    { name: 'Lofi Chill Beats',  url: 'https://stream.zeno.fm/f3wvbbqmdg8uv' },
  quran:   { name: 'Radio Quran',       url: 'https://stream.radiojar.com/quran' },
  bbc:     { name: 'BBC World Service', url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_world_service' },
  jazz:    { name: 'Jazz 24/7',         url: 'https://live.amperwave.net/manifest/ppm-jazz24aacstream-hlsc.m3u8' },
  fm91:    { name: 'FM91',              url: 'https://stream.zeno.fm/5ak3ey5y9e8uv' },
  cityfm89:{ name: 'City FM89',         url: 'https://stream.zeno.fm/mxlj5g5wquhvv' },
  humfm:   { name: 'HUM FM 106.2',      url: 'https://stream.zeno.fm/8wr0xv4kwenuv' },
  radioone:{ name: 'Radio One 91 FM',   url: 'https://stream.zeno.fm/5jwy09fyyghvv' }
};

/* ===================== COMMANDS ===================== */
const COMMANDS = [
  /* ---------- .play ---------- */
  {
    command: 'play',
    aliases: ['plays', 'playsong'],
    category: 'music',
    description: 'Search and download MP3 from YouTube',
    usage: '.play <song name | YouTube URL>',
    async handler(sock, message, args, context = {}) {
      const chatId = chatOf(message, context);
      const query = args.join(' ').trim();
      if (!query) return say(sock, chatId, message, '*Which song do you want to play?*\nUsage: .play <song name>');

      try {
        await say(sock, chatId, message, '🔍 *Searching...*');
        const video = await resolveVideo(query);

        const caption =
          `✅ *Found:* ${video.title}\n⏱️ ${video.timestamp}\n👤 ${video.author?.name || ''}\n\n⏳ *Downloading... (may take up to 30s)*`;
        if (video.thumbnail) {
          await sock.sendMessage(chatId, { image: { url: video.thumbnail }, caption }, { quoted: message });
        } else {
          await say(sock, chatId, message, caption);
        }

        await sendSong(sock, message, chatId, video);
      } catch (err) {
        console.error('[PLAY]', err.message);
        const reason = err.response?.status === 408 ? 'Download timed out. Try again.'
          : err.response?.status === 429 ? 'Rate limited. Wait a minute.'
          : err.message;
        await say(sock, chatId, message, `❌ *Failed:* ${reason}`);
      }
    }
  },

  /* ---------- .play2 (tries every URL the API returns) ---------- */
  {
    command: 'play2',
    aliases: ['mp3fallback', 'playfb'],
    category: 'music',
    description: 'Stream MP3 with full URL fallback chain',
    usage: '.play2 <song name>',
    async handler(sock, message, args, context = {}) {
      const chatId = chatOf(message, context);
      const query = args.join(' ').trim();
      if (!query) return say(sock, chatId, message, '🎵 Usage: `.play2 <song name>`');

      try {
        await say(sock, chatId, message, '🔍 Searching...');
        const video = await ytSearch(query);

        if (video.thumbnail) {
          await sock.sendMessage(chatId, {
            image: { url: video.thumbnail },
            caption: `*🎵 ${video.title}*\n⏱️ ${video.timestamp}\n📢 ${video.author.name}\n\n🔄 Fetching URLs...`
          }, { quoted: message });
        }

        const { data: apiResp } = await axios.get(QASIM_API, {
          params: { apiKey: QASIM_KEY, format: 'mp3', url: video.url },
          timeout: 120000
        }).catch(() => ({ data: {} }));

        const urlsToTry = [];
        if (apiResp?.data?.downloadUrl) urlsToTry.push(apiResp.data.downloadUrl);
        if (apiResp?.data?.alternativeUrls?.length) apiResp.data.alternativeUrls.forEach((a) => urlsToTry.push(a.url));
        urlsToTry.push('__cobalt__');

        let sent = false;
        let lastErr = null;
        for (const candidate of urlsToTry) {
          try {
            let finalUrl = candidate;
            if (finalUrl === '__cobalt__') {
              finalUrl = (await cobaltFallback(video.url, true)).downloadUrl;
            } else {
              await axios.head(finalUrl, { timeout: 8000 });
            }
            await sock.sendMessage(chatId, {
              audio: { url: finalUrl },
              mimetype: 'audio/mpeg',
              fileName: `${video.title}.mp3`
            }, { quoted: message });
            sent = true;
            break;
          } catch (e) { lastErr = e; }
        }
        if (!sent) throw new Error(`All ${urlsToTry.length} URLs failed. Last: ${lastErr?.message}`);
      } catch (e) {
        await say(sock, chatId, message, `❌ Play2 failed: ${e.message}`);
      }
    }
  },

  /* ---------- .song / .mp3 / .audio (separate commands, same function) ---------- */
  ...[
    { command: 'song',  aliases: ['dlmp3'], description: 'Download song MP3 from YouTube' },
    { command: 'mp3',   aliases: [],        description: 'Download MP3 from YouTube' },
    { command: 'audio', aliases: [],        description: 'Download audio from YouTube' }
  ].map((c) => ({
    command: c.command,
    aliases: c.aliases,
    category: 'music',
    description: c.description,
    usage: `.${c.command} <name | YouTube URL>`,
    async handler(sock, message, args, context = {}) {
      const chatId = chatOf(message, context);
      const query = args.join(' ').trim();
      if (!query) {
        return say(sock, chatId, message, `🎵 *Song Downloader*\n\nUsage:\n.${c.command} <song name | YouTube link>`);
      }
      try {
        const video = await resolveVideo(query);
        if (video.thumbnail) {
          await sock.sendMessage(chatId, {
            image: { url: video.thumbnail },
            caption: `🎵 *${video.title}*\n⏱ ${video.timestamp}\n👤 ${video.author?.name || ''}\n\n⏳ Downloading...`
          }, { quoted: message });
        }
        const dl = await downloadAny(video.url, 'mp3');
        await sock.sendMessage(chatId, {
          audio: { url: dl.downloadUrl },
          mimetype: 'audio/mpeg',
          fileName: `${dl.title || video.title || 'song'}.mp3`,
          ptt: false
        }, { quoted: message });
      } catch (e) {
        await say(sock, chatId, message, `❌ ${e.message}`);
      }
    }
  })),

  /* ---------- .video ---------- */
  {
    command: 'video',
    aliases: ['ytmp4', 'ytvideo', 'ytdl'],
    category: 'download',
    description: 'Download YouTube video (MP4 360p)',
    usage: '.video <youtube link | search>',
    async handler(sock, message, args, context = {}) {
      const chatId = chatOf(message, context);
      const query = args.join(' ').trim();
      if (!query) return say(sock, chatId, message, '🎥 *Video Downloader*\nExample:\n.video Alan Walker Faded');

      try {
        let videoUrl;
        let title;
        let thumb;
        if (/^https?:\/\//i.test(query)) {
          videoUrl = query;
        } else {
          const v = await ytSearch(query);
          videoUrl = v.url;
          title = v.title;
          thumb = v.thumbnail;
        }

        const valid = videoUrl.match(YT_RE);
        if (!valid) return say(sock, chatId, message, '❌ Not a valid YouTube link!');

        await sock.sendMessage(chatId, {
          image: { url: thumb || `https://i.ytimg.com/vi/${valid[1]}/sddefault.jpg` },
          caption: `🎬 *${title || query}*\n⬇️ Downloading... *(may take up to 30s)*`
        }, { quoted: message });

        const data = await downloadAny(videoUrl, '360');
        await sock.sendMessage(chatId, {
          video: { url: data.downloadUrl },
          mimetype: 'video/mp4',
          fileName: `${data.title || title || 'video'}.mp4`,
          caption: `🎬 *${data.title || title || 'Video'}*\n\n> *_TYREX_KSH MD_*`
        }, { quoted: message });
      } catch (err) {
        await say(sock, chatId, message, `❌ Download failed: ${err.message}`);
      }
    }
  },

  /* ---------- .lyrics ---------- */
  {
    command: 'lyrics',
    aliases: ['lyric', 'songlyrics', 'lrc'],
    category: 'music',
    description: 'Get song lyrics with artist and image',
    usage: '.lyrics <song name>',
    async handler(sock, message, args, context = {}) {
      const chatId = chatOf(message, context);
      const query = args.join(' ').trim();
      if (!query) return say(sock, chatId, message, '🎤 Usage: `.lyrics <song name>`');

      try {
        const { data } = await axios.get('https://discardapi.dpdns.org/api/music/lyrics', {
          params: { apikey: 'qasim', song: query },
          timeout: 15000
        }).catch(() => ({ data: null }));

        const md = data?.result?.message;
        if (md?.lyrics) {
          const caption = `🎵 *${md.title}*\n👤 *Artist:* ${md.artist}\n🔗 ${md.url}\n\n📝 *Lyrics:*\n${md.lyrics.slice(0, 4000)}`.trim();
          if (md.image) {
            return sock.sendMessage(chatId, { image: { url: md.image }, caption }, { quoted: message });
          }
          return say(sock, chatId, message, caption);
        }

        // Fallback: lrclib.net
        const { data: lb } = await axios.get('https://lrclib.net/api/search', { params: { q: query }, timeout: 10000 });
        const track = lb?.[0];
        if (!track) return say(sock, chatId, message, `❌ No lyrics found for "${query}".`);
        const lrc = track.plainLyrics || 'No lyrics text.';
        await say(sock, chatId, message,
          `🎤 *${track.trackName}*\n👤 ${track.artistName}\n💽 ${track.albumName || '?'}\n\n${lrc.slice(0, 6000)}`);
      } catch (e) {
        await say(sock, chatId, message, `❌ Lyrics error: ${e.message}`);
      }
    }
  },

  /* ---------- .trending ---------- */
  {
    command: 'trending',
    aliases: ['yttrend', 'musictrend'],
    category: 'music',
    description: 'Top trending music on YouTube',
    usage: '.trending [country code]',
    async handler(sock, message, args, context = {}) {
      const chatId = chatOf(message, context);
      const gl = (args[0] || DEFAULT_COUNTRY).toUpperCase();
      try {
        const yts = require('yt-search');
        const { videos } = await yts({ search: 'trending music', gl });
        if (!videos?.length) return say(sock, chatId, message, '❌ No trending results.');

        const list = videos.slice(0, 10)
          .map((v, i) => `${i + 1}. *${v.title}*\n   ⏱ ${v.timestamp} | 👤 ${v.author.name}`)
          .join('\n\n');
        await say(sock, chatId, message, `🔥 *Trending Music — ${gl}*\n\n${list}\n\n_Use \`.play <name>\` to stream_`);
      } catch (e) {
        await say(sock, chatId, message, `❌ ${e.message}`);
      }
    }
  },

  /* ---------- .radio ---------- */
  {
    command: 'radio',
    aliases: ['stream', 'radiofm'],
    category: 'music',
    description: 'Stream internet radio stations',
    usage: '.radio <station> | .radio list',
    async handler(sock, message, args, context = {}) {
      const chatId = chatOf(message, context);
      const sub = (args[0] || 'list').toLowerCase();

      if (sub === 'list' || !STATIONS[sub]) {
        const list = Object.entries(STATIONS).map(([k, v]) => `• \`.radio ${k}\` — ${v.name}`).join('\n');
        return say(sock, chatId, message, `📻 *Radio Stations*\n\n${list}`);
      }

      const st = STATIONS[sub];
      try {
        await say(sock, chatId, message, `📻 Streaming *${st.name}*...`);
        await sock.sendMessage(chatId, { audio: { url: st.url }, mimetype: 'audio/mpeg', ptt: false }, { quoted: message });
      } catch (e) {
        await say(sock, chatId, message, `❌ Stream failed: ${e.message}`);
      }
    }
  },

  /* ---------- .shazam ---------- */
  {
    command: 'shazam',
    aliases: ['identify', 'songid', 'whatssong'],
    category: 'music',
    description: 'Identify a song from audio or video',
    usage: '.shazam (reply to audio/video)',
    async handler(sock, message, args, context = {}) {
      const chatId = chatOf(message, context);
      const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
      let tmpPath = null;

      try {
        const m = message.message || {};
        const quoted = m.extendedTextMessage?.contextInfo?.quotedMessage;
        const audioMsg = m.audioMessage || quoted?.audioMessage;
        const videoMsg = m.videoMessage || quoted?.videoMessage;
        const mediaMsg = audioMsg || videoMsg;
        const mediaType = audioMsg ? 'audio' : videoMsg ? 'video' : null;
        if (!mediaMsg) return say(sock, chatId, message, '⚠️ *Reply to an audio or video message.*');

        await say(sock, chatId, message, '🔍 Analyzing audio...');

        const stream = await downloadContentFromMessage(mediaMsg, mediaType);
        let buf = Buffer.alloc(0);
        for await (const ch of stream) buf = Buffer.concat([buf, ch]);

        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
        tmpPath = path.join(tmpDir, `shazam_${Date.now()}${mediaType === 'audio' ? '.mp3' : '.mp4'}`);
        fs.writeFileSync(tmpPath, buf);

        let result = null;

        // 1) ACRCloud (needs ACRCLOUD_KEY + ACRCLOUD_SECRET env vars)
        if (process.env.ACRCLOUD_KEY && process.env.ACRCLOUD_SECRET) {
          try {
            const Acr = require('acrcloud');
            const acr = new Acr({
              host: 'identify-eu-west-1.acrcloud.com',
              access_key: process.env.ACRCLOUD_KEY,
              access_secret: process.env.ACRCLOUD_SECRET
            });
            const res = await acr.identify(fs.readFileSync(tmpPath));
            const music = res.status.code === 0 && res.metadata.music?.[0];
            if (music) {
              result = {
                title: music.title,
                artist: music.artists?.map((a) => a.name).join(', '),
                album: music.album?.name,
                genre: music.genres?.map((g) => g.name).join(', '),
                release: music.release_date
              };
            }
          } catch (e) {
            console.log('[SHAZAM] ACRCloud failed:', e.message);
          }
        }

        // 2) Fallback: audd.io
        if (!result) {
          try {
            const FormData = require('form-data');
            const form = new FormData();
            form.append('file', fs.createReadStream(tmpPath));
            form.append('return', 'apple_music,spotify');
            form.append('api_token', process.env.AUDD_API_KEY || 'test');
            const { data } = await axios.post('https://api.audd.io/', form, { headers: form.getHeaders(), timeout: 30000 });
            if (data?.status === 'success' && data?.result) {
              const r = data.result;
              result = { title: r.title, artist: r.artist, album: r.album, release: r.release_date };
            }
          } catch (e) {
            console.log('[SHAZAM] audd.io failed:', e.message);
          }
        }

        if (!result) return say(sock, chatId, message, '❌ Could not identify the song.');

        await say(sock, chatId, message,
          `🎵 *Song Identified!*\n\n` +
          `• 📌 *Title:*   ${result.title || '?'}\n` +
          `• 👤 *Artist:*  ${result.artist || '?'}\n` +
          `• 💽 *Album:*   ${result.album || '?'}\n` +
          `• 🎭 *Genre:*   ${result.genre || '?'}\n` +
          `• 📅 *Release:* ${result.release || '?'}\n\n` +
          `_Use \`.play ${result.title}\` to stream_`);
      } catch (e) {
        await say(sock, chatId, message, `❌ Shazam error: ${e.message}`);
      } finally {
        if (tmpPath) { try { fs.unlinkSync(tmpPath); } catch {} }
      }
    }
  },

  /* ---------- .spotify ---------- */
  {
    command: 'spotify',
    aliases: ['sptfdl', 'spotifydl'],
    category: 'download',
    description: 'Download music from Spotify URL',
    usage: '.spotify <spotify track URL>',
    async handler(sock, message, args, context = {}) {
      const chatId = chatOf(message, context);
      const url = args.join(' ').trim();
      if (!url || !url.includes('spotify.com')) {
        return say(sock, chatId, message,
          '🎵 *Spotify Downloader*\n\nUsage: `.spotify <spotify track url>`\nExample: `.spotify https://open.spotify.com/track/4LMlVCXHJtCE9abhmn0mYo`');
      }

      try {
        await sock.sendMessage(chatId, { react: { text: '🎵', key: message.key } });
        const { data } = await axios.get('https://api.qasimdev.dpdns.org/api/spotify/download', {
          params: { apiKey: QASIM_KEY, url },
          timeout: 30000
        });
        if (!data?.success || !data?.data) throw new Error('Invalid API response');

        const track = data.data;
        if (!track.download) return say(sock, chatId, message, '❌ No downloadable audio found.');

        const fmt = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`;
        const caption = [
          `🎵 *${track.title || 'Unknown'}*`,
          track.artist ? `👤 ${track.artist}` : '',
          track.duration ? `⏱ ${fmt(track.duration)}` : '',
          track.format ? `🎧 ${track.format.toUpperCase()}` : ''
        ].filter(Boolean).join('\n');

        if (track.cover) await sock.sendMessage(chatId, { image: { url: track.cover }, caption }, { quoted: message });
        else await say(sock, chatId, message, caption);

        await sock.sendMessage(chatId, {
          audio: { url: track.download },
          mimetype: 'audio/mpeg',
          fileName: `${(track.title || 'track').replace(/[\\/:*?"<>|]/g, '')}.mp3`
        }, { quoted: message });
      } catch (e) {
        await say(sock, chatId, message, `❌ Spotify failed: ${e.message}`);
      }
    }
  },

  /* ---------- .ringtone ---------- */
  {
    command: 'ringtone',
    aliases: ['ring', 'tone', 'ringtones'],
    category: 'music',
    description: 'Search and download ringtones',
    usage: '.ringtone <search term>',
    async handler(sock, message, args, context = {}) {
      const chatId = chatOf(message, context);
      const query = args.join(' ').trim();
      if (!query) return say(sock, chatId, message, '*Which ringtone do you want?*\nUsage: .ringtone <name>\n\nExample: .ringtone Nokia');

      try {
        await say(sock, chatId, message, '🔍 *Searching for ringtones...*');
        const { data } = await axios.get('https://discardapi.dpdns.org/api/dl/ringtone', {
          params: { apikey: 'guru', title: query },
          timeout: 30000
        });
        if (!data?.result?.length) return say(sock, chatId, message, '❌ *No ringtones found!*\nTry a different search term.');

        for (const tone of data.result.slice(0, 2)) {
          await sock.sendMessage(chatId, {
            audio: { url: tone.audio },
            mimetype: 'audio/mpeg',
            fileName: `${tone.title || query}.mp3`,
            ptt: false
          }, { quoted: message });
          await wait(500);
        }
      } catch (e) {
        await say(sock, chatId, message, `❌ Ringtone failed: ${e.message}`);
      }
    }
  },

  /* ---------- .soundcloud ---------- */
  {
    command: 'soundcloud',
    aliases: ['sc', 'scdl'],
    category: 'music',
    description: 'Download SoundCloud track',
    usage: '.soundcloud <SoundCloud URL>',
    async handler(sock, message, args, context = {}) {
      const chatId = chatOf(message, context);
      const url = args.join(' ').trim();
      if (!/^https?:\/\/\S*soundcloud\.com/i.test(url)) {
        return say(sock, chatId, message, '🎵 Usage: `.soundcloud <SoundCloud track URL>`');
      }

      try {
        await say(sock, chatId, message, '⏳ Fetching from SoundCloud...');
        const { data } = await axios.get('https://api.siputzx.my.id/api/d/soundcloud', { params: { url }, timeout: 30000 });
        const audioUrl = data?.data?.audio || data?.data?.download || data?.audio;
        const title = data?.data?.title || data?.title || 'track';
        if (!audioUrl) throw new Error('No audio URL from API');

        await sock.sendMessage(chatId, {
          audio: { url: audioUrl },
          mimetype: 'audio/mpeg',
          fileName: `${title}.mp3`,
          ptt: false
        }, { quoted: message });
      } catch (e) {
        await say(sock, chatId, message, `❌ SoundCloud failed: ${e.message}`);
      }
    }
  }
];

/* ===================== ADAPTER (bot loader format) ===================== */
// Your loader expects { name, execute(conn, mek, args, chatId, isOwner) }
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

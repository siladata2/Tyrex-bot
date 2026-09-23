'use strict';
/* TYREX_KSH MD - Sticker commands (deduplicated, single file)
 * Exports an ARRAY of commands in the same { command, aliases, handler } format
 * used by your bundles, so your loader will pick them up as before.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFile, spawn } = require('child_process');
const axios = require('axios');
const sharp = require('sharp');
const webp = require('node-webpmux');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { downloadContentFromMessage, downloadMediaMessage } = require('@whiskeysockets/baileys');
const { igdl } = require('ruhend-scraper');
const settings = require('../settings');

/* ===================== CONFIG ===================== */
const PACK = () => settings.packname || 'TYREX_KSH MD';
const AUTHOR = 'TYREX_KSH TECH';
// Keys/tokens: set these as environment variables (or in settings.js)
const TENOR_KEY = process.env.TENOR_KEY || 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ';
const TG_TOKEN = () => process.env.TELEGRAM_BOT_TOKEN || settings.telegramBotToken;

const TMP = path.join(process.cwd(), 'tmp');
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

/* ===================== HELPERS ===================== */
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const rm = (...files) => files.forEach((f) => { try { fs.unlinkSync(f); } catch {} });

const ctx = (message, context = {}) => ({
  chatId: context.chatId || message.key.remoteJid,
  ci: context.channelInfo || {}
});

const say = (sock, chatId, message, text, ci = {}) =>
  sock.sendMessage(chatId, { text, ...ci }, { quoted: message });

function ffmpeg(args) {
  return new Promise((resolve, reject) => {
    execFile('ffmpeg', ['-y', ...args], (err, _out, stderr) =>
      err ? reject(new Error(stderr || err.message)) : resolve()
    );
  });
}

// Convert image/video buffer -> webp sticker (auto-shrinks animated stickers)
async function toWebp(input, { animated = false, crop = false } = {}) {
  const id = uid();
  const inFile = path.join(TMP, `in_${id}`);
  const outFile = path.join(TMP, `out_${id}.webp`);
  fs.writeFileSync(inFile, input);

  const fit = (s, fps) => {
    const base = crop
      ? `crop=min(iw\\,ih):min(iw\\,ih),scale=${s}:${s}`
      : `scale=${s}:${s}:force_original_aspect_ratio=decrease,pad=${s}:${s}:(ow-iw)/2:(oh-ih)/2:color=#00000000`;
    return `${base}${animated ? `,fps=${fps}` : ',format=rgba'}`;
  };

  const attempts = animated
    ? [
        { s: 512, fps: 15, q: 75 },
        { s: 512, fps: 12, q: 45, t: 3 },
        { s: 512, fps: 8, q: 30, t: 2 },
        { s: 320, fps: 8, q: 28, t: 2 }
      ]
    : [{ s: 512, fps: 0, q: 75 }];

  try {
    let result;
    for (const a of attempts) {
      await ffmpeg([
        '-i', inFile,
        ...(a.t ? ['-t', String(a.t)] : []),
        '-vf', fit(a.s, a.fps),
        '-c:v', 'libwebp', '-preset', 'default', '-loop', '0',
        '-pix_fmt', 'yuva420p', '-quality', String(a.q), '-compression_level', '6',
        outFile
      ]);
      result = fs.readFileSync(outFile);
      if (result.length <= 900 * 1024) break;
    }
    return result;
  } finally {
    rm(inFile, outFile);
  }
}

// Write pack name / author / emoji into the webp EXIF
async function addExif(buffer, pack = PACK(), emoji = '🤖', author = AUTHOR) {
  const img = new webp.Image();
  await img.load(buffer);
  const json = {
    'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
    'sticker-pack-name': pack,
    'sticker-pack-publisher': author,
    emojis: [emoji]
  };
  const head = Buffer.from([
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
    0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00
  ]);
  const jb = Buffer.from(JSON.stringify(json), 'utf8');
  const exif = Buffer.concat([head, jb]);
  exif.writeUIntLE(jb.length, 14, 4);
  img.exif = exif;
  return await img.save(null);
}

async function makeSticker(buffer, { animated = false, crop = false, emoji = '🤖', pack } = {}) {
  return addExif(await toWebp(buffer, { animated, crop }), pack || PACK(), emoji);
}

// Get media from the replied message, or from the message itself (caption)
async function getMedia(sock, message, chatId, types) {
  let target = message;
  const c = message.message?.extendedTextMessage?.contextInfo;
  if (c?.quotedMessage) {
    target = {
      key: { remoteJid: chatId, id: c.stanzaId, participant: c.participant },
      message: c.quotedMessage
    };
  }
  const m = target.message || {};
  const type = types.find((t) => m[t]);
  if (!type) return null;
  const media = m[type];
  const buffer = await downloadMediaMessage(target, 'buffer', {}, {
    logger: undefined,
    reuploadRequest: sock.updateMediaMessage
  });
  if (!buffer) return null;
  const animated =
    type === 'videoMessage' ||
    !!media.isAnimated ||
    !!media.mimetype?.includes('gif') ||
    !!media.mimetype?.includes('video') ||
    media.seconds > 0;
  return { buffer, animated, type };
}

async function fetchBuffer(url, timeout = 30000) {
  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  return Buffer.from(res.data);
}

// Instagram post/reel -> stickers (used by both .igs and .igsc)
async function instaSticker(sock, message, context, crop) {
  const { chatId, ci } = ctx(message, context);
  const cmd = crop ? '.igsc' : '.igs';
  const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
  const urlMatch = text.match(/https?:\/\/\S+/);

  if (!urlMatch) {
    return say(sock, chatId, message, `Send an Instagram post/reel link.\nUsage: ${cmd} <url>`, ci);
  }

  try {
    await sock.sendMessage(chatId, { react: { text: '🔄', key: message.key } });

    const data = await igdl(urlMatch[0]).catch(() => null);
    if (!data || !data.data) {
      return say(sock, chatId, message, '❌ Failed to fetch media from Instagram link.', ci);
    }

    const seen = new Set();
    const items = (data.data || []).filter((m) => m && m.url && !seen.has(m.url) && seen.add(m.url));
    if (!items.length) {
      return say(sock, chatId, message, '❌ No media found at the provided link.', ci);
    }

    const hashes = new Set();
    const max = Math.min(items.length, 10);
    for (let i = 0; i < max; i++) {
      try {
        const it = items[i];
        const isVideo = it.type === 'video' || /\.(mp4|mov|avi|mkv|webm)$/i.test(it.url);
        const buf = await fetchBuffer(it.url);
        const h = crypto.createHash('sha1').update(buf).digest('hex');
        if (hashes.has(h)) continue;
        hashes.add(h);

        const sticker = await makeSticker(buf, { animated: isVideo, crop, emoji: crop ? '✂️' : '📸' });
        await sock.sendMessage(chatId, { sticker, ...ci }, { quoted: message });
        if (i < max - 1) await delay(800);
      } catch (e) {
        console.error(`${cmd} item error:`, e);
      }
    }
  } catch (err) {
    console.error(`Error in ${cmd}:`, err);
    await say(sock, chatId, message, '❌ Failed to create sticker from Instagram link.', ci);
  }
}

// Blinking colored text video for .attp
function renderBlinkingVideo(text) {
  return new Promise((resolve, reject) => {
    const fontPath = process.platform === 'win32'
      ? 'C\\:/Windows/Fonts/arialbd.ttf'
      : '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';

    const safe = text
      .replace(/\\/g, '\\\\')
      .replace(/:/g, '\\:')
      .replace(/,/g, '\\,')
      .replace(/'/g, "\\'")
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/%/g, '\\%');

    const cycle = 0.3;
    const dur = 1.8;
    const layer = (color, cond) =>
      `drawtext=fontfile='${fontPath}':text='${safe}':fontcolor=${color}:borderw=2:bordercolor=black@0.6:fontsize=56:x=(w-text_w)/2:y=(h-text_h)/2:enable='${cond}'`;

    const filter = [
      layer('red', `lt(mod(t,${cycle}),0.1)`),
      layer('blue', `between(mod(t,${cycle}),0.1,0.2)`),
      layer('green', `gte(mod(t,${cycle}),0.2)`)
    ].join(',');

    const ff = spawn('ffmpeg', [
      '-y', '-f', 'lavfi', '-i', `color=c=black:s=512x512:d=${dur}:r=20`,
      '-vf', filter,
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart+frag_keyframe+empty_moov',
      '-t', String(dur), '-f', 'mp4', 'pipe:1'
    ]);
    const out = [];
    const errs = [];
    ff.stdout.on('data', (d) => out.push(d));
    ff.stderr.on('data', (e) => errs.push(e));
    ff.on('error', reject);
    ff.on('close', (code) =>
      code === 0
        ? resolve(Buffer.concat(out))
        : reject(new Error(Buffer.concat(errs).toString() || `ffmpeg exited with code ${code}`))
    );
  });
}

/* ===================== COMMANDS ===================== */
module.exports = [
  /* ---------- .sticker (wa-sticker-formatter, supports types) ---------- */
  {
    command: 'sticker',
    aliases: ['s', 'sk'],
    category: 'stickers',
    description: 'Create a sticker from an image or video',
    usage: '.sticker (reply to image/video) [default|full|circle|rounded|crop]',
    async handler(sock, message, args, context = {}) {
      const { chatId, ci } = ctx(message, context);
      try {
        const media = await getMedia(sock, message, chatId, ['imageMessage', 'videoMessage']);
        if (!media) return say(sock, chatId, message, '❌ Reply to an image or video.', ci);

        const typeMap = {
          default: StickerTypes.DEFAULT,
          full: StickerTypes.FULL,
          circle: StickerTypes.CIRCLE,
          rounded: StickerTypes.ROUNDED,
          crop: StickerTypes.CROPPED
        };
        const type = typeMap[(args[0] || '').toLowerCase()] || StickerTypes.DEFAULT;

        const sticker = new Sticker(media.buffer, {
          pack: PACK(),
          author: AUTHOR,
          type,
          quality: 80,
          categories: ['🤖', '✨']
        });

        await sock.sendMessage(chatId, { sticker: await sticker.toBuffer(), ...ci }, { quoted: message });
      } catch (error) {
        console.error('Sticker creation error:', error);
        await say(sock, chatId, message, '❌ Failed to create sticker.', ci);
      }
    }
  },

  /* ---------- .sticker2 (ffmpeg, keeps full image with padding) ---------- */
  {
    command: 'sticker2',
    aliases: ['s2', 'stik2'],
    category: 'stickers',
    description: 'Convert image/video to sticker (ffmpeg method)',
    usage: '.sticker2 (reply to image/video or send with caption)',
    async handler(sock, message, args, context = {}) {
      const { chatId, ci } = ctx(message, context);
      try {
        const media = await getMedia(sock, message, chatId, ['imageMessage', 'videoMessage', 'documentMessage']);
        if (!media) {
          return say(sock, chatId, message,
            'Please reply to an image/video with .sticker2, or send an image/video with .sticker2 as the caption.', ci);
        }
        const sticker = await makeSticker(media.buffer, { animated: media.animated });
        await sock.sendMessage(chatId, { sticker, ...ci }, { quoted: message });
      } catch (error) {
        console.error('Error in sticker2 command:', error);
        await say(sock, chatId, message, 'Failed to create sticker! Try again later.', ci);
      }
    }
  },

  /* ---------- .crop ---------- */
  {
    command: 'crop',
    aliases: ['stickercrop', 'scrop'],
    category: 'stickers',
    description: 'Crop image/video/sticker into a square sticker',
    usage: '.crop (reply to image/video/sticker)',
    async handler(sock, message, args, context = {}) {
      const { chatId, ci } = ctx(message, context);
      try {
        const media = await getMedia(sock, message, chatId,
          ['imageMessage', 'videoMessage', 'documentMessage', 'stickerMessage']);
        if (!media) {
          return say(sock, chatId, message,
            'Please reply to an image/video/sticker with .crop, or send one with .crop as the caption.', ci);
        }
        const sticker = await makeSticker(media.buffer, { animated: media.animated, crop: true, emoji: '✂️' });
        await sock.sendMessage(chatId, { sticker, ...ci }, { quoted: message });
      } catch (error) {
        console.error('Error in crop command:', error);
        await say(sock, chatId, message, 'Failed to crop sticker! Try with an image.', ci);
      }
    }
  },

  /* ---------- .take ---------- */
  {
    command: 'take',
    aliases: ['steal', 'wm'],
    category: 'stickers',
    description: 'Change sticker pack name',
    usage: '.take <packname> (reply to sticker)',
    async handler(sock, message, args, context = {}) {
      const { chatId, ci } = ctx(message, context);
      try {
        const media = await getMedia(sock, message, chatId, ['stickerMessage']);
        if (!media) return say(sock, chatId, message, '❌ Reply to a sticker with .take <packname>', ci);

        const pack = args.join(' ').trim() || PACK();
        const sticker = await addExif(media.buffer, pack);
        await sock.sendMessage(chatId, { sticker, ...ci }, { quoted: message });
      } catch (error) {
        console.error('Error in take command:', error);
        await say(sock, chatId, message, '❌ Error processing sticker', ci);
      }
    }
  },

  /* ---------- .stickername (owner) ---------- */
  {
    command: 'stickername',
    aliases: ['setpack'],
    category: 'owner',
    description: 'Change default sticker pack name',
    usage: '.stickername <new pack name>',
    async handler(sock, message, args, context = {}) {
      const { chatId } = ctx(message, context);
      if (!message.key.fromMe) {
        return say(sock, chatId, message, '❌ This command can only be used by the bot itself.');
      }
      const newName = args.join(' ').trim();
      if (!newName) {
        return say(sock, chatId, message, '❌ Please provide a new sticker pack name.\nExample: .stickername TYREX_KSH MD Pack');
      }
      try {
        const store = require('../lib/lightweight_store');
        await store.saveSetting('global', 'stickerPackName', newName);
        await say(sock, chatId, message, `✅ Sticker pack name changed to: *${newName}*`);
      } catch (error) {
        console.error('StickerName error:', error);
        await say(sock, chatId, message, `❌ Failed to save sticker name: ${error.message}`);
      }
    }
  },

  /* ---------- .stickerpack ---------- */
  {
    command: 'stickerpack',
    aliases: ['spack', 'getstickers'],
    category: 'stickers',
    description: 'Extract all stickers from a sticker pack message',
    usage: '.stickerpack (reply to a sticker pack message)',
    async handler(sock, message, args, context = {}) {
      const { chatId } = ctx(message, context);
      try {
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted?.stickerPackMessage) {
          return say(sock, chatId, message, '❌ Please reply to a *sticker pack message*.');
        }

        const pack = quoted.stickerPackMessage;
        const stickers = pack.stickers || [];
        if (!stickers.length) return say(sock, chatId, message, '❌ No stickers found in this pack.');

        await sock.sendMessage(chatId, {
          text: `📦 Sticker pack: *${pack.name || 'Unnamed'}*\nPublisher: ${pack.publisher || 'Unknown'}\nExtracting ${stickers.length} sticker(s)...`
        });

        for (let i = 0; i < stickers.length; i++) {
          const s = stickers[i];
          try {
            const stream = await downloadContentFromMessage({
              url: `https://mmg.whatsapp.net${s.directPath}`,
              directPath: s.directPath,
              mediaKey: s.mediaKey,
              mimetype: s.mimetype || 'image/webp',
              fileEncSha256: s.fileEncSha256,
              fileSha256: s.fileSha256,
              fileLength: s.fileLength
            }, 'sticker');

            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            await sock.sendMessage(chatId, { sticker: buffer });
          } catch (err) {
            console.error(`Failed to download sticker ${i + 1}:`, err);
            await sock.sendMessage(chatId, { text: `⚠️ Failed to download sticker ${i + 1}.` });
          }
          await delay(500);
        }

        await sock.sendMessage(chatId, { text: '✅ All stickers extracted!' });
      } catch (error) {
        console.error('Error in stickerpack command:', error);
        await say(sock, chatId, message, '❌ An error occurred while processing the sticker pack.');
      }
    }
  },

  /* ---------- .tgstk ---------- */
  {
    command: 'tgstk',
    aliases: ['telegram', 'tgsticker'],
    category: 'stickers',
    description: 'Download stickers from Telegram',
    usage: '.tgstk <telegram sticker URL>',
    async handler(sock, message, args, context = {}) {
      const { chatId, ci } = ctx(message, context);
      const link = args[0];

      if (!link) {
        return say(sock, chatId, message,
          '⚠️ Please enter the Telegram sticker URL!\n\nExample: .tgstk https://t.me/addstickers/Porcientoreal', ci);
      }
      if (!/^https:\/\/t\.me\/addstickers\//i.test(link)) {
        return say(sock, chatId, message, "❌ Invalid URL! Make sure it's a Telegram sticker URL.", ci);
      }
      const token = TG_TOKEN();
      if (!token) {
        return say(sock, chatId, message, '❌ Telegram bot token is not configured (set TELEGRAM_BOT_TOKEN).', ci);
      }

      const packName = link.replace(/^https:\/\/t\.me\/addstickers\//i, '').split(/[?#]/)[0];

      try {
        const { data: set } = await axios.get(`https://api.telegram.org/bot${token}/getStickerSet`, {
          params: { name: packName },
          timeout: 30000
        });
        if (!set.ok || !set.result) throw new Error('Invalid sticker pack or API response');

        const list = set.result.stickers;
        await say(sock, chatId, message, `📦 Found ${list.length} stickers\n⏳ Starting download...`, ci);

        let ok = 0;
        for (let i = 0; i < list.length; i++) {
          const st = list[i];
          if (st.is_animated) continue; // .tgs (Lottie) cannot be converted with ffmpeg
          try {
            const { data: f } = await axios.get(`https://api.telegram.org/bot${token}/getFile`, {
              params: { file_id: st.file_id },
              timeout: 30000
            });
            if (!f.ok || !f.result?.file_path) continue;

            const buf = await fetchBuffer(`https://api.telegram.org/file/bot${token}/${f.result.file_path}`);
            const sticker = await makeSticker(buf, { animated: !!st.is_video, emoji: st.emoji || '🤖' });
            await sock.sendMessage(chatId, { sticker, ...ci });
            ok++;
            await delay(1000);
          } catch (err) {
            console.error(`Error processing sticker ${i}:`, err);
          }
        }

        await say(sock, chatId, message, `✅ Successfully downloaded ${ok}/${list.length} stickers!`, ci);
      } catch (error) {
        console.error('Error in tgstk command:', error);
        await say(sock, chatId, message,
          '❌ Failed to process Telegram stickers!\nMake sure:\n1. The URL is correct\n2. The sticker pack exists\n3. The sticker pack is public', ci);
      }
    }
  },

  /* ---------- .emojimix ---------- */
  {
    command: 'emojimix',
    aliases: ['mixemoji', 'emix'],
    category: 'stickers',
    description: 'Mix two emojis into a sticker',
    usage: '.emojimix 😎+🥰',
    async handler(sock, message, args, context = {}) {
      const { chatId, ci } = ctx(message, context);
      const input = args.join('');

      if (!input) return say(sock, chatId, message, '🎴 Example: .emojimix 😎+🥰', ci);
      if (!input.includes('+')) {
        return say(sock, chatId, message, '✳️ Separate the emoji with a *+* sign\n\n📌 Example:\n.emojimix 😎+🥰', ci);
      }

      try {
        const [e1, e2] = input.split('+').map((e) => e.trim());
        const { data } = await axios.get('https://tenor.googleapis.com/v2/featured', {
          params: {
            key: TENOR_KEY,
            contentfilter: 'high',
            media_filter: 'png_transparent',
            component: 'proactive',
            collection: 'emoji_kitchen_v5',
            q: `${e1}_${e2}`
          },
          timeout: 30000
        });

        if (!data.results?.length) {
          return say(sock, chatId, message, '❌ These emojis cannot be mixed! Try different ones.', ci);
        }

        const png = await fetchBuffer(data.results[0].url);
        const sticker = await makeSticker(png, { emoji: e1 });
        await sock.sendMessage(chatId, { sticker, ...ci }, { quoted: message });
      } catch (error) {
        console.error('Error in emojimix command:', error);
        await say(sock, chatId, message, '❌ Failed to mix emojis!\n\n📌 Example:\n.emojimix 😎+🥰', ci);
      }
    }
  },

  /* ---------- .s2img ---------- */
  {
    command: 's2img',
    aliases: ['simage', 'stoimg'],
    category: 'stickers',
    description: 'Convert a sticker to an image',
    usage: '.s2img (reply to a sticker)',
    async handler(sock, message, args, context = {}) {
      const { chatId } = ctx(message, context);
      try {
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted?.stickerMessage) {
          return say(sock, chatId, message, '⚠️ Reply to a sticker with .s2img to convert it.');
        }

        const stream = await downloadContentFromMessage(quoted.stickerMessage, 'sticker');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

        const png = await sharp(buffer).png().toBuffer();
        await sock.sendMessage(chatId, { image: png, caption: '✨ Here is the converted image!' }, { quoted: message });
      } catch (error) {
        console.error('s2img error:', error);
        await say(sock, chatId, message, '❌ An error occurred while converting the sticker.');
      }
    }
  },

  /* ---------- .igs / .igsc ---------- */
  {
    command: 'igs',
    aliases: ['igsticker', 'instasticker'],
    category: 'stickers',
    description: 'Convert Instagram post/reel to sticker',
    usage: '.igs <instagram URL>',
    async handler(sock, message, args, context = {}) {
      return instaSticker(sock, message, context, false);
    }
  },
  {
    command: 'igsc',
    aliases: ['igstickercrop', 'instacrop'],
    category: 'stickers',
    description: 'Convert Instagram post/reel to cropped sticker',
    usage: '.igsc <instagram URL>',
    async handler(sock, message, args, context = {}) {
      return instaSticker(sock, message, context, true);
    }
  },

  /* ---------- .attp ---------- */
  {
    command: 'attp',
    aliases: ['texts', 'textsticker'],
    category: 'stickers',
    description: 'Generate an animated sticker from text',
    usage: '.attp <text>',
    async handler(sock, message, args, context = {}) {
      const { chatId } = ctx(message, context);
      const text = args.join(' ');
      if (!text) return say(sock, chatId, message, 'Please provide text after the .attp command.');

      try {
        const mp4 = await renderBlinkingVideo(text);
        const sticker = await makeSticker(mp4, { animated: true, emoji: '💬' });
        await sock.sendMessage(chatId, { sticker }, { quoted: message });
      } catch (error) {
        console.error('attp error:', error);
        await say(sock, chatId, message, '❌ Failed to generate the sticker locally.');
      }
    }
  },

  /* ---------- .gif ---------- */
  {
    command: 'gif',
    aliases: ['giphy', 'searchgif'],
    category: 'stickers',
    description: 'Get a GIF based on a search term',
    usage: '.gif <search term>',
    async handler(sock, message, args, context = {}) {
      const { chatId } = ctx(message, context);
      const query = args.join(' ');
      if (!query) return say(sock, chatId, message, 'Please provide a search term for the GIF.');

      try {
        const { data } = await axios.get('https://api.giphy.com/v1/gifs/search', {
          params: { api_key: settings.giphyApiKey, q: query, limit: 1, rating: 'g' }
        });
        const gif = data.data?.[0];
        if (!gif) return say(sock, chatId, message, 'No GIFs found for your search term.');

        const mp4 = gif.images.original_mp4?.mp4;
        if (mp4) {
          await sock.sendMessage(chatId, { video: { url: mp4 }, caption: `Here is your GIF for "${query}"` }, { quoted: message });
        } else {
          await sock.sendMessage(chatId, {
            document: { url: gif.images.original?.url },
            mimetype: 'image/gif',
            caption: `Here is your GIF for "${query}"`
          }, { quoted: message });
        }
      } catch (error) {
        console.error('Error in gif command:', error);
        await say(sock, chatId, message, '❌ Failed to fetch GIF. Please try again later.');
      }
    }
  },

  /* ---------- .quoted ---------- */
  {
    command: 'quoted',
    aliases: ['q', 'fakereply'],
    category: 'stickers',
    description: 'Generate a quote sticker from text',
    usage: '.quoted <text> or reply to a message',
    async handler(sock, message, args, context = {}) {
      const { chatId } = ctx(message, context);
      const info = message.message?.extendedTextMessage?.contextInfo;
      let text = args.join(' ').trim();

      try {
        if (!text && !info?.quotedMessage) {
          return say(sock, chatId, message, '📝 Please provide some text or reply to a message to create a quote.\n\nUsage: .quoted <text>');
        }

        if (!text && info?.quotedMessage) {
          const q = info.quotedMessage;
          text = q.conversation || q.extendedTextMessage?.text || q.imageMessage?.caption || q.videoMessage?.caption || 'Media message';
        }

        const sender = message.key.participant || message.key.remoteJid;
        const who = info?.participant || info?.mentionedJid?.[0] || sender;

        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

        let pfp;
        try {
          pfp = await sock.profilePictureUrl(who, 'image');
        } catch {
          pfp = 'https://i.ibb.co/9HY4wjz/a4c0b1af253197d4837ff6760d5b81c0.jpg';
        }

        const name = who === sender && message.pushName ? message.pushName : who.split('@')[0];

        const res = await axios.post('https://bot.lyo.su/quote/generate', {
          type: 'quote',
          format: 'png',
          backgroundColor: '#FFFFFF',
          width: 1800,
          height: 200,
          scale: 2,
          messages: [{ entities: [], avatar: true, from: { id: 1, name, photo: { url: pfp } }, text, replyMessage: {} }]
        }, { headers: { 'Content-Type': 'application/json' }, timeout: 30000 });

        if (!res.data?.result?.image) throw new Error('Invalid API response');
        const img = Buffer.from(res.data.result.image, 'base64');

        try {
          const sticker = new Sticker(img, {
            pack: PACK(),
            author: name,
            type: StickerTypes.FULL,
            categories: ['🤩', '🎉'],
            id: Math.floor(100000 + Math.random() * 900000).toString(),
            quality: 100,
            background: '#00000000'
          });
          await sock.sendMessage(chatId, { sticker: await sticker.toBuffer() }, { quoted: message });
          await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
        } catch (stickerError) {
          console.error('Error sending sticker:', stickerError);
          await sock.sendMessage(chatId, { image: img, caption: '📝 Quote image (sticker conversion failed)' }, { quoted: message });
          await sock.sendMessage(chatId, { react: { text: '⚠️', key: message.key } });
        }
      } catch (err) {
        console.error('Quote plugin error:', err);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });

        let msg = '❌ Failed to generate quote. ';
        if (err.message.includes('timeout')) msg += 'Request timed out. Please try again.';
        else if (err.message.includes('Invalid API response')) msg += 'API returned invalid data.';
        else msg += 'Please try again later.';
        await say(sock, chatId, message, msg);
      }
    }
  }
];

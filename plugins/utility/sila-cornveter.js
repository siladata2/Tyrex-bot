const fs = require('fs');
const { exec, execFile } = require('child_process');
const axios = require('axios');
const path = require('path');

//=====================================================================
// HELPER: Convert buffer to PTT (voice note)
//=====================================================================
async function toPtt(buffer) {
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const timestamp = Date.now();
  const inputPath = path.join(tempDir, `ptt_in_${timestamp}.tmp`);
  const outputPath = path.join(tempDir, `ptt_out_${timestamp}.ogg`);

  fs.writeFileSync(inputPath, buffer);

  const cleanup = () => {
    try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch {}
    try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch {}
  };

  return new Promise((resolve, reject) => {
    execFile('ffmpeg', [
      '-y', '-i', inputPath,
      '-c:a', 'libopus',
      '-b:a', '64k',
      '-ar', '48000',
      '-ac', '1',
      '-f', 'ogg',
      outputPath
    ], { timeout: 120000 }, (err) => {
      if (err) { cleanup(); return reject(err); }
      try {
        const out = fs.readFileSync(outputPath);
        cleanup();
        resolve(out);
      } catch (e) { cleanup(); reject(e); }
    });
  });
}

//=====================================================================
// HELPER: Random filename
//=====================================================================
function randomFile(ext) {
  return path.join(__dirname, `temp_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
}

//=====================================================================
// 1. TOPTT - Convert audio to voice note
//=====================================================================
module.exports = {
  name: 'toptt',
  aliases: ['tovoice', 'tovn', 'tovoicenote'],
  category: 'converter',
  description: 'Convert audio to WhatsApp voice note',
  usage: '.toptt (reply to audio)',
  react: '🎙️',
  async execute(conn, mek, args, chatId) {
    await conn.sendMessage(chatId, { react: { text: '🎙️', key: mek.key } });

    const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedAudio = quoted?.audioMessage;

    if (!quotedAudio) {
      return conn.sendMessage(chatId, { text: '❌ Reply to an audio message.' }, { quoted: mek });
    }

    let tempFilePath;
    try {
      tempFilePath = await conn.downloadAndSaveMediaMessage(
        { message: { audioMessage: quotedAudio } },
        'temp_media'
      );
      const buffer = fs.readFileSync(tempFilePath);
      const convertedBuffer = await toPtt(buffer);

      await conn.sendMessage(chatId, {
        audio: convertedBuffer,
        mimetype: 'audio/ogg; codecs=opus',
        ptt: true
      }, { quoted: mek });

      await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
    } catch (e) {
      console.error('toptt error:', e);
      await conn.sendMessage(chatId, { text: '❌ Failed to convert to voice note.' }, { quoted: mek });
    } finally {
      if (tempFilePath) fs.unlink(tempFilePath, () => {});
    }
  }
};

//=====================================================================
// 2. TTS - Text to speech
//=====================================================================
module.exports = {
  name: 'tts',
  aliases: ['say'],
  category: 'tools',
  description: 'Convert text or quoted message to speech',
  usage: '.tts <text> (or reply)',
  react: '🔊',
  async execute(conn, mek, args, chatId) {
    await conn.sendMessage(chatId, { react: { text: '🔊', key: mek.key } });

    const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    let text = args.join(' ').trim();

    if (!text && quoted) {
      text = quoted.conversation || quoted.extendedTextMessage?.text || '';
    }

    if (!text) {
      return conn.sendMessage(chatId, { text: '📌 Reply to a text message or provide text directly.' }, { quoted: mek });
    }

    try {
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=id&client=tw-ob`;
      await conn.sendMessage(chatId, {
        audio: { url: ttsUrl },
        mimetype: 'audio/mpeg',
        ptt: false
      }, { quoted: mek });

      await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
    } catch (error) {
      console.error('TTS error:', error);
      await conn.sendMessage(chatId, { text: '⚠️ Error while generating speech.' }, { quoted: mek });
    }
  }
};

//=====================================================================
// 3. TOMP3 - Convert audio/video to MP3
//=====================================================================
module.exports = {
  name: 'tomp3',
  aliases: ['audioextract', 'toaudio'],
  category: 'converter',
  description: 'Convert quoted audio or video to MP3',
  usage: '.tomp3 (reply to audio/video)',
  react: '🎵',
  async execute(conn, mek, args, chatId) {
    await conn.sendMessage(chatId, { react: { text: '🎵', key: mek.key } });

    const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const mediaType = quoted?.videoMessage || quoted?.audioMessage;

    if (!mediaType) {
      return conn.sendMessage(chatId, { text: '❌ Reply to an audio or video.' }, { quoted: mek });
    }

    try {
      const mediaPath = await conn.downloadAndSaveMediaMessage(
        quoted.videoMessage ? { message: { videoMessage: quoted.videoMessage } } : { message: { audioMessage: quoted.audioMessage } }
      );
      const buffer = fs.readFileSync(mediaPath);

      await conn.sendMessage(chatId, {
        audio: buffer,
        mimetype: 'audio/mpeg'
      }, { quoted: mek });

      fs.unlinkSync(mediaPath);
      await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
    } catch (error) {
      console.error('tomp3 error:', error);
      await conn.sendMessage(chatId, { text: '❌ Error while converting.' }, { quoted: mek });
    }
  }
};

//=====================================================================
// 4. TOM4A - Convert audio/video to M4A
//=====================================================================
module.exports = {
  name: 'tom4a',
  aliases: ['m4a'],
  category: 'converter',
  description: 'Convert quoted audio or video to M4A',
  usage: '.tom4a (reply to audio/video)',
  react: '🎶',
  async execute(conn, mek, args, chatId) {
    await conn.sendMessage(chatId, { react: { text: '🎶', key: mek.key } });

    const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const mediaType = quoted?.videoMessage || quoted?.audioMessage;

    if (!mediaType) {
      return conn.sendMessage(chatId, { text: '❌ Reply to an audio or video.' }, { quoted: mek });
    }

    try {
      const mediaPath = await conn.downloadAndSaveMediaMessage(
        quoted.videoMessage ? { message: { videoMessage: quoted.videoMessage } } : { message: { audioMessage: quoted.audioMessage } }
      );
      const buffer = fs.readFileSync(mediaPath);

      await conn.sendMessage(chatId, {
        audio: buffer,
        mimetype: 'audio/mp4'
      }, { quoted: mek });

      fs.unlinkSync(mediaPath);
      await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
    } catch (error) {
      console.error('tom4a error:', error);
      await conn.sendMessage(chatId, { text: '❌ Error while converting.' }, { quoted: mek });
    }
  }
};

//=====================================================================
// 5. TOIMG - Sticker to image
//=====================================================================
module.exports = {
  name: 'toimg',
  aliases: ['sticker2img', 'webp2png'],
  category: 'converter',
  description: 'Convert quoted sticker to image',
  usage: '.toimg (reply to sticker)',
  react: '🖼️',
  async execute(conn, mek, args, chatId) {
    await conn.sendMessage(chatId, { react: { text: '🖼️', key: mek.key } });

    const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted?.stickerMessage) {
      return conn.sendMessage(chatId, { text: '❌ Reply to a sticker.' }, { quoted: mek });
    }

    try {
      const mediaPath = await conn.downloadAndSaveMediaMessage({ message: { stickerMessage: quoted.stickerMessage } });
      const isAnimated = quoted.stickerMessage.isAnimated;

      if (isAnimated) {
        await conn.sendMessage(chatId, {
          video: fs.readFileSync(mediaPath),
          mimetype: 'video/mp4',
          caption: '🎞️ Converted from animated sticker'
        }, { quoted: mek });
      } else {
        await conn.sendMessage(chatId, {
          image: fs.readFileSync(mediaPath),
          caption: '🖼️ Converted from sticker'
        }, { quoted: mek });
      }

      fs.unlinkSync(mediaPath);
      await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
    } catch (e) {
      console.error('toimg error:', e);
      await conn.sendMessage(chatId, { text: '❌ Unable to convert sticker.' }, { quoted: mek });
    }
  }
};

//=====================================================================
// 6. IMGSIZE - Get image dimensions
//=====================================================================
module.exports = {
  name: 'imgsize',
  aliases: ['imagesize', 'dimension'],
  category: 'utility',
  description: 'Get dimensions of quoted image',
  usage: '.imgsize (reply to image)',
  react: '📐',
  async execute(conn, mek, args, chatId) {
    await conn.sendMessage(chatId, { react: { text: '📐', key: mek.key } });

    const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted?.imageMessage) {
      return conn.sendMessage(chatId, { text: '📌 Reply to an image.' }, { quoted: mek });
    }

    const mediaPath = await conn.downloadAndSaveMediaMessage({ message: { imageMessage: quoted.imageMessage } });

    exec(`ffmpeg -i ${mediaPath} -f null - 2>&1 | grep -oP 'Stream.*Video:.*\\s\\K\\d+x\\d+'`, async (err, stdout) => {
      try { fs.unlinkSync(mediaPath); } catch {}

      if (err || !stdout) {
        return conn.sendMessage(chatId, { text: '❌ Couldn\'t detect dimensions.' }, { quoted: mek });
      }

      await conn.sendMessage(chatId, { text: `🖼️ Dimensions: ${stdout.trim()}` }, { quoted: mek });
      await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
    });
  }
};

//=====================================================================
// 7. RESIZE - Resize image
//=====================================================================
module.exports = {
  name: 'resize',
  aliases: ['imgresize'],
  category: 'utility',
  description: 'Resize quoted image to given dimensions',
  usage: '.resize 300×250 (reply to image)',
  react: '🖼️',
  async execute(conn, mek, args, chatId) {
    await conn.sendMessage(chatId, { react: { text: '🖼️', key: mek.key } });

    const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted?.imageMessage) {
      return conn.sendMessage(chatId, { text: '📌 Reply to an image.' }, { quoted: mek });
    }

    const q = args.join(' ');
    if (!q || !q.match(/^\d+[×x]\d+$/)) {
      return conn.sendMessage(chatId, { text: '📌 Provide dimensions like *300×250*' }, { quoted: mek });
    }

    const [width, height] = q.split(/[×x]/).map(Number);
    if (width <= 0 || height <= 0 || width > 5000 || height > 5000) {
      return conn.sendMessage(chatId, { text: '❌ Invalid dimensions.' }, { quoted: mek });
    }

    const mediaPath = await conn.downloadAndSaveMediaMessage({ message: { imageMessage: quoted.imageMessage } });
    const outputPath = randomFile('.jpg');

    exec(`ffmpeg -i ${mediaPath} -vf "scale=${width}:${height}" ${outputPath}`, async (error) => {
      try { fs.unlinkSync(mediaPath); } catch {}

      if (error) {
        return conn.sendMessage(chatId, { text: '❌ Error resizing image.' }, { quoted: mek });
      }

      const imageBuffer = fs.readFileSync(outputPath);
      await conn.sendMessage(chatId, {
        image: imageBuffer,
        caption: `Resized to ${width}×${height}`
      }, { quoted: mek });

      try { fs.unlinkSync(outputPath); } catch {}
      await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
    });
  }
};

//=====================================================================
// 8. TRIM - Trim audio/video
//=====================================================================
module.exports = {
  name: 'trim',
  aliases: ['cut'],
  category: 'utility',
  description: 'Trim quoted audio or video',
  usage: '.trim 0:10 0:30 (reply to media)',
  react: '✂️',
  async execute(conn, mek, args, chatId) {
    await conn.sendMessage(chatId, { react: { text: '✂️', key: mek.key } });

    const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) {
      return conn.sendMessage(chatId, { text: '❌ Reply to an audio or video.\nExample: `.trim 0:10 0:30`' }, { quoted: mek });
    }

    const [startTime, endTime] = args.join(' ').split(' ').map(t => t.trim());
    if (!startTime || !endTime) {
      return conn.sendMessage(chatId, { text: '⚠️ Example: `.trim 0:10 0:30`' }, { quoted: mek });
    }

    const isAudio = !!quoted.audioMessage;
    const isVideo = !!quoted.videoMessage;
    if (!isAudio && !isVideo) {
      return conn.sendMessage(chatId, { text: '❌ Unsupported media.' }, { quoted: mek });
    }

    try {
      const mediaPath = await conn.downloadAndSaveMediaMessage(
        isAudio ? { message: { audioMessage: quoted.audioMessage } } : { message: { videoMessage: quoted.videoMessage } }
      );
      const outputExt = isAudio ? '.mp3' : '.mp4';
      const outputPath = randomFile(outputExt);

      exec(`ffmpeg -i ${mediaPath} -ss ${startTime} -to ${endTime} -c copy ${outputPath}`, async (err) => {
        try { fs.unlinkSync(mediaPath); } catch {}

        if (err) {
          return conn.sendMessage(chatId, { text: '❌ Trimming failed.' }, { quoted: mek });
        }

        const buffer = fs.readFileSync(outputPath);
        const message = isAudio
          ? { audio: buffer, mimetype: 'audio/mpeg' }
          : { video: buffer, mimetype: 'video/mp4' };

        await conn.sendMessage(chatId, message, { quoted: mek });
        try { fs.unlinkSync(outputPath); } catch {}
        await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
      });
    } catch (error) {
      console.error('trim error:', error);
      await conn.sendMessage(chatId, { text: '❌ Error while processing.' }, { quoted: mek });
    }
  }
};

//=====================================================================
// 9. VOLUME - Adjust volume
//=====================================================================
module.exports = {
  name: 'volume',
  aliases: ['vol'],
  category: 'utility',
  description: 'Adjust volume of quoted audio/video',
  usage: '.volume 1.5 (reply to media)',
  react: '🔉',
  async execute(conn, mek, args, chatId) {
    await conn.sendMessage(chatId, { react: { text: '🔉', key: mek.key } });

    const q = args.join(' ').trim();
    if (!q) {
      return conn.sendMessage(chatId, { text: '⚠️ Example: `.volume 1.5`' }, { quoted: mek });
    }

    const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const isAudio = !!quoted?.audioMessage;
    const isVideo = !!quoted?.videoMessage;
    if (!isAudio && !isVideo) {
      return conn.sendMessage(chatId, { text: '❌ Reply to an audio or video.' }, { quoted: mek });
    }

    try {
      const mediaPath = await conn.downloadAndSaveMediaMessage(
        isAudio ? { message: { audioMessage: quoted.audioMessage } } : { message: { videoMessage: quoted.videoMessage } }
      );
      const outputExt = isAudio ? '.mp3' : '.mp4';
      const outputPath = randomFile(outputExt);

      exec(`ffmpeg -i ${mediaPath} -filter:a volume=${q} ${outputPath}`, async (err) => {
        try { fs.unlinkSync(mediaPath); } catch {}

        if (err) {
          return conn.sendMessage(chatId, { text: '❌ Volume adjustment failed.' }, { quoted: mek });
        }

        const buffer = fs.readFileSync(outputPath);
        const message = isAudio
          ? { audio: buffer, mimetype: 'audio/mpeg' }
          : { video: buffer, mimetype: 'video/mp4' };

        await conn.sendMessage(chatId, message, { quoted: mek });
        try { fs.unlinkSync(outputPath); } catch {}
        await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
      });
    } catch (error) {
      console.error('volume error:', error);
      await conn.sendMessage(chatId, { text: '❌ Error while processing.' }, { quoted: mek });
    }
  }
};

//=====================================================================
// 10. AMPLIFY - Replace video audio with URL
//=====================================================================
module.exports = {
  name: 'amplify',
  aliases: ['replaceaudio', 'mergeaudio'],
  category: 'utility',
  description: 'Replace quoted video audio with URL',
  usage: '.amplify <audio_url> (reply to video)',
  react: '🔊',
  async execute(conn, mek, args, chatId) {
    await conn.sendMessage(chatId, { react: { text: '🔊', key: mek.key } });

    const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted?.videoMessage) {
      return conn.sendMessage(chatId, { text: '❌ Reply to a video.' }, { quoted: mek });
    }

    const audioUrl = args.join(' ').trim();
    if (!audioUrl) {
      return conn.sendMessage(chatId, { text: '❌ Provide an audio URL.' }, { quoted: mek });
    }

    try {
      const media = await conn.downloadAndSaveMediaMessage({ message: { videoMessage: quoted.videoMessage } });
      const ext = audioUrl.split('.').pop().split('?')[0].toLowerCase();
      const audioPath = randomFile(`.${ext}`);
      const outputPath = randomFile('.mp4');

      const response = await axios.get(audioUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(audioPath, response.data);

      exec(`ffmpeg -i ${media} -i ${audioPath} -c:v copy -map 0:v:0 -map 1:a:0 -shortest ${outputPath}`, async (err) => {
        try { fs.unlinkSync(media); } catch {}
        try { fs.unlinkSync(audioPath); } catch {}

        if (err) {
          return conn.sendMessage(chatId, { text: '❌ Error during audio replacement.' }, { quoted: mek });
        }

        const videoBuffer = fs.readFileSync(outputPath);
        await conn.sendMessage(chatId, {
          video: videoBuffer,
          mimetype: 'video/mp4'
        }, { quoted: mek });

        try { fs.unlinkSync(outputPath); } catch {}
        await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
      });
    } catch (error) {
      console.error('amplify error:', error);
      await conn.sendMessage(chatId, { text: '❌ Error while processing.' }, { quoted: mek });
    }
  }
};
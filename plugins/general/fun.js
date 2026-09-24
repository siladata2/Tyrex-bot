'use strict';
/* TYREX_KSH MD - Fun commands (single file)
 * Powered by TYREX_KSH TECH
 *
 * Exports commands in the format index.js expects:
 * { name, aliases, execute(conn, mek, args, chatId, isOwner) }
 *
 * Needs: axios (installed). Optional: gtts (for joke / shayari / gaali voice notes).
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

/* ===================== HELPERS ===================== */
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const tag = (jid) => '@' + jid.split('@')[0];

// Build a command in the loader's format
const mk = (meta, run) => ({
  name: meta.name,
  aliases: meta.aliases || [],
  category: meta.category || 'fun',
  description: meta.description || '',
  usage: meta.usage || `.${meta.name}`,
  async execute(conn, mek, args, chatId, isOwner) {
    const isGroup = chatId.endsWith('@g.us');
    const sender = mek.key.participant || mek.key.remoteJid;
    const say = (text, extra = {}) => conn.sendMessage(chatId, { text, ...extra }, { quoted: mek });
    return run({ sock: conn, mek, args, chatId, isOwner, isGroup, sender, say });
  }
});

const ctxInfo = (mek) => mek.message?.extendedTextMessage?.contextInfo;
// mentioned user, else replied-to user
const targetOf = (mek) => ctxInfo(mek)?.mentionedJid?.[0] || ctxInfo(mek)?.participant || null;

async function ttsSend({ sock, mek, chatId, say }, text, lang, emoji) {
  const filePath = path.join(process.cwd(), 'tmp', `tts-${Date.now()}.mp3`);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  try {
    const gtts = require('gtts'); // optional dependency
    await sock.sendMessage(chatId, { react: { text: emoji, key: mek.key } });
    await new Promise((resolve, reject) =>
      new gtts(text, lang).save(filePath, (err) => (err ? reject(err) : resolve()))
    );
    await sock.sendMessage(chatId, { audio: fs.readFileSync(filePath), mimetype: 'audio/mpeg', ptt: true }, { quoted: mek });
  } catch (err) {
    console.error('TTS error:', err);
    await say(`❌ Failed to generate audio: ${err.message}`);
  } finally {
    try { fs.unlinkSync(filePath); } catch {}
  }
}

/* ---------- command factories ---------- */
// text from shizoapi.onrender.com
const shizo = (meta, endpoint, failWord) =>
  mk(meta, async ({ say }) => {
    try {
      const { data } = await axios.get(`https://shizoapi.onrender.com/api/texts/${endpoint}`, {
        params: { apikey: 'shizo' },
        timeout: 15000
      });
      await say(data.result);
    } catch (e) {
      console.error(`${meta.name} error:`, e.message);
      await say(`❌ Failed to get ${failWord}. Please try again later!`);
    }
  });

// animated edit-message sequence
const editAnim = (meta, first, seq, ms) =>
  mk(meta, async ({ sock, mek, chatId, say }) => {
    try {
      const initial = await sock.sendMessage(chatId, { text: first }, { quoted: mek });
      for (const line of seq) {
        await wait(ms);
        await sock.relayMessage(chatId, {
          protocolMessage: { key: initial.key, type: 14, editedMessage: { conversation: line } }
        }, {});
      }
    } catch (e) {
      console.error(`${meta.name} error:`, e.message);
      await say(`❌ Error: ${e.message}`);
    }
  });

// gif action (hug / kiss / slap)
const gifAction = (meta, emoji, verb, gifs) =>
  mk(meta, async ({ sock, mek, chatId, args }) => {
    const from = mek.pushName || 'Someone';
    const mentioned = ctxInfo(mek)?.mentionedJid;
    let target = 'themself';
    if (mentioned?.length) target = tag(mentioned[0]);
    else if (args[0]) target = args[0];

    await sock.sendMessage(chatId, {
      video: { url: pick(gifs) },
      caption: `${emoji} *${from}* ${verb} *${target}*`,
      gifPlayback: true,
      mentions: mentioned || []
    }, { quoted: mek });
  });

// pick a random group member (son / wife / husband)
const randomMember = (meta, buildText) =>
  mk(meta, async ({ sock, mek, chatId, isGroup, say }) => {
    if (!isGroup) return say('❌ This command can only be used in groups!');
    try {
      const meta2 = await sock.groupMetadata(chatId);
      const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
      const eligible = meta2.participants.filter((p) => p.id !== botId);
      if (!eligible.length) return say('❌ No eligible members found.');
      const jid = pick(eligible).id;
      await say(buildText(tag(jid)), { mentions: [jid] });
    } catch (e) {
      console.error(`${meta.name} error:`, e.message);
      await say(`❌ Failed. Try again later.`);
    }
  });

// some-random-api canvas card (simp / stupid)
const canvasCard = (meta, endpoint, extraQuery, caption) =>
  mk(meta, async ({ sock, mek, chatId, args, sender, say }) => {
    const who = targetOf(mek) || sender;
    try {
      let avatar;
      try {
        avatar = await sock.profilePictureUrl(who, 'image');
      } catch {
        avatar = 'https://telegra.ph/file/24fa902ead26340f3df2c.png';
      }
      const res = await axios.get(`https://some-random-api.com/canvas/misc/${endpoint}`, {
        params: { avatar, ...extraQuery(args) },
        responseType: 'arraybuffer',
        timeout: 30000
      });
      await sock.sendMessage(chatId, {
        image: Buffer.from(res.data),
        caption: caption(who),
        mentions: [who]
      }, { quoted: mek });
    } catch (e) {
      console.error(`${meta.name} error:`, e.message);
      await say(`❌ Sorry, I couldn't generate the card. Please try again later!`);
    }
  });

// numbered list + voice note (shayari / gaali)
const ttsList = (meta, list, defaultLang, title, emoji, detectLang) =>
  mk(meta, async (c) => {
    const { args, say } = c;
    let lang = defaultLang;
    const a = [...args];
    if (a.length && /^[a-z]{2}$/.test(a[a.length - 1])) lang = a.pop().toLowerCase();

    const num = parseInt(a[0]);
    if (!a.length || isNaN(num)) {
      const shown = list.slice(0, 20).map((s, i) => `${i + 1}. ${s.length > 30 ? s.slice(0, 30) + '...' : s}`).join('\n');
      return say(`${emoji} *${title} LIST (1-${list.length})*\n\n${shown}\n\n_Use_ \`.${meta.name} <number>\` _to hear one._`);
    }
    if (num < 1 || num > list.length) {
      return say(`❌ Invalid number. Please enter a number between 1 and ${list.length}.`);
    }
    const text = list[num - 1];
    await ttsSend(c, text, detectLang ? detectLang(text) : lang, emoji);
  });

/* ===================== DATA ===================== */
const JOKES = [
  "Why don't scientists trust atoms? Because they make up everything!",
  'एक आदमी डॉक्टर के पास गया और बोला – डॉक्टर साहब, मुझे हर रात सपना आता है कि मैं एक कप चाय हूँ। डॉक्टर बोले – अरे यार, तू तो छोड़, चाय की पत्तियाँ कैसी हैं?',
  'What do you call a fake noodle? An impasta!',
  "टीचर: 'तुम्हें पढ़ाई क्यों नहीं करनी?' स्टूडेंट: 'सर, मैं तो किताबें पढ़ता हूँ, पर वो मुझे नहीं पढ़तीं।'",
  'I told my wife she should embrace her mistakes. She gave me a hug.'
];

const EIGHT_BALL = [
  'Yes, definitely!', 'No way!', 'Ask again later.', 'It is certain.',
  'Very doubtful.', 'Without a doubt.', 'My reply is no.', 'Signs point to yes.'
];

const COMPLIMENTS = [
  "You're amazing just the way you are!", 'You have a great sense of humor!',
  "You're incredibly thoughtful and kind.", 'You are more powerful than you know.',
  'You light up the room!', "You're a true friend.", 'You inspire me!',
  'Your creativity knows no bounds!', 'You have a heart of gold.',
  'You make a difference in the world.', 'Your positivity is contagious!',
  'You have an incredible work ethic.', 'You bring out the best in people.',
  "Your smile brightens everyone's day.", "You're so talented in everything you do.",
  'Your kindness makes the world a better place.', 'You have a unique and wonderful perspective.',
  'Your enthusiasm is truly inspiring!', 'You are capable of achieving great things.',
  'You always know how to make someone feel special.', 'Your confidence is admirable.',
  'You have a beautiful soul.', 'Your generosity knows no limits.',
  'You have a great eye for detail.', 'Your passion is truly motivating!',
  'You are an amazing listener.', "You're stronger than you think!",
  'Your laughter is infectious.', 'You have a natural gift for making others feel valued.',
  'You make the world a better place just by being in it.'
];

const INSULTS = [
  "You're like a cloud. When you disappear, it's a beautiful day!",
  'You bring everyone so much joy when you leave the room!',
  "I'd agree with you, but then we'd both be wrong.",
  "You're not stupid; you just have bad luck thinking.",
  'Your secrets are always safe with me. I never even listen to them.',
  "You're proof that even evolution takes a break sometimes.",
  'You have something on your chin... no, the third one down.',
  "You're like a software update. Whenever I see you, I think, 'Do I really need this right now?'",
  'You bring everyone happiness... you know, when you leave.',
  "You're like a penny—two-faced and not worth much.",
  'You have something on your mind... oh wait, never mind.',
  "You're the reason they put directions on shampoo bottles.",
  "You're like a cloud. Always floating around with no real purpose.",
  'Your jokes are like expired milk—sour and hard to digest.',
  "You're like a candle in the wind... useless when things get tough.",
  'You have something unique—your ability to annoy everyone equally.',
  "You're like a Wi-Fi signal—always weak when needed most.",
  "You're proof that not everyone needs a filter to be unappealing.",
  'Your energy is like a black hole—it just sucks the life out of the room.',
  'You have the perfect face for radio.',
  "You're like a traffic jam—nobody wants you, but here you are.",
  "You're like a broken pencil—pointless.",
  "Your ideas are so original, I'm sure I've heard them all before.",
  "You're living proof that even mistakes can be productive.",
  "You're not lazy; you're just highly motivated to do nothing.",
  "Your brain's running Windows 95—slow and outdated.",
  "You're like a speed bump—nobody likes you, but everyone has to deal with you.",
  "You're like a cloud of mosquitoes—just irritating.",
  'You bring people together... to talk about how annoying you are.'
];

const SHAYARI = [
  'मोहब्बत में हमने तुम्हें दिल दिया, तुमने क्या दिया? एक धोखा दिया, एक सज़ा दिया।',
  'हर किसी को मुकम्मल जहाँ नहीं मिलता, किसी को ख़ुशी तो किसी को जहर का प्याला मिलता है।',
  'उनकी आँखों में बसा कर देखा, तो पता चला कि वो किसी और के लिए धड़कती हैं।',
  'दिल टूटा तो एहसास हुआ, कि हर मोहब्बत का अंजाम अलग होता है।',
  'हम उनसे मिलने को तरस गए, और वो हमसे मिलकर भी खो गए।',
  'तेरी यादों ने ऐसा जादू किया, हर घड़ी तेरा ही ख्याल आया।',
  'बहुत खूबसूरत थी वो शाम, जब तुम मिले थे हमसे, अब तो हर शाम तुम्हारी याद लाती है।',
  'कभी हँसते हैं तो कभी रोते हैं, तेरे बिना हम क्या करते हैं?',
  'दिल की बात जुबां पर नहीं लाते, तुम्हें देखकर मुस्कुरा देते हैं।',
  'तेरी आँखों में खो जाने का दिल करता है, तेरे बिना जीने का मन नहीं करता।',
  'इश्क़ में हम तुम्हें क्या बताएँ, दिल का हाल जुबां पर नहीं आता।',
  'तेरे बिना हर लम्हा अधूरा है, तू ही मेरी ज़िन्दगी का सहारा है।',
  'दिल की धड़कन तुम हो, साँसों में बसी खुशबू तुम हो।',
  'तेरे इश्क़ में हम दीवाने हो गए, तेरे लिए हम पागल हो गए।',
  'हम तो तुम्हारे हो गए, अब और किसी के नहीं।',
  'तेरे बिना जीना सीखा है, तू न हो तो क्या होगा?',
  'तेरी यादों का सहारा लिए बैठे हैं, तू आए तो जिएं वरना मर जाएँ।',
  'तेरे इश्क़ ने हमें क्या बना दिया, दुनिया से बेगाना कर दिया।',
  'हम तुम्हें भूल जाएँ ऐसा हो न सके, तुम्हारे बिना हम कहाँ टिक सके?',
  'तेरी बातों में वो मिठास है, जैसे गुलाब में खुशबू का एहसास।',
  'उनकी यादों ने हमें तरसाया, रात भर जागकर हमने गुज़ारा।',
  'दिल में बसा लिया तुमको, अब निकालना मुश्किल है।',
  'तेरे प्यार में हमने दुनिया भुला दी, तू ही मेरी ज़िन्दगी बन गया।',
  'हम तो तेरे दीवाने हैं, तू समझे न समझे, हम तो तेरे दीवाने हैं।',
  'तेरी एक मुस्कान पे हम वारे जाएँ, तेरे लिए हम जान भी दे दें।',
  'दिल की बात छुपाई नहीं जाती, तुझसे मिलने की तमन्ना सताती है।',
  'तेरे इश्क़ ने हमें पागल कर दिया, हर घड़ी तेरा ही ख़याल रहता है।',
  'तेरी आँखों में डूबने का दिल करता है, तेरे बिना अब जीने का मन नहीं करता।',
  'तेरे बिना हर लम्हा सून है, तू ही मेरी दुनिया का रौशन चाँद है।',
  'तेरी हँसी मेरी दवा है, तेरा दर्द मेरा इलाज़ है।',
  'तेरे ख़त में लिखा था कि तुम आओगे, हमने राहें तक लीं, तुम न आए।',
  'बिछड़कर भी तेरे पास रहते हैं, ये दिल क्या जाने कैसे कहते हैं।',
  'तेरी याद ने जगाया रात भर, हम सोचते रहे तू क्यों नहीं मिला।',
  'तेरा दर्द बहुत है सीने में, फिर भी हम मुस्कुरा रहे हैं।',
  'तेरी बेरुखी ने मार डाला, हम तो तेरे लिए ही थे।',
  'You are the sunshine of my life, without you everything is grey.',
  "In your eyes I found my home, in your arms I'll never roam.",
  'Every moment with you is a treasure, your love is my only pleasure.',
  'You are the poetry my heart writes, the melody that fills my nights.',
  'When you smile, the world smiles with me, your love sets my spirit free.',
  "I never knew love until you came, now I'll never be the same.",
  'You are the dream I never want to wake, the love my soul will always take.',
  'Your voice is music to my ears, your touch erases all my fears.',
  'With you, every day is spring, your love makes my heart sing.',
  'You are the star that guides my way, with you, I want to stay.',
  'My heart beats only for you, everything I am, I give to you.',
  'You are the reason I believe in love, a gift sent from above.',
  'In your eyes I see forever, in your heart we\'ll be together.',
  'Your love is like a gentle rain, washing away all my pain.',
  "You are the one I've waited for, my heart's open door."
];

const GAALIS = [
  'Madarchod! Teri maa ka bhosda!', 'Bhen ke lode!', 'Tatti chod! Randi ke!', 'Gaand mara! Chutiye!',
  'Bhan ka taka!', 'Teri ma ko lun!', 'Mia Khalifa ki aulad!', 'Johny Sins ki aulaad!',
  'Ladle! Maderchod!', 'Mewo! Madarjaat!', 'Teri ammi ka joota!', 'Haramzade!',
  'Kamine! Suar ki aulad!', 'Teri behen ki choot!', 'Tera baap chakka!', 'Bhadwe!',
  'Teri naani ka tatta!', 'Gandu!', 'Randibaaz!', 'Chakke ke pille!', 'Kutte ki dum!',
  'Teri mummy ka lund!', 'Teri didi ka bhosda!', 'Teri family ka bharosa nahi!',
  'Maa chudane wale!', 'Bhen ke takke!', 'Lund le!', 'Teri gaand mein danda!',
  'Chup chaap mar!', 'Suar ki aulaad!', 'Kutte ki nasal!', 'Teri ammi ka number do!',
  'Tera baap nahi teri maa bhi nahi!', 'Hijde!', 'Launda!', 'Teri aukaat kya hai?',
  'Jhat ke!', 'Fattu!', 'Namak haram!', 'Beghairat!',
  'Fuck you!', 'Motherfucker!', 'Dickhead!', 'Asshole!', 'Prick!', 'Wanker!', 'Bastard!',
  'Cocksucker!', 'Son of a bitch!', 'Shithead!', 'Twat!', 'Bollocks!', 'Arsehole!',
  'Piss off!', 'Bugger off!', 'Sod off!', 'Bloody hell!', 'You piece of shit!',
  'You fucking idiot!', 'You absolute wanker!'
];

const FLIP_MAP = {
  a: 'ɐ', b: 'q', c: 'ɔ', d: 'p', e: 'ǝ', f: 'ɟ', g: 'ƃ', h: 'ɥ', i: 'ᴉ', j: 'ɾ',
  k: 'ʞ', l: 'l', m: 'ɯ', n: 'u', o: 'o', p: 'd', q: 'b', r: 'ɹ', s: 's', t: 'ʇ',
  u: 'n', v: 'ʌ', w: 'ʍ', x: 'x', y: 'ʎ', z: 'z',
  A: '∀', B: 'ᗺ', C: 'Ɔ', D: 'p', E: 'Ǝ', F: 'Ⅎ', G: 'פ', H: 'H', I: 'I', J: 'ſ',
  K: 'ʞ', L: '˥', M: 'W', N: 'N', O: 'O', P: 'Ԁ', Q: 'Ό', R: 'ᴚ', S: 'S', T: '⊥',
  U: '∩', V: 'Λ', W: 'M', X: 'X', Y: '⅄', Z: 'Z',
  1: 'Ɩ', 2: 'ᄅ', 3: 'Ɛ', 4: 'ㄣ', 5: 'ϛ', 6: '9', 7: 'ㄥ', 8: '8', 9: '6', 0: '0',
  '.': '˙', ',': "'", "'": ',', '"': '„', '!': '¡', '?': '¿', '(': ')', ')': '(', '[': ']', ']': '[',
  '{': '}', '}': '{', '<': '>', '>': '<', _: '‾', '&': '⅋'
};

/* ===================== fakereact state ===================== */
const activeGroups = new Map(); // groupJid -> { enabled, emojis }
const DEFAULT_EMOJIS = ['😂', '🔥', '👍', '❤️', '🎉', '😍', '🤣', '💀', '🥴', '👏', '🙌', '🍿', '⚡', '🤯', '💯', '✅', '⭐', '🎯', '🔁', '💪'];
const EMOJI_RE = /\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic}|[\u{1F3FB}-\u{1F3FF}])*/gu;
const hooked = new WeakSet();

// Listens for new group messages once per connection (no change to main.js needed)
function ensureReactHook(conn) {
  if (hooked.has(conn)) return;
  hooked.add(conn);
  conn.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const m of messages) {
      const jid = m.key?.remoteJid;
      if (!jid || !jid.endsWith('@g.us') || m.key.fromMe) continue;
      const g = activeGroups.get(jid);
      if (!g?.enabled || !g.emojis.length) continue;
      try {
        await conn.sendMessage(jid, { react: { text: pick(g.emojis), key: m.key } });
      } catch (err) {
        console.error('[FAKEREACT] Auto-react error:', err.message);
      }
    }
  });
}

/* ===================== random.js (media) ===================== */
async function sendMedia(sock, chatId, mek, url, type = 'image', caption = '') {
  const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
  const buffer = Buffer.from(res.data);
  if (type === 'video') await sock.sendMessage(chatId, { video: buffer, mimetype: 'video/mp4', caption }, { quoted: mek });
  else await sock.sendMessage(chatId, { image: buffer, caption }, { quoted: mek });
}

const deline = (meta, endpoint, caption, allowVideo) =>
  mk({ ...meta, category: 'random' }, async ({ sock, mek, chatId, say }) => {
    try {
      const { data } = await axios.get(`https://api.deline.web.id/random/${endpoint}`, { timeout: 10000 });
      if (!data.status || !data.result) throw new Error(data.error || 'No media');
      const url = data.result;
      const isVideo = allowVideo && (url.includes('.mp4') || url.includes('/video/'));
      await sendMedia(sock, chatId, mek, url, isVideo ? 'video' : 'image', caption);
    } catch (err) {
      await say(`❌ Failed: ${err.message}`);
    }
  });

/* ===================== COMMANDS ===================== */
const teddyBusy = new Set();

module.exports = [
  /* ---------- jokes / facts / questions ---------- */
  mk({ name: 'joke', aliases: ['humour', 'chutkula'], description: '😂 Listen to a random joke in TTS', usage: '.joke [language code]' },
    async (c) => {
      const a = [...c.args];
      const lang = a.length && /^[a-z]{2}$/.test(a[a.length - 1]) ? a.pop() : 'en';
      await ttsSend(c, pick(JOKES), lang, '😂');
    }),

  mk({ name: 'joke2', aliases: ['funny2', 'jokes2'], description: 'Get a random general joke' },
    async ({ say }) => {
      try {
        const res = await axios.get('https://raw.githubusercontent.com/Sila-Md/Database/main/text/random_jokes.txt', { timeout: 15000 });
        const jokes = String(res.data || '').split('\n').filter((l) => l.trim());
        if (!jokes.length) return say('❌ No jokes available.');
        await say(`😂 *Joke*\n\n${pick(jokes)}`);
      } catch (err) {
        console.error('joke2 error:', err.message);
        await say('❌ Error while fetching joke.');
      }
    }),

  mk({ name: 'fact', aliases: ['randomfact', 'uselessfact'], description: 'Get a random interesting fact' },
    async ({ say }) => {
      try {
        const r = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en', { timeout: 15000 });
        await say(r.data.text);
      } catch {
        await say('Sorry, I could not fetch a fact right now.');
      }
    }),

  mk({ name: 'why', aliases: ['whyme', 'question'], description: 'Get a random "why" question' },
    async ({ say }) => {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const { data } = await axios.get('https://nekos.life/api/v2/why', { timeout: 15000 });
          if (!data?.why?.trim()) return say('❌ Invalid response from API. Try again.');
          return say(`🤔 *Why?*\n\n${data.why}`);
        } catch (err) {
          console.error(`[WHY] Attempt ${attempt} failed:`, err.message);
          if (attempt === 3) return say('❌ Failed to fetch question. Try again later.');
          await wait(2000);
        }
      }
    }),

  mk({ name: 'wyr', aliases: ['wouldyourather'], category: 'quotes', description: 'Get a Would You Rather question' },
    async ({ say }) => {
      try {
        const res = await axios.get('https://discardapi.dpdns.org/api/quote/wyr?apikey=guru', { timeout: 15000 });
        if (!res.data || res.data.status !== true) return say('❌ Failed to fetch question.');
        const o1 = res.data.question?.option1 || 'Option 1 not found';
        const o2 = res.data.question?.option2 || 'Option 2 not found';
        await say(`🤔 *Would You Rather*\n\n◍ ${o1}\n◍ ${o2}`);
      } catch (err) {
        console.error('wyr error:', err.message);
        await say('❌ Error while fetching question.');
      }
    }),

  mk({ name: '8ball', aliases: ['eightball', 'magic8ball'], description: 'Ask the magic 8-ball a question', usage: '.8ball Will I be rich?' },
    async ({ args, say }) => {
      const question = args.join(' ');
      if (!question) return say('🎱 Please ask a question!');
      await say(`🎱 *Question:* ${question}\n\n*Answer:* ${pick(EIGHT_BALL)}`);
    }),

  /* ---------- text from APIs ---------- */
  shizo({ name: 'dare', aliases: ['truthordare', 'challenge'], category: 'games', description: 'Get a random dare' }, 'dare', 'dare'),
  shizo({ name: 'truth', aliases: ['truthdare'], category: 'games', description: 'Get a random truth' }, 'truth', 'truth'),
  shizo({ name: 'flirt', aliases: ['flirty', 'pickuplines'], description: 'Get a random flirt message' }, 'flirt', 'flirt message'),
  shizo({ name: 'goodnight', aliases: ['gn', 'night'], category: 'quotes', description: 'Send a random good night message' }, 'lovenight', 'goodnight message'),

  mk({ name: 'roseday', aliases: ['rose', 'rosequote'], category: 'quotes', description: 'Get a random Rose Day message/quote' },
    async ({ say }) => {
      try {
        const { data } = await axios.get('https://api.princetechn.com/api/fun/roseday', { params: { apikey: 'prince' }, timeout: 15000 });
        await say(data.result);
      } catch (err) {
        console.error('roseday error:', err.message);
        await say('❌ Failed to get Rose Day quote. Please try again later!');
      }
    }),

  /* ---------- cards ---------- */
  canvasCard({ name: 'simp', aliases: ['simpcard'], category: 'group', description: 'Generate a simp card for a user', usage: '.simp (reply to user or mention someone)' },
    'simpcard', () => ({}), () => '*your religion is simping*'),
  canvasCard({ name: 'stupid', aliases: ['stupidcard', 'dumb'], category: 'group', description: 'Generate a stupid card for a user', usage: '.stupid (reply, mention, or add text)' },
    'its-so-stupid', (args) => ({ dog: args.length ? args.join(' ') : 'im+stupid' }), (who) => `*${tag(who)}*`),

  /* ---------- group games ---------- */
  mk({ name: 'ship', aliases: ['couple'], category: 'group', description: 'Randomly ship two members in the group' },
    async ({ sock, chatId, isGroup, say }) => {
      if (!isGroup) return say('❌ This command can only be used in groups!');
      try {
        const ids = (await sock.groupMetadata(chatId)).participants.map((p) => p.id);
        if (ids.length < 2) return say('❌ Not enough members.');
        const first = pick(ids);
        let second;
        do { second = pick(ids); } while (second === first);
        await sock.sendMessage(chatId, {
          text: `${tag(first)} ❤️ ${tag(second)}\nCongratulations 💖🍻`,
          mentions: [first, second]
        });
      } catch (err) {
        console.error('ship error:', err.message);
        await say('❌ Failed to ship! Make sure this is a group.');
      }
    }),

  randomMember({ name: 'son', aliases: ['beta'], description: 'Pick a random group member as your son' },
    (m) => `👨‍👦 *Congratulations!*\n\nYour son is: ${m}\n\n🎉 Take good care of him!`),
  randomMember({ name: 'wife', aliases: ['biwi'], description: 'Pick a random group member as your wife' },
    (m) => `💖 *Congratulations!*\n\nYour wife is: ${m}\n\n🤵 May your marriage be blessed!`),
  randomMember({ name: 'husband', aliases: ['shohar'], description: 'Pick a random group member as your husband' },
    (m) => `💍 *Congratulations!*\n\nYour husband is: ${m}\n\n👰‍♀️ May you have a happy life together!`),

  mk({ name: 'compliment', aliases: ['praise', 'nice'], category: 'group', description: 'Send a random compliment to a user', usage: '.compliment @user' },
    async ({ mek, say }) => {
      const user = targetOf(mek);
      if (!user) return say('Please mention someone or reply to their message to compliment them!');
      await wait(1000);
      await say(`Hey ${tag(user)}, ${pick(COMPLIMENTS)}`, { mentions: [user] });
    }),

  mk({ name: 'insult', aliases: ['roast', 'mock'], category: 'group', description: 'Send a playful insult to someone', usage: '.insult @user (or reply to their message)' },
    async ({ mek, say }) => {
      const user = targetOf(mek);
      if (!user) return say('❌ Please mention someone or reply to their message to insult them!');
      await wait(1000);
      await say(`Hey ${tag(user)}, ${pick(INSULTS)}`, { mentions: [user] });
    }),

  mk({ name: 'howgay', aliases: ['gayrate'], description: 'Check how gay you are', usage: '.howgay [@user]' },
    async ({ mek, args, isGroup, say }) => {
      let target = 'you';
      let mentions = [];
      const m = ctxInfo(mek)?.mentionedJid;
      if (isGroup && m?.length) {
        target = tag(m[0]);
        mentions = [m[0]];
      } else if (args.length) {
        target = args.join(' ');
      }
      const percent = Math.floor(Math.random() * 101);
      const filled = Math.floor(percent / 10);
      const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
      await say(`🏳️‍🌈 *Gay Meter*\n${target} is *${percent}%* gay!\n[${bar}]`, { mentions });
    }),

  mk({ name: 'rate', description: 'Rate something out of 100%', usage: '.rate <thing>' },
    async ({ args, say }) => {
      if (!args.length) return say('❌ What should I rate?');
      await say(`I rate *${args.join(' ')}* a *${Math.floor(Math.random() * 101)}%*!`);
    }),

  /* ---------- gif actions ---------- */
  gifAction({ name: 'hug', aliases: ['embrace'], description: 'Give a warm hug', usage: '.hug @user' }, '🤗', 'gave a big hug to', [
    'https://media.giphy.com/media/od5H3PmEG5EVq/giphy.gif',
    'https://media.giphy.com/media/3o7abB06u9bNzA8LC8/giphy.gif',
    'https://media.giphy.com/media/11f7zMNWcD6w08/giphy.gif',
    'https://media.giphy.com/media/3o7TKqhAQxX5bXr0zW/giphy.gif'
  ]),
  gifAction({ name: 'kiss', aliases: ['smooch'], description: 'Send a kiss to someone', usage: '.kiss @user' }, '😘', 'gave a kiss to', [
    'https://media.giphy.com/media/G3va31oEEnIkM/giphy.gif',
    'https://media.giphy.com/media/bm2O3nXTcKJeU/giphy.gif',
    'https://media.giphy.com/media/11f7zMNWcD6w08/giphy.gif',
    'https://media.giphy.com/media/3o7abB06u9bNzA8LC8/giphy.gif'
  ]),
  gifAction({ name: 'slap', aliases: ['hit'], description: 'Slap someone playfully', usage: '.slap @user' }, '👋', 'slapped', [
    'https://media.giphy.com/media/Zd3N1G6iXU4Oc/giphy.gif',
    'https://media.giphy.com/media/lXzCzS5Wf5W7G/giphy.gif',
    'https://media.giphy.com/media/j3iGKfXRKlLqw/giphy.gif',
    'https://media.giphy.com/media/10PzYxAwC6nHKo/giphy.gif'
  ]),

  /* ---------- voice notes ---------- */
  ttsList({ name: 'shayari', aliases: ['sher', 'poetry', 'kavita'], description: '🎤 Hear a shayari/poem in TTS', usage: '.shayari [number]' },
    SHAYARI, 'hi', 'SHAYARI', '🎤',
    (text) => (/[\u0600-\u06FF]/.test(text) ? 'ur' : /[a-zA-Z]/.test(text) && !/[ऀ-ॿ]/.test(text) ? 'en' : 'hi')),
  ttsList({ name: 'gaali', aliases: ['gali', 'abuse'], description: '🤬 Hear a funny gaali in TTS', usage: '.gaali [number] [language code]' },
    GAALIS, 'hi', 'GAALI', '🤬'),

  /* ---------- emoji animations ---------- */
  editAnim({ name: 'hot', aliases: ['spicy', '🔥'], description: 'Dynamic edit message with emojis' }, '💋',
    ['🥵', '❤️', '💋', '😫', '🤤', '😋', '🥵', '🥶', '🙊', '😻', '🙈', '💋', '🫂', '🫀', '👅', '👄', '💋'], 1000),
  editAnim({ name: 'leg', aliases: ['thigh', 'legwork'], description: '🦵 Leg and thigh action sequence' }, '🦵',
    ['🦵', '🍑🦵', '💦🦵', '🔥🦵', '🦵🍆', '🦵💦', '🍑💦🦵', '🥵🦵', '😫🦵', '💢🦵', '🦵🍑💦', '🦵🔥', '😵🦵', '💦💦🦵', '🦵🍆💦'], 600),
  editAnim({ name: 'mouth', aliases: ['oral', 'blowjob', 'bj'], description: '👄 Mouth action with wet emojis' }, '👄',
    ['👄', '👅', '🍆👄', '💦👅', '😮', '👄💦', '🍆💦👄', '😝', '🥵👄', '💦💦👅', '🍆👅💦', '😫👄', '🔥👄', '💢👅', '👄🍑'], 600),
  editAnim({ name: 'finger', aliases: ['fing', 'digits'], description: '🖕 Dirty finger animation' }, '👉',
    ['👉', '👉👇', '👉👌', '👈👌', '🍆👉🍑', '💦👉', '👉💦🍑', '👉🍑💦', '😩👉💦', '🥵👉🍆💦', '👉 Fuck yeah!', '👉🍑💦💦', '👉💢 Fingered!', '🔥👉🍑💦'], 800),
  editAnim({ name: 'fuck', aliases: ['fck'], description: '🔥 Explicit fun – dynamic emoji sequence' }, '💢',
    ['💢', '🍑', '🍆', '💦', '😩', '🍑💦', '🍆💦', '💦💦', '😫', '🥵', '🍆🍑', '💦💦💦', '😵', '💢💢', '🔥'], 800),
  editAnim({ name: 'fuckall', aliases: ['fa', 'sabko'], description: '💥 Abuse everyone in the chat with style' }, '💥',
    ['💥 FUCK ALL OF YOU 💥', 'SAB KE SAB MADERCHOD 🖕', 'BHAN KE CHOD 👊', 'TERI MA KA BHOSDA 🔥', 'GAND MARAO SAB NE 🍑',
      '*CHUTIYA SAPNA* 💢', 'RANDI KE PILLE 🚬', 'FUCK YOUR GENERATION 👪🖕', '*CH*T CH*T* 💦', 'BHAN CHOD DUNGA SABKO 😈',
      'TERI MA KA LUND 🍆', 'JOHNY SINS KA CHODA 🥵', '*GROUP CHOD DIYA* 🔊'], 700),
  editAnim({ name: 'fuckoff', aliases: ['fo', 'gtfo'], description: '🖕 Tell someone to fuck off with style' }, '🖕',
    ['🖕', '🚫', '😤', '🖕🖕', '🤬', 'FUCK OFF', '🖕 OFF', '🚫🚫', '💢🖕', '🔥🖕', '🖕 YOU', 'BYE FELICIA', '👋🖕', '💥🖕', '🤡🖕'], 600),
  editAnim({ name: 'fuckyou', aliases: ['fu', 'fucku'], category: 'abuse', description: '🖕 Ultimate abuse sequence – Hindi + English' }, '🖕',
    ['🖕 FUCK YOU 🖕', '💥 FUCK YOUR WHOLE FAMILY 💥', '🤬 MADER CHOD 🤬', '👊 BHAN CHOR 👊', '🔥 THERI BHAN KO CHODU 🔥',
      '💢 MA KA LORA 💢', '👿 BHAN KA TAKA 👿', '🍆 TERI MA KO LUN 🍆', '😡 MADERCHOR 😡', '🔊 MIA KHALIFA KI AULAD 🔊',
      '🎬 JONY SINS KI AULAD 🎬', '💥 BHAN KA TAKA 💥', '🐷 RANDI KE BACHE 🐷', '🐕 KUTTA 🐕', '🐗 SUAR KI AULAD 🐗',
      '🤪 CHUTIYA 🤪', '💢 BHOSDIKE 💢', '🖕 GANDU 🖕', '🔥 TERI MA KA BHOSDA 🔥', '💥 BHAN CHOAD 💥',
      '👊 MADARCHOD 👊', '🔞 NOW FUCK OFF! 🔞'], 700),

  mk({ name: 'teddy', description: 'Send an animated teddy with cute emojis' },
    async ({ sock, mek, chatId, sender, say }) => {
      if (teddyBusy.has(sender)) return;
      teddyBusy.add(sender);
      const emojis = ['❤', '💕', '😻', '🧡', '💛', '💚', '💙', '💜', '🖤', '❣', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥', '💌', '🙂',
        '🤗', '😌', '😉', '🤗', '😊', '🎊', '🎉', '🎁', '🎈'];
      try {
        const msg = await sock.sendMessage(chatId, { text: '(\\_/)\n( •.•)\n/>🤍' }, { quoted: mek });
        for (const e of emojis) {
          await wait(500);
          await sock.relayMessage(chatId, {
            protocolMessage: { key: msg.key, type: 14, editedMessage: { conversation: `(\\_/)\n( •.•)\n/>${e}` } }
          }, {});
        }
      } catch (err) {
        console.error('teddy error:', err.message);
        await say('❌ Something went wrong while sending teddy emojis.');
      } finally {
        teddyBusy.delete(sender);
      }
    }),

  mk({ name: 'sex', aliases: ['makeout', 'romance'], description: 'Simulate a romantic encounter (just for laughs)', usage: '.sex [partner]' },
    async ({ sock, mek, chatId, args }) => {
      const partner = args[0] || 'someone';
      const user = mek.pushName || 'You';
      const first = await sock.sendMessage(chatId, { text: `*💕 ${user} is feeling romantic with ${partner}...*` }, { quoted: mek });
      const edit = (text) => sock.sendMessage(chatId, { text, edit: first.key });
      const steps = [
        [1000, '*😊 Setting the mood...*'],
        [1500, '*🕯️ Lighting candles...*'],
        [1500, '*🎶 Playing romantic music...*'],
        [1500, '*💋 Sharing a sweet kiss...*'],
        [2000, '*❤️ A wonderful time was had by all!*'],
        [1000, `*🥰 ${user} and ${partner} are now closer than ever.*`]
      ];
      for (const [ms, text] of steps) {
        await wait(ms);
        await edit(text);
      }
    }),

  mk({ name: 'dado', aliases: ['dados', 'dice'], category: 'games', description: 'Roll a random dice sticker' },
    async ({ sock, mek, chatId }) => {
      const url = pick([
        'https://tinyurl.com/gdd01', 'https://tinyurl.com/gdd02', 'https://tinyurl.com/gdd003',
        'https://tinyurl.com/gdd004', 'https://tinyurl.com/gdd05', 'https://tinyurl.com/gdd006'
      ]);
      try {
        await sock.sendMessage(chatId, { sticker: { url } }, { quoted: mek });
      } catch {
        await sock.sendMessage(chatId, { image: { url }, caption: '🎲 The dice rolled!' }, { quoted: mek });
      }
    }),

  mk({ name: 'flip', aliases: ['mirror', 'upside'], category: 'tools', description: 'Flip text upside down', usage: '.flip <text> OR reply to a message' },
    async ({ mek, args, say }) => {
      let txt = args.join(' ');
      const quoted = ctxInfo(mek)?.quotedMessage;
      if (quoted) {
        txt = quoted.conversation || quoted.extendedTextMessage?.text || quoted.imageMessage?.caption || txt;
      }
      txt = txt.trim();
      if (!txt) return say('*What should I flip?*');
      await say([...txt].map((ch) => FLIP_MAP[ch] || ch).reverse().join(''));
    }),

  /* ---------- random media ---------- */
  deline({ name: 'asupan', description: 'Random asupan video/picture' }, 'asupan', '✨ Random Asupan', true),
  deline({ name: 'ba', description: 'Random Blue Archive image' }, 'ba', '🎮 Blue Archive', false),

  mk({ name: 'nsfw', category: 'nsfw', description: 'Random NSFW image (categories 0-69)', usage: '.nsfw [category]' },
    async ({ sock, mek, chatId, args, say }) => {
      const cat = args[0] || '0';
      try {
        const { data } = await axios.get('https://api.deline.web.id/nsfw', { params: { cat }, timeout: 10000 });
        if (!data.status || !data.result) throw new Error(data.error || 'No media');
        await sendMedia(sock, chatId, mek, data.result, 'image', `🔞 NSFW (cat ${cat})`);
      } catch (err) {
        await say(`❌ Failed: ${err.message}`);
      }
    }),

  mk({ name: 'ppcouple', category: 'random', description: 'Random couple profile pictures' },
    async ({ sock, mek, chatId, say }) => {
      try {
        const { data } = await axios.get('https://api.deline.web.id/random/ppcouple', { timeout: 10000 });
        if (!data.status) throw new Error(data.error);
        await sendMedia(sock, chatId, mek, data.result.cowo, 'image', '👫 Couple (Male)');
        await wait(1000);
        await sendMedia(sock, chatId, mek, data.result.cewe, 'image', '👫 Couple (Female)');
      } catch (err) {
        await say(`❌ Failed: ${err.message}`);
      }
    }),

  /* ---------- fakereact ---------- */
  mk({
    name: 'fakereact',
    aliases: ['freaction', 'autoreact'],
    description: '🤖 Auto-react to every message in a group',
    usage: '.fakereact on | off | set 🎉🔥😂 | list | react 😍 (reply) | help'
  }, async ({ sock, mek, chatId, args, isGroup, say }) => {
    const sub = (args[0] || '').toLowerCase();

    if (!isGroup && sub !== 'react') {
      return say('⚠️ This command only works in groups (or use `.fakereact react` while replying to a message).');
    }

    let group = activeGroups.get(chatId);
    if (!group) {
      group = { enabled: false, emojis: [...DEFAULT_EMOJIS] };
      activeGroups.set(chatId, group);
    }

    if (!sub || sub === 'help') {
      return say(`🤖 *FAKE REACTION SYSTEM*

\`.fakereact on\` – react to every new message
\`.fakereact off\` – stop
\`.fakereact set 😂🔥👍\` – custom emojis (max 20)
\`.fakereact list\` – show active emojis
\`.fakereact react ❤️\` – react to the message you reply to

*Status:* ${group.enabled ? '✅ ACTIVE' : '❌ INACTIVE'}
*Emojis:* ${group.emojis.join(' ')}`);
    }

    if (sub === 'on') {
      ensureReactHook(sock);
      group.enabled = true;
      return say(`✅ *Auto-reaction ENABLED* in this group.\nEmojis: ${group.emojis.join(' ')}`);
    }

    if (sub === 'off') {
      group.enabled = false;
      return say('❌ *Auto-reaction DISABLED* in this group.');
    }

    if (sub === 'set') {
      const list = (args.slice(1).join(' ').match(EMOJI_RE) || []).slice(0, 20);
      if (!list.length) return say('❌ Please provide at least one emoji.\nExample: `.fakereact set 🎉🔥😂`');
      group.emojis = list;
      return say(`✅ Custom reaction emojis set to: ${list.join(' ')}`);
    }

    if (sub === 'list') {
      return say(`🎭 *Current reaction emojis* (${group.emojis.length}):\n${group.emojis.join(' ')}`);
    }

    if (sub === 'react') {
      const emoji = (args.slice(1).join(' ').match(EMOJI_RE) || [])[0];
      if (!emoji) return say('❌ Usage: `.fakereact react 😍` (reply to the target message)');
      const info = ctxInfo(mek);
      if (!info?.quotedMessage) return say(`❌ You must reply to a message to react with ${emoji}`);
      try {
        await sock.sendMessage(chatId, {
          react: {
            text: emoji,
            key: { remoteJid: mek.key.remoteJid, id: info.stanzaId, participant: info.participant }
          }
        });
        return say(`✅ Reacted with ${emoji}`);
      } catch (err) {
        return say(`❌ Failed to react: ${err.message}`);
      }
    }

    return say('❓ Unknown subcommand. Use `.fakereact help`');
  })
];

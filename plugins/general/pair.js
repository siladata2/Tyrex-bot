const axios = require('axios');

//=====================================================================
// PAIR2 COMMAND
//=====================================================================
const pair2 = {
  name: 'pair2',
  aliases: ['code2', 'getpair2', 'paircode2', 'bot2', 'linkdevice2'],
  category: 'general',
  description: 'Generate pairing code with instructions',
  usage: '.pair2 <number>',
  react: '🔗',
  async execute(conn, mek, args, chatId, isOwner) {
    await conn.sendMessage(chatId, { react: { text: '🔗', key: mek.key } });

    const q = args.join('').replace(/\D/g, '');

    if (!q) {
      return conn.sendMessage(chatId, {
        text: '❌ Please provide a number to pair.\nExample: `.pair2 255789661031`'
      }, { quoted: mek });
    }

    if (q.length < 10 || q.length > 15) {
      return conn.sendMessage(chatId, {
        text: '❌ Invalid number. Include country code.\nExample: `.pair2 255789661031`'
      }, { quoted: mek });
    }

    // 🔧 API base
    const api = 'https://tyrex-ksh-pair-site1-82c7d9aeaab2.herokuapp.com';
    const botname = 'TYREX_KSH MD';

    try {
      // ✅ Endpoint sahihi: /code?number=
      const response = await axios.get(`${api}/code?number=${q}`, {
        timeout: 90000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      const data = response.data;

      const code =
        data?.code ||
        data?.result ||
        data?.pairingCode ||
        data?.pair_code ||
        (typeof data === 'string' && data.match(/\b[A-Z0-9]{6,10}\b/)?.[0]);

      if (!code) {
        return conn.sendMessage(chatId, {
          text: '❌ Failed to generate pairing code.\n\nServer response:\n```' +
            JSON.stringify(data).slice(0, 400) + '```'
        }, { quoted: mek });
      }

      const caption =
        `🔑 *PAIRING CODE GENERATED*\n\n` +
        `📱 *Number:* ${q}\n` +
        `🔐 *Code:* \`${code}\`\n\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `*HOW TO USE YOUR CODE*\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `1️⃣ Open WhatsApp on your phone\n` +
        `2️⃣ Tap the three dots (menu) at the top right corner\n` +
        `3️⃣ Select "Linked Devices"\n` +
        `4️⃣ Tap "Link a Device"\n` +
        `5️⃣ Tap "Link with phone number instead"\n` +
        `6️⃣ Enter the 8-digit code shown above\n\n` +
        `✅ Your session ID will arrive on WhatsApp shortly!\n\n` +
        `> *${botname}*`;

      await conn.sendMessage(chatId, { text: caption }, { quoted: mek });
      await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });

    } catch (err) {
      console.error('pair2 error:', err.message);
      await conn.sendMessage(chatId, {
        text: '❌ Failed to fetch pairing code.\nError: ' + err.message
      }, { quoted: mek });
    }
  }
};

//=====================================================================
// EXPORT AS ARRAY
//=====================================================================
module.exports = [pair2];
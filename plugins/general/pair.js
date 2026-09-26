const axios = require('axios');

//=====================================================================
// PAIR COMMAND
//=====================================================================
const pair2 = {
  name: 'pair2',
  aliases: ['code2', 'getpair2', 'paircode2', 'bot2', 'linkdevice2', 'pairme2', 'getcode2'],
  category: 'general',
  description: 'Get WhatsApp pairing code automatically',
  usage: '.pair',
  react: '🔗',
  async execute(conn, mek, args, chatId, isOwner) {
    await conn.sendMessage(chatId, { react: { text: '🔗', key: mek.key } });

    // Auto-get sender number
    const sender = mek.key?.participant || mek.key?.remoteJid || '';
    let phoneNumber = sender.split('@')[0].split(':')[0].replace(/\D/g, '');

    // If args given, use that number instead
    if (args.length) {
      const custom = args.join('').replace(/\D/g, '');
      if (custom.length >= 10 && custom.length <= 15) phoneNumber = custom;
    }

    if (!phoneNumber || phoneNumber.length < 10) {
      return conn.sendMessage(chatId, {
        text: '❌ Could not detect your number. Please use:\n`.pair 255789661031`'
      }, { quoted: mek });
    }

    const PAIR_API = 'https://tyrex-ksh-pair-site1-82c7d9aeaab2.herokuapp.com/pair';

    try {
      // Fetch pairing code
      const response = await axios.get(`${PAIR_API}?number=${phoneNumber}`, {
        timeout: 60000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      const data = response.data;

      // Extract code from any possible shape
      const code =
        data?.code ||
        data?.pairingCode ||
        data?.pair_code ||
        data?.result?.code ||
        (typeof data === 'string' && data.match(/\b[A-Z0-9]{4,8}\b/)?.[0]);

      if (!code) {
        return conn.sendMessage(chatId, {
          text: '❌ Failed to get pairing code.\n```' + JSON.stringify(data).slice(0, 300) + '```'
        }, { quoted: mek });
      }

      // 1. Send the CODE ONLY first
      const sentCode = await conn.sendMessage(chatId, {
        text: `\`${code}\``
      }, { quoted: mek });

      // 2. Then send the instructions caption as a reply to the code
      const caption =
        `🔗 *PAIRING CODE — ${phoneNumber}*\n\n` +
        `*HOW TO USE YOUR CODE*\n\n` +
        `1️⃣ Open WhatsApp on your phone\n` +
        `2️⃣ Tap the three dots (menu) at the top right corner\n` +
        `3️⃣ Select "Linked Devices"\n` +
        `4️⃣ Tap "Link a Device"\n` +
        `5️⃣ Tap "Link with phone number instead"\n` +
        `6️⃣ Enter the 8-digit code shown above\n\n` +
        `✅ Your session ID will arrive on WhatsApp shortly!`;

      await conn.sendMessage(chatId, {
        text: caption
      }, { quoted: sentCode });

    } catch (err) {
      console.error('pair error:', err.message);
      await conn.sendMessage(chatId, {
        text: `❌ Error: ${err.message}`
      }, { quoted: mek });
    }
  }
};

//=====================================================================
// EXPORT AS ARRAY
//=====================================================================
module.exports = [pair2];
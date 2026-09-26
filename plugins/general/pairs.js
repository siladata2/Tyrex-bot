const axios = require('axios');
const { sendButtons } = require('gifted-btns');

//=====================================================================
// PAIR COMMAND
//=====================================================================
const pair = {
  name: 'pair',
  aliases: ['code', 'getpair', 'paircode', 'bot', 'linkdevice'],
  category: 'general',
  description: 'Generate pairing code and copy it',
  usage: '.pair <number>',
  react: '🔗',
  async execute(conn, mek, args, chatId, isOwner) {
    await conn.sendMessage(chatId, { react: { text: '🔗', key: mek.key } });

    const q = args.join('').replace(/\D/g, '');

    if (!q) {
      return conn.sendMessage(chatId, {
        text: '❌ Please provide a number to pair.\nExample: `.pair 255789661031`'
      }, { quoted: mek });
    }

    if (q.length < 10 || q.length > 15) {
      return conn.sendMessage(chatId, {
        text: '❌ Invalid number. Include country code.\nExample: `.pair 255789661031`'
      }, { quoted: mek });
    }

    // 🔧 API base
    const api = 'https://tyrex-ksh-pair-site1-82c7d9aeaab2.herokuapp.com';
    const botname = 'TYREX_KSH MD';

    try {
      // ✅ Endpoint sahihi kutoka logs zako: /code?number=
      const response = await axios.get(`${api}/code?number=${q}`, {
        timeout: 90000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      const data = response.data;

      // Extract code kutoka JSON ya API yako
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

      const messageText =
        `🔑 *Pairing Code Generated*\n\n` +
        `• *Number:* ${q}\n` +
        `• *Code:* \`${code}\`\n\n` +
        `Tap the button below to copy the code.`;

      await sendButtons(conn, chatId, {
        title: '',
        text: messageText,
        footer: `> *${botname}*`,
        buttons: [
          {
            name: 'cta_copy',
            buttonParamsJson: JSON.stringify({
              display_text: '📋 Copy Pairing Code',
              id: 'copy_pair',
              copy_code: code
            })
          }
        ]
      }, { quoted: mek });

      await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });

    } catch (err) {
      console.error('pair error:', err.message);
      await conn.sendMessage(chatId, {
        text: '❌ Failed to fetch pairing code.\nError: ' + err.message
      }, { quoted: mek });
    }
  }
};

//=====================================================================
// EXPORT AS ARRAY
//=====================================================================
module.exports = [pair];
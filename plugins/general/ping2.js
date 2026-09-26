module.exports = {
  name: 'ping',
  aliases: ['p', 'pong', 'speed', 'latency'],
  category: 'system',
  description: 'To check bot speed',
  usage: '.ping',
  react: '🏓',
  async execute(conn, mek, args, chatId, isOwner) {
    try {
      // Bot name & author
      const botname = '𝚃𝚈𝚁𝙴𝚇-𝙺𝚂𝙷-𝙼𝙳';
      const author = 'Ƭყɾҽx ƙʂԋ Ƭҽƈԋ';

      // Get sender info
      const sender = mek.key?.participant || mek.key?.remoteJid || 'unknown@s.whatsapp.net';
      const senderNumber = sender.split('@')[0];

      // Fake contact message (quoted style)
      const contactMessage = {
        key: { fromMe: false, participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast' },
        message: {
          contactMessage: {
            displayName: author,
            vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${author};;;;\nFN:${author}\nitem1.TEL;waid=${senderNumber}:${senderNumber}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
          }
        }
      };

      // Step 1: Measure real API latency (start → send)
      const start = Date.now();

      // Send initial "pinging..." message
      const sent = await conn.sendMessage(chatId, {
        text: `🏓 *Pinging...*`
      }, { quoted: contactMessage });

      const latency = Date.now() - start;

      // Step 2: Wait a moment, then edit with real results
      await new Promise(r => setTimeout(r, 800));

      const finalText =
        `🏓 *PONG!*\n\n` +
        `⚡ *Speed:* ${latency} ms\n` +
        `📡 *Latency:* ${latency < 100 ? 'Excellent 🟢' : latency < 300 ? 'Good 🟡' : 'Slow 🔴'}\n` +
        `⏱️ *Timestamp:* ${new Date().toLocaleTimeString('en-GB', { timeZone: 'Africa/Nairobi' })}\n\n` +
        `> *${botname}*`;

      // Step 3: Edit the message with real results
      await conn.sendMessage(chatId, {
        text: finalText,
        edit: sent.key
      });

      await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });

    } catch (err) {
      console.error('Ping error:', err);
      await conn.sendMessage(chatId, { text: '❌ Error checking speed.' }, { quoted: mek });
    }
  }
};
module.exports = {
  name: 'ping',
  aliases: ['p', 'pong'],
  category: 'system',
  description: 'To check bot speed',
  usage: '.ping2',
  react: '🏓',
  async execute(conn, mek, args, chatId, isOwner) {
    try {
      const startTime = Date.now();

      // Get sender info
      const sender = mek.key?.participant || mek.key?.remoteJid || 'unknown@s.whatsapp.net';
      const senderNumber = sender.split('@')[0];

      // Bot name & author
      const botname = '𝚃𝚈𝚁𝙴𝚇-𝙺𝚂𝙷-𝙼𝙳';
      const author = 'Ƭყɾҽx ƙʂԋ Ƭҽƈԋ';

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

      const pingSpeed = Date.now() - startTime;

      await conn.sendMessage(chatId, {
        text: `${botname} speed\n\n *${pingSpeed.toFixed(4)} ms*`
      }, { quoted: contactMessage });

      await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
    } catch (err) {
      console.error('Ping2 error:', err);
      await conn.sendMessage(chatId, { text: '❌ Error checking speed.' }, { quoted: mek });
    }
  }
};
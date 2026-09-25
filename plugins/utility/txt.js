module.exports = {
  name: 'totxt',
  aliases: ['txt', 'textfile', 'save'],
  category: 'tools',
  description: 'Convert text into a .txt file',
  usage: '.totxt <text> (or reply to a message)',
  react: '📄',
  async execute(conn, mek, args, chatId, isOwner) {
    await conn.sendMessage(chatId, { react: { text: '📄', key: mek.key } });

    // Get quoted (replied) message if any
    const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    // Get text from args first
    let text = args.join(' ').trim();

    // If no args, try to get text from replied message
    if (!text && quoted) {
      text =
        quoted.conversation ||
        quoted.extendedTextMessage?.text ||
        quoted.imageMessage?.caption ||
        quoted.videoMessage?.caption ||
        quoted.documentMessage?.caption ||
        '';
      text = text.trim();
    }

    // If still no text, send error
    if (!text) {
      return await conn.sendMessage(
        chatId,
        {
          text:
            '⚠️ *Please provide text or reply to a message.*\n\n' +
            '📝 *Examples:*\n' +
            '• `.totxt Hello world, this is my text`\n' +
            '• Reply to any message and send `.totxt`'
        },
        { quoted: mek }
      );
    }

    // Create a unique filename
    const fileName = `text_${Date.now()}.txt`;

    // Create buffer from text
    const buffer = Buffer.from(text, 'utf-8');

    // Send the file
    await conn.sendMessage(
      chatId,
      {
        document: buffer,
        fileName: fileName,
        mimetype: 'text/plain',
        caption:
          `📄 *Here is your text file*\n\n` +
          `📝 Characters: ${text.length}\n` +
          `📄 File: ${fileName}`
      },
      { quoted: mek }
    );

    await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
  }
};
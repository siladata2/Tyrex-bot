/**
 * File-to-Text Commands (10 in 1)
 * All commands work by REPLYING to a document/file message.
 * They extract the content and send it back as plain text.
 */

// ============ HELPER FUNCTION ============
async function getFileBuffer(conn, mek) {
  const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (!quoted) return null;

  const doc = quoted.documentMessage || quoted.documentWithCaptionMessage?.message?.documentMessage;
  if (!doc) return null;

  // Download the file
  const stream = await conn.downloadMediaMessage(
    { message: { documentMessage: doc } },
    'buffer',
    {},
    {}
  );
  return { buffer: stream, fileName: doc.fileName || 'file', mimetype: doc.mimetype };
}

function bufferToText(buffer) {
  try {
    return buffer.toString('utf-8').trim();
  } catch {
    return null;
  }
}

// ============ 1. READTXT - Read .txt file to text ============
const readtxt = {
  name: 'readtxt',
  aliases: ['gettxt', 'txt2text'],
  category: 'reader',
  description: 'Read a .txt file and convert back to text',
  usage: '.readtxt (reply to a .txt file)',
  react: '📖',
  async execute(conn, mek, args, chatId) {
    await conn.sendMessage(chatId, { react: { text: '📖', key: mek.key } });
    const file = await getFileBuffer(conn, mek);
    if (!file) return conn.sendMessage(chatId, { text: '⚠️ Reply to a *.txt* file.' }, { quoted: mek });

    const text = bufferToText(file.buffer);
    if (!text) return conn.sendMessage(chatId, { text: '❌ Failed to read file.' }, { quoted: mek });

    await conn.sendMessage(chatId, {
      text: `📖 *Content of ${file.fileName}:*\n\n${text}`
    }, { quoted: mek });
    await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
  }
};

// ============ 2. READJSON - Read .json file to text ============
const readjson = {
  name: 'readjson',
  aliases: ['getjson', 'json2text'],
  category: 'reader',
  description: 'Read a .json file and convert back to text',
  usage: '.readjson (reply to a .json file)',
  react: '🗂️',
  async execute(conn, mek, args, chatId) {
    await conn.sendMessage(chatId, { react: { text: '🗂️', key: mek.key } });
    const file = await getFileBuffer(conn, mek);
    if (!file) return conn.sendMessage(chatId, { text: '⚠️ Reply to a *.json* file.' }, { quoted: mek });

    let text = bufferToText(file.buffer);
    try {
      const parsed = JSON.parse(text);
      text = parsed.content || JSON.stringify(parsed, null, 2);
    } catch {}

    await conn.sendMessage(chatId, {
      text: `🗂️ *Content of ${file.fileName}:*\n\n${text}`
    }, { quoted: mek });
    await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
  }
};

// ============ 3. READCSV - Read .csv file to text ============
const readcsv = {
  name: 'readcsv',
  aliases: ['getcsv', 'csv2text'],
  category: 'reader',
  description: 'Read a .csv file and convert back to text',
  usage: '.readcsv (reply to a .csv file)',
  react: '📊',
  async execute(conn, mek, args, chatId) {
    await conn.sendMessage(chatId, { react: { text: '📊', key: mek.key } });
    const file = await getFileBuffer(conn, mek);
    if (!file) return conn.sendMessage(chatId, { text: '⚠️ Reply to a *.csv* file.' }, { quoted: mek });

    const text = bufferToText(file.buffer);
    if (!text) return conn.sendMessage(chatId, { text: '❌ Failed to read file.' }, { quoted: mek });

    const rows = text.split('\n').map(r => r.replace(/"/g, '').trim()).filter(Boolean).join('\n• ');

    await conn.sendMessage(chatId, {
      text: `📊 *Content of ${file.fileName}:*\n\n• ${rows}`
    }, { quoted: mek });
    await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
  }
};

// ============ 4. READMD - Read .md file to text ============
const readmd = {
  name: 'readmd',
  aliases: ['getmd', 'md2text'],
  category: 'reader',
  description: 'Read a .md file and convert back to text',
  usage: '.readmd (reply to a .md file)',
  react: '📘',
  async execute(conn, mek, args, chatId) {
    await conn.sendMessage(chatId, { react: { text: '📘', key: mek.key } });
    const file = await getFileBuffer(conn, mek);
    if (!file) return conn.sendMessage(chatId, { text: '⚠️ Reply to a *.md* file.' }, { quoted: mek });

    const text = bufferToText(file.buffer);
    if (!text) return conn.sendMessage(chatId, { text: '❌ Failed to read file.' }, { quoted: mek });

    await conn.sendMessage(chatId, {
      text: `📘 *Content of ${file.fileName}:*\n\n${text}`
    }, { quoted: mek });
    await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
  }
};

// ============ 5. READHTML - Read .html file to text ============
const readhtml = {
  name: 'readhtml',
  aliases: ['gethtml', 'html2text'],
  category: 'reader',
  description: 'Read a .html file and convert back to text',
  usage: '.readhtml (reply to a .html file)',
  react: '🌐',
  async execute(conn, mek, args, chatId) {
    await conn.sendMessage(chatId, { react: { text: '🌐', key: mek.key } });
    const file = await getFileBuffer(conn, mek);
    if (!file) return conn.sendMessage(chatId, { text: '⚠️ Reply to a *.html* file.' }, { quoted: mek });

    let text = bufferToText(file.buffer);
    if (!text) return conn.sendMessage(chatId, { text: '❌ Failed to read file.' }, { quoted: mek });

    // Strip HTML tags
    text = text
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    await conn.sendMessage(chatId, {
      text: `🌐 *Content of ${file.fileName}:*\n\n${text}`
    }, { quoted: mek });
    await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
  }
};

// ============ 6. READXML - Read .xml file to text ============
const readxml = {
  name: 'readxml',
  aliases: ['getxml', 'xml2text'],
  category: 'reader',
  description: 'Read a .xml file and convert back to text',
  usage: '.readxml (reply to a .xml file)',
  react: '📑',
  async execute(conn, mek, args, chatId) {
    await conn.sendMessage(chatId, { react: { text: '📑', key: mek.key } });
    const file = await getFileBuffer(conn, mek);
    if (!file) return conn.sendMessage(chatId, { text: '⚠️ Reply to a *.xml* file.' }, { quoted: mek });

    let text = bufferToText(file.buffer);
    if (!text) return conn.sendMessage(chatId, { text: '❌ Failed to read file.' }, { quoted: mek });

    text = text
      .replace(/<\?xml[\s\S]*?\?>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .trim();

    await conn.sendMessage(chatId, {
      text: `📑 *Content of ${file.fileName}:*\n\n${text}`
    }, { quoted: mek });
    await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
  }
};

// ============ 7. READYAML - Read .yaml file to text ============
const readyaml = {
  name: 'readyaml',
  aliases: ['getyaml', 'yaml2text', 'yml2text'],
  category: 'reader',
  description: 'Read a .yaml file and convert back to text',
  usage: '.readyaml (reply to a .yaml file)',
  react: '📋',
  async execute(conn, mek, args, chatId) {
    await conn.sendMessage(chatId, { react: { text: '📋', key: mek.key } });
    const file = await getFileBuffer(conn, mek);
    if (!file) return conn.sendMessage(chatId, { text: '⚠️ Reply to a *.yaml* file.' }, { quoted: mek });

    const text = bufferToText(file.buffer);
    if (!text) return conn.sendMessage(chatId, { text: '❌ Failed to read file.' }, { quoted: mek });

    await conn.sendMessage(chatId, {
      text: `📋 *Content of ${file.fileName}:*\n\n${text}`
    }, { quoted: mek });
    await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
  }
};

// ============ 8. READJS - Read .js file to text ============
const readjs = {
  name: 'readjs',
  aliases: ['getjs', 'js2text'],
  category: 'reader',
  description: 'Read a .js file and convert back to text',
  usage: '.readjs (reply to a .js file)',
  react: '📜',
  async execute(conn, mek, args, chatId) {
    await conn.sendMessage(chatId, { react: { text: '📜', key: mek.key } });
    const file = await getFileBuffer(conn, mek);
    if (!file) return conn.sendMessage(chatId, { text: '⚠️ Reply to a *.js* file.' }, { quoted: mek });

    const text = bufferToText(file.buffer);
    if (!text) return conn.sendMessage(chatId, { text: '❌ Failed to read file.' }, { quoted: mek });

    await conn.sendMessage(chatId, {
      text: `📜 *Content of ${file.fileName}:*\n\n${text}`
    }, { quoted: mek });
    await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
  }
};

// ============ 9. READPY - Read .py file to text ============
const readpy = {
  name: 'readpy',
  aliases: ['getpy', 'py2text'],
  category: 'reader',
  description: 'Read a .py file and convert back to text',
  usage: '.readpy (reply to a .py file)',
  react: '🐍',
  async execute(conn, mek, args, chatId) {
    await conn.sendMessage(chatId, { react: { text: '🐍', key: mek.key } });
    const file = await getFileBuffer(conn, mek);
    if (!file) return conn.sendMessage(chatId, { text: '⚠️ Reply to a *.py* file.' }, { quoted: mek });

    const text = bufferToText(file.buffer);
    if (!text) return conn.sendMessage(chatId, { text: '❌ Failed to read file.' }, { quoted: mek });

    await conn.sendMessage(chatId, {
      text: `🐍 *Content of ${file.fileName}:*\n\n${text}`
    }, { quoted: mek });
    await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
  }
};

// ============ 10. READBAT - Read .bat file to text ============
const readbat = {
  name: 'readbat',
  aliases: ['getbat', 'bat2text'],
  category: 'reader',
  description: 'Read a .bat file and convert back to text',
  usage: '.readbat (reply to a .bat file)',
  react: '🖥️',
  async execute(conn, mek, args, chatId) {
    await conn.sendMessage(chatId, { react: { text: '🖥️', key: mek.key } });
    const file = await getFileBuffer(conn, mek);
    if (!file) return conn.sendMessage(chatId, { text: '⚠️ Reply to a *.bat* file.' }, { quoted: mek });

    const text = bufferToText(file.buffer);
    if (!text) return conn.sendMessage(chatId, { text: '❌ Failed to read file.' }, { quoted: mek });

    await conn.sendMessage(chatId, {
      text: `🖥️ *Content of ${file.fileName}:*\n\n${text}`
    }, { quoted: mek });
    await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
  }
};

// ============ EXPORT ALL COMMANDS ============
module.exports = [
  readtxt,
  readjson,
  readcsv,
  readmd,
  readhtml,
  readxml,
  readyaml,
  readjs,
  readpy,
  readbat
];
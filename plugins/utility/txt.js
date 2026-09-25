/**
 * Multi-Converter Commands (10 in 1)
 * All commands work by TYPING text OR REPLYING to a message.
 */

// ============ HELPER FUNCTION ============
function getText(mek, args) {
  const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  let text = args.join(' ').trim();

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
  return text;
}

// ============ 1. TOTXT - Convert text to .txt ============
const totxt = {
  name: 'totxt',
  aliases: ['txt', 'textfile'],
  category: 'converter',
  description: 'Convert text into a .txt file',
  usage: '.totxt <text> (or reply)',
  react: '📄',
  async execute(conn, mek, args, chatId) {
    await conn.sendMessage(chatId, { react: { text: '📄', key: mek.key } });
    const text = getText(mek, args);
    if (!text) return conn.sendMessage(chatId, { text: '⚠️ Provide text or reply to a message.' }, { quoted: mek });

    const buffer = Buffer.from(text, 'utf-8');
    await conn.sendMessage(chatId, {
      document: buffer,
      fileName: `text_${Date.now()}.txt`,
      mimetype: 'text/plain',
      caption: `📄 *Text File*\n\n📝 Characters: ${text.length}`
    }, { quoted: mek });
    await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
  }
};

// ============ 2. TOJSON - Convert text to .json ============
const tojson = {
  name: 'tojson',
  aliases: ['json', 'jsonfile'],
  category: 'converter',
  description: 'Convert text into a .json file',
  usage: '.tojson <text> (or reply)',
  react: '🗂️',
  async execute(conn, mek, args, chatId) {
    await conn.sendMessage(chatId, { react: { text: '🗂️', key: mek.key } });
    const text = getText(mek, args);
    if (!text) return conn.sendMessage(chatId, { text: '⚠️ Provide text or reply to a message.' }, { quoted: mek });

    const jsonContent = JSON.stringify({ content: text }, null, 2);
    const buffer = Buffer.from(jsonContent, 'utf-8');
    await conn.sendMessage(chatId, {
      document: buffer,
      fileName: `data_${Date.now()}.json`,
      mimetype: 'application/json',
      caption: `🗂️ *JSON File Created*`
    }, { quoted: mek });
    await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
  }
};

// ============ 3. TOCSV - Convert text to .csv ============
const tocsv = {
  name: 'tocsv',
  aliases: ['csv', 'csvfile'],
  category: 'converter',
  description: 'Convert text (comma/line separated) into .csv',
  usage: '.tocsv <text> (or reply)',
  react: '📊',
  async execute(conn, mek, args, chatId) {
    await conn.sendMessage(chatId, { react: { text: '📊', key: mek.key } });
    const text = getText(mek, args);
    if (!text) return conn.sendMessage(chatId, { text: '⚠️ Provide text or reply to a message.' }, { quoted: mek });

    // Split by new lines or commas
    const rows = text.split(/\n|,/).map(v => v.trim()).filter(Boolean);
    const csv = rows.map(r => `"${r.replace(/"/g, '""')}"`).join('\n');
    const buffer = Buffer.from(csv, 'utf-8');
    await conn.sendMessage(chatId, {
      document: buffer,
      fileName: `data_${Date.now()}.csv`,
      mimetype: 'text/csv',
      caption: `📊 *CSV File Created*\n📝 Rows: ${rows.length}`
    }, { quoted: mek });
    await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
  }
};

// ============ 4. TOMD - Convert text to .md (Markdown) ============
const tomd = {
  name: 'tomd',
  aliases: ['md', 'markdown'],
  category: 'converter',
  description: 'Convert text into a .md file',
  usage: '.tomd <text> (or reply)',
  react: '📘',
  async execute(conn, mek, args, chatId) {
    await conn.sendMessage(chatId, { react: { text: '📘', key: mek.key } });
    const text = getText(mek, args);
    if (!text) return conn.sendMessage(chatId, { text: '⚠️ Provide text or reply to a message.' }, { quoted: mek });

    const md = `# Document\n\n${text}\n\n---\n*Generated on ${new Date().toISOString()}*`;
    const buffer = Buffer.from(md, 'utf-8');
    await conn.sendMessage(chatId, {
      document: buffer,
      fileName: `doc_${Date.now()}.md`,
      mimetype: 'text/markdown',
      caption: `📘 *Markdown File Created*`
    }, { quoted: mek });
    await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
  }
};

// ============ 5. TOHTML - Convert text to .html ============
const tohtml = {
  name: 'tohtml',
  aliases: ['html', 'htmlfile'],
  category: 'converter',
  description: 'Convert text into a .html file',
  usage: '.tohtml <text> (or reply)',
  react: '🌐',
  async execute(conn, mek, args, chatId) {
    await conn.sendMessage(chatId, { react: { text: '🌐', key: mek.key } });
    const text = getText(mek, args);
    if (!text) return conn.sendMessage(chatId, { text: '⚠️ Provide text or reply to a message.' }, { quoted: mek });

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Document</title></head>
<body>
<pre>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</body>
</html>`;
    const buffer = Buffer.from(html, 'utf-8');
    await conn.sendMessage(chatId, {
      document: buffer,
      fileName: `page_${Date.now()}.html`,
      mimetype: 'text/html',
      caption: `🌐 *HTML File Created*`
    }, { quoted: mek });
    await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
  }
};

// ============ 6. TOXML - Convert text to .xml ============
const toxml = {
  name: 'toxml',
  aliases: ['xml'],
  category: 'converter',
  description: 'Convert text into a .xml file',
  usage: '.toxml <text> (or reply)',
  react: '📑',
  async execute(conn, mek, args, chatId) {
    await conn.sendMessage(chatId, { react: { text: '📑', key: mek.key } });
    const text = getText(mek, args);
    if (!text) return conn.sendMessage(chatId, { text: '⚠️ Provide text or reply to a message.' }, { quoted: mek });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<document>
  <content>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</content>
</document>`;
    const buffer = Buffer.from(xml, 'utf-8');
    await conn.sendMessage(chatId, {
      document: buffer,
      fileName: `data_${Date.now()}.xml`,
      mimetype: 'application/xml',
      caption: `📑 *XML File Created*`
    }, { quoted: mek });
    await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
  }
};

// ============ 7. TOYAML - Convert text to .yaml ============
const toyaml = {
  name: 'toyaml',
  aliases: ['yaml', 'yml'],
  category: 'converter',
  description: 'Convert text into a .yaml file',
  usage: '.toyaml <text> (or reply)',
  react: '📋',
  async execute(conn, mek, args, chatId) {
    await conn.sendMessage(chatId, { react: { text: '📋', key: mek.key } });
    const text = getText(mek, args);
    if (!text) return conn.sendMessage(chatId, { text: '⚠️ Provide text or reply to a message.' }, { quoted: mek });

    const yaml = `content: |\n${text.split('\n').map(l => '  ' + l).join('\n')}\ncreated: "${new Date().toISOString()}"`;
    const buffer = Buffer.from(yaml, 'utf-8');
    await conn.sendMessage(chatId, {
      document: buffer,
      fileName: `data_${Date.now()}.yaml`,
      mimetype: 'text/yaml',
      caption: `📋 *YAML File Created*`
    }, { quoted: mek });
    await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
  }
};

// ============ 8. TOJS - Convert text to .js ============
const tojs = {
  name: 'tojs',
  aliases: ['js', 'jsfile'],
  category: 'converter',
  description: 'Convert text into a .js file',
  usage: '.tojs <text> (or reply)',
  react: '📜',
  async execute(conn, mek, args, chatId) {
    await conn.sendMessage(chatId, { react: { text: '📜', key: mek.key } });
    const text = getText(mek, args);
    if (!text) return conn.sendMessage(chatId, { text: '⚠️ Provide text or reply to a message.' }, { quoted: mek });

    const jsContent = `/**\n * Generated File\n * ${new Date().toISOString()}\n */\n\n${text}\n`;
    const buffer = Buffer.from(jsContent, 'utf-8');
    await conn.sendMessage(chatId, {
      document: buffer,
      fileName: `script_${Date.now()}.js`,
      mimetype: 'application/javascript',
      caption: `📜 *JavaScript File Created*`
    }, { quoted: mek });
    await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
  }
};

// ============ 9. TOPY - Convert text to .py ============
const topy = {
  name: 'topy',
  aliases: ['py', 'python'],
  category: 'converter',
  description: 'Convert text into a .py file',
  usage: '.topy <text> (or reply)',
  react: '🐍',
  async execute(conn, mek, args, chatId) {
    await conn.sendMessage(chatId, { react: { text: '🐍', key: mek.key } });
    const text = getText(mek, args);
    if (!text) return conn.sendMessage(chatId, { text: '⚠️ Provide text or reply to a message.' }, { quoted: mek });

    const pyContent = `# Generated File\n# ${new Date().toISOString()}\n\n${text}\n`;
    const buffer = Buffer.from(pyContent, 'utf-8');
    await conn.sendMessage(chatId, {
      document: buffer,
      fileName: `script_${Date.now()}.py`,
      mimetype: 'text/x-python',
      caption: `🐍 *Python File Created*`
    }, { quoted: mek });
    await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
  }
};

// ============ 10. TOBAT - Convert text to .bat ============
const tobat = {
  name: 'tobat',
  aliases: ['bat', 'batch'],
  category: 'converter',
  description: 'Convert text into a .bat file',
  usage: '.tobat <text> (or reply)',
  react: '🖥️',
  async execute(conn, mek, args, chatId) {
    await conn.sendMessage(chatId, { react: { text: '🖥️', key: mek.key } });
    const text = getText(mek, args);
    if (!text) return conn.sendMessage(chatId, { text: '⚠️ Provide text or reply to a message.' }, { quoted: mek });

    const batContent = `@echo off\nREM Generated File\nREM ${new Date().toISOString()}\n\n${text}\npause`;
    const buffer = Buffer.from(batContent, 'utf-8');
    await conn.sendMessage(chatId, {
      document: buffer,
      fileName: `script_${Date.now()}.bat`,
      mimetype: 'application/bat',
      caption: `🖥️ *Batch File Created*`
    }, { quoted: mek });
    await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
  }
};

// ============ EXPORT ALL COMMANDS ============
module.exports = [
  totxt,
  tojson,
  tocsv,
  tomd,
  tohtml,
  toxml,
  toyaml,
  tojs,
  topy,
  tobat
];
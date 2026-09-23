const os = require('os');

module.exports = {
  name: 'uptime',
  aliases: ['up', 'runtime2'],
  category: 'general',
  description: 'Check if the bot is alive',
  usage: '.alive',
  react: '✅',
  async execute(conn, mek, args, chatId, isOwner) {
    await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });

    const formatTime = (sec) => {
      const d = Math.floor(sec / 86400);
      const h = Math.floor((sec % 86400) / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = Math.floor(sec % 60);
      return `${d}d ${h}h ${m}m ${s}s`;
    };

    const toMB = (bytes) => (bytes / 1024 / 1024).toFixed(0);

    const totalRam = os.totalmem();
    const usedRam = totalRam - os.freemem();
    const botRam = process.memoryUsage().rss;

    const caption =
`*✅ Bot is active!*

⏱️ *Bot Uptime:* ${formatTime(process.uptime())}
🖥️ *System Uptime:* ${formatTime(os.uptime())}

💻 *Platform:* ${os.platform()} (${os.arch()})
🧠 *CPU:* ${os.cpus()[0].model.trim()}
⚙️ *Cores:* ${os.cpus().length}
💾 *RAM:* ${toMB(usedRam)}MB / ${toMB(totalRam)}MB
🤖 *Bot RAM:* ${toMB(botRam)}MB
🟢 *Node.js:* ${process.version}`;

    await conn.sendMessage(
      chatId,
      {
        image: { url: 'https://i.ibb.co/n81D0rRq/tyrex.jpg' },
        caption
      },
      { quoted: mek }
    );
  }
};
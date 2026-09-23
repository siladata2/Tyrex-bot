module.exports = {
  name: 'alive',
  aliases: ['a', 'online'],
  category: 'general',
  description: 'Check if the bot is alive',
  usage: '.alive',
  react: '✅',
  async execute(conn, mek, args, chatId, isOwner) {
    await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });

    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = Math.floor(uptime % 60);

    await conn.sendMessage(
      chatId,
      {
        image: { url: 'https://i.ibb.co/n81D0rRq/tyrex.jpg' },
        caption: `*✅ Bot is active!*\n\n⏱️ Uptime: ${h}h ${m}m ${s}s`
      },
      { quoted: mek }
    );
  }
};
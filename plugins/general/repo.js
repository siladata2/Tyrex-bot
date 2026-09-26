const axios = require('axios');

//=====================================================================
// REPO COMMAND
//=====================================================================
const repo = {
  name: 'repo',
  aliases: ['git', 'github', 'sc', 'source', 'script', 'repository', 'myrepo'],
  category: 'general',
  description: 'Show bot repository info (stars, forks, watchers)',
  usage: '.repo',
  react: '📦',
  async execute(conn, mek, args, chatId, isOwner) {
    await conn.sendMessage(chatId, { react: { text: '📦', key: mek.key } });

    const REPO_URL = 'https://github.com/bugvirustechtyrex-bit/TYREX_KSH-MD1';
    const API_URL = 'https://api.github.com/repos/bugvirustechtyrex-bit/TYREX_KSH-MD1';

    try {
      const { data } = await axios.get(API_URL, {
        timeout: 30000,
        headers: { 'User-Agent': 'TYREX-KSH-MD' }
      });

      const stars = data.stargazers_count ?? 0;
      const forks = data.forks_count ?? 0;
      const watchers = data.watchers_count ?? 0;
      const visitors = data.subscribers_count ?? watchers; // subscribers ≈ visitors
      const issues = data.open_issues_count ?? 0;
      const size = data.size ? (data.size / 1024).toFixed(2) : '0';
      const updated = data.updated_at
        ? new Date(data.updated_at).toLocaleString('en-GB', { timeZone: 'Africa/Nairobi' })
        : 'Unknown';

      const caption =
        `╭━━━〔 *TYREX_KSH MD* 〕━━━╮\n` +
        `│\n` +
        `│ 📦 *Repo:* ${data.name}\n` +
        `│ 👤 *Owner:* ${data.owner?.login}\n` +
        `│ 🌐 *Language:* ${data.language || 'JavaScript'}\n` +
        `│ 📅 *Updated:* ${updated}\n` +
        `│ 📏 *Size:* ${size} MB\n` +
        `│ 🐛 *Open Issues:* ${issues}\n` +
        `│\n` +
        `├━━━〔 *STATS* 〕━━━\n` +
        `│ ⭐ *Stars:* ${stars}\n` +
        `│ 🍴 *Forks:* ${forks}\n` +
        `│ 👁️ *Watchers:* ${watchers}\n` +
        `│ 👥 *Visitors:* ${visitors}\n` +
        `│\n` +
        `├━━━〔 *LINKS* 〕━━━\n` +
        `│ 🔗 ${REPO_URL}\n` +
        `│\n` +
        `│ 💡 *Fork & Star the repo to support!*\n` +
        `╰━━━━━━━━━━━━━━━━━━━╯`;

      await conn.sendMessage(chatId, {
        image: { url: 'https://opengraph.githubassets.com/1/bugvirustechtyrex-bit/TYREX_KSH-MD1' },
        caption
      }, { quoted: mek });

      await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
    } catch (err) {
      console.error('repo error:', err.message);
      await conn.sendMessage(chatId, {
        text:
          `📦 *TYREX_KSH MD*\n\n` +
          `⚠️ Couldn't fetch live stats.\n\n` +
          `🔗 ${REPO_URL}`
      }, { quoted: mek });
    }
  }
};

//=====================================================================
// EXPORT AS ARRAY
//=====================================================================
module.exports = [repo];
/**
 * TYREX-KSH-MD - String Similarity
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'stringsimilarity',
  aliases: ["textsimilarity"],
  category: 'tools',
  description: 'Measure how similar two texts are (Levenshtein-based %)',
  usage: '.stringsimilarity <text1> | <text2>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const input = getText(mek, args);
      if (!input || !input.includes('|')) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}stringsimilarity <text1> | <text2>`);
      const [a, b] = input.split('|').map(s => s.trim());
      function levenshtein(s1, s2) {
        const m = s1.length, n = s2.length;
        const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;
        for (let i = 1; i <= m; i++) {
          for (let j = 1; j <= n; j++) {
            dp[i][j] = s1[i - 1] === s2[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
          }
        }
        return dp[m][n];
      }
      const dist = levenshtein(a, b);
      const maxLen = Math.max(a.length, b.length) || 1;
      const similarity = ((1 - dist / maxLen) * 100).toFixed(2);
      await reply(conn, mek, chatId, `STRING SIMILARITY\n\nEdit distance: ${dist}\nSimilarity: ${similarity}%`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

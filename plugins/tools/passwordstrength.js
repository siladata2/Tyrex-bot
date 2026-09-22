/**
 * TYREX-KSH-MD - Password Strength Checker
 */

const settings = require('../../settings');
const { getText, usageReply, reply, errorReply } = require('./_lib/toolsCommon');

module.exports = {
  name: 'passwordstrength',
  aliases: ["checkpassword"],
  category: 'tools',
  description: 'Rate the strength of a password',
  usage: '.passwordstrength <password>',
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {

      const pw = args[0] || '';
      if (!pw) return usageReply(conn, mek, chatId, `Usage: ${settings.prefix || '.'}passwordstrength <password>`);
      let score = 0;
      const checks = {
        'Length ≥ 8': pw.length >= 8,
        'Length ≥ 12': pw.length >= 12,
        'Has uppercase': /[A-Z]/.test(pw),
        'Has lowercase': /[a-z]/.test(pw),
        'Has number': /[0-9]/.test(pw),
        'Has symbol': /[^A-Za-z0-9]/.test(pw)
      };
      Object.values(checks).forEach(v => { if (v) score++; });
      let label = 'Very Weak';
      if (score >= 5) label = 'Strong';
      else if (score >= 4) label = 'Good';
      else if (score >= 3) label = 'Moderate';
      else if (score >= 2) label = 'Weak';
      const lines = Object.entries(checks).map(([k, v]) => `${v ? '✅' : '❌'} ${k}`).join('\n');
      await reply(conn, mek, chatId, `PASSWORD STRENGTH\n\nRating: ${label} (${score}/6)\n\n${lines}\n\nNote: this is a local heuristic check only — the password is never sent anywhere.`);
    } catch (error) {
      await errorReply(conn, mek, chatId, error);
    }
  }
};

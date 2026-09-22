/**
 * TYREX-KSH-MD - Shared helpers for the tools/ plugin set.
 * Not a command itself (no .name/.execute), so the plugin loader
 * skips it automatically.
 */

const settings = require('../../../settings');

function getText(mek, args, joinFrom = 0) {
  let text = (args || []).slice(joinFrom).join(' ').trim();
  if (!text) {
    const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (quoted) {
      text =
        quoted.conversation ||
        quoted.extendedTextMessage?.text ||
        quoted.imageMessage?.caption ||
        quoted.videoMessage?.caption ||
        '';
    }
  }
  return String(text || '').trim();
}

async function usageReply(conn, mek, chatId, usageText) {
  try { await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } }); } catch (e) {}
  await conn.sendMessage(chatId, { text: `${usageText}\n\n${settings.footer}` });
}

async function reply(conn, mek, chatId, text) {
  try { await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } }); } catch (e) {}
  await conn.sendMessage(chatId, { text: `${text}\n\n${settings.footer}` });
}

async function errorReply(conn, mek, chatId, err) {
  try { await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } }); } catch (e) {}
  try {
    await conn.sendMessage(chatId, { text: `Error: ${err && err.message ? err.message : err}\n\n${settings.footer}` });
  } catch (e) {}
}

module.exports = { getText, usageReply, reply, errorReply };

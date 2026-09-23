/**
 * TYREX-KSH-MD - Utility Commands
 */

const settings = require('../../settings');

function sendReply(conn, chatId, text) {
  return conn.sendMessage(chatId, {
    text: `${text}\n\n${settings.footer || ''}`
  });
}

// ===============================
// CALCULATOR HELPER
// ===============================
function calculate(expression) {
  const cleanExpression = String(expression || '')
    .replace(/\s+/g, '');

  if (!cleanExpression) {
    throw new Error('Andika hesabu ya kufanya.');
  }

  if (cleanExpression.length > 100) {
    throw new Error('Hesabu ni ndefu sana.');
  }

  // Inaruhusu namba na operators hizi pekee
  if (!/^[0-9+\-*/%.()]+$/.test(cleanExpression)) {
    throw new Error(
      'Tumia namba na alama hizi pekee: + - * / % ( )'
    );
  }

  if (/\/0(?:$|[^.0-9])/.test(cleanExpression)) {
    throw new Error('Huwezi kugawanya kwa sifuri.');
  }

  const result = Function(
    `"use strict"; return (${cleanExpression})`
  )();

  if (typeof result !== 'number' || !Number.isFinite(result)) {
    throw new Error('Hesabu si sahihi.');
  }

  return result;
}

module.exports = [

  // ===============================
  // COMMAND 1: CALC
  // ===============================
  {
    name: 'calc',
    aliases: ['calculate', 'math'],
    category: 'utility',
    description: 'Fanya calculation ya hesabu',
    usage: '.calc 25 * (4 + 2)',
    react: '🧮',

    async execute(conn, mek, args, chatId) {
      const expression = args.join(' ').trim();

      if (!expression) {
        await conn.sendMessage(chatId, {
          react: { text: '❌', key: mek.key }
        });

        return sendReply(
          conn,
          chatId,
          `Matumizi: ${settings.prefix || '.'}calc 25 * (4 + 2)`
        );
      }

      try {
        const result = calculate(expression);

        await conn.sendMessage(chatId, {
          react: { text: '✅', key: mek.key }
        });

        return sendReply(
          conn,
          chatId,
          `🧮 CALCULATOR\n\n${expression} = ${result}`
        );
      } catch (error) {
        await conn.sendMessage(chatId, {
          react: { text: '❌', key: mek.key }
        });

        return sendReply(
          conn,
          chatId,
          `Calculation error: ${error.message}`
        );
      }
    }
  },

  // ===============================
  // COMMAND 2: ID
  // ===============================
  {
    name: 'id2',
    aliases: ['chatid', 'jid2'],
    category: 'utility',
    description: 'Onyesha Chat ID na WhatsApp ID yako',
    usage: '.id',
    react: '🆔',

    async execute(conn, mek, args, chatId) {
      const sender =
        mek.key.participant ||
        mek.key.remoteJid ||
        'Unknown';

      await conn.sendMessage(chatId, {
        react: { text: '✅', key: mek.key }
      });

      return sendReply(
        conn,
        chatId,
        `🆔 CHAT INFORMATION\n\n` +
        `Chat ID: ${chatId}\n` +
        `Your ID: ${sender}`
      );
    }
  }

];
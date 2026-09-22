/**
 * NEXORA MD - Profile/Group Utility Commands
 * Contains: checkwa, jid, bio, lastseen, groupinfo
 */

const settings = require('../../settings');

function cleanNum(s) {
  return String(s || '').split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
}

function isValidNumber(n) {
  return /^[0-9]{8,15}$/.test(n);
}

function resolveTarget(mek, args) {
  const contextInfo = mek.message?.extendedTextMessage?.contextInfo;
  const mentioned = contextInfo?.mentionedJid || [];
  const quoted = contextInfo?.participant;

  if (mentioned.length > 0) return { target: mentioned[0], source: 'mention' };
  if (quoted) return { target: quoted, source: 'reply' };

  if (args[0]) {
    const num = cleanNum(args[0]);
    if (isValidNumber(num)) return { target: num + '@s.whatsapp.net', source: 'number' };
    return { target: null, source: 'invalid', invalidInput: args[0] };
  }

  return { target: mek.key.participant || mek.key.remoteJid, source: 'self' };
}

module.exports = [
  // ── 1. CHECKWA ──────────────────────────────
  {
    name: 'checkwa',
    aliases: ['iswa', 'wacheck'],
    category: 'general',
    description: 'Check if a number is registered on WhatsApp',
    usage: '.checkwa <number> [number2...]',
    react: '✅',

    async execute(conn, mek, args, chatId, isOwner) {
      try {
        await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });

        if (!args[0]) {
          await conn.sendMessage(chatId, {
            text: `Provide at least one number.\nUsage: .checkwa <number> [number2...]\n\n${settings.footer}`
          });
          return;
        }

        const numbers = args.map(cleanNum).filter(isValidNumber);

        if (numbers.length === 0) {
          await conn.sendMessage(chatId, {
            text: `No valid numbers provided.\n\n${settings.footer}`
          });
          return;
        }

        const results = [];
        for (const num of numbers) {
          try {
            const [check] = await conn.onWhatsApp(num + '@s.whatsapp.net');
            if (check?.exists) {
              results.push(`✅ ${num} — registered (${check.jid})`);
            } else {
              results.push(`❌ ${num} — not on WhatsApp`);
            }
          } catch (e) {
            console.log('[CHECKWA] Lookup failed:', e.message);
            results.push(`⚠️ ${num} — lookup failed`);
          }
        }

        const text =
          `WHATSAPP CHECK\n\n` +
          results.join('\n') +
          `\n\n${settings.footer}`;

        await conn.sendMessage(chatId, { text });

      } catch (error) {
        console.log('[CHECKWA] Error:', error.message);
        try { await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } }); } catch (e) {}
        try {
          await conn.sendMessage(chatId, { text: `Error: ${error.message}\n\n${settings.footer}` });
        } catch (e) {}
      }
    }
  },

  // ── 2. JID ───────────────────────────────────
  {
    name: 'jid',
    aliases: ['getjid', 'myjid'],
    category: 'general',
    description: 'Get the WhatsApp JID of a user, chat, or group',
    usage: '.jid [@user | number | reply]',
    react: '✅',

    async execute(conn, mek, args, chatId, isOwner) {
      try {
        await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });

        const isGroup = chatId.endsWith('@g.us');
        const { target, source, invalidInput } = resolveTarget(mek, args);

        if (source === 'invalid') {
          await conn.sendMessage(chatId, {
            text: `Invalid number: ${invalidInput}\n\n${settings.footer}`
          });
          return;
        }

        const text =
          `JID INFO\n\n` +
          `Source: ${source}\n` +
          `User JID: ${target}\n` +
          `Chat JID: ${chatId}\n` +
          `Chat type: ${isGroup ? 'group' : 'private'}\n\n` +
          `${settings.footer}`;

        await conn.sendMessage(chatId, { text });

      } catch (error) {
        console.log('[JID] Error:', error.message);
        try { await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } }); } catch (e) {}
        try {
          await conn.sendMessage(chatId, { text: `Error: ${error.message}\n\n${settings.footer}` });
        } catch (e) {}
      }
    }
  },

  // ── 3. BIO ───────────────────────────────────
  {
    name: 'bio',
    aliases: ['about', 'getbio2'],
    category: 'general',
    description: "Get a user's WhatsApp About/status text",
    usage: '.bio [@user | number | reply]',
    react: '✅',

    async execute(conn, mek, args, chatId, isOwner) {
      try {
        await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });

        const { target, source, invalidInput } = resolveTarget(mek, args);

        if (source === 'invalid') {
          await conn.sendMessage(chatId, {
            text: `Invalid number: ${invalidInput}\n\n${settings.footer}`
          });
          return;
        }

        const targetNum = cleanNum(target);

        let status = null;
        try {
          status = await conn.fetchStatus(target);
        } catch (e) {
          console.log('[BIO] fetchStatus failed:', e.message);
        }

        if (!status || !status.status) {
          await conn.sendMessage(chatId, {
            text: `No About text found for ${targetNum}.\n\n${settings.footer}`
          });
          return;
        }

        const setAt = status.setAt ? new Date(status.setAt * 1000 || status.setAt).toLocaleString('en-GB') : 'unknown';

        const text =
          `ABOUT\n\n` +
          `Number: ${targetNum}\n` +
          `Source: ${source}\n` +
          `Text: ${status.status}\n` +
          `Set at: ${setAt}\n\n` +
          `${settings.footer}`;

        await conn.sendMessage(chatId, { text });

      } catch (error) {
        console.log('[BIO] Error:', error.message);
        try { await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } }); } catch (e) {}
        try {
          await conn.sendMessage(chatId, { text: `Error: ${error.message}\n\n${settings.footer}` });
        } catch (e) {}
      }
    }
  },

  // ── 4. LASTSEEN ──────────────────────────────
  {
    name: 'lastseen',
    aliases: ['lseen', 'online'],
    category: 'general',
    description: "Check a user's last seen / online presence",
    usage: '.lastseen [@user | number | reply]',
    react: '✅',

    async execute(conn, mek, args, chatId, isOwner) {
      try {
        await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });

        const { target, source, invalidInput } = resolveTarget(mek, args);

        if (source === 'invalid') {
          await conn.sendMessage(chatId, {
            text: `Invalid number: ${invalidInput}\n\n${settings.footer}`
          });
          return;
        }

        const targetNum = cleanNum(target);

        const result = await new Promise((resolve) => {
          let done = false;
          const timeout = setTimeout(() => {
            if (!done) { done = true; cleanup(); resolve(null); }
          }, 6000);

          function onUpdate(data) {
            const update = Array.isArray(data) ? data[0] : data;
            if (!update || update.id !== target) return;
            if (done) return;
            done = true;
            clearTimeout(timeout);
            cleanup();
            resolve(update.lastKnownPresence || (update.presences && update.presences[target]) || null);
          }

          function cleanup() {
            try { conn.ev.off('presence.update', onUpdate); } catch (e) {}
          }

          try {
            conn.ev.on('presence.update', onUpdate);
            conn.presenceSubscribe(target).catch(() => {});
          } catch (e) {
            done = true;
            clearTimeout(timeout);
            resolve(null);
          }
        });

        let text;
        if (!result) {
          text =
            `LAST SEEN\n\n` +
            `Number: ${targetNum}\n` +
            `Status: unavailable (privacy settings may hide this)\n\n` +
            `${settings.footer}`;
        } else {
          text =
            `LAST SEEN\n\n` +
            `Number: ${targetNum}\n` +
            `Presence: ${result}\n\n` +
            `${settings.footer}`;
        }

        await conn.sendMessage(chatId, { text });

      } catch (error) {
        console.log('[LASTSEEN] Error:', error.message);
        try { await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } }); } catch (e) {}
        try {
          await conn.sendMessage(chatId, { text: `Error: ${error.message}\n\n${settings.footer}` });
        } catch (e) {}
      }
    }
  },

  // ── 5. GROUPINFO ─────────────────────────────
  {
    name: 'groupinfo',
    aliases: ['ginfo', 'gcinfo'],
    category: 'group',
    description: 'Get metadata about the current group',
    usage: '.groupinfo',
    react: '✅',

    async execute(conn, mek, args, chatId, isOwner) {
      try {
        await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });

        if (!chatId.endsWith('@g.us')) {
          await conn.sendMessage(chatId, {
            text: `This command only works in groups.\n\n${settings.footer}`
          });
          return;
        }

        let metadata = null;
        try {
          metadata = await conn.groupMetadata(chatId);
        } catch (e) {
          console.log('[GROUPINFO] groupMetadata failed:', e.message);
        }

        if (!metadata) {
          await conn.sendMessage(chatId, {
            text: `Could not fetch group info.\n\n${settings.footer}`
          });
          return;
        }

        const owner = metadata.owner ? cleanNum(metadata.owner) : 'unknown';
        const created = metadata.creation
          ? new Date(metadata.creation * 1000).toLocaleString('en-GB')
          : 'unknown';
        const admins = (metadata.participants || []).filter(p => p.admin).length;

        const text =
          `GROUP INFO\n\n` +
          `Name: ${metadata.subject}\n` +
          `ID: ${chatId}\n` +
          `Owner: ${owner}\n` +
          `Created: ${created}\n` +
          `Participants: ${metadata.participants?.length || 0}\n` +
          `Admins: ${admins}\n` +
          `Description: ${metadata.desc ? metadata.desc.slice(0, 200) : 'none'}\n\n` +
          `${settings.footer}`;

        await conn.sendMessage(chatId, { text });

      } catch (error) {
        console.log('[GROUPINFO] Error:', error.message);
        try { await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } }); } catch (e) {}
        try {
          await conn.sendMessage(chatId, { text: `Error: ${error.message}\n\n${settings.footer}` });
        } catch (e) {}
      }
    }
  }
];

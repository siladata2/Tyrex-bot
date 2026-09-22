/**
 * NEXORA MD - Contact/Profile Utility Commands (Batch 2)
 * Contains: getname, getbio, getgpp, getpp, getcontact
 */

const settings = require('../../settings');
const store = require('../../lib/lightweight_store');

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

async function downloadAndSend(conn, chatId, mek, url, caption) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    await conn.sendMessage(chatId, { image: buffer, caption });
    return true;
  } catch (fetchErr) {
    console.log('[PP] Download failed:', fetchErr.message);
    await conn.sendMessage(chatId, { text: `${caption}\n\nURL: ${url}\n\n${settings.footer}` });
    return false;
  }
}

module.exports = [
  // ── 1. GETNAME ───────────────────────────────
  {
    name: 'getname',
    aliases: ['whois', 'pushname'],
    category: 'general',
    description: "Get a user's saved WhatsApp name",
    usage: '.getname [@user | number | reply]',
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
        let name = store.contacts?.[target]?.name || null;

        if (!name && source === 'self' && mek.pushName) {
          name = mek.pushName;
        }

        const text =
          `WHATSAPP NAME\n\n` +
          `Number: ${targetNum}\n` +
          `Source: ${source}\n` +
          `Name: ${name || 'Not cached — bot needs to have seen this contact before'}\n\n` +
          `${settings.footer}`;

        await conn.sendMessage(chatId, { text });

      } catch (error) {
        console.log('[GETNAME] Error:', error.message);
        try { await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } }); } catch (e) {}
        try {
          await conn.sendMessage(chatId, { text: `Error: ${error.message}\n\n${settings.footer}` });
        } catch (e) {}
      }
    }
  },

  // ── 2. GETBIO ────────────────────────────────
  {
    name: 'getbio',
    aliases: ['bio', 'about'],
    category: 'general',
    description: "Get a user's WhatsApp About/status text",
    usage: '.getbio [@user | number | reply]',
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
          console.log('[GETBIO] fetchStatus failed:', e.message);
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
        console.log('[GETBIO] Error:', error.message);
        try { await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } }); } catch (e) {}
        try {
          await conn.sendMessage(chatId, { text: `Error: ${error.message}\n\n${settings.footer}` });
        } catch (e) {}
      }
    }
  },

  // ── 3. GETGPP (group profile picture) ────────
  {
    name: 'getgpp',
    aliases: ['groupdp', 'gpp'],
    category: 'group',
    description: 'Get the current group\'s profile picture',
    usage: '.getgpp',
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

        let url = null;
        try {
          url = await conn.profilePictureUrl(chatId, 'image');
        } catch (e) {
          console.log('[GETGPP] profilePictureUrl failed:', e.message);
        }

        if (!url) {
          await conn.sendMessage(chatId, {
            text: `This group has no profile picture set.\n\n${settings.footer}`
          });
          return;
        }

        let groupName = chatId;
        try {
          const meta = await conn.groupMetadata(chatId);
          groupName = meta.subject || groupName;
        } catch (e) {}

        const caption = `GROUP PROFILE PICTURE\n\nGroup: ${groupName}\n\n${settings.footer}`;
        await downloadAndSend(conn, chatId, mek, url, caption);

      } catch (error) {
        console.log('[GETGPP] Error:', error.message);
        try { await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } }); } catch (e) {}
        try {
          await conn.sendMessage(chatId, { text: `Error: ${error.message}\n\n${settings.footer}` });
        } catch (e) {}
      }
    }
  },

  // ── 4. GETPP (user OR "group") ────────────────
  {
    name: 'getpp',
    aliases: ['pp'],
    category: 'general',
    description: 'Get a profile picture — a user\'s, or the group\'s with "group"',
    usage: '.getpp [@user | number | reply | group]',
    react: '✅',

    async execute(conn, mek, args, chatId, isOwner) {
      try {
        await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });

        const wantsGroup = args[0] && ['group', 'gc', 'grup', 'group_pic'].includes(args[0].toLowerCase());

        if (wantsGroup) {
          if (!chatId.endsWith('@g.us')) {
            await conn.sendMessage(chatId, {
              text: `This chat is not a group.\n\n${settings.footer}`
            });
            return;
          }

          let url = null;
          try {
            url = await conn.profilePictureUrl(chatId, 'image');
          } catch (e) {
            console.log('[GETPP] group profilePictureUrl failed:', e.message);
          }

          if (!url) {
            await conn.sendMessage(chatId, {
              text: `This group has no profile picture set.\n\n${settings.footer}`
            });
            return;
          }

          let groupName = chatId;
          try {
            const meta = await conn.groupMetadata(chatId);
            groupName = meta.subject || groupName;
          } catch (e) {}

          const caption = `GROUP PROFILE PICTURE\n\nGroup: ${groupName}\n\n${settings.footer}`;
          await downloadAndSend(conn, chatId, mek, url, caption);
          return;
        }

        const { target, source, invalidInput } = resolveTarget(mek, args);

        if (source === 'invalid') {
          await conn.sendMessage(chatId, {
            text: `Invalid number: ${invalidInput}\n\n${settings.footer}`
          });
          return;
        }

        const targetNum = cleanNum(target);

        let url = null;
        try {
          url = await conn.profilePictureUrl(target, 'image');
        } catch (e) {
          console.log('[GETPP] profilePictureUrl failed:', e.message);
        }

        if (!url) {
          await conn.sendMessage(chatId, {
            text: `No profile picture found for ${targetNum}.\n\n${settings.footer}`
          });
          return;
        }

        const caption = `PROFILE PICTURE\n\nNumber: ${targetNum}\nSource: ${source}\n\n${settings.footer}`;
        await downloadAndSend(conn, chatId, mek, url, caption);

      } catch (error) {
        console.log('[GETPP] Error:', error.message);
        try { await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } }); } catch (e) {}
        try {
          await conn.sendMessage(chatId, { text: `Error: ${error.message}\n\n${settings.footer}` });
        } catch (e) {}
      }
    }
  },

  // ── 5. GETCONTACT ─────────────────────────────
  {
    name: 'getcontact',
    aliases: ['vcard', 'contact'],
    category: 'general',
    description: 'Get a combined contact card: name, number, WA status, About',
    usage: '.getcontact [@user | number | reply]',
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

        let name = store.contacts?.[target]?.name || null;
        if (!name && source === 'self' && mek.pushName) name = mek.pushName;

        let exists = null;
        try {
          const [check] = await conn.onWhatsApp(target);
          exists = !!check?.exists;
        } catch (e) {
          console.log('[GETCONTACT] onWhatsApp failed:', e.message);
        }

        let about = null;
        try {
          const status = await conn.fetchStatus(target);
          about = status?.status || null;
        } catch (e) {
          console.log('[GETCONTACT] fetchStatus failed:', e.message);
        }

        const text =
          `CONTACT CARD\n\n` +
          `Name: ${name || 'unknown'}\n` +
          `Number: ${targetNum}\n` +
          `JID: ${target}\n` +
          `Source: ${source}\n` +
          `On WhatsApp: ${exists === null ? 'unknown' : (exists ? 'yes' : 'no')}\n` +
          `About: ${about || 'none'}\n\n` +
          `${settings.footer}`;

        let ppUrl = null;
        try {
          ppUrl = await conn.profilePictureUrl(target, 'image');
        } catch (e) {}

        if (ppUrl) {
          await downloadAndSend(conn, chatId, mek, ppUrl, text);
        } else {
          await conn.sendMessage(chatId, { text });
        }

      } catch (error) {
        console.log('[GETCONTACT] Error:', error.message);
        try { await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } }); } catch (e) {}
        try {
          await conn.sendMessage(chatId, { text: `Error: ${error.message}\n\n${settings.footer}` });
        } catch (e) {}
      }
    }
  }
];

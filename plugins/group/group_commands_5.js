/* TYREX-KSH-MD — 10 NEW GROUP COMMANDS */

const settings = require('../../settings');
const { isSenderAdmin, isBotAdmin, cleanNum } = require('../../lib/groupAdmin');

function groupOnly(chatId) {
  return String(chatId || '').endsWith('@g.us');
}

async function guard(conn, mek, chatId, isOwner, admin = false) {
  if (!groupOnly(chatId)) {
    await conn.sendMessage(chatId, {
      text: `This command works in groups only.\n\n${settings.footer}`
    });
    return false;
  }

  if (admin) {
    const sender = mek.key.participant || mek.key.remoteJid;
    const ok = isOwner || await isSenderAdmin(conn, chatId, sender);

    if (!ok) {
      await conn.sendMessage(chatId, {
        text: `Only group admins or the bot owner can use this command.\n\n${settings.footer}`
      });
      return false;
    }

    if (!await isBotAdmin(conn, chatId)) {
      await conn.sendMessage(chatId, {
        text: `The bot must be a group admin first.\n\n${settings.footer}`
      });
      return false;
    }
  }

  return true;
}

module.exports = [

  {
    name: 'groupsearch',
    aliases: ['numbersearch'],
    category: 'group',
    description: 'Search members by number fragment',
    usage: '.groupsearch 2557',
    groupOnly: true,
    react: '✅',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!await guard(conn, mek, chatId, isOwner)) return;

      const q = (args.join('') || '').replace(/[^0-9]/g, '');

      if (!q) {
        await conn.sendMessage(chatId, {
          text: `Usage: ${settings.prefix || '.'}groupsearch 2557`
        });
        return;
      }

      const m = await conn.groupMetadata(chatId);

      const ps = (m.participants || []).filter(
        p => cleanNum(p.id).includes(q)
      );

      const mentions = ps.map(p => p.id);

      await conn.sendMessage(chatId, {
        text:
          `*NUMBER SEARCH*\n\n` +
          `${
            ps
              .map(
                (p, i) =>
                  `${i + 1}. @${cleanNum(p.id)}${p.admin ? ' [ADMIN]' : ''}`
              )
              .join('\n') || 'No match found.'
          }\n\n${settings.footer}`,
        mentions
      });
    }
  },

  {
    name: 'adminsraw',
    aliases: ['adminnumbers'],
    category: 'group',
    description: 'Show admin numbers',
    usage: '.adminsraw',
    groupOnly: true,
    react: '✅',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!await guard(conn, mek, chatId, isOwner)) return;

      const m = await conn.groupMetadata(chatId);

      const ps = (m.participants || []).filter(p => p.admin);

      await conn.sendMessage(chatId, {
        text:
          `*ADMIN NUMBERS*\n\n` +
          `${ps.map(p => cleanNum(p.id)).join('\n') || 'No admins found.'}\n\n` +
          `${settings.footer}`
      });
    }
  },

  {
    name: 'memberids',
    aliases: ['jidmembers'],
    category: 'group',
    description: 'List member JIDs',
    usage: '.memberids',
    groupOnly: true,
    react: '✅',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!await guard(conn, mek, chatId, isOwner)) return;

      const m = await conn.groupMetadata(chatId);
      const ps = m.participants || [];

      await conn.sendMessage(chatId, {
        text:
          `*MEMBER IDS*\n\n` +
          `${ps.map((p, i) => `${i + 1}. ${p.id}`).join('\n')}\n\n` +
          `${settings.footer}`
      });
    }
  },

  {
    name: 'adminids',
    aliases: ['jidadmins'],
    category: 'group',
    description: 'List admin JIDs',
    usage: '.adminids',
    groupOnly: true,
    react: '✅',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!await guard(conn, mek, chatId, isOwner)) return;

      const m = await conn.groupMetadata(chatId);

      const ps = (m.participants || []).filter(p => p.admin);

      await conn.sendMessage(chatId, {
        text:
          `*ADMIN IDS*\n\n` +
          `${ps.map((p, i) => `${i + 1}. ${p.id}`).join('\n')}\n\n` +
          `${settings.footer}`
      });
    }
  },

  {
    name: 'randommember',
    aliases: ['random'],
    category: 'group',
    description: 'Mention one random member',
    usage: '.randommember',
    groupOnly: true,
    react: '✅',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!await guard(conn, mek, chatId, isOwner)) return;

      const m = await conn.groupMetadata(chatId);

      const ps = (m.participants || []).filter(p => !p.admin);

      if (!ps.length) {
        await conn.sendMessage(chatId, {
          text: `No regular members found.`
        });
        return;
      }

      const p = ps[Math.floor(Math.random() * ps.length)];

      await conn.sendMessage(chatId, {
        text: `Random member: @${cleanNum(p.id)}\n\n${settings.footer}`,
        mentions: [p.id]
      });
    }
  },

  {
    name: 'randomadmin',
    aliases: ['randadmin'],
    category: 'group',
    description: 'Mention one random admin',
    usage: '.randomadmin',
    groupOnly: true,
    react: '✅',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!await guard(conn, mek, chatId, isOwner)) return;

      const m = await conn.groupMetadata(chatId);

      const ps = (m.participants || []).filter(p => p.admin);

      if (!ps.length) {
        await conn.sendMessage(chatId, {
          text: `No admins found.`
        });
        return;
      }

      const p = ps[Math.floor(Math.random() * ps.length)];

      await conn.sendMessage(chatId, {
        text: `Random admin: @${cleanNum(p.id)}\n\n${settings.footer}`,
        mentions: [p.id]
      });
    }
  },

  {
    name: 'groupwelcome',
    aliases: ['setwelcome'],
    category: 'group',
    description: 'Save group welcome text',
    usage: '.groupwelcome Welcome text',
    groupOnly: true,
    react: '✅',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!await guard(conn, mek, chatId, isOwner, true)) return;

      const fs = require('fs');

      if (!fs.existsSync('./data')) {
        fs.mkdirSync('./data', { recursive: true });
      }

      const file = './data/group-welcome.json';

      let d = {};

      try {
        d = JSON.parse(fs.readFileSync(file, 'utf8'));
      } catch {}

      const t = args.join(' ').trim();

      if (!t) {
        await conn.sendMessage(chatId, {
          text: `Current welcome:\n${d[chatId] || 'Not set.'}`
        });
        return;
      }

      d[chatId] = t;

      fs.writeFileSync(file, JSON.stringify(d, null, 2));

      await conn.sendMessage(chatId, {
        text: `Welcome text saved for this group.\n\n${settings.footer}`
      });
    }
  },

  {
    name: 'groupgoodbye',
    aliases: ['setgoodbye'],
    category: 'group',
    description: 'Save group goodbye text',
    usage: '.groupgoodbye Goodbye text',
    groupOnly: true,
    react: '✅',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!await guard(conn, mek, chatId, isOwner, true)) return;

      const fs = require('fs');

      if (!fs.existsSync('./data')) {
        fs.mkdirSync('./data', { recursive: true });
      }

      const file = './data/group-goodbye.json';

      let d = {};

      try {
        d = JSON.parse(fs.readFileSync(file, 'utf8'));
      } catch {}

      const t = args.join(' ').trim();

      if (!t) {
        await conn.sendMessage(chatId, {
          text: `Current goodbye:\n${d[chatId] || 'Not set.'}`
        });
        return;
      }

      d[chatId] = t;

      fs.writeFileSync(file, JSON.stringify(d, null, 2));

      await conn.sendMessage(chatId, {
        text: `Goodbye text saved for this group.\n\n${settings.footer}`
      });
    }
  },

  {
    name: 'greeting',
    aliases: ['greetings'],
    category: 'group',
    description: 'Show saved welcome and goodbye settings',
    usage: '.greeting',
    groupOnly: true,
    react: '✅',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!await guard(conn, mek, chatId, isOwner)) return;

      const fs = require('fs');

      const wf = './data/group-welcome.json';
      const gf = './data/group-goodbye.json';

      let w = {};
      let g = {};

      try {
        w = JSON.parse(fs.readFileSync(wf, 'utf8'));
      } catch {}

      try {
        g = JSON.parse(fs.readFileSync(gf, 'utf8'));
      } catch {}

      await conn.sendMessage(chatId, {
        text:
          `*GROUP GREETINGS*\n\n` +
          `Welcome: ${w[chatId] || 'Not set'}\n` +
          `Goodbye: ${g[chatId] || 'Not set'}\n\n` +
          `${settings.footer}`
      });
    }
  },

  {
    name: 'groupadmins',
    aliases: ['gcsadmins'],
    category: 'group',
    description: 'Show admin count and mentions',
    usage: '.groupadmins',
    groupOnly: true,
    react: '✅',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!await guard(conn, mek, chatId, isOwner)) return;

      const m = await conn.groupMetadata(chatId);

      const ps = (m.participants || []).filter(p => p.admin);
      const mentions = ps.map(p => p.id);

      await conn.sendMessage(chatId, {
        text:
          `Admin count: ${ps.length}\n\n` +
          `${ps.map(p => `@${cleanNum(p.id)}`).join('\n')}\n\n` +
          `${settings.footer}`,
        mentions
      });
    }
  }

];
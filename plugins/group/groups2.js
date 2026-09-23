/**
 * NEXORA MD - Group Commands (4/5): Warnings & Moderation
 * Contains: warn, warnings, unwarn, resetwarn, warnlist,
 *           antiflood, antimedia, antisticker, antitag, grouprules
 */

const fs = require('fs');
const settings = require('../../settings');
const prefixLib = require('../../lib/prefix');
const { cleanNum, isSenderAdmin } = require('../../lib/groupAdmin');

function px() {
  return prefixLib.getPrefix(settings.prefix || '.');
}

function ensureDataDir() {
  if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
}

function readJSON(file, fallback) {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {}
  return fallback;
}

function writeJSON(file, data) {
  ensureDataDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

const WARN_FILE = './data/warnings.json';
const MOD_FILE = './data/moderation.json'; // { groupId: { antiflood, antimedia, antisticker, antitag } }
const RULES_FILE = './data/grouprules.json'; // { groupId: "rules text" }

function getWarnCount(groupId, userJid) {
  const data = readJSON(WARN_FILE, {});
  return data[groupId]?.[userJid] || 0;
}

function setWarnCount(groupId, userJid, count) {
  const data = readJSON(WARN_FILE, {});
  if (!data[groupId]) data[groupId] = {};
  if (count <= 0) {
    delete data[groupId][userJid];
  } else {
    data[groupId][userJid] = count;
  }
  writeJSON(WARN_FILE, data);
}

function getModSetting(groupId, key) {
  const data = readJSON(MOD_FILE, {});
  return !!data[groupId]?.[key];
}

function setModSetting(groupId, key, value) {
  const data = readJSON(MOD_FILE, {});
  if (!data[groupId]) data[groupId] = {};
  data[groupId][key] = value;
  writeJSON(MOD_FILE, data);
}

async function requireGroupAdmin(conn, mek, chatId, isOwner) {
  if (!chatId.endsWith('@g.us')) {
    await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } });
    await conn.sendMessage(chatId, { text: `This command only works in groups.\n\n${settings.footer}` });
    return false;
  }
  const sender = mek.key.participant || mek.key.remoteJid;
  const senderAdmin = await isSenderAdmin(conn, chatId, sender);
  if (!senderAdmin && !isOwner) {
    await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } });
    await conn.sendMessage(chatId, { text: `Admin or owner access required.\n\n${settings.footer}` });
    return false;
  }
  return true;
}

function getTargetFromMek(mek, args) {
  const contextInfo = mek.message?.extendedTextMessage?.contextInfo;
  const mentioned = contextInfo?.mentionedJid || [];
  const quoted = contextInfo?.participant;
  if (mentioned.length > 0) return mentioned[0];
  if (quoted) return quoted;
  if (args[0]) {
    const num = cleanNum(args[0]);
    if (/^[0-9]{8,15}$/.test(num)) return num + '@s.whatsapp.net';
  }
  return null;
}

module.exports = [
  // ── 1. WARN ───────────────────────────────────
  {
    name: 'warn',
    aliases: ['warnuser'],
    category: 'group',
    description: 'Warn a member (3 warnings shown as a threshold)',
    usage: '.warn @user [reason]',
    groupOnly: true,
    react: '✅',

    async execute(conn, mek, args, chatId, isOwner) {
      try {
        if (!(await requireGroupAdmin(conn, mek, chatId, isOwner))) return;

        const target = getTargetFromMek(mek, args);
        if (!target) {
          await conn.sendMessage(chatId, { text: `Tag, reply to, or give the number of the user to warn.\n\n${settings.footer}` });
          return;
        }

        const contextInfo = mek.message?.extendedTextMessage?.contextInfo;
        const reasonArgs = contextInfo?.mentionedJid?.length ? args.slice(1) : args.slice(1);
        const reason = reasonArgs.join(' ') || 'no reason given';

        const count = getWarnCount(chatId, target) + 1;
        setWarnCount(chatId, target, count);

        await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
        await conn.sendMessage(chatId, {
          text: `⚠️ WARNING ISSUED\n\n@${cleanNum(target)} — warning ${count}/3\nReason: ${reason}\n\n${count >= 3 ? 'This member has reached the warning limit — consider removing them.' : ''}\n\n${settings.footer}`,
          mentions: [target]
        });
      } catch (error) {
        console.log('[WARN] Error:', error.message);
        try { await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } }); } catch (e) {}
        try { await conn.sendMessage(chatId, { text: `Error: ${error.message}\n\n${settings.footer}` }); } catch (e) {}
      }
    }
  },

  // ── 2. WARNINGS ───────────────────────────────
  {
    name: 'warnings',
    aliases: ['checkwarn'],
    category: 'group',
    description: "Check a member's warning count",
    usage: '.warnings [@user]',
    groupOnly: true,
    react: '✅',

    async execute(conn, mek, args, chatId, isOwner) {
      try {
        await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
        if (!chatId.endsWith('@g.us')) {
          await conn.sendMessage(chatId, { text: `This command only works in groups.\n\n${settings.footer}` });
          return;
        }

        const target = getTargetFromMek(mek, args) || (mek.key.participant || mek.key.remoteJid);
        const count = getWarnCount(chatId, target);

        await conn.sendMessage(chatId, {
          text: `WARNINGS\n\n@${cleanNum(target)} has ${count}/3 warning(s).\n\n${settings.footer}`,
          mentions: [target]
        });
      } catch (error) {
        console.log('[WARNINGS] Error:', error.message);
        try { await conn.sendMessage(chatId, { text: `Error: ${error.message}\n\n${settings.footer}` }); } catch (e) {}
      }
    }
  },

  // ── 3. UNWARN ───────────────────────────────────
  {
    name: 'unwarn',
    aliases: ['removewarn'],
    category: 'group',
    description: 'Remove one warning from a member',
    usage: '.unwarn @user',
    groupOnly: true,
    react: '✅',

    async execute(conn, mek, args, chatId, isOwner) {
      try {
        if (!(await requireGroupAdmin(conn, mek, chatId, isOwner))) return;

        const target = getTargetFromMek(mek, args);
        if (!target) {
          await conn.sendMessage(chatId, { text: `Tag, reply to, or give the number of the user.\n\n${settings.footer}` });
          return;
        }

        const count = Math.max(0, getWarnCount(chatId, target) - 1);
        setWarnCount(chatId, target, count);

        await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
        await conn.sendMessage(chatId, {
          text: `Removed one warning from @${cleanNum(target)} — now at ${count}/3.\n\n${settings.footer}`,
          mentions: [target]
        });
      } catch (error) {
        console.log('[UNWARN] Error:', error.message);
        try { await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } }); } catch (e) {}
        try { await conn.sendMessage(chatId, { text: `Error: ${error.message}\n\n${settings.footer}` }); } catch (e) {}
      }
    }
  },

  // ── 4. RESETWARN ─────────────────────────────────
  {
    name: 'resetwarn',
    aliases: ['clearwarn'],
    category: 'group',
    description: "Reset a member's warnings to zero",
    usage: '.resetwarn @user',
    groupOnly: true,
    react: '✅',

    async execute(conn, mek, args, chatId, isOwner) {
      try {
        if (!(await requireGroupAdmin(conn, mek, chatId, isOwner))) return;

        const target = getTargetFromMek(mek, args);
        if (!target) {
          await conn.sendMessage(chatId, { text: `Tag, reply to, or give the number of the user.\n\n${settings.footer}` });
          return;
        }

        setWarnCount(chatId, target, 0);

        await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
        await conn.sendMessage(chatId, {
          text: `Warnings reset for @${cleanNum(target)}.\n\n${settings.footer}`,
          mentions: [target]
        });
      } catch (error) {
        console.log('[RESETWARN] Error:', error.message);
        try { await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } }); } catch (e) {}
        try { await conn.sendMessage(chatId, { text: `Error: ${error.message}\n\n${settings.footer}` }); } catch (e) {}
      }
    }
  },

  // ── 5. WARNLIST ────────────────────────────────────
  {
    name: 'warnlist',
    aliases: ['allwarnings'],
    category: 'group',
    description: 'List everyone with active warnings in this group',
    usage: '.warnlist',
    groupOnly: true,
    react: '✅',

    async execute(conn, mek, args, chatId, isOwner) {
      try {
        await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
        if (!chatId.endsWith('@g.us')) {
          await conn.sendMessage(chatId, { text: `This command only works in groups.\n\n${settings.footer}` });
          return;
        }

        const data = readJSON(WARN_FILE, {});
        const group = data[chatId] || {};
        const entries = Object.entries(group);

        if (entries.length === 0) {
          await conn.sendMessage(chatId, { text: `No active warnings in this group.\n\n${settings.footer}` });
          return;
        }

        const list = entries.map(([jid, count], i) => `${i + 1}. @${cleanNum(jid)} — ${count}/3`).join('\n');
        await conn.sendMessage(chatId, {
          text: `ACTIVE WARNINGS\n\n${list}\n\n${settings.footer}`,
          mentions: entries.map(([jid]) => jid)
        });
      } catch (error) {
        console.log('[WARNLIST] Error:', error.message);
        try { await conn.sendMessage(chatId, { text: `Error: ${error.message}\n\n${settings.footer}` }); } catch (e) {}
      }
    }
  },

  // ── 6. ANTIFLOOD ─────────────────────────────────────
  {
    name: 'antiflood',
    aliases: ['antispam'],
    category: 'group',
    description: 'Toggle anti-spam/flood protection for this group',
    usage: '.antiflood on | off',
    groupOnly: true,
    react: '✅',

    async execute(conn, mek, args, chatId, isOwner) {
      try {
        if (!(await requireGroupAdmin(conn, mek, chatId, isOwner))) return;

        const choice = (args[0] || '').toLowerCase();
        if (choice !== 'on' && choice !== 'off') {
          const state = getModSetting(chatId, 'antiflood');
          await conn.sendMessage(chatId, { text: `Anti-flood is currently ${state ? 'ON' : 'OFF'}.\nUsage: ${px()}antiflood on | off\n\n${settings.footer}` });
          return;
        }

        setModSetting(chatId, 'antiflood', choice === 'on');
        await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
        await conn.sendMessage(chatId, { text: `Anti-flood protection turned ${choice.toUpperCase()}.\n\n${settings.footer}` });
      } catch (error) {
        console.log('[ANTIFLOOD] Error:', error.message);
        try { await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } }); } catch (e) {}
        try { await conn.sendMessage(chatId, { text: `Error: ${error.message}\n\n${settings.footer}` }); } catch (e) {}
      }
    }
  },

  // ── 7. ANTIMEDIA ─────────────────────────────────────
  {
    name: 'antimedia',
    aliases: ['nomedia'],
    category: 'group',
    description: 'Toggle auto-delete of media messages (image/video/doc) in this group',
    usage: '.antimedia on | off',
    groupOnly: true,
    react: '✅',

    async execute(conn, mek, args, chatId, isOwner) {
      try {
        if (!(await requireGroupAdmin(conn, mek, chatId, isOwner))) return;

        const choice = (args[0] || '').toLowerCase();
        if (choice !== 'on' && choice !== 'off') {
          const state = getModSetting(chatId, 'antimedia');
          await conn.sendMessage(chatId, { text: `Anti-media is currently ${state ? 'ON' : 'OFF'}.\nUsage: ${px()}antimedia on | off\n\n${settings.footer}` });
          return;
        }

        setModSetting(chatId, 'antimedia', choice === 'on');
        await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
        await conn.sendMessage(chatId, { text: `Anti-media turned ${choice.toUpperCase()}.\n\n${settings.footer}` });
      } catch (error) {
        console.log('[ANTIMEDIA] Error:', error.message);
        try { await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } }); } catch (e) {}
        try { await conn.sendMessage(chatId, { text: `Error: ${error.message}\n\n${settings.footer}` }); } catch (e) {}
      }
    }
  },

  // ── 8. ANTISTICKER ─────────────────────────────────────
  {
    name: 'antisticker',
    aliases: ['nosticker'],
    category: 'group',
    description: 'Toggle auto-delete of stickers in this group',
    usage: '.antisticker on | off',
    groupOnly: true,
    react: '✅',

    async execute(conn, mek, args, chatId, isOwner) {
      try {
        if (!(await requireGroupAdmin(conn, mek, chatId, isOwner))) return;

        const choice = (args[0] || '').toLowerCase();
        if (choice !== 'on' && choice !== 'off') {
          const state = getModSetting(chatId, 'antisticker');
          await conn.sendMessage(chatId, { text: `Anti-sticker is currently ${state ? 'ON' : 'OFF'}.\nUsage: ${px()}antisticker on | off\n\n${settings.footer}` });
          return;
        }

        setModSetting(chatId, 'antisticker', choice === 'on');
        await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
        await conn.sendMessage(chatId, { text: `Anti-sticker turned ${choice.toUpperCase()}.\n\n${settings.footer}` });
      } catch (error) {
        console.log('[ANTISTICKER] Error:', error.message);
        try { await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } }); } catch (e) {}
        try { await conn.sendMessage(chatId, { text: `Error: ${error.message}\n\n${settings.footer}` }); } catch (e) {}
      }
    }
  },

  // ── 9. ANTITAG ─────────────────────────────────────────
  {
    name: 'antitag',
    aliases: ['notagall'],
    category: 'group',
    description: 'Toggle blocking mass-mention spam from non-admins',
    usage: '.antitag on | off',
    groupOnly: true,
    react: '✅',

    async execute(conn, mek, args, chatId, isOwner) {
      try {
        if (!(await requireGroupAdmin(conn, mek, chatId, isOwner))) return;

        const choice = (args[0] || '').toLowerCase();
        if (choice !== 'on' && choice !== 'off') {
          const state = getModSetting(chatId, 'antitag');
          await conn.sendMessage(chatId, { text: `Anti-tag is currently ${state ? 'ON' : 'OFF'}.\nUsage: ${px()}antitag on | off\n\n${settings.footer}` });
          return;
        }

        setModSetting(chatId, 'antitag', choice === 'on');
        await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
        await conn.sendMessage(chatId, { text: `Anti-tag protection turned ${choice.toUpperCase()}.\n\n${settings.footer}` });
      } catch (error) {
        console.log('[ANTITAG] Error:', error.message);
        try { await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } }); } catch (e) {}
        try { await conn.sendMessage(chatId, { text: `Error: ${error.message}\n\n${settings.footer}` }); } catch (e) {}
      }
    }
  },

  // ── 10. GROUPRULES ────────────────────────────────────
  {
    name: 'grouprules',
    aliases: ['rules', 'setrules'],
    category: 'group',
    description: 'Set or view the group rules',
    usage: '.grouprules [new rules text]',
    groupOnly: true,
    react: '✅',

    async execute(conn, mek, args, chatId, isOwner) {
      try {
        await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
        if (!chatId.endsWith('@g.us')) {
          await conn.sendMessage(chatId, { text: `This command only works in groups.\n\n${settings.footer}` });
          return;
        }

        const newRules = args.join(' ').trim();

        if (!newRules) {
          const data = readJSON(RULES_FILE, {});
          const rules = data[chatId];
          await conn.sendMessage(chatId, {
            text: rules
              ? `GROUP RULES\n\n${rules}\n\n${settings.footer}`
              : `No rules set yet. Use ${px()}grouprules <text> to set them.\n\n${settings.footer}`
          });
          return;
        }

        const sender = mek.key.participant || mek.key.remoteJid;
        const senderAdmin = await isSenderAdmin(conn, chatId, sender);
        if (!senderAdmin && !isOwner) {
          await conn.sendMessage(chatId, { text: `Only admins can set the group rules.\n\n${settings.footer}` });
          return;
        }

        const data = readJSON(RULES_FILE, {});
        data[chatId] = newRules;
        writeJSON(RULES_FILE, data);

        await conn.sendMessage(chatId, { text: `Group rules updated.\n\n${settings.footer}` });
      } catch (error) {
        console.log('[GROUPRULES] Error:', error.message);
        try { await conn.sendMessage(chatId, { text: `Error: ${error.message}\n\n${settings.footer}` }); } catch (e) {}
      }
    }
  }
];

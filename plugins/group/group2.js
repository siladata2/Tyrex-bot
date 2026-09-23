/**
 * TYREX_KSH-MD â€” GROUP PACK 2 (10 commands)
 * Members, listing & warnings (group-only).
 * Drop into: plugins/group/group2.js
 */
const settings = require('../../settings');
const fs = require('fs');
const path = require('path');
const { isSenderAdmin, isBotAdmin, cleanNum } = require('../../lib/groupAdmin');

const DATA_DIR = path.join(process.cwd(), 'data');
function readJson(file, def) { try { const p = path.join(DATA_DIR, file); if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) {} return def; }
function writeJson(file, data) { try { if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2)); } catch (e) {} }

async function isAdminOrOwner(conn, chatId, mek, isOwner) {
  if (isOwner) return true;
  const sender = mek.key.participant || mek.key.remoteJid;
  return await isSenderAdmin(conn, chatId, sender);
}
function parseTargets(mek) {
  const ctx = mek.message?.extendedTextMessage?.contextInfo;
  const list = [...(ctx?.mentionedJid || [])];
  if (ctx?.participant && !list.includes(ctx.participant)) list.push(ctx.participant);
  return list;
}
async function ok(conn, chatId, mek) { try { await conn.sendMessage(chatId, { react: { text: 'âœ…', key: mek.key } }); } catch (e) {} }
async function no(conn, chatId, mek) { try { await conn.sendMessage(chatId, { react: { text: 'âŒ', key: mek.key } }); } catch (e) {} }
async function reply(conn, chatId, text, mentions) {
  try { await conn.sendMessage(chatId, { text: text + '\n\n' + settings.footer, ...(mentions ? { mentions } : {}) }); } catch (e) {}
}

const commands = [
  {
    name: 'listadmins', aliases: ['admins', 'adminlist'], category: 'group',
    description: 'List all group admins', usage: '.listadmins', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        const meta = await conn.groupMetadata(chatId);
        const admins = meta.participants.filter(p => p.admin);
        let t = `ðŸ‘‘ *ADMINS (${admins.length})*\n\n`;
        admins.forEach(p => { t += `â€¢ @${cleanNum(p.id)}${p.admin === 'superadmin' ? ' (owner)' : ''}\n`; });
        await ok(conn, chatId, mek);
        await reply(conn, chatId, t.trim(), admins.map(p => p.id));
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'listmembers', aliases: ['members', 'memberlist'], category: 'group',
    description: 'List all group members', usage: '.listmembers', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        const meta = await conn.groupMetadata(chatId);
        let t = `ðŸ‘¥ *MEMBERS (${meta.participants.length})*\n\n`;
        meta.participants.forEach((p, i) => { t += `${i + 1}. @${cleanNum(p.id)}${p.admin ? ' ðŸ‘‘' : ''}\n`; });
        await ok(conn, chatId, mek);
        await reply(conn, chatId, t.trim(), meta.participants.map(p => p.id));
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'gccount', aliases: ['membercount', 'countmembers'], category: 'group',
    description: 'Count group members and admins', usage: '.gccount', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        const meta = await conn.groupMetadata(chatId);
        const admins = meta.participants.filter(p => p.admin).length;
        const members = meta.participants.length - admins;
        await ok(conn, chatId, mek);
        await reply(conn, chatId, `ðŸ“Š *GROUP COUNT*\n\n*Total:* ${meta.participants.length}\n*Admins:* ${admins}\n*Members:* ${members}`);
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'hidetag', aliases: ['taghidden', 'gctag'], category: 'group',
    description: 'Mention everyone silently (hidden tag)', usage: '.hidetag [message]', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        if (!(await isAdminOrOwner(conn, chatId, mek, isOwner))) { await no(conn, chatId, mek); await reply(conn, chatId, 'Admin or owner access required.'); return; }
        const meta = await conn.groupMetadata(chatId);
        const ids = meta.participants.map(p => p.id);
        const msg = args.join(' ') || 'Attention everyone';
        await ok(conn, chatId, mek);
        await conn.sendMessage(chatId, { text: `${msg}\n\n${settings.footer}`, mentions: ids });
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'tagadmins', aliases: ['mentionadmins', 'admintag'], category: 'group',
    description: 'Mention only the group admins', usage: '.tagadmins [message]', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        if (!(await isAdminOrOwner(conn, chatId, mek, isOwner))) { await no(conn, chatId, mek); await reply(conn, chatId, 'Admin or owner access required.'); return; }
        const meta = await conn.groupMetadata(chatId);
        const admins = meta.participants.filter(p => p.admin);
        const custom = args.join(' ') || 'Admins attention';
        let t = `${custom}\n\n`;
        admins.forEach(p => { t += `@${cleanNum(p.id)}\n`; });
        await ok(conn, chatId, mek);
        await conn.sendMessage(chatId, { text: t + '\n' + settings.footer, mentions: admins.map(p => p.id) });
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'warn', aliases: ['warnuser'], category: 'group',
    description: 'Warn a member (auto-remove at limit)', usage: '.warn @user', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        if (!(await isAdminOrOwner(conn, chatId, mek, isOwner))) { await no(conn, chatId, mek); await reply(conn, chatId, 'Admin or owner access required.'); return; }
        const targets = parseTargets(mek);
        if (!targets.length) { await no(conn, chatId, mek); await reply(conn, chatId, 'Tag or reply to the member you want to warn.'); return; }
        const data = readJson('warnings.json', {});
        data[chatId] = data[chatId] || {};
        const limit = settings.WARN_COUNT || 3;
        const botAdmin = await isBotAdmin(conn, chatId);
        await ok(conn, chatId, mek);
        for (const t of targets) {
          const num = cleanNum(t);
          data[chatId][num] = (data[chatId][num] || 0) + 1;
          const c = data[chatId][num];
          await conn.sendMessage(chatId, { text: `âš ï¸ Warning ${c}/${limit} for @${num}\n\n${settings.footer}`, mentions: [t] });
          if (c >= limit && botAdmin) {
            await conn.groupParticipantsUpdate(chatId, [t], 'remove');
            delete data[chatId][num];
            await conn.sendMessage(chatId, { text: `ðŸš« @${num} reached ${limit} warnings and was removed.\n\n${settings.footer}`, mentions: [t] });
          }
        }
        writeJson('warnings.json', data);
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'warnings', aliases: ['warnlist', 'checkwarn'], category: 'group',
    description: 'Show all warned members in this group', usage: '.warnings', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        const data = readJson('warnings.json', {});
        const g = data[chatId] || {};
        const nums = Object.keys(g);
        await ok(conn, chatId, mek);
        if (!nums.length) { await reply(conn, chatId, 'No warnings recorded in this group.'); return; }
        const mentions = nums.map(n => n + '@s.whatsapp.net');
        let t = `âš ï¸ *WARNINGS*\n\n`;
        nums.forEach(n => { t += `â€¢ @${n} â€” ${g[n]} warning(s)\n`; });
        await conn.sendMessage(chatId, { text: t + '\n' + settings.footer, mentions });
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'resetwarn', aliases: ['clearwarn', 'delwarn'], category: 'group',
    description: 'Clear warnings for a member (or all)', usage: '.resetwarn @user | all', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        if (!(await isAdminOrOwner(conn, chatId, mek, isOwner))) { await no(conn, chatId, mek); await reply(conn, chatId, 'Admin or owner access required.'); return; }
        const data = readJson('warnings.json', {});
        data[chatId] = data[chatId] || {};
        if ((args[0] || '').toLowerCase() === 'all') {
          data[chatId] = {}; writeJson('warnings.json', data);
          await ok(conn, chatId, mek); await reply(conn, chatId, 'All warnings cleared for this group.'); return;
        }
        const targets = parseTargets(mek);
        if (!targets.length) { await no(conn, chatId, mek); await reply(conn, chatId, 'Tag a member or use ".resetwarn all".'); return; }
        targets.forEach(t => { delete data[chatId][cleanNum(t)]; });
        writeJson('warnings.json', data);
        await ok(conn, chatId, mek);
        await reply(conn, chatId, 'Warnings cleared for the selected member(s).', targets);
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'memberinfo', aliases: ['whoisgc', 'gcmemberinfo'], category: 'group',
    description: 'Show info about a group member', usage: '.memberinfo @user', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        const targets = parseTargets(mek);
        const target = targets[0] || (mek.key.participant || mek.key.remoteJid);
        const meta = await conn.groupMetadata(chatId);
        const p = meta.participants.find(x => cleanNum(x.id) === cleanNum(target));
        if (!p) { await no(conn, chatId, mek); await reply(conn, chatId, 'That member was not found in this group.'); return; }
        await ok(conn, chatId, mek);
        await reply(conn, chatId,
          `ðŸ‘¤ *MEMBER INFO*\n\n*Number:* @${cleanNum(p.id)}\n*Role:* ${p.admin ? (p.admin === 'superadmin' ? 'Super Admin' : 'Admin') : 'Member'}`,
          [p.id]
        );
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'groupstats', aliases: ['gcstats', 'statsgc'], category: 'group',
    description: 'Quick group statistics', usage: '.groupstats', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        const meta = await conn.groupMetadata(chatId);
        const admins = meta.participants.filter(p => p.admin).length;
        const created = meta.creation ? new Date(meta.creation * 1000).toDateString() : 'Unknown';
        await ok(conn, chatId, mek);
        await reply(conn, chatId,
          `ðŸ“ˆ *GROUP STATS*\n\n*Name:* ${meta.subject}\n*Total members:* ${meta.participants.length}\n*Admins:* ${admins}\n*Members:* ${meta.participants.length - admins}\n*Created:* ${created}`
        );
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  }
];

module.exports = commands;
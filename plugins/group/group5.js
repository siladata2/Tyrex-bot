/**
 * TYREX_KSH-MD â€” GROUP PACK 5 (10 commands + live guards)
 * Group protection & moderation with real enforcement watchers.
 * Drop into: plugins/group/group5.js
 *
 * NOTE: to activate the guards, main.js must call:
 *   const gg = require('./plugins/group/group5');
 *   await gg.guardMessages(conn, mek, chatId);          // inside the @g.us message block
 *   await gg.guardParticipants(conn, update);           // inside handleGroupParticipantUpdate
 */
const settings = require('../../settings');
const fs = require('fs');
const path = require('path');
const { isSenderAdmin, isBotAdmin, cleanNum } = require('../../lib/groupAdmin');

const DATA_DIR = path.join(process.cwd(), 'data');
const GUARD_FILE = 'groupguard.json';

function readGuard() { try { const p = path.join(DATA_DIR, GUARD_FILE); if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) {} return {}; }
function writeGuard(d) { try { if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(path.join(DATA_DIR, GUARD_FILE), JSON.stringify(d, null, 2)); } catch (e) {} }
function cfg(chatId) { const g = readGuard(); return g[chatId] || {}; }
function setCfg(chatId, patch) { const g = readGuard(); g[chatId] = Object.assign(g[chatId] || {}, patch); writeGuard(g); }

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
function onoff(args) { const c = (args[0] || '').toLowerCase(); return c === 'on' || c === 'off' ? c : null; }

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• LIVE GUARDS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const floodLog = new Map();
const slowLog = new Map();

async function guardMessages(conn, mek, chatId) {
  try {
    const c = cfg(chatId);
    const sender = mek.key.participant || mek.key.remoteJid;
    if (!sender) return;
    if (await isSenderAdmin(conn, chatId, sender)) return;
    const botAdmin = await isBotAdmin(conn, chatId);

    if (c.slowmode && c.slowmode.enabled) {
      const key = chatId + '|' + sender;
      const now = Date.now();
      const last = slowLog.get(key) || 0;
      if (now - last < (c.slowmode.seconds || 5) * 1000) {
        if (botAdmin) await conn.sendMessage(chatId, { delete: mek.key });
        return;
      }
      slowLog.set(key, now);
    }

    if (c.antiFlood && c.antiFlood.enabled) {
      const key = chatId + '|' + sender;
      const now = Date.now();
      const arr = (floodLog.get(key) || []).filter(t => now - t < 8000);
      arr.push(now);
      floodLog.set(key, arr);
      if (arr.length > (c.antiFlood.limit || 6)) {
        floodLog.set(key, []);
        if (botAdmin) await conn.sendMessage(chatId, { delete: mek.key });
        await conn.sendMessage(chatId, { text: `âš ï¸ Flood detected from @${cleanNum(sender)}\n\n${settings.footer}`, mentions: [sender] });
        return;
      }
    }

    if (c.antiTag && c.antiTag.enabled) {
      const ctx = mek.message?.extendedTextMessage?.contextInfo;
      const mentions = ctx?.mentionedJid || [];
      if (mentions.length > (c.antiTag.limit || 5)) {
        if (botAdmin) await conn.sendMessage(chatId, { delete: mek.key });
        await conn.sendMessage(chatId, { text: `âš ï¸ Mass mention blocked from @${cleanNum(sender)}\n\n${settings.footer}`, mentions: [sender] });
        return;
      }
    }

    if (c.antiBug && c.antiBug.enabled) {
      const text = mek.message?.conversation || mek.message?.extendedTextMessage?.text || '';
      const isContact = !!(mek.message?.contactMessage || mek.message?.contactsArrayMessage);
      const tooLong = text.length > 3000;
      const tooManyLines = (text.match(/\n/g) || []).length > 60;
      if (isContact || tooLong || tooManyLines) {
        if (botAdmin) await conn.sendMessage(chatId, { delete: mek.key });
        await conn.sendMessage(chatId, { text: `ðŸ›¡ï¸ Suspicious message removed in this group.\n\n${settings.footer}` });
      }
    }
  } catch (e) { console.log('[GROUPGUARD] msg hook error:', e.message); }
}

async function guardParticipants(conn, update) {
  try {
    const chatId = update.id;
    if (!chatId || !chatId.endsWith('@g.us')) return;
    const c = cfg(chatId);
    const botAdmin = await isBotAdmin(conn, chatId);
    const parts = update.participants || [];

    if (update.action === 'add') {
      if (Array.isArray(c.blacklist) && c.blacklist.length && botAdmin) {
        for (const p of parts) {
          if (c.blacklist.includes(cleanNum(p))) {
            await conn.groupParticipantsUpdate(chatId, [p], 'remove');
            await conn.sendMessage(chatId, { text: `ðŸš« @${cleanNum(p)} is blacklisted and was removed.\n\n${settings.footer}`, mentions: [p] });
          }
        }
      }
      if (c.welcome && c.welcome.enabled && c.welcome.text) {
        for (const p of parts) {
          const msg = c.welcome.text.replace(/\{user\}/g, '@' + cleanNum(p)).replace(/\{group\}/g, update.subject || '');
          await conn.sendMessage(chatId, { text: `${msg}\n\n${settings.footer}`, mentions: [p] });
        }
      }
    }

    if (update.action === 'remove') {
      if (c.goodbye && c.goodbye.enabled && c.goodbye.text) {
        for (const p of parts) {
          const msg = c.goodbye.text.replace(/\{user\}/g, '@' + cleanNum(p)).replace(/\{group\}/g, update.subject || '');
          await conn.sendMessage(chatId, { text: `${msg}\n\n${settings.footer}`, mentions: [p] });
        }
      }
    }
  } catch (e) { console.log('[GROUPGUARD] part hook error:', e.message); }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• COMMANDS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const commands = [
  {
    name: 'antiflood', aliases: ['antispam'], category: 'group',
    description: 'Block message flooding', usage: '.antiflood on | off | 6', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        if (!(await isAdminOrOwner(conn, chatId, mek, isOwner))) { await no(conn, chatId, mek); await reply(conn, chatId, 'Admin or owner access required.'); return; }
        const c = cfg(chatId).antiFlood || { enabled: false, limit: 6 };
        const toggle = onoff(args);
        const num = parseInt((args[0] || '').replace(/[^0-9]/g, ''), 10);
        if (num) c.limit = num;
        if (toggle) c.enabled = toggle === 'on';
        setCfg(chatId, { antiFlood: c });
        await ok(conn, chatId, mek);
        await reply(conn, chatId, `ðŸ›¡ï¸ Anti-flood: *${c.enabled ? 'ON' : 'OFF'}* | limit: ${c.limit} msgs / 8s`);
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'antitag', aliases: ['antitagall', 'antimention'], category: 'group',
    description: 'Block mass mentions / tagall', usage: '.antitag on | off | 5', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        if (!(await isAdminOrOwner(conn, chatId, mek, isOwner))) { await no(conn, chatId, mek); await reply(conn, chatId, 'Admin or owner access required.'); return; }
        const c = cfg(chatId).antiTag || { enabled: false, limit: 5 };
        const toggle = onoff(args);
        const num = parseInt((args[0] || '').replace(/[^0-9]/g, ''), 10);
        if (num) c.limit = num;
        if (toggle) c.enabled = toggle === 'on';
        setCfg(chatId, { antiTag: c });
        await ok(conn, chatId, mek);
        await reply(conn, chatId, `ðŸ›¡ï¸ Anti-tag: *${c.enabled ? 'ON' : 'OFF'}* | max mentions: ${c.limit}`);
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'antibug', aliases: ['antivcard', 'antimassmention'], category: 'group',
    description: 'Remove contact-spam & huge messages', usage: '.antibug on | off', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        if (!(await isAdminOrOwner(conn, chatId, mek, isOwner))) { await no(conn, chatId, mek); await reply(conn, chatId, 'Admin or owner access required.'); return; }
        const c = cfg(chatId).antiBug || { enabled: false };
        const toggle = onoff(args);
        if (toggle) c.enabled = toggle === 'on';
        setCfg(chatId, { antiBug: c });
        await ok(conn, chatId, mek);
        await reply(conn, chatId, `ðŸ›¡ï¸ Anti-bug: *${c.enabled ? 'ON' : 'OFF'}*`);
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'welcome', aliases: ['setwelcome', 'gcwelcome'], category: 'group',
    description: 'Set a custom welcome message on join', usage: '.welcome on | off | text with {user}', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        if (!(await isAdminOrOwner(conn, chatId, mek, isOwner))) { await no(conn, chatId, mek); await reply(conn, chatId, 'Admin or owner access required.'); return; }
        const c = cfg(chatId).welcome || { enabled: false, text: 'ðŸ‘‹ Welcome {user} to {group}!' };
        const toggle = onoff(args);
        if (toggle) { c.enabled = toggle === 'on'; }
        else if (args.length) { c.text = args.join(' '); c.enabled = true; }
        setCfg(chatId, { welcome: c });
        await ok(conn, chatId, mek);
        await reply(conn, chatId, `ðŸ‘‹ Welcome message: *${c.enabled ? 'ON' : 'OFF'}*\n\nText: ${c.text}`);
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'goodbye', aliases: ['setgoodbye', 'gcgoodbye'], category: 'group',
    description: 'Set a custom goodbye message on leave', usage: '.goodbye on | off | text with {user}', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        if (!(await isAdminOrOwner(conn, chatId, mek, isOwner))) { await no(conn, chatId, mek); await reply(conn, chatId, 'Admin or owner access required.'); return; }
        const c = cfg(chatId).goodbye || { enabled: false, text: 'ðŸ‘‹ {user} left {group}. Take care!' };
        const toggle = onoff(args);
        if (toggle) { c.enabled = toggle === 'on'; }
        else if (args.length) { c.text = args.join(' '); c.enabled = true; }
        setCfg(chatId, { goodbye: c });
        await ok(conn, chatId, mek);
        await reply(conn, chatId, `ðŸ‘‹ Goodbye message: *${c.enabled ? 'ON' : 'OFF'}*\n\nText: ${c.text}`);
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'rules', aliases: ['gcrules', 'setrules'], category: 'group',
    description: 'Set or show the group rules', usage: '.rules text | (no text to view)', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        const c = cfg(chatId);
        if (args.length) {
          if (!(await isAdminOrOwner(conn, chatId, mek, isOwner))) { await no(conn, chatId, mek); await reply(conn, chatId, 'Admin or owner access required.'); return; }
          setCfg(chatId, { rules: args.join(' ') });
          await ok(conn, chatId, mek);
          await reply(conn, chatId, 'ðŸ“œ Group rules saved.');
          return;
        }
        await ok(conn, chatId, mek);
        await reply(conn, chatId, c.rules ? `ðŸ“œ *GROUP RULES*\n\n${c.rules}` : 'No rules set yet. An admin can use .rules text');
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'slowmode', aliases: ['gcslowmode', 'setslowmode'], category: 'group',
    description: 'Limit how often members can send messages', usage: '.slowmode on | off | 5', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        if (!(await isAdminOrOwner(conn, chatId, mek, isOwner))) { await no(conn, chatId, mek); await reply(conn, chatId, 'Admin or owner access required.'); return; }
        const c = cfg(chatId).slowmode || { enabled: false, seconds: 5 };
        const toggle = onoff(args);
        const num = parseInt((args[0] || '').replace(/[^0-9]/g, ''), 10);
        if (num) c.seconds = num;
        if (toggle) c.enabled = toggle === 'on';
        setCfg(chatId, { slowmode: c });
        await ok(conn, chatId, mek);
        await reply(conn, chatId, `ðŸ¢ Slow mode: *${c.enabled ? 'ON' : 'OFF'}* | ${c.seconds}s between messages`);
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'blacklist', aliases: ['gcblacklist', 'blmember'], category: 'group',
    description: 'Blacklist a member (auto-kick if they join)', usage: '.blacklist 2557xxxx', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        if (!(await isAdminOrOwner(conn, chatId, mek, isOwner))) { await no(conn, chatId, mek); await reply(conn, chatId, 'Admin or owner access required.'); return; }
        const num = (args[0] || '').replace(/[^0-9]/g, '') || cleanNum(parseTargets(mek)[0] || '');
        if (!num) { await no(conn, chatId, mek); await reply(conn, chatId, 'Usage: .blacklist 2557xxxx'); return; }
        const c = cfg(chatId);
        const list = Array.isArray(c.blacklist) ? c.blacklist : [];
        if (!list.includes(num)) list.push(num);
        setCfg(chatId, { blacklist: list });
        await ok(conn, chatId, mek);
        await reply(conn, chatId, `ðŸš« +${num} added to the blacklist (${list.length} total).`);
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'whitelist', aliases: ['gcunblacklist', 'unblmember'], category: 'group',
    description: 'Remove a member from the blacklist', usage: '.whitelist 2557xxxx', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        if (!(await isAdminOrOwner(conn, chatId, mek, isOwner))) { await no(conn, chatId, mek); await reply(conn, chatId, 'Admin or owner access required.'); return; }
        const num = (args[0] || '').replace(/[^0-9]/g, '') || cleanNum(parseTargets(mek)[0] || '');
        if (!num) { await no(conn, chatId, mek); await reply(conn, chatId, 'Usage: .whitelist 2557xxxx'); return; }
        const c = cfg(chatId);
        const list = (Array.isArray(c.blacklist) ? c.blacklist : []).filter(n => n !== num);
        setCfg(chatId, { blacklist: list });
        await ok(conn, chatId, mek);
        await reply(conn, chatId, `âœ… +${num} removed from the blacklist (${list.length} left).`);
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'gclist', aliases: ['blist', 'listblacklist'], category: 'group',
    description: 'Show this group blacklist', usage: '.gclist', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        const list = cfg(chatId).blacklist || [];
        await ok(conn, chatId, mek);
        if (!list.length) { await reply(conn, chatId, 'Blacklist is empty.'); return; }
        let t = `ðŸš« *BLACKLIST (${list.length})*\n\n`;
        list.forEach((n, i) => { t += `${i + 1}. +${n}\n`; });
        await reply(conn, chatId, t.trim());
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  }
];

module.exports = commands;
module.exports.guardMessages = guardMessages;
module.exports.guardParticipants = guardParticipants;
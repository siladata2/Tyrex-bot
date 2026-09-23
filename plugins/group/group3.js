/**
 * TYREX_KSH-MD â€” GROUP PACK 3 (10 commands)
 * Join requests, bulk member ops & messaging (group-only).
 * Drop into: plugins/group/group3.js
 */
const settings = require('../../settings');
const { isSenderAdmin, isBotAdmin, cleanNum } = require('../../lib/groupAdmin');

async function isAdminOrOwner(conn, chatId, mek, isOwner) {
  if (isOwner) return true;
  const sender = mek.key.participant || mek.key.remoteJid;
  return await isSenderAdmin(conn, chatId, sender);
}
function toJid(num) { return String(num).replace(/[^0-9]/g, '') + '@s.whatsapp.net'; }
async function ok(conn, chatId, mek) { try { await conn.sendMessage(chatId, { react: { text: 'âœ…', key: mek.key } }); } catch (e) {} }
async function no(conn, chatId, mek) { try { await conn.sendMessage(chatId, { react: { text: 'âŒ', key: mek.key } }); } catch (e) {} }
async function reply(conn, chatId, text, mentions) {
  try { await conn.sendMessage(chatId, { text: text + '\n\n' + settings.footer, ...(mentions ? { mentions } : {}) }); } catch (e) {}
}
async function guard(conn, chatId, mek, isOwner) {
  if (!(await isAdminOrOwner(conn, chatId, mek, isOwner))) { await no(conn, chatId, mek); await reply(conn, chatId, 'Admin or owner access required.'); return false; }
  if (!(await isBotAdmin(conn, chatId))) { await no(conn, chatId, mek); await reply(conn, chatId, 'I need to be an admin to do that.'); return false; }
  return true;
}

const commands = [
  {
    name: 'joinrequests', aliases: ['requestlist', 'pendingrequests'], category: 'group',
    description: 'List pending join requests', usage: '.joinrequests', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        const list = await conn.groupRequestParticipantsList(chatId);
        await ok(conn, chatId, mek);
        if (!list.length) { await reply(conn, chatId, 'No pending join requests.'); return; }
        let t = `ðŸ“¥ *JOIN REQUESTS (${list.length})*\n\n`;
        list.forEach((r, i) => { t += `${i + 1}. +${cleanNum(r.jid)}\n`; });
        await reply(conn, chatId, t.trim());
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'approverequest', aliases: ['acceptrequest', 'approveuser'], category: 'group',
    description: 'Approve pending join request(s) by number', usage: '.approverequest 2557xxxx', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        if (!(await guard(conn, chatId, mek, isOwner))) return;
        const wanted = args.map(a => a.replace(/[^0-9]/g, '')).filter(Boolean);
        if (!wanted.length) { await no(conn, chatId, mek); await reply(conn, chatId, 'Usage: .approverequest 2557xxxx'); return; }
        const list = await conn.groupRequestParticipantsList(chatId);
        const toApprove = list.filter(r => wanted.includes(cleanNum(r.jid))).map(r => r.jid);
        if (!toApprove.length) { await no(conn, chatId, mek); await reply(conn, chatId, 'No matching request. Use .joinrequests to view.'); return; }
        await conn.groupRequestParticipantsUpdate(chatId, toApprove, 'approve');
        await ok(conn, chatId, mek);
        await reply(conn, chatId, `Approved ${toApprove.length} join request(s).`);
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'rejectrequest', aliases: ['denyrequest', 'rejectuser'], category: 'group',
    description: 'Reject pending join request(s) by number', usage: '.rejectrequest 2557xxxx', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        if (!(await guard(conn, chatId, mek, isOwner))) return;
        const wanted = args.map(a => a.replace(/[^0-9]/g, '')).filter(Boolean);
        if (!wanted.length) { await no(conn, chatId, mek); await reply(conn, chatId, 'Usage: .rejectrequest 2557xxxx'); return; }
        const list = await conn.groupRequestParticipantsList(chatId);
        const toReject = list.filter(r => wanted.includes(cleanNum(r.jid))).map(r => r.jid);
        if (!toReject.length) { await no(conn, chatId, mek); await reply(conn, chatId, 'No matching request. Use .joinrequests to view.'); return; }
        await conn.groupRequestParticipantsUpdate(chatId, toReject, 'reject');
        await ok(conn, chatId, mek);
        await reply(conn, chatId, `Rejected ${toReject.length} join request(s).`);
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'approveall', aliases: ['acceptall', 'approvejoin'], category: 'group',
    description: 'Approve every pending join request', usage: '.approveall', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        if (!(await guard(conn, chatId, mek, isOwner))) return;
        const list = await conn.groupRequestParticipantsList(chatId);
        if (!list.length) { await no(conn, chatId, mek); await reply(conn, chatId, 'No pending join requests.'); return; }
        await conn.groupRequestParticipantsUpdate(chatId, list.map(r => r.jid), 'approve');
        await ok(conn, chatId, mek);
        await reply(conn, chatId, `Approved all ${list.length} pending request(s).`);
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'rejectall', aliases: ['denyall', 'rejectjoin'], category: 'group',
    description: 'Reject every pending join request', usage: '.rejectall', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        if (!(await guard(conn, chatId, mek, isOwner))) return;
        const list = await conn.groupRequestParticipantsList(chatId);
        if (!list.length) { await no(conn, chatId, mek); await reply(conn, chatId, 'No pending join requests.'); return; }
        await conn.groupRequestParticipantsUpdate(chatId, list.map(r => r.jid), 'reject');
        await ok(conn, chatId, mek);
        await reply(conn, chatId, `Rejected all ${list.length} pending request(s).`);
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'addmember', aliases: ['invitemember', 'adduser'], category: 'group',
    description: 'Add a member to the group by number', usage: '.addmember 2557xxxx', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        if (!(await guard(conn, chatId, mek, isOwner))) return;
        const num = (args[0] || '').replace(/[^0-9]/g, '');
        if (!num) { await no(conn, chatId, mek); await reply(conn, chatId, 'Usage: .addmember 2557xxxx'); return; }
        await conn.groupParticipantsUpdate(chatId, [toJid(num)], 'add');
        await ok(conn, chatId, mek);
        await reply(conn, chatId, `Added +${num} to the group.`);
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'demoteall', aliases: ['unadminall', 'stripadmin'], category: 'group',
    description: 'Demote all admins except the group owner', usage: '.demoteall', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        if (!(await guard(conn, chatId, mek, isOwner))) return;
        const meta = await conn.groupMetadata(chatId);
        const targets = meta.participants.filter(p => p.admin === 'admin').map(p => p.id);
        if (!targets.length) { await no(conn, chatId, mek); await reply(conn, chatId, 'No regular admins to demote.'); return; }
        for (let i = 0; i < targets.length; i += 10) {
          await conn.groupParticipantsUpdate(chatId, targets.slice(i, i + 10), 'demote');
        }
        await ok(conn, chatId, mek);
        await reply(conn, chatId, `Demoted ${targets.length} admin(s).`);
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'gcinviteme', aliases: ['inviteme', 'linkme'], category: 'group',
    description: 'Send the group invite link to you in DM', usage: '.gcinviteme', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        if (!(await isBotAdmin(conn, chatId))) { await no(conn, chatId, mek); await reply(conn, chatId, 'I need to be an admin to do that.'); return; }
        const sender = mek.key.participant || mek.key.remoteJid;
        const code = await conn.groupInviteCode(chatId);
        await conn.sendMessage(sender, { text: `ðŸ”— *Invite link*\n\nhttps://chat.whatsapp.com/${code}\n\n${settings.footer}` });
        await ok(conn, chatId, mek);
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'gcecho', aliases: ['gcrepeat', 'echo'], category: 'group',
    description: 'Make the bot repeat your text in the group', usage: '.gcecho text', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        if (!(await isAdminOrOwner(conn, chatId, mek, isOwner))) { await no(conn, chatId, mek); await reply(conn, chatId, 'Admin or owner access required.'); return; }
        const text = args.join(' ').trim();
        if (!text) { await no(conn, chatId, mek); await reply(conn, chatId, 'Usage: .gcecho your message'); return; }
        await ok(conn, chatId, mek);
        await conn.sendMessage(chatId, { text });
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'gcannounce', aliases: ['announcement', 'gcnotice'], category: 'group',
    description: 'Send a highlighted announcement to the group', usage: '.gcannounce text', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        if (!(await isAdminOrOwner(conn, chatId, mek, isOwner))) { await no(conn, chatId, mek); await reply(conn, chatId, 'Admin or owner access required.'); return; }
        const text = args.join(' ').trim();
        if (!text) { await no(conn, chatId, mek); await reply(conn, chatId, 'Usage: .gcannounce your announcement'); return; }
        await ok(conn, chatId, mek);
        await conn.sendMessage(chatId, { text: `ðŸ“¢ *ANNOUNCEMENT*\n\n${text}\n\n${settings.footer}` });
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  }
];

module.exports = commands;
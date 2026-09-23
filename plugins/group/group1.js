/**
 * TYREX_KSH-MD — GROUP PACK 1 (10 commands)
 * Group setup & info commands (group-only).
 * Drop into: plugins/group/group1.js
 */
const settings = require('../../settings');
const { isSenderAdmin, isBotAdmin, cleanNum } = require('../../lib/groupAdmin');

async function isAdminOrOwner(conn, chatId, mek, isOwner) {
  if (isOwner) return true;
  const sender = mek.key.participant || mek.key.remoteJid;
  return await isSenderAdmin(conn, chatId, sender);
}
async function ok(conn, chatId, mek) { try { await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } }); } catch (e) {} }
async function no(conn, chatId, mek) { try { await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } }); } catch (e) {} }
async function reply(conn, chatId, text, mentions) {
  try { await conn.sendMessage(chatId, { text: text + '\n\n' + settings.footer, ...(mentions ? { mentions } : {}) }); } catch (e) {}
}

const commands = [
  {
    name: 'groupinfo', aliases: ['gcinfo', 'groupdetails'], category: 'group',
    description: 'Show full group information', usage: '.groupinfo', groupOnly: true, react: '✅',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        const meta = await conn.groupMetadata(chatId);
        const admins = meta.participants.filter(p => p.admin);
        const created = meta.creation ? new Date(meta.creation * 1000).toDateString() : 'Unknown';
        await ok(conn, chatId, mek);
        await reply(conn, chatId,
          `📊 *GROUP INFO*\n\n` +
          `*Name:* ${meta.subject}\n` +
          `*ID:* ${chatId.split('@')[0]}\n` +
          `*Members:* ${meta.participants.length}\n` +
          `*Admins:* ${admins.length}\n` +
          `*Created:* ${created}\n` +
          `*Owner:* ${meta.owner ? '@' + cleanNum(meta.owner) : 'Unknown'}\n` +
          `*Description:* ${meta.desc || 'No description'}`,
          meta.owner ? [meta.owner] : []
        );
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'groupname', aliases: ['setgcname', 'setgroupname'], category: 'group',
    description: 'Change the group name/subject', usage: '.groupname New Name', groupOnly: true, react: '✅',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        if (!(await isAdminOrOwner(conn, chatId, mek, isOwner))) { await no(conn, chatId, mek); await reply(conn, chatId, 'Admin or owner access required.'); return; }
        const name = args.join(' ').trim();
        if (!name) { await no(conn, chatId, mek); await reply(conn, chatId, 'Provide a new group name.'); return; }
        if (!(await isBotAdmin(conn, chatId))) { await no(conn, chatId, mek); await reply(conn, chatId, 'I need to be an admin to do that.'); return; }
        await conn.groupUpdateSubject(chatId, name);
        await ok(conn, chatId, mek);
        await reply(conn, chatId, `Group name changed to *${name}*.`);
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'groupdesc', aliases: ['setgcdesc', 'setgroupdesc'], category: 'group',
    description: 'Change the group description', usage: '.groupdesc New description', groupOnly: true, react: '✅',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        if (!(await isAdminOrOwner(conn, chatId, mek, isOwner))) { await no(conn, chatId, mek); await reply(conn, chatId, 'Admin or owner access required.'); return; }
        const desc = args.join(' ').trim();
        if (!desc) { await no(conn, chatId, mek); await reply(conn, chatId, 'Provide a new description.'); return; }
        if (!(await isBotAdmin(conn, chatId))) { await no(conn, chatId, mek); await reply(conn, chatId, 'I need to be an admin to do that.'); return; }
        await conn.groupUpdateDescription(chatId, desc);
        await ok(conn, chatId, mek);
        await reply(conn, chatId, 'Group description updated.');
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'groupicon', aliases: ['setgcicon', 'setgroupicon'], category: 'group',
    description: 'Change the group icon (reply to an image)', usage: '.groupicon (reply to image)', groupOnly: true, react: '✅',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        if (!(await isAdminOrOwner(conn, chatId, mek, isOwner))) { await no(conn, chatId, mek); await reply(conn, chatId, 'Admin or owner access required.'); return; }
        if (!(await isBotAdmin(conn, chatId))) { await no(conn, chatId, mek); await reply(conn, chatId, 'I need to be an admin to do that.'); return; }
        const ctx = mek.message?.extendedTextMessage?.contextInfo;
        const img = ctx?.quotedMessage?.imageMessage || mek.message?.imageMessage;
        if (!img) { await no(conn, chatId, mek); await reply(conn, chatId, 'Reply to an image to set it as the group icon.'); return; }
        const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
        const stream = await downloadContentFromMessage(img, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        await conn.updateProfilePicture(chatId, buffer);
        await ok(conn, chatId, mek);
        await reply(conn, chatId, 'Group icon updated.');
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'grouplink', aliases: ['gclink', 'invitelink'], category: 'group',
    description: 'Get the group invite link', usage: '.grouplink', groupOnly: true, react: '✅',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        if (!(await isAdminOrOwner(conn, chatId, mek, isOwner))) { await no(conn, chatId, mek); await reply(conn, chatId, 'Admin or owner access required.'); return; }
        if (!(await isBotAdmin(conn, chatId))) { await no(conn, chatId, mek); await reply(conn, chatId, 'I need to be an admin to do that.'); return; }
        const code = await conn.groupInviteCode(chatId);
        await ok(conn, chatId, mek);
        await reply(conn, chatId, `🔗 *Group Link*\n\nhttps://chat.whatsapp.com/${code}`);
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'resetlink', aliases: ['revokeinvite', 'newlink'], category: 'group',
    description: 'Revoke the old invite link and generate a new one', usage: '.resetlink', groupOnly: true, react: '✅',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        if (!(await isAdminOrOwner(conn, chatId, mek, isOwner))) { await no(conn, chatId, mek); await reply(conn, chatId, 'Admin or owner access required.'); return; }
        if (!(await isBotAdmin(conn, chatId))) { await no(conn, chatId, mek); await reply(conn, chatId, 'I need to be an admin to do that.'); return; }
        const code = await conn.groupRevokeInvite(chatId);
        await ok(conn, chatId, mek);
        await reply(conn, chatId, `🔗 *New Group Link*\n\nhttps://chat.whatsapp.com/${code}`);
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'gclock', aliases: ['lockgroup', 'closegroup'], category: 'group',
    description: 'Only admins can send messages', usage: '.gclock', groupOnly: true, react: '✅',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        if (!(await isAdminOrOwner(conn, chatId, mek, isOwner))) { await no(conn, chatId, mek); await reply(conn, chatId, 'Admin or owner access required.'); return; }
        if (!(await isBotAdmin(conn, chatId))) { await no(conn, chatId, mek); await reply(conn, chatId, 'I need to be an admin to do that.'); return; }
        await conn.groupSettingUpdate(chatId, 'announcement');
        await ok(conn, chatId, mek);
        await reply(conn, chatId, 'Group locked: only admins can send messages now.');
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'gcunlock', aliases: ['unlockgroup', 'opengroup'], category: 'group',
    description: 'Everyone can send messages', usage: '.gcunlock', groupOnly: true, react: '✅',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        if (!(await isAdminOrOwner(conn, chatId, mek, isOwner))) { await no(conn, chatId, mek); await reply(conn, chatId, 'Admin or owner access required.'); return; }
        if (!(await isBotAdmin(conn, chatId))) { await no(conn, chatId, mek); await reply(conn, chatId, 'I need to be an admin to do that.'); return; }
        await conn.groupSettingUpdate(chatId, 'not_announcement');
        await ok(conn, chatId, mek);
        await reply(conn, chatId, 'Group unlocked: everyone can send messages now.');
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'gceditlock', aliases: ['lockedit', 'restrictedit'], category: 'group',
    description: 'Only admins can edit group info', usage: '.gceditlock', groupOnly: true, react: '✅',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        if (!(await isAdminOrOwner(conn, chatId, mek, isOwner))) { await no(conn, chatId, mek); await reply(conn, chatId, 'Admin or owner access required.'); return; }
        if (!(await isBotAdmin(conn, chatId))) { await no(conn, chatId, mek); await reply(conn, chatId, 'I need to be an admin to do that.'); return; }
        await conn.groupSettingUpdate(chatId, 'locked');
        await ok(conn, chatId, mek);
        await reply(conn, chatId, 'Group info locked: only admins can edit group info now.');
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'gceditunlock', aliases: ['unlockedit', 'openedit'], category: 'group',
    description: 'Everyone can edit group info', usage: '.gceditunlock', groupOnly: true, react: '✅',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        if (!(await isAdminOrOwner(conn, chatId, mek, isOwner))) { await no(conn, chatId, mek); await reply(conn, chatId, 'Admin or owner access required.'); return; }
        if (!(await isBotAdmin(conn, chatId))) { await no(conn, chatId, mek); await reply(conn, chatId, 'I need to be an admin to do that.'); return; }
        await conn.groupSettingUpdate(chatId, 'unlocked');
        await ok(conn, chatId, mek);
        await reply(conn, chatId, 'Group info unlocked: everyone can edit group info now.');
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  }
];

module.exports = commands;

const settings = require('../../settings');
const { isSenderAdmin, isBotAdmin, idsMatch } = require('../../lib/groupAdmin');

const n = jid => String(jid || '').split('@')[0].split(':')[0];
const sender = mek => mek.key.participant || mek.key.remoteJid;
const reply = (conn,chatId,text,mentions=[]) => conn.sendMessage(chatId,{text:`${text}\n\n${settings.footer}`,...(mentions.length?{mentions}:{})});
const target = mek => {
  const c=mek.message?.extendedTextMessage?.contextInfo;
  return c?.mentionedJid?.[0] || c?.participant || null;
};

module.exports = [
  {
    name:'whoami', aliases:['myrank'], category:'group', groupOnly:true, react:'👤',
    description:'Show your role in the group',
    async execute(conn,mek,args,chatId){
      const m=await conn.groupMetadata(chatId), me=sender(mek);
      const p=m.participants.find(x=>idsMatch(x.id,me)||(x.lid&&idsMatch(x.lid,me)));
      const role=p?.admin==='superadmin'?'Group Owner':p?.admin==='admin'?'Group Admin':'Member';
      await reply(conn,chatId,`YOUR GROUP ROLE\n\nNumber: ${n(me)}\nRole: ${role}`,p?.id?[p.id]:[]);
    }
  },
  {
    name:'mygroupid', aliases:['mygid'], category:'group', groupOnly:true, react:'🆔',
    description:'Show your WhatsApp JID in the group',
    async execute(conn,mek,args,chatId){ const s=sender(mek); await reply(conn,chatId,`YOUR GROUP JID\n\n${s}`); }
  },
  {
    name:'checkadmin', aliases:['isadmin'], category:'group', groupOnly:true, react:'👑',
    description:'Check whether a mentioned/replied user is an admin',
    async execute(conn,mek,args,chatId){
      const t=target(mek)||sender(mek); const ok=await isSenderAdmin(conn,chatId,t);
      await reply(conn,chatId,`ADMIN CHECK\n\n@${n(t)}: ${ok?'Admin':'Not an admin'}`,[t]);
    }
  },
  {
    name:'userrole', aliases:['rolecheck'], category:'group', groupOnly:true, react:'🔎',
    description:'Show the role of a mentioned/replied user',
    async execute(conn,mek,args,chatId){
      const t=target(mek)||sender(mek),m=await conn.groupMetadata(chatId);
      const p=m.participants.find(x=>idsMatch(x.id,t)||(x.lid&&idsMatch(x.lid,t)));
      if(!p)return reply(conn,chatId,'User is not found in this group.');
      const role=p.admin==='superadmin'?'Group Owner':p.admin==='admin'?'Group Admin':'Member';
      await reply(conn,chatId,`USER ROLE\n\n@${n(p.id)}: ${role}`,[p.id]);
    }
  },
  {
    name:'findmember', aliases:['finduser'], category:'group', groupOnly:true, react:'🔍',
    description:'Find a member by number or mention',
    async execute(conn,mek,args,chatId){
      const m=await conn.groupMetadata(chatId), t=target(mek), q=(args[0]||'').replace(/\D/g,'');
      const p=t?m.participants.find(x=>idsMatch(x.id,t)||(x.lid&&idsMatch(x.lid,t))):m.participants.find(x=>n(x.id)===q);
      if(!p)return reply(conn,chatId,'Member not found.');
      await reply(conn,chatId,`MEMBER FOUND\n\n@${n(p.id)}\nRole: ${p.admin==='superadmin'?'Group Owner':p.admin==='admin'?'Group Admin':'Member'}`,[p.id]);
    }
  },
  {
    name:'memberexists', aliases:['ismember'], category:'group', groupOnly:true, react:'🔎',
    description:'Check whether a number is in the group',
    async execute(conn,mek,args,chatId){
      const q=(args[0]||'').replace(/\D/g,''); if(!q)return reply(conn,chatId,`Usage: ${settings.prefix||'.'}memberexists 255700000000`);
      const m=await conn.groupMetadata(chatId),p=m.participants.find(x=>n(x.id)===q);
      await reply(conn,chatId,`MEMBER CHECK\n\n${q}: ${p?'YES — member is in this group.':'NO — member is not in this group.'}`);
    }
  },
  {
    name:'adminlist', aliases:['listadmins'], category:'group', groupOnly:true, react:'📋',
    description:'Show admins with their roles',
    async execute(conn,mek,args,chatId){
      const m=await conn.groupMetadata(chatId),a=m.participants.filter(x=>x.admin);
      await reply(conn,chatId,`ADMIN LIST\n\n${a.map((p,i)=>`${i+1}. @${n(p.id)} — ${p.admin==='superadmin'?'Owner':'Admin'}`).join('\n')}`,a.map(p=>p.id));
    }
  },
  {
    name:'nonadmins', aliases:['membersonly'], category:'group', groupOnly:true, react:'👥',
    description:'List members who are not admins',
    async execute(conn,mek,args,chatId){
      const m=await conn.groupMetadata(chatId),a=m.participants.filter(x=>!x.admin);
      await reply(conn,chatId,`NON-ADMINS (${a.length})\n\n${a.map((p,i)=>`${i+1}. @${n(p.id)}`).join('\n')}`,a.map(p=>p.id));
    }
  },
  {
    name:'groupstats', aliases:['gcstats'], category:'group', groupOnly:true, react:'📊',
    description:'Show group member statistics',
    async execute(conn,mek,args,chatId){
      const m=await conn.groupMetadata(chatId), total=m.participants.length, admins=m.participants.filter(x=>x.admin).length;
      await reply(conn,chatId,`GROUP STATS\n\nTotal members: ${total}\nAdmins: ${admins}\nRegular members: ${total-admins}`);
    }
  },
  {
    name:'botingroup', aliases:['botmember'], category:'group', groupOnly:true, react:'🤖',
    description:'Check whether the bot is a member of this group',
    async execute(conn,mek,args,chatId){
      const ok=await isBotAdmin(conn,chatId); const m=await conn.groupMetadata(chatId);
      const bot=m.participants.find(p=>p.id===conn.user?.id||p.id===`${conn.user?.id?.split(':')[0]}@s.whatsapp.net`);
      await reply(conn,chatId,`BOT GROUP STATUS\n\nMember: ${bot?'YES':'NO'}\nAdmin: ${ok?'YES':'NO'}`);
    }
  }
];

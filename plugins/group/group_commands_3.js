const settings = require('../../settings');
const { isSenderAdmin, isBotAdmin } = require('../../lib/groupAdmin');

const senderOf = mek => mek.key.participant || mek.key.remoteJid;
const reply = (conn, chatId, text) => conn.sendMessage(chatId, { text: `${text}\n\n${settings.footer}` });
const needAdmin = async (conn, mek, chatId, owner) => owner || await isSenderAdmin(conn, chatId, senderOf(mek));
const needBot = async (conn, chatId) => isBotAdmin(conn, chatId);

const targetFrom = mek => {
  const c = mek.message?.extendedTextMessage?.contextInfo;
  return c?.mentionedJid?.[0] || c?.participant || null;
};

module.exports = [
  {
    name:'setgname', aliases:['setgroupname'], category:'group', groupOnly:true, react:'✅',
    description:'Change the group subject',
    async execute(conn,mek,args,chatId,isOwner){
      if(!await needAdmin(conn,mek,chatId,isOwner)) return reply(conn,chatId,'Only group admins can use this command.');
      if(!await needBot(conn,chatId)) return reply(conn,chatId,'Bot must be a group admin.');
      const name=args.join(' ').trim();
      if(!name) return reply(conn,chatId,`Usage: ${settings.prefix || '.'}setgname New Group Name`);
      await conn.groupUpdateSubject(chatId,name);
      await reply(conn,chatId,'Group name updated successfully.');
    }
  },
  {
    name:'setgdesc', aliases:['setgroupdesc'], category:'group', groupOnly:true, react:'✅',
    description:'Change the group description',
    async execute(conn,mek,args,chatId,isOwner){
      if(!await needAdmin(conn,mek,chatId,isOwner)) return reply(conn,chatId,'Only group admins can use this command.');
      if(!await needBot(conn,chatId)) return reply(conn,chatId,'Bot must be a group admin.');
      const desc=args.join(' ').trim();
      if(!desc) return reply(conn,chatId,`Usage: ${settings.prefix || '.'}setgdesc New description`);
      await conn.groupUpdateDescription(chatId,desc);
      await reply(conn,chatId,'Group description updated successfully.');
    }
  },
  {
    name:'openchat', aliases:['opengroup'], category:'group', groupOnly:true, react:'🔓',
    description:'Allow all members to send messages',
    async execute(conn,mek,args,chatId,isOwner){
      if(!await needAdmin(conn,mek,chatId,isOwner)) return reply(conn,chatId,'Only group admins can use this command.');
      if(!await needBot(conn,chatId)) return reply(conn,chatId,'Bot must be a group admin.');
      await conn.groupSettingUpdate(chatId,'not_announcement');
      await reply(conn,chatId,'Group chat is now open to all members.');
    }
  },
  {
    name:'closechat', aliases:['closegroup'], category:'group', groupOnly:true, react:'🔒',
    description:'Allow only admins to send messages',
    async execute(conn,mek,args,chatId,isOwner){
      if(!await needAdmin(conn,mek,chatId,isOwner)) return reply(conn,chatId,'Only group admins can use this command.');
      if(!await needBot(conn,chatId)) return reply(conn,chatId,'Bot must be a group admin.');
      await conn.groupSettingUpdate(chatId,'announcement');
      await reply(conn,chatId,'Group chat is now admin-only.');
    }
  },
  {
    name:'lockinfo', aliases:['lockgroupinfo'], category:'group', groupOnly:true, react:'🔒',
    description:'Prevent members from editing group info',
    async execute(conn,mek,args,chatId,isOwner){
      if(!await needAdmin(conn,mek,chatId,isOwner)) return reply(conn,chatId,'Only group admins can use this command.');
      if(!await needBot(conn,chatId)) return reply(conn,chatId,'Bot must be a group admin.');
      await conn.groupSettingUpdate(chatId,'locked');
      await reply(conn,chatId,'Group info is now admin-only.');
    }
  },
  {
    name:'unlockinfo', aliases:['unlockgroupinfo'], category:'group', groupOnly:true, react:'🔓',
    description:'Allow members to edit group info',
    async execute(conn,mek,args,chatId,isOwner){
      if(!await needAdmin(conn,mek,chatId,isOwner)) return reply(conn,chatId,'Only group admins can use this command.');
      if(!await needBot(conn,chatId)) return reply(conn,chatId,'Bot must be a group admin.');
      await conn.groupSettingUpdate(chatId,'unlocked');
      await reply(conn,chatId,'Group info editing is now open.');
    }
  },
  {
    name:'revokeinvite', aliases:['resetinvite'], category:'group', groupOnly:true, react:'🔄',
    description:'Reset the group invite link',
    async execute(conn,mek,args,chatId,isOwner){
      if(!await needAdmin(conn,mek,chatId,isOwner)) return reply(conn,chatId,'Only group admins can use this command.');
      if(!await needBot(conn,chatId)) return reply(conn,chatId,'Bot must be a group admin.');
      await conn.groupRevokeInvite(chatId);
      await reply(conn,chatId,'Group invite link has been reset.');
    }
  },
  {
    name:'setgpp', aliases:['setgroupicon'], category:'group', groupOnly:true, react:'🖼️',
    description:'Set the group profile picture by replying to an image',
    async execute(conn,mek,args,chatId,isOwner){
      if(!await needAdmin(conn,mek,chatId,isOwner)) return reply(conn,chatId,'Only group admins can use this command.');
      if(!await needBot(conn,chatId)) return reply(conn,chatId,'Bot must be a group admin.');
      const q=mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const img=q?.imageMessage;
      if(!img) return reply(conn,chatId,`Reply to an image with ${settings.prefix || '.'}setgpp`);
      const { downloadContentFromMessage }=require('@whiskeysockets/baileys');
      const stream=await downloadContentFromMessage(img,'image'); const chunks=[];
      for await(const c of stream) chunks.push(c);
      await conn.updateProfilePicture(chatId,Buffer.concat(chunks));
      await reply(conn,chatId,'Group profile picture updated.');
    }
  },
  {
    name:'openinvite', aliases:['getinvite'], category:'group', groupOnly:true, react:'🔗',
    description:'Generate the current group invite link',
    async execute(conn,mek,args,chatId,isOwner){
      if(!await needAdmin(conn,mek,chatId,isOwner)) return reply(conn,chatId,'Only group admins can use this command.');
      if(!await needBot(conn,chatId)) return reply(conn,chatId,'Bot must be a group admin.');
      const code=await conn.groupInviteCode(chatId);
      await reply(conn,chatId,`GROUP INVITE\n\nhttps://chat.whatsapp.com/${code}`);
    }
  },
  {
    name:'checkbotadmin', aliases:['botadmin'], category:'group', groupOnly:true, react:'🤖',
    description:'Check whether the bot is a group admin',
    async execute(conn,mek,args,chatId){
      const ok=await isBotAdmin(conn,chatId);
      await reply(conn,chatId,`BOT ADMIN STATUS\n\n${ok ? 'YES — bot is an admin.' : 'NO — bot is not an admin.'}`);
    }
  }
];

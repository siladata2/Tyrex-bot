const settings = require('../../settings');
const fs = require('fs');
const path = require('path');
const { isSenderAdmin } = require('../../lib/groupAdmin');

const DATA=path.join(process.cwd(),'data','group-tools');
if(!fs.existsSync(DATA))fs.mkdirSync(DATA,{recursive:true});
const file=jid=>path.join(DATA,`${jid.replace(/[^a-zA-Z0-9_-]/g,'_')}.json`);
const read=jid=>{try{return JSON.parse(fs.readFileSync(file(jid),'utf8'))}catch{return {}}};
const write=(jid,d)=>fs.writeFileSync(file(jid),JSON.stringify(d,null,2));
const sender=mek=>mek.key.participant||mek.key.remoteJid;
const reply=(conn,jid,text)=>conn.sendMessage(jid,{text:`${text}\n\n${settings.footer}`});
const admin=async(conn,mek,jid,owner)=>owner||await isSenderAdmin(conn,jid,sender(mek));

module.exports=[
  {
    name:'setrules', aliases:['gcrules'], category:'group', groupOnly:true, react:'📝',
    description:'Save group rules',
    async execute(conn,mek,args,jid,owner){
      if(!await admin(conn,mek,jid,owner))return reply(conn,jid,'Only group admins can set rules.');
      const text=args.join(' ').trim(); if(!text)return reply(conn,jid,`Usage: ${settings.prefix||'.'}setrules Rule text`);
      const d=read(jid); d.rules=text; write(jid,d); await reply(conn,jid,'Group rules saved.');
    }
  },
  {
    name:'rules', aliases:['gcrulesview'], category:'group', groupOnly:true, react:'📜',
    description:'Show saved group rules',
    async execute(conn,mek,args,jid){const d=read(jid);await reply(conn,jid,`GROUP RULES\n\n${d.rules||'No rules have been saved for this group.'}`);}
  },
  {
    name:'delrules', aliases:['clearrules'], category:'group', groupOnly:true, react:'🗑️',
    description:'Delete saved group rules',
    async execute(conn,mek,args,jid,owner){
      if(!await admin(conn,mek,jid,owner))return reply(conn,jid,'Only group admins can delete rules.');
      const d=read(jid);delete d.rules;write(jid,d);await reply(conn,jid,'Saved group rules deleted.');
    }
  },
  {
    name:'setgreeting', aliases:['setgroupgreet'], category:'group', groupOnly:true, react:'👋',
    description:'Save a custom group greeting text',
    async execute(conn,mek,args,jid,owner){
      if(!await admin(conn,mek,jid,owner))return reply(conn,jid,'Only group admins can set the greeting.');
      const text=args.join(' ').trim();if(!text)return reply(conn,jid,`Usage: ${settings.prefix||'.'}setgreeting Welcome text`);
      const d=read(jid);d.greeting=text;write(jid,d);await reply(conn,jid,'Group greeting saved.');
    }
  },
  {
    name:'greeting', aliases:['groupgreet'], category:'group', groupOnly:true, react:'👋',
    description:'Show the saved group greeting',
    async execute(conn,mek,args,jid){const d=read(jid);await reply(conn,jid,`GROUP GREETING\n\n${d.greeting||'No greeting has been saved.'}`);}
  },
  {
    name:'delgreeting', aliases:['cleargreeting'], category:'group', groupOnly:true, react:'🗑️',
    description:'Delete saved group greeting',
    async execute(conn,mek,args,jid,owner){
      if(!await admin(conn,mek,jid,owner))return reply(conn,jid,'Only group admins can delete the greeting.');
      const d=read(jid);delete d.greeting;write(jid,d);await reply(conn,jid,'Saved group greeting deleted.');
    }
  },
  {
    name:'setgfooter', aliases:['setgroupfooter'], category:'group', groupOnly:true, react:'📝',
    description:'Save a custom group footer',
    async execute(conn,mek,args,jid,owner){
      if(!await admin(conn,mek,jid,owner))return reply(conn,jid,'Only group admins can set the footer.');
      const text=args.join(' ').trim();if(!text)return reply(conn,jid,`Usage: ${settings.prefix||'.'}setgfooter Footer text`);
      const d=read(jid);d.footer=text;write(jid,d);await reply(conn,jid,'Group footer saved.');
    }
  },
  {
    name:'gfooter', aliases:['groupfooter'], category:'group', groupOnly:true, react:'📌',
    description:'Show the saved group footer',
    async execute(conn,mek,args,jid){const d=read(jid);await reply(conn,jid,`GROUP FOOTER\n\n${d.footer||'No custom footer has been saved.'}`);}
  },
  {
    name:'delgfooter', aliases:['cleargfooter'], category:'group', groupOnly:true, react:'🗑️',
    description:'Delete saved group footer',
    async execute(conn,mek,args,jid,owner){
      if(!await admin(conn,mek,jid,owner))return reply(conn,jid,'Only group admins can delete the footer.');
      const d=read(jid);delete d.footer;write(jid,d);await reply(conn,jid,'Saved group footer deleted.');
    }
  },
  {
    name:'groupconfig', aliases:['gcconfig'], category:'group', groupOnly:true, react:'⚙️',
    description:'Show saved group bot configuration',
    async execute(conn,mek,args,jid){const d=read(jid);await reply(conn,jid,`GROUP CONFIG\n\nRules: ${d.rules?'Set':'Not set'}\nGreeting: ${d.greeting?'Set':'Not set'}\nCustom footer: ${d.footer?'Set':'Not set'}`);}
  }
];

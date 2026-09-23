/**
 * TYREX_KSH-MD â€” GROUP PACK 4 (10 commands)
 * Group interaction & fun (group-only).
 * Drop into: plugins/group/group4.js
 */
const settings = require('../../settings');
const { isSenderAdmin, cleanNum } = require('../../lib/groupAdmin');

async function isAdminOrOwner(conn, chatId, mek, isOwner) {
  if (isOwner) return true;
  const sender = mek.key.participant || mek.key.remoteJid;
  return await isSenderAdmin(conn, chatId, sender);
}
async function ok(conn, chatId, mek) { try { await conn.sendMessage(chatId, { react: { text: 'âœ…', key: mek.key } }); } catch (e) {} }
async function no(conn, chatId, mek) { try { await conn.sendMessage(chatId, { react: { text: 'âŒ', key: mek.key } }); } catch (e) {} }
async function reply(conn, chatId, text, mentions) {
  try { await conn.sendMessage(chatId, { text: text + '\n\n' + settings.footer, ...(mentions ? { mentions } : {}) }); } catch (e) {}
}
const QUOTES = [
  'Unity is strength â€” together we go far.',
  'A group is only as strong as its members.',
  'Respect each other and the group will grow.',
  'Good talk builds good teams.',
  'Stay active, stay helpful, stay kind.'
];
const FACTS = [
  'Honey never spoils â€” it can last thousands of years.',
  'Octopuses have three hearts.',
  'A day on Venus is longer than its year.',
  'Bananas are berries, but strawberries are not.',
  'The Eiffel Tower grows taller in summer heat.'
];
const JOKES = [
  'Why did the developer go broke? He used up all his cache.',
  'I told my WiFi we needed space... now it won\'t connect.',
  'Why do programmers prefer dark mode? Because light attracts bugs.',
  'I would tell you a WhatsApp joke, but you might not get the message.',
  'My password is the last 8 digits of pi.'
];
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const commands = [
  {
    name: 'poll', aliases: ['createpoll', 'gcpoll'], category: 'group',
    description: 'Create a WhatsApp poll', usage: '.poll Question | Option1 | Option2', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        if (!(await isAdminOrOwner(conn, chatId, mek, isOwner))) { await no(conn, chatId, mek); await reply(conn, chatId, 'Admin or owner access required.'); return; }
        const raw = args.join(' ');
        const parts = raw.split('|').map(s => s.trim()).filter(Boolean);
        if (parts.length < 3) { await no(conn, chatId, mek); await reply(conn, chatId, 'Usage: .poll Question | Option1 | Option2'); return; }
        const name = parts[0];
        const values = parts.slice(1, 13);
        await ok(conn, chatId, mek);
        await conn.sendMessage(chatId, { poll: { name, values, selectableCount: 1 } });
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'gcremind', aliases: ['setreminder', 'gcalert'], category: 'group',
    description: 'Set a group reminder (e.g. 10m, 1h)', usage: '.gcremind 10m Text', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        if (!(await isAdminOrOwner(conn, chatId, mek, isOwner))) { await no(conn, chatId, mek); await reply(conn, chatId, 'Admin or owner access required.'); return; }
        const m = (args[0] || '').match(/^(\d+)(s|m|h)$/i);
        const msg = args.slice(1).join(' ').trim();
        if (!m || !msg) { await no(conn, chatId, mek); await reply(conn, chatId, 'Usage: .gcremind 10m Your text'); return; }
        const unit = m[2].toLowerCase();
        const ms = parseInt(m[1], 10) * (unit === 's' ? 1000 : unit === 'm' ? 60000 : 3600000);
        const cap = Math.min(ms, 3600000);
        await ok(conn, chatId, mek);
        await reply(conn, chatId, `â° Reminder set (${m[1]}${unit}).`);
        setTimeout(() => {
          conn.sendMessage(chatId, { text: `â° *REMINDER*\n\n${msg}\n\n${settings.footer}` }).catch(() => {});
        }, cap);
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'gccountdown', aliases: ['countdowngc', 'gctimer'], category: 'group',
    description: 'Start a minute countdown in the group', usage: '.gccountdown 5 Text', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        if (!(await isAdminOrOwner(conn, chatId, mek, isOwner))) { await no(conn, chatId, mek); await reply(conn, chatId, 'Admin or owner access required.'); return; }
        const mins = parseInt((args[0] || '').replace(/[^0-9]/g, ''), 10);
        const label = args.slice(1).join(' ') || 'Countdown';
        if (!mins || mins < 1 || mins > 10) { await no(conn, chatId, mek); await reply(conn, chatId, 'Usage: .gccountdown 1-10 Text'); return; }
        await ok(conn, chatId, mek);
        for (let i = mins; i >= 0; i--) {
          const text = i === 0 ? `â³ *${label}* â€” Time up!` : `â³ *${label}* â€” ${i} minute(s) left`;
          // eslint-disable-next-line no-await-in-loop
          await conn.sendMessage(chatId, { text: `${text}\n\n${settings.footer}` });
          if (i > 0) await new Promise(r => setTimeout(r, 60000));
        }
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'gcsay', aliases: ['saygc', 'gcsend'], category: 'group',
    description: 'Send a plain message as the bot', usage: '.gcsay text', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        if (!(await isAdminOrOwner(conn, chatId, mek, isOwner))) { await no(conn, chatId, mek); await reply(conn, chatId, 'Admin or owner access required.'); return; }
        const text = args.join(' ').trim();
        if (!text) { await no(conn, chatId, mek); await reply(conn, chatId, 'Usage: .gcsay your message'); return; }
        await ok(conn, chatId, mek);
        await conn.sendMessage(chatId, { text });
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  },
  {
    name: 'gcq', aliases: ['gcquote', 'groupquote'], category: 'group',
    description: 'Post a random motivational quote', usage: '.gcq', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      await ok(conn, chatId, mek);
      await reply(conn, chatId, `ðŸ’¬ *QUOTE*\n\n"${pick(QUOTES)}"`);
    }
  },
  {
    name: 'gcfact', aliases: ['gcfunfact', 'groupfact'], category: 'group',
    description: 'Post a random fun fact', usage: '.gcfact', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      await ok(conn, chatId, mek);
      await reply(conn, chatId, `ðŸ§  *FUN FACT*\n\n${pick(FACTS)}`);
    }
  },
  {
    name: 'gcjoke', aliases: ['groupjoke', 'gcjk'], category: 'group',
    description: 'Post a random joke', usage: '.gcjoke', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      await ok(conn, chatId, mek);
      await reply(conn, chatId, `ðŸ˜‚ *JOKE*\n\n${pick(JOKES)}`);
    }
  },
  {
    name: 'gcdice', aliases: ['gcdiceroll', 'groupdice'], category: 'group',
    description: 'Roll a dice in the group', usage: '.gcdice', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      await ok(conn, chatId, mek);
      const n = Math.floor(Math.random() * 6) + 1;
      await reply(conn, chatId, `ðŸŽ² *DICE ROLL*\n\nYou rolled a *${n}*.`);
    }
  },
  {
    name: 'gcflip', aliases: ['gccoin', 'groupflip'], category: 'group',
    description: 'Flip a coin in the group', usage: '.gcflip', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      await ok(conn, chatId, mek);
      const res = Math.random() < 0.5 ? 'HEADS' : 'TAILS';
      await reply(conn, chatId, `ðŸª™ *COIN FLIP*\n\nResult: *${res}*`);
    }
  },
  {
    name: 'gcpick', aliases: ['randompick', 'choosemember'], category: 'group',
    description: 'Randomly pick a group member', usage: '.gcpick', groupOnly: true, react: 'âœ…',
    async execute(conn, mek, args, chatId) {
      if (!chatId.endsWith('@g.us')) { await no(conn, chatId, mek); return; }
      try {
        const meta = await conn.groupMetadata(chatId);
        const lucky = meta.participants[Math.floor(Math.random() * meta.participants.length)];
        await ok(conn, chatId, mek);
        await reply(conn, chatId, `ðŸŽ¯ *RANDOM PICK*\n\nThe chosen member is @${cleanNum(lucky.id)}`, [lucky.id]);
      } catch (e) { await no(conn, chatId, mek); await reply(conn, chatId, `Error: ${e.message}`); }
    }
  }
];

module.exports = commands;
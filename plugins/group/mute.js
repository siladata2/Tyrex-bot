// Helpers
const isGroup = (chatId) => chatId.endsWith('@g.us');

const parseTime = (args) => {
  const num = parseInt(args[0]);
  const unit = (args[1] || '').toLowerCase();
  if (!num || num <= 0) return null;

  const units = {
    second: 1, seconds: 1, sec: 1, s: 1,
    minute: 60, minutes: 60, min: 60, m: 60,
    hour: 3600, hours: 3600, h: 3600,
    day: 86400, days: 86400, d: 86400
  };

  if (!units[unit]) return null;
  return { ms: num * units[unit] * 1000, label: `${num} ${unit}` };
};

const checkPerms = async (conn, mek, chatId, isOwner) => {
  if (!isGroup(chatId)) {
    await conn.sendMessage(chatId, { text: '❌ This command is for groups only.' }, { quoted: mek });
    return false;
  }

  const meta = await conn.groupMetadata(chatId);
  const sender = mek.key.participant || mek.key.remoteJid;
  const botId = conn.user.id.split(':')[0].split('@')[0];

  const isAdmin = (jid) =>
    meta.participants.some(
      (p) =>
        p.id.split(':')[0].split('@')[0] === jid.split(':')[0].split('@')[0] &&
        (p.admin === 'admin' || p.admin === 'superadmin')
    );

  if (!isOwner && !isAdmin(sender)) {
    await conn.sendMessage(chatId, { text: '❌ Only admins can use this command.' }, { quoted: mek });
    return false;
  }

  if (!isAdmin(botId)) {
    await conn.sendMessage(chatId, { text: '❌ Make me an admin first to use this command.' }, { quoted: mek });
    return false;
  }

  return true;
};

const timers = {}; // { chatId: { open: timeout, close: timeout } }

module.exports = [
  {
    name: 'mute',
    aliases: ['close', 'lock'],
    category: 'group',
    description: 'Close group (only admins can send messages)',
    usage: '.mute',
    react: '🔇',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!(await checkPerms(conn, mek, chatId, isOwner))) return;

      await conn.groupSettingUpdate(chatId, 'announcement');
      await conn.sendMessage(chatId, { react: { text: '🔇', key: mek.key } });
      await conn.sendMessage(chatId, { text: '🔇 *Group closed.* Only admins can send messages.' }, { quoted: mek });
    }
  },

  {
    name: 'unmute',
    aliases: ['open', 'unlock'],
    category: 'group',
    description: 'Open group (everyone can send messages)',
    usage: '.unmute',
    react: '🔊',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!(await checkPerms(conn, mek, chatId, isOwner))) return;

      await conn.groupSettingUpdate(chatId, 'not_announcement');
      await conn.sendMessage(chatId, { react: { text: '🔊', key: mek.key } });
      await conn.sendMessage(chatId, { text: '🔊 *Group opened.* Everyone can send messages.' }, { quoted: mek });
    }
  },

  {
    name: 'closetime',
    aliases: ['closein'],
    category: 'group',
    description: 'Close group after a set time',
    usage: '.closetime 10 minutes',
    react: '⏳',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!(await checkPerms(conn, mek, chatId, isOwner))) return;

      const t = parseTime(args);
      if (!t) {
        return conn.sendMessage(
          chatId,
          { text: '❌ Usage:\n.closetime 10 minutes\n\nUnits: second, minute, hour, day' },
          { quoted: mek }
        );
      }

      timers[chatId] = timers[chatId] || {};
      if (timers[chatId].close) clearTimeout(timers[chatId].close);

      await conn.sendMessage(chatId, { react: { text: '⏳', key: mek.key } });
      await conn.sendMessage(chatId, { text: `⏳ Group will close in *${t.label}*.` }, { quoted: mek });

      timers[chatId].close = setTimeout(async () => {
        try {
          await conn.groupSettingUpdate(chatId, 'announcement');
          await conn.sendMessage(chatId, { text: '🔇 *Time is up.* Group closed.' });
        } catch (e) {
          console.error('closetime error:', e);
        }
        delete timers[chatId].close;
      }, t.ms);
    }
  },

  {
    name: 'opentime',
    aliases: ['openin'],
    category: 'group',
    description: 'Open group after a set time',
    usage: '.opentime 10 minutes',
    react: '⏳',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!(await checkPerms(conn, mek, chatId, isOwner))) return;

      const t = parseTime(args);
      if (!t) {
        return conn.sendMessage(
          chatId,
          { text: '❌ Usage:\n.opentime 10 minutes\n\nUnits: second, minute, hour, day' },
          { quoted: mek }
        );
      }

      timers[chatId] = timers[chatId] || {};
      if (timers[chatId].open) clearTimeout(timers[chatId].open);

      await conn.sendMessage(chatId, { react: { text: '⏳', key: mek.key } });
      await conn.sendMessage(chatId, { text: `⏳ Group will open in *${t.label}*.` }, { quoted: mek });

      timers[chatId].open = setTimeout(async () => {
        try {
          await conn.groupSettingUpdate(chatId, 'not_announcement');
          await conn.sendMessage(chatId, { text: '🔊 *Time is up.* Group opened.' });
        } catch (e) {
          console.error('opentime error:', e);
        }
        delete timers[chatId].open;
      }, t.ms);
    }
  }
];
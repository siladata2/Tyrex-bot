/* TYREX-KSH-MD — 10 NEW GROUP COMMANDS */

const settings = require('../../settings');
const { isSenderAdmin, isBotAdmin } = require('../../lib/groupAdmin');

function groupOnly(chatId) {
  return String(chatId || '').endsWith('@g.us');
}

async function guard(conn, mek, chatId, isOwner, admin = false) {
  if (!groupOnly(chatId)) {
    await conn.sendMessage(chatId, {
      text: `This command works in groups only.\n\n${settings.footer}`
    });
    return false;
  }

  if (admin) {
    const sender = mek.key.participant || mek.key.remoteJid;
    const ok = isOwner || await isSenderAdmin(conn, chatId, sender);

    if (!ok) {
      await conn.sendMessage(chatId, {
        text: `Only group admins or the bot owner can use this command.\n\n${settings.footer}`
      });
      return false;
    }

    if (!await isBotAdmin(conn, chatId)) {
      await conn.sendMessage(chatId, {
        text: `The bot must be a group admin first.\n\n${settings.footer}`
      });
      return false;
    }
  }

  return true;
}

module.exports = [

  {
    name: 'addmember',
    aliases: ['add'],
    category: 'group',
    description: 'Add a member using phone number',
    usage: '.addmember 2557...',
    groupOnly: true,
    react: '✅',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!await guard(conn, mek, chatId, isOwner, true)) return;

      const nums = args
        .map(x => x.replace(/[^0-9]/g, ''))
        .filter(Boolean);

      if (!nums.length) {
        await conn.sendMessage(chatId, {
          text: `Usage: ${settings.prefix || '.'}addmember 2557...`
        });
        return;
      }

      const jids = nums.map(n => `${n}@s.whatsapp.net`);

      await conn.groupParticipantsUpdate(chatId, jids, 'add');

      await conn.sendMessage(chatId, {
        text: `Add request sent for: ${nums.join(', ')}\n\n${settings.footer}`
      });
    }
  },

  {
    name: 'removebyid',
    aliases: ['kickid'],
    category: 'group',
    description: 'Remove member using phone number',
    usage: '.removebyid 2557...',
    groupOnly: true,
    react: '✅',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!await guard(conn, mek, chatId, isOwner, true)) return;

      const n = (args[0] || '').replace(/[^0-9]/g, '');

      if (!n) {
        await conn.sendMessage(chatId, {
          text: `Usage: ${settings.prefix || '.'}removebyid 2557...`
        });
        return;
      }

      await conn.groupParticipantsUpdate(
        chatId,
        [`${n}@s.whatsapp.net`],
        'remove'
      );

      await conn.sendMessage(chatId, {
        text: `Removal request sent for ${n}.\n\n${settings.footer}`
      });
    }
  },

  {
    name: 'promotebyid',
    aliases: ['adminbyid'],
    category: 'group',
    description: 'Promote member using phone number',
    usage: '.promotebyid 2557...',
    groupOnly: true,
    react: '✅',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!await guard(conn, mek, chatId, isOwner, true)) return;

      const n = (args[0] || '').replace(/[^0-9]/g, '');

      if (!n) {
        await conn.sendMessage(chatId, {
          text: `Usage: ${settings.prefix || '.'}promotebyid 2557...`
        });
        return;
      }

      await conn.groupParticipantsUpdate(
        chatId,
        [`${n}@s.whatsapp.net`],
        'promote'
      );

      await conn.sendMessage(chatId, {
        text: `Promotion request sent for ${n}.\n\n${settings.footer}`
      });
    }
  },

  {
    name: 'demotebyid',
    aliases: ['unadminbyid'],
    category: 'group',
    description: 'Demote admin using phone number',
    usage: '.demotebyid 2557...',
    groupOnly: true,
    react: '✅',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!await guard(conn, mek, chatId, isOwner, true)) return;

      const n = (args[0] || '').replace(/[^0-9]/g, '');

      if (!n) {
        await conn.sendMessage(chatId, {
          text: `Usage: ${settings.prefix || '.'}demotebyid 2557...`
        });
        return;
      }

      await conn.groupParticipantsUpdate(
        chatId,
        [`${n}@s.whatsapp.net`],
        'demote'
      );

      await conn.sendMessage(chatId, {
        text: `Demotion request sent for ${n}.\n\n${settings.footer}`
      });
    }
  },

  {
    name: 'setsubjectfast',
    aliases: ['subject'],
    category: 'group',
    description: 'Set group name quickly',
    usage: '.setsubjectfast New Name',
    groupOnly: true,
    react: '✅',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!await guard(conn, mek, chatId, isOwner, true)) return;

      const s = args.join(' ').trim();

      if (!s) {
        await conn.sendMessage(chatId, {
          text: `Usage: ${settings.prefix || '.'}setsubjectfast New Name`
        });
        return;
      }

      await conn.groupUpdateSubject(chatId, s);

      await conn.sendMessage(chatId, {
        text: `Subject changed successfully.\n\n${settings.footer}`
      });
    }
  },

  {
    name: 'clearinvite',
    aliases: ['newlink'],
    category: 'group',
    description: 'Revoke and refresh group invite',
    usage: '.clearinvite',
    groupOnly: true,
    react: '✅',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!await guard(conn, mek, chatId, isOwner, true)) return;

      const code = await conn.groupRevokeInvite(chatId);

      await conn.sendMessage(chatId, {
        text:
          `Old invite invalidated.\n` +
          `Fresh invite:\nhttps://chat.whatsapp.com/${code}\n\n` +
          `${settings.footer}`
      });
    }
  },

  {
    name: 'gcpicture',
    aliases: ['groupavatar'],
    category: 'group',
    description: 'Get group profile picture',
    usage: '.gcpicture',
    groupOnly: true,
    react: '✅',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!await guard(conn, mek, chatId, isOwner)) return;

      try {
        const url = await conn.profilePictureUrl(chatId, 'image');

        await conn.sendMessage(chatId, {
          image: { url },
          caption: `Group profile picture\n\n${settings.footer}`
        });
      } catch (e) {
        await conn.sendMessage(chatId, {
          text: `This group has no accessible profile picture.\n\n${settings.footer}`
        });
      }
    }
  },

  {
    name: 'gcpictureurl',
    aliases: ['avatarurl'],
    category: 'group',
    description: 'Show group profile picture URL',
    usage: '.gcpictureurl',
    groupOnly: true,
    react: '✅',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!await guard(conn, mek, chatId, isOwner)) return;

      try {
        const url = await conn.profilePictureUrl(chatId, 'image');

        await conn.sendMessage(chatId, {
          text: `Group picture URL:\n${url}\n\n${settings.footer}`
        });
      } catch (e) {
        await conn.sendMessage(chatId, {
          text: `Could not retrieve the group picture URL.`
        });
      }
    }
  },

  {
    name: 'grouptopic',
    aliases: ['topic'],
    category: 'group',
    description: 'Set group topic/description',
    usage: '.grouptopic Topic text',
    groupOnly: true,
    react: '✅',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!await guard(conn, mek, chatId, isOwner, true)) return;

      const t = args.join(' ').trim();

      if (!t) {
        await conn.sendMessage(chatId, {
          text: `Usage: ${settings.prefix || '.'}grouptopic Topic text`
        });
        return;
      }

      await conn.groupUpdateDescription(chatId, t);

      await conn.sendMessage(chatId, {
        text: `Group topic updated.\n\n${settings.footer}`
      });
    }
  },

  {
    name: 'groupannounce',
    aliases: ['gcannounce'],
    category: 'group',
    description: 'Toggle admin-only chat',
    usage: '.groupannounce on|off',
    groupOnly: true,
    react: '✅',
    async execute(conn, mek, args, chatId, isOwner) {
      if (!await guard(conn, mek, chatId, isOwner, true)) return;

      const v = (args[0] || '').toLowerCase();

      if (!['on', 'off'].includes(v)) {
        await conn.sendMessage(chatId, {
          text: `Usage: ${settings.prefix || '.'}groupannounce on|off`
        });
        return;
      }

      await conn.groupSettingUpdate(
        chatId,
        v === 'on' ? 'announcement' : 'not_announcement'
      );

      await conn.sendMessage(chatId, {
        text:
          `Admin-only chat: ${v === 'on' ? 'ON' : 'OFF'}\n\n` +
          `${settings.footer}`
      });
    }
  }

];
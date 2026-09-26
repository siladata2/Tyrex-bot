const { S_WHATSAPP_NET } = require('@whiskeysockets/baileys');
const Jimp = require('jimp');
const moment = require('moment-timezone');
const fs = require('fs/promises');
const { exec } = require('child_process');
const axios = require('axios');
const util = require('util');
const { sendInteractiveMessage } = require('gifted-btns');

//=====================================================================
// 1. MYGROUPS
//=====================================================================
const mygroups = {
  name: 'mygroups',
  aliases: ['groups', 'botgroups', 'glist'],
  category: 'owner',
  description: 'List all groups the bot is in (interactive)',
  usage: '.mygroups',
  react: '📋',
  async execute(conn, mek, args, chatId, isOwner) {
    if (!isOwner) return conn.sendMessage(chatId, { text: '❌ Owner Only Command!' }, { quoted: mek });

    try {
      const allGroups = await conn.groupFetchAllParticipating();
      const groupList = Object.values(allGroups);

      if (!groupList.length) {
        return conn.sendMessage(chatId, { text: '⚠️ Bot is not in any groups.' }, { quoted: mek });
      }

      const rows = groupList.map(g => ({
        header: '📛',
        title: g.subject || 'Unnamed Group',
        description: `👥 Members: ${g.participants?.length || 0}\n🆔 JID: ${g.id}`,
        id: `group_${g.id}`
      }));

      await sendInteractiveMessage(conn, chatId, {
        text: `*📋 My Groups*\n\nBot is in ${groupList.length} groups.\nSelect one to view metadata:`,
        interactiveButtons: [
          {
            name: 'single_select',
            buttonParamsJson: JSON.stringify({
              title: 'Groups',
              sections: [{ title: 'Available Groups', rows }]
            })
          }
        ]
      });

      await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
    } catch (err) {
      console.error('mygroups error:', err);
      conn.sendMessage(chatId, { text: '❌ Error while accessing bot groups.\n\n' + err.message }, { quoted: mek });
    }
  }
};

//=====================================================================
// 2. DISAPPEARING
//=====================================================================
const disappearing = {
  name: 'disappearing',
  aliases: ['updatedisappearing', 'ephemeral'],
  category: 'owner',
  description: 'Update WhatsApp default disappearing messages duration',
  usage: '.disappearing <0|86400|604800|7776000>',
  react: '⏳',
  async execute(conn, mek, args, chatId, isOwner) {
    if (!isOwner) return conn.sendMessage(chatId, { text: '❌ Owner Only Command!' }, { quoted: mek });

    const q = args.join(' ').trim();
    if (!q) {
      return conn.sendMessage(chatId, { text: '📌 Usage: .disappearing <0|86400|604800|7776000>\n\nValues:\n0 = Remove\n86400 = 24h\n604800 = 7d\n7776000 = 90d' }, { quoted: mek });
    }

    const value = parseInt(q, 10);
    const validValues = [0, 86400, 604800, 7776000];

    if (!validValues.includes(value)) {
      return conn.sendMessage(chatId, { text: '❌ Invalid value.\nAvailable: 0, 86400, 604800, 7776000' }, { quoted: mek });
    }

    try {
      await conn.updateDefaultDisappearingMode(value);
      const labels = { 0: 'Removed (No disappearing)', 86400: '24 hours', 604800: '7 days', 7776000: '90 days' };
      await conn.sendMessage(chatId, { text: `✅ Default disappearing messages updated to: *${labels[value]}*` }, { quoted: mek });
      await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
    } catch (err) {
      console.error('disappearing error:', err);
      conn.sendMessage(chatId, { text: `❌ Error updating.\n${err.message}` }, { quoted: mek });
    }
  }
};

//=====================================================================
// 3. GROUPPRIVACY
//=====================================================================
const groupprivacy = {
  name: 'groupprivacy',
  aliases: ['updategroupprivacy'],
  category: 'owner',
  description: 'Update WhatsApp Group Add privacy setting',
  usage: '.groupprivacy <all|contacts|contact_blacklist>',
  react: '🔒',
  async execute(conn, mek, args, chatId, isOwner) {
    if (!isOwner) return conn.sendMessage(chatId, { text: '❌ Owner Only Command!' }, { quoted: mek });

    const q = args.join(' ').trim().toLowerCase();
    if (!q) return conn.sendMessage(chatId, { text: '📌 Usage: .groupprivacy <all|contacts|contact_blacklist>' }, { quoted: mek });

    const validValues = ['all', 'contacts', 'contact_blacklist'];
    if (!validValues.includes(q)) {
      return conn.sendMessage(chatId, { text: `❌ Invalid value.\nAvailable: ${validValues.join(', ')}` }, { quoted: mek });
    }

    try {
      await conn.updateGroupsAddPrivacy(q);
      await conn.sendMessage(chatId, { text: `✅ Group Add privacy updated to: *${q}*` }, { quoted: mek });
      await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
    } catch (err) {
      console.error('groupprivacy error:', err);
      conn.sendMessage(chatId, { text: `❌ Error.\n${err.message}` }, { quoted: mek });
    }
  }
};

//=====================================================================
// 4. READRECEIPTS
//=====================================================================
const readreceipts = {
  name: 'readreceipts',
  aliases: ['updatereadreceipts'],
  category: 'owner',
  description: 'Update WhatsApp Read Receipts privacy setting',
  usage: '.readreceipts <all|none>',
  react: '👁️',
  async execute(conn, mek, args, chatId, isOwner) {
    if (!isOwner) return conn.sendMessage(chatId, { text: '❌ Owner Only Command!' }, { quoted: mek });

    const q = args.join(' ').trim().toLowerCase();
    if (!q) return conn.sendMessage(chatId, { text: '📌 Usage: .readreceipts <all|none>' }, { quoted: mek });

    const validValues = ['all', 'none'];
    if (!validValues.includes(q)) {
      return conn.sendMessage(chatId, { text: `❌ Invalid value.\nAvailable: ${validValues.join(', ')}` }, { quoted: mek });
    }

    try {
      await conn.updateReadReceiptsPrivacy(q);
      await conn.sendMessage(chatId, { text: `✅ Read Receipts privacy updated to: *${q}*` }, { quoted: mek });
      await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
    } catch (err) {
      console.error('readreceipts error:', err);
      conn.sendMessage(chatId, { text: `❌ Error.\n${err.message}` }, { quoted: mek });
    }
  }
};

//=====================================================================
// 5. STATUSPRIVACY
//=====================================================================
const statusprivacy = {
  name: 'statusprivacy',
  aliases: ['updatestatusprivacy'],
  category: 'owner',
  description: 'Update WhatsApp Status privacy setting',
  usage: '.statusprivacy <all|contacts|contact_blacklist|none>',
  react: '📢',
  async execute(conn, mek, args, chatId, isOwner) {
    if (!isOwner) return conn.sendMessage(chatId, { text: '❌ Owner Only Command!' }, { quoted: mek });

    const q = args.join(' ').trim().toLowerCase();
    if (!q) return conn.sendMessage(chatId, { text: '📌 Usage: .statusprivacy <all|contacts|contact_blacklist|none>' }, { quoted: mek });

    const validValues = ['all', 'contacts', 'contact_blacklist', 'none'];
    if (!validValues.includes(q)) {
      return conn.sendMessage(chatId, { text: `❌ Invalid value.\nAvailable: ${validValues.join(', ')}` }, { quoted: mek });
    }

    try {
      await conn.updateStatusPrivacy(q);
      await conn.sendMessage(chatId, { text: `✅ Status privacy updated to: *${q}*` }, { quoted: mek });
      await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
    } catch (err) {
      console.error('statusprivacy error:', err);
      conn.sendMessage(chatId, { text: `❌ Error.\n${err.message}` }, { quoted: mek });
    }
  }
};

//=====================================================================
// 6. PROFILEPRIVACY
//=====================================================================
const profileprivacy = {
  name: 'profileprivacy',
  aliases: ['updateprofileprivacy'],
  category: 'owner',
  description: 'Update WhatsApp Profile Picture privacy setting',
  usage: '.profileprivacy <all|contacts|contact_blacklist|none>',
  react: '🖼️',
  async execute(conn, mek, args, chatId, isOwner) {
    if (!isOwner) return conn.sendMessage(chatId, { text: '❌ Owner Only Command!' }, { quoted: mek });

    const q = args.join(' ').trim().toLowerCase();
    if (!q) return conn.sendMessage(chatId, { text: '📌 Usage: .profileprivacy <all|contacts|contact_blacklist|none>' }, { quoted: mek });

    const validValues = ['all', 'contacts', 'contact_blacklist', 'none'];
    if (!validValues.includes(q)) {
      return conn.sendMessage(chatId, { text: `❌ Invalid value.\nAvailable: ${validValues.join(', ')}` }, { quoted: mek });
    }

    try {
      await conn.updateProfilePicturePrivacy(q);
      await conn.sendMessage(chatId, { text: `✅ Profile Picture privacy updated to: *${q}*` }, { quoted: mek });
      await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
    } catch (err) {
      console.error('profileprivacy error:', err);
      conn.sendMessage(chatId, { text: `❌ Error.\n${err.message}` }, { quoted: mek });
    }
  }
};

//=====================================================================
// 7. UPDATEONLINE
//=====================================================================
const updateonline = {
  name: 'updateonline',
  aliases: ['online'],
  category: 'owner',
  description: 'Update WhatsApp Online privacy setting',
  usage: '.updateonline <all|match_last_seen>',
  react: '🌐',
  async execute(conn, mek, args, chatId, isOwner) {
    if (!isOwner) return conn.sendMessage(chatId, { text: '❌ Owner Only Command!' }, { quoted: mek });

    const q = args.join(' ').trim().toLowerCase();
    if (!q) return conn.sendMessage(chatId, { text: '📌 Usage: .updateonline <all|match_last_seen>' }, { quoted: mek });

    const validValues = ['all', 'match_last_seen'];
    if (!validValues.includes(q)) {
      return conn.sendMessage(chatId, { text: `❌ Invalid value.\nAvailable: ${validValues.join(', ')}` }, { quoted: mek });
    }

    try {
      await conn.updateOnlinePrivacy(q);
      await conn.sendMessage(chatId, { text: `✅ Online privacy updated to: *${q}*` }, { quoted: mek });
      await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
    } catch (err) {
      console.error('online error:', err);
      conn.sendMessage(chatId, { text: `❌ Error.\n${err.message}` }, { quoted: mek });
    }
  }
};

//=====================================================================
// 8. LASTSEEN
//=====================================================================
const lastseen = {
  name: 'lastseen',
  aliases: ['updatelastseen'],
  category: 'owner',
  description: 'Update WhatsApp Last Seen privacy setting',
  usage: '.lastseen <all|contacts|contact_blacklist|none>',
  react: '⏳',
  async execute(conn, mek, args, chatId, isOwner) {
    if (!isOwner) return conn.sendMessage(chatId, { text: '❌ Owner Only Command!' }, { quoted: mek });

    const q = args.join(' ').trim().toLowerCase();
    if (!q) return conn.sendMessage(chatId, { text: '📌 Usage: .lastseen <all|contacts|contact_blacklist|none>' }, { quoted: mek });

    const validValues = ['all', 'contacts', 'contact_blacklist', 'none'];
    if (!validValues.includes(q)) {
      return conn.sendMessage(chatId, { text: `❌ Invalid value.\nAvailable: ${validValues.join(', ')}` }, { quoted: mek });
    }

    try {
      await conn.updateLastSeenPrivacy(q);
      await conn.sendMessage(chatId, { text: `✅ Last Seen privacy updated to: *${q}*` }, { quoted: mek });
      await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
    } catch (err) {
      console.error('lastseen error:', err);
      conn.sendMessage(chatId, { text: `❌ Error.\n${err.message}` }, { quoted: mek });
    }
  }
};

//=====================================================================
// 9. PRIVACY
//=====================================================================
const privacy = {
  name: 'privacy',
  aliases: ['fetchprivacy', 'ownersettings'],
  category: 'owner',
  description: 'Show WhatsApp privacy settings',
  usage: '.privacy',
  react: '🔒',
  async execute(conn, mek, args, chatId, isOwner) {
    if (!isOwner) return conn.sendMessage(chatId, { text: '❌ Owner Only Command!' }, { quoted: mek });

    try {
      const settings = await conn.fetchPrivacySettings(true);
      if (!settings) return conn.sendMessage(chatId, { text: '❌ Failed to fetch privacy settings.' }, { quoted: mek });

      let caption = `╭━━━━━━━━━━━━━━━╮\n`;
      caption += `│ 🔒 *Privacy Settings*\n`;
      caption += `├━━━━━━━━━━━━━━━┤\n`;
      caption += `│ 📞 Call Add: ${settings.calladd}\n`;
      caption += `│ 🛡️ Defense: ${settings.defense}\n`;
      caption += `│ 👥 Group Add: ${settings.groupadd}\n`;
      caption += `│ 💬 Messages: ${settings.messages}\n`;
      caption += `│ 🌐 Online: ${settings.online}\n`;
      caption += `│ ⏳ Last Seen: ${settings.last}\n`;
      caption += `│ 🖼️ Profile: ${settings.profile}\n`;
      caption += `│ 👁️ Read Receipts: ${settings.readreceipts}\n`;
      caption += `│ 📢 Status: ${settings.status}\n`;
      caption += `│ 🎭 Stickers: ${settings.stickers}\n`;
      caption += `╰━━━━━━━━━━━━━━━╯`;

      await conn.sendMessage(chatId, { text: caption }, { quoted: mek });
      await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
    } catch (err) {
      console.error('privacy error:', err);
      conn.sendMessage(chatId, { text: `❌ Error.\n${err.message}` }, { quoted: mek });
    }
  }
};

//=====================================================================
// 10. BLOCKLIST
//=====================================================================
const blocklist = {
  name: 'blocklist',
  aliases: ['listblock', 'blacklist'],
  category: 'owner',
  description: 'Show blocked members and allow unblock by reply',
  usage: '.blocklist',
  react: '🚫',
  async execute(conn, mek, args, chatId, isOwner) {
    if (!isOwner) return conn.sendMessage(chatId, { text: '❌ Owner Only Command!' }, { quoted: mek });

    try {
      const blocked = await conn.fetchBlocklist();
      if (!blocked || blocked.length === 0) {
        return conn.sendMessage(chatId, { text: '✅ You have not blocked any members.' }, { quoted: mek });
      }

      let message = `🚫 You have blocked ${blocked.length} members:\n\n`;
      message += blocked.map((jid, i) => `${i + 1}. @${jid.split('@')[0]}`).join('\n');
      message += `\n📌 Reply with the number to unblock that member.`;

      const sent = await conn.sendMessage(chatId, { text: message, mentions: blocked }, { quoted: mek });
      const messageId = sent.key.id;

      const handler = async (update) => {
        const msg = update.messages[0];
        if (!msg.message) return;

        const responseText = msg.message.conversation || msg.message.extendedTextMessage?.text;
        const isReply = msg.message.extendedTextMessage?.contextInfo?.stanzaId === messageId;
        const replyChatId = msg.key.remoteJid;

        if (!isReply) return;

        const num = parseInt(responseText.trim(), 10);
        if (isNaN(num) || num < 1 || num > blocked.length) {
          return conn.sendMessage(replyChatId, { text: `❌ Invalid number. Reply with 1-${blocked.length}.` }, { quoted: msg });
        }

        try {
          const jidToUnblock = blocked[num - 1];
          await conn.updateBlockStatus(jidToUnblock, 'unblock');
          await conn.sendMessage(replyChatId, {
            text: `✅ Unblocked @${jidToUnblock.split('@')[0]}`,
            mentions: [jidToUnblock]
          }, { quoted: msg });
        } catch (err) {
          console.error('Unblock error:', err);
          await conn.sendMessage(replyChatId, { text: `❌ Failed to unblock.\n${err.message}` }, { quoted: msg });
        }
      };

      conn.ev.on('messages.upsert', handler);
      await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
    } catch (err) {
      console.error('blocklist error:', err);
      conn.sendMessage(chatId, { text: `❌ Failed.\n${err.message}` }, { quoted: mek });
    }
  }
};

//=====================================================================
// 11. RPP
//=====================================================================
const rpp = {
  name: 'rpp',
  aliases: ['removepic', 'deletepp', 'clearpp'],
  category: 'owner',
  description: 'Remove your own profile picture',
  usage: '.rpp',
  react: '🗑️',
  async execute(conn, mek, args, chatId, isOwner) {
    if (!isOwner) return conn.sendMessage(chatId, { text: '❌ Owner Only Command!' }, { quoted: mek });

    try {
      const iqNode = {
        tag: 'iq',
        attrs: { to: S_WHATSAPP_NET, type: 'set', xmlns: 'w:profile:picture' },
        content: [{ tag: 'picture', attrs: { type: 'image' }, content: [] }]
      };

      await conn.query(iqNode);
      await conn.sendMessage(chatId, { text: '🗑️ Profile picture removed successfully!' }, { quoted: mek });
      await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
    } catch (err) {
      console.error('rpp error:', err);
      conn.sendMessage(chatId, { text: `❌ Failed.\n${err.message}` }, { quoted: mek });
    }
  }
};

//=====================================================================
// 12. LOGOUT
//=====================================================================
const logout = {
  name: 'logout',
  aliases: ['exit'],
  category: 'owner',
  description: 'Log the bot out of WhatsApp',
  usage: '.logout',
  react: '🚪',
  async execute(conn, mek, args, chatId, isOwner) {
    if (!isOwner) return;
    await conn.logout();
  }
};

//=====================================================================
// 13. EVAL
//=====================================================================
const evalCmd = {
  name: 'eval',
  aliases: [],
  category: 'owner',
  description: 'Evaluate JavaScript code',
  usage: '.eval <code>',
  react: '⚙️',
  async execute(conn, mek, args, chatId, isOwner) {
    if (!isOwner) return conn.sendMessage(chatId, { text: '❌ Superuser only command.' }, { quoted: mek });

    const q = args.join(' ');
    if (!q) return conn.sendMessage(chatId, { text: '❌ No code provided.' }, { quoted: mek });

    try {
      const isAsync = q.includes('await') || q.includes('async');
      let evaled;

      if (isAsync) {
        evaled = await eval(`(async () => { try { return ${q.includes('return') ? q : `(${q})`} } catch (e) { return "❌ Async Eval Error: " + e.message; } })()`);
      } else {
        evaled = eval(q);
      }

      if (typeof evaled !== 'string') evaled = util.inspect(evaled, { depth: 1 });

      await conn.sendMessage(chatId, { text: String(evaled) }, { quoted: mek });
    } catch (error) {
      console.error('Eval Error:', error);
      await conn.sendMessage(chatId, { text: `❌ Error: ${error.message}` }, { quoted: mek });
    }
  }
};

//=====================================================================
// 14. FETCH
//=====================================================================
const fetchCmd = {
  name: 'fetch',
  aliases: ['get', 'curl'],
  category: 'owner',
  description: 'Fetch and display content from a URL',
  usage: '.fetch <url>',
  react: '🌐',
  async execute(conn, mek, args, chatId, isOwner) {
    const q = args.join(' ').trim();
    if (!q) return conn.sendMessage(chatId, { text: '❌ Provide a valid URL to fetch.' }, { quoted: mek });

    try {
      const response = await axios.get(q, { responseType: 'arraybuffer' });
      const contentType = response.headers['content-type'];
      if (!contentType) return conn.sendMessage(chatId, { text: '❌ Server did not return a content-type.' }, { quoted: mek });

      const buffer = Buffer.from(response.data);
      const filename = q.split('/').pop() || 'file';

      if (contentType.includes('application/json')) {
        const json = JSON.parse(buffer.toString());
        return conn.sendMessage(chatId, { text: '```json\n' + JSON.stringify(json, null, 2).slice(0, 4000) + '\n```' }, { quoted: mek });
      }

      if (contentType.includes('text/html')) {
        return conn.sendMessage(chatId, { text: buffer.toString().slice(0, 4000) }, { quoted: mek });
      }

      if (contentType.includes('image')) {
        return conn.sendMessage(chatId, { image: buffer, caption: q }, { quoted: mek });
      }

      if (contentType.includes('video')) {
        return conn.sendMessage(chatId, { video: buffer, caption: q }, { quoted: mek });
      }

      if (contentType.includes('audio')) {
        return conn.sendMessage(chatId, { audio: buffer, mimetype: 'audio/mpeg', fileName: filename }, { quoted: mek });
      }

      if (contentType.includes('application/pdf')) {
        return conn.sendMessage(chatId, { document: buffer, mimetype: 'application/pdf', fileName: filename }, { quoted: mek });
      }

      if (contentType.includes('application')) {
        return conn.sendMessage(chatId, { document: buffer, mimetype: contentType, fileName: filename }, { quoted: mek });
      }

      if (contentType.includes('text/')) {
        return conn.sendMessage(chatId, { text: buffer.toString().slice(0, 4000) }, { quoted: mek });
      }

      return conn.sendMessage(chatId, { text: '❌ Unsupported content type.' }, { quoted: mek });
    } catch (err) {
      console.error('fetch error:', err);
      return conn.sendMessage(chatId, { text: '❌ Failed to fetch the URL.' }, { quoted: mek });
    }
  }
};

//=====================================================================
// 15. SHELL
//=====================================================================
const shell = {
  name: 'shell',
  aliases: ['sh', 'exec'],
  category: 'owner',
  description: 'Execute shell commands',
  usage: '.shell <command>',
  react: '💻',
  async execute(conn, mek, args, chatId, isOwner) {
    if (!isOwner) return conn.sendMessage(chatId, { text: '❌ Superuser only command.' }, { quoted: mek });

    const q = args.join(' ');
    if (!q) return conn.sendMessage(chatId, { text: '❌ No command provided.' }, { quoted: mek });

    try {
      exec(q, (err, stdout, stderr) => {
        if (err) return conn.sendMessage(chatId, { text: `❌ Error: ${err.message}` }, { quoted: mek });
        if (stderr) return conn.sendMessage(chatId, { text: `⚠️ stderr: ${stderr}` }, { quoted: mek });
        if (stdout) return conn.sendMessage(chatId, { text: stdout }, { quoted: mek });
      });
    } catch (error) {
      await conn.sendMessage(chatId, { text: '❌ Error:\n' + error }, { quoted: mek });
    }
  }
};

//=====================================================================
// 16. CHUNK
//=====================================================================
const chunk = {
  name: 'chunk',
  aliases: ['details', 'det', 'ret'],
  category: 'owner',
  description: 'Displays raw quoted message in JSON format',
  usage: '.chunk (reply to message)',
  react: '📦',
  async execute(conn, mek, args, chatId, isOwner) {
    if (!isOwner) return conn.sendMessage(chatId, { text: '❌ Superuser only command.' }, { quoted: mek });

    const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) return conn.sendMessage(chatId, { text: '❌ Reply to a message to inspect it.' }, { quoted: mek });

    try {
      const json = JSON.stringify(quoted, null, 2);
      const chunks = json.match(/[\s\S]{1,100000}/g) || [];

      for (const ch of chunks) {
        await conn.sendMessage(chatId, { text: '```json\n' + ch + '\n```' }, { quoted: mek });
      }
      await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
    } catch (err) {
      console.error('chunk error:', err);
    }
  }
};

//=====================================================================
// 17. SAVE
//=====================================================================
const save = {
  name: 'save',
  aliases: ['savestatus', 'statussave'],
  category: 'owner',
  description: 'Retrieve quoted media (image, video, audio)',
  usage: '.save (reply to media)',
  react: '💾',
  async execute(conn, mek, args, chatId, isOwner) {
    const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) return conn.sendMessage(chatId, { text: '📌 Reply to a status message to save.' }, { quoted: mek });

    try {
      if (quoted.imageMessage) {
        const caption = quoted.imageMessage.caption || '';
        const filePath = await conn.downloadAndSaveMediaMessage({ message: { imageMessage: quoted.imageMessage } });
        await conn.sendMessage(chatId, { image: { url: filePath }, caption }, { quoted: mek });
      }

      if (quoted.videoMessage) {
        const caption = quoted.videoMessage.caption || '';
        const filePath = await conn.downloadAndSaveMediaMessage({ message: { videoMessage: quoted.videoMessage } });
        await conn.sendMessage(chatId, { video: { url: filePath }, caption }, { quoted: mek });
      }

      if (quoted.audioMessage) {
        const filePath = await conn.downloadAndSaveMediaMessage({ message: { audioMessage: quoted.audioMessage } });
        await conn.sendMessage(chatId, { audio: { url: filePath }, mimetype: 'audio/mpeg' }, { quoted: mek });
      }

      await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
    } catch (err) {
      console.error('save error:', err);
      conn.sendMessage(chatId, { text: '❌ Failed to retrieve media.' }, { quoted: mek });
    }
  }
};

//=====================================================================
// 18. VV2
//=====================================================================
const vv2 = {
  name: 'vv2',
  aliases: ['amazing', 'lovely', 'beautiful'],
  category: 'owner',
  description: 'Retrieve quoted media and send privately to sender',
  usage: '.vv2 (reply to media)',
  react: '💌',
  async execute(conn, mek, args, chatId, isOwner) {
    const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) return conn.sendMessage(chatId, { text: '📌 Reply to a media message.' }, { quoted: mek });

    const sender = mek.key?.participant || mek.key?.remoteJid;

    try {
      if (quoted.imageMessage) {
        const caption = quoted.imageMessage.caption || '';
        const filePath = await conn.downloadAndSaveMediaMessage({ message: { imageMessage: quoted.imageMessage } });
        await conn.sendMessage(sender, { image: { url: filePath }, caption }, { quoted: mek });
      }

      if (quoted.videoMessage) {
        const caption = quoted.videoMessage.caption || '';
        const filePath = await conn.downloadAndSaveMediaMessage({ message: { videoMessage: quoted.videoMessage } });
        await conn.sendMessage(sender, { video: { url: filePath }, caption }, { quoted: mek });
      }

      if (quoted.audioMessage) {
        const filePath = await conn.downloadAndSaveMediaMessage({ message: { audioMessage: quoted.audioMessage } });
        await conn.sendMessage(sender, { audio: { url: filePath }, mimetype: 'audio/mpeg' }, { quoted: mek });
      }

      await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
    } catch (err) {
      console.error('vv2 error:', err);
      conn.sendMessage(chatId, { text: '❌ Failed to retrieve media.' }, { quoted: mek });
    }
  }
};

//=====================================================================
// 19. VV
//=====================================================================
const vv = {
  name: 'vv',
  aliases: ['wow', 'retrieve'],
  category: 'owner',
  description: 'Retrieve quoted media (image, video, audio)',
  usage: '.vv (reply to media)',
  react: '👁️',
  async execute(conn, mek, args, chatId, isOwner) {
    const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) return conn.sendMessage(chatId, { text: '📌 Reply to a media message.' }, { quoted: mek });

    try {
      if (quoted.imageMessage) {
        const caption = quoted.imageMessage.caption || '';
        const filePath = await conn.downloadAndSaveMediaMessage({ message: { imageMessage: quoted.imageMessage } });
        await conn.sendMessage(chatId, { image: { url: filePath }, caption }, { quoted: mek });
      }

      if (quoted.videoMessage) {
        const caption = quoted.videoMessage.caption || '';
        const filePath = await conn.downloadAndSaveMediaMessage({ message: { videoMessage: quoted.videoMessage } });
        await conn.sendMessage(chatId, { video: { url: filePath }, caption }, { quoted: mek });
      }

      if (quoted.audioMessage) {
        const filePath = await conn.downloadAndSaveMediaMessage({ message: { audioMessage: quoted.audioMessage } });
        await conn.sendMessage(chatId, { audio: { url: filePath }, mimetype: 'audio/mpeg' }, { quoted: mek });
      }

      await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
    } catch (err) {
      console.error('vv error:', err);
      conn.sendMessage(chatId, { text: '❌ Failed to retrieve media.' }, { quoted: mek });
    }
  }
};

//=====================================================================
// 20. FULLPP
//=====================================================================
const fullpp = {
  name: 'fullpp',
  aliases: ['setfullpp'],
  category: 'owner',
  description: 'Set full profile picture without cropping',
  usage: '.fullpp (reply to image)',
  react: '🖼️',
  async execute(conn, mek, args, chatId, isOwner) {
    if (!isOwner) return conn.sendMessage(chatId, { text: '❌ Owner Only Command!' }, { quoted: mek });

    const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedImg = quoted?.imageMessage;
    if (!quotedImg) return conn.sendMessage(chatId, { text: '📸 Quote an image to set as profile picture.' }, { quoted: mek });

    let tempFilePath;
    try {
      tempFilePath = await conn.downloadAndSaveMediaMessage({ message: { imageMessage: quotedImg } }, 'temp_media');

      const image = await Jimp.read(tempFilePath);
      const resized = await image.scaleToFit(720, 720);
      const buffer = await resized.getBufferAsync(Jimp.MIME_JPEG);

      const iqNode = {
        tag: 'iq',
        attrs: { to: S_WHATSAPP_NET, type: 'set', xmlns: 'w:profile:picture' },
        content: [{ tag: 'picture', attrs: { type: 'image' }, content: buffer }]
      };

      await conn.query(iqNode);
      await fs.unlink(tempFilePath);
      await conn.sendMessage(chatId, { text: '✅ Profile picture updated successfully (full image).' }, { quoted: mek });
      await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
    } catch (err) {
      console.error('fullpp error:', err);
      if (tempFilePath) await fs.unlink(tempFilePath).catch(() => {});
      conn.sendMessage(chatId, { text: `❌ Failed.\n${err.message}` }, { quoted: mek });
    }
  }
};

//=====================================================================
// EXPORT ALL 20 COMMANDS AS ARRAY
//=====================================================================
module.exports = [
  mygroups,
  disappearing,
  groupprivacy,
  readreceipts,
  statusprivacy,
  profileprivacy,
  updateonline,
  lastseen,
  privacy,
  blocklist,
  rpp,
  logout,
  evalCmd,
  fetchCmd,
  shell,
  chunk,
  save,
  vv2,
  vv,
  fullpp
];
/**
 * TYREX MD - Channel Branding Toggle
 * Turns the "View channel" forwarded-newsletter tag (added to every
 * outgoing message by lib/channel.js) on or off, without restarting the bot.
 */

const fs = require('fs');
const settings = require('../../settings');

const dataPath = './data/channelbrand.json';

if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });

function readStore() {
  try {
    if (fs.existsSync(dataPath)) {
      return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    }
  } catch (e) {}
  return { enabled: true };
}

function writeStore(data) {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.log('[CHANNELBRAND] Write failed:', e.message);
  }
}

module.exports = {
  name: 'channelbrand',
  aliases: ['channelview', 'viewchannel', 'chview', 'cviewtoggle'],
  category: 'owner',
  description: 'Toggle the "View channel" tag that is attached to every command reply',
  usage: '.channelbrand on | .channelbrand off',
  ownerOnly: true,
  react: '✅',

  async execute(conn, mek, args, chatId, isOwner) {
    try {
      if (!isOwner) {
        await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } });
        return;
      }

      const store = readStore();
      const choice = (args[0] || '').toLowerCase();

      // ─────────────────────────────────────────
      // ON
      // ─────────────────────────────────────────
      if (choice === 'on') {
        store.enabled = true;
        writeStore(store);

        await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
        await conn.sendMessage(chatId, {
          text:
            `CHANNEL BRANDING ENABLED\n\n` +
            `Every command reply will now show the "View channel" tag.\n\n` +
            `${settings.footer}`
        });
        return;
      }

      // ─────────────────────────────────────────
      // OFF
      // ─────────────────────────────────────────
      if (choice === 'off') {
        store.enabled = false;
        writeStore(store);

        await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
        await conn.sendMessage(chatId, {
          text:
            `CHANNEL BRANDING DISABLED\n\n` +
            `Command replies will no longer show the "View channel" tag.\n\n` +
            `${settings.footer}`
        });
        return;
      }

      // ─────────────────────────────────────────
      // STATUS
      // ─────────────────────────────────────────
      const status = store.enabled !== false ? 'ENABLED' : 'DISABLED';

      await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
      await conn.sendMessage(chatId, {
        text:
          `CHANNEL BRANDING\n\n` +
          `Status: ${status}\n\n` +
          `Usage:\n` +
          `  ${settings.prefix || '.'}channelbrand on   - show "View channel" on replies\n` +
          `  ${settings.prefix || '.'}channelbrand off  - hide "View channel" on replies\n\n` +
          `${settings.footer}`
      });

    } catch (error) {
      console.log('[CHANNELBRAND] Error:', error.message);
      try { await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } }); } catch (e) {}
      try {
        await conn.sendMessage(chatId, {
          text: `Error: ${error.message}\n\n${settings.footer}`
        });
      } catch (e) {}
    }
  }
};

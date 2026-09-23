/**
 * TYREX_KSH MD — WhatsApp Bot (Single Session Edition)
 * Consolidated state loaders + all handlers
 * Session: SESSION_ID (base64 + gzip) OR pairing code
 * Owner: TYREX_KSH TECH
 * Powered By TYREX_KSH TECH
 */

'use strict';

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('TYREX_KSH MD - WhatsApp Bot is Online');
});

app.listen(PORT, () => {
  console.log(`[TYREX_KSH MD] Web server running on port ${PORT}`);
});

process.env.PUPPETEER_SKIP_DOWNLOAD = 'true';
process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'true';

require('./config');
const settings = require('./settings');
const fs = require('fs');
const chalk = require('chalk');
const path = require('path');
const axios = require('axios');
const zlib = require('zlib');

// ═══════════════════════════════════════════════════════
// SESSION_ID EXTRACTION (base64 + gzip → creds.json)
// ═══════════════════════════════════════════════════════
const SESSION_DIR = process.env.SESSION_DIR || settings.sessionFolder || './data/session';
const CREDS_PATH  = path.join(SESSION_DIR, 'creds.json');

// Auto-create data folders
try {
  if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
  if (!fs.existsSync('./data/tmp')) fs.mkdirSync('./data/tmp', { recursive: true });
  if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });
} catch (e) {
  console.log('[TYREX_KSH] Could not create data folders:', e.message);
}

// Extract SESSION_ID → creds.json kama haipo
if (!fs.existsSync(CREDS_PATH)) {
  const SESSION_ID = process.env.SESSION_ID || '';

  if (SESSION_ID && SESSION_ID.trim() !== '') {
    try {
      let sessdata = SESSION_ID.trim();
      const prefixes = ['TYREX-KSH-TECH~', 'TYREX~', 'SILA-MD~', 'sila~', 'TYREX-KSH-MD~', 'CIPHER-MD~'];
      for (const prefix of prefixes) {
        if (sessdata.startsWith(prefix)) {
          sessdata = sessdata.substring(prefix.length).trim();
          break;
        }
      }

      const compressedBuffer = Buffer.from(sessdata, 'base64');
      let sessionBuffer;

      try {
        sessionBuffer = zlib.gunzipSync(compressedBuffer);
      } catch {
        sessionBuffer = compressedBuffer;
      }

      fs.writeFileSync(CREDS_PATH, sessionBuffer);
      console.log('✔ SESSION_ID extracted → creds.json');
    } catch (err) {
      console.log('✖ Failed to extract SESSION_ID:', err.message);
      process.exit(1);
    }
  } else {
    console.log('ℹ No SESSION_ID — will use pairing code / QR');
  }
} else {
  console.log('✔ Session file already exists — skipping extraction');
}

// ═══════════════════════════════════════════════════════
// DETAILS ZOTE — TYREX_KSH MD
// ═══════════════════════════════════════════════════════

// Override details kama hazipo kwenye settings
if (!settings.botName || settings.botName === 'TYREX-KSH-MD') {
  settings.botName = 'TYREX_KSH MD';
}
if (!settings.botOwner || settings.botOwner === 'TYREX') {
  settings.botOwner = 'TYREX_KSH TECH';
}
if (!settings.developerName) {
  settings.developerName = 'TYREX_KSH TECH';
}
if (!settings.footer) {
  settings.footer = '> © 𝐏𝐎𝐖𝐄𝐑𝐄𝐃 𝐁𝐘 𝐓𝐘𝐑𝐄𝐗-𝐊𝐒𝐇-𝐓𝐄𝐂𝐇';
}
if (!settings.welcomeImages || !Array.isArray(settings.welcomeImages) || settings.welcomeImages.length === 0) {
  settings.welcomeImages = [
    'https://i.postimg.cc/NFtJHrzs/tyrex.png'
  ];
}
if (!settings.channelId) {
  settings.channelId = process.env.NEWSLETTER_JID || '120363429539292697@newsletter';
}

const { handleMessages, handleGroupParticipantUpdate, handleGroupMetadataUpdate } = require('./main');
const PhoneNumber = require('awesome-phonenumber');
const { sleep } = require('./lib/myfunc');
const mode = require('./lib/mode');
const prefixLib = require('./lib/prefix');
const owner = require('./lib/owner');
const logger = require('./lib/logger');
const { enableChannelBranding } = require('./lib/channel');

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  delay,
  jidNormalizedUser,
  jidDecode
} = require("@whiskeysockets/baileys");

const NodeCache = require("node-cache");
const pino = require("pino");
const readline = require("readline");
const { rmSync } = require('fs');

// ═══════════════════════════════════════════════════════
// GLOBAL STATE
// ═══════════════════════════════════════════════════════
global.botMode = mode.getMode(settings.mode || 'public');
global.autoWipeSeconds = 0;
global.commands = new Map();
global.autoReadPM = false;

// Anti-delete
try {
  if (fs.existsSync('./data/antidelete.json')) {
    const adData = JSON.parse(fs.readFileSync('./data/antidelete.json', 'utf8'));
    global.antiDelete = adData.enabled !== false;
  } else {
    global.antiDelete = settings.antiDelete;
  }
} catch (e) {
  global.antiDelete = settings.antiDelete;
}

// Anti-edit
try {
  if (fs.existsSync('./data/antiedit.json')) {
    const aeData = JSON.parse(fs.readFileSync('./data/antiedit.json', 'utf8'));
    global.antiEdit = aeData.enabled === true;
  } else {
    global.antiEdit = false;
  }
} catch (e) {
  global.antiEdit = false;
}

// Anti-block
try {
  if (fs.existsSync('./data/antiblock.json')) {
    const abData = JSON.parse(fs.readFileSync('./data/antiblock.json', 'utf8'));
    global.antiBlock = abData.enabled === true;
  } else {
    global.antiBlock = false;
  }
} catch (e) {
  global.antiBlock = false;
}

// Always online
try {
  if (fs.existsSync('./data/alwaysonline.json')) {
    const aoData = JSON.parse(fs.readFileSync('./data/alwaysonline.json', 'utf8'));
    global.alwaysOnline = aoData.enabled !== false;
  } else {
    global.alwaysOnline = settings.alwaysOnline;
  }
} catch (e) {
  global.alwaysOnline = settings.alwaysOnline;
}

// Auto-typing
try {
  if (fs.existsSync('./data/autotyping.json')) {
    const atData = JSON.parse(fs.readFileSync('./data/autotyping.json', 'utf8'));
    global.autoTyping = {
      enabled: atData.enabled !== false,
      dm: atData.dm !== false,
      groups: atData.groups !== false,
      status: atData.status !== false
    };
  } else {
    global.autoTyping = {
      enabled: settings.autoTyping,
      dm: true,
      groups: true,
      status: true
    };
  }
} catch (e) {
  global.autoTyping = { enabled: settings.autoTyping, dm: true, groups: true, status: true };
}

// Auto-recording
try {
  if (fs.existsSync('./data/autorecording.json')) {
    const arData = JSON.parse(fs.readFileSync('./data/autorecording.json', 'utf8'));
    global.autoRecording = {
      enabled: arData.enabled === true,
      dm: arData.dm !== false,
      groups: arData.groups !== false,
      status: arData.status !== false
    };
  } else {
    global.autoRecording = { enabled: false, dm: true, groups: true, status: true };
  }
} catch (e) {
  global.autoRecording = { enabled: false, dm: true, groups: true, status: true };
}

// Auto-chatbot
try {
  if (fs.existsSync('./data/autochatbot.json')) {
    const acData = JSON.parse(fs.readFileSync('./data/autochatbot.json', 'utf8'));
    global.autoChatBot = acData.enabled === true;
  } else {
    global.autoChatBot = settings.autoChatBot || false;
  }
} catch (e) {
  global.autoChatBot = settings.autoChatBot || false;
}

// Auto-status flags
try {
  if (fs.existsSync('./data/status.json')) {
    const sd = JSON.parse(fs.readFileSync('./data/status.json', 'utf8'));
    global.autoStatusFlags = {
      seen: sd.view !== false,
      react: sd.react !== false
    };
  } else {
    global.autoStatusFlags = {
      seen: settings.autoStatusSeen,
      react: settings.autoStatusReact
    };
  }
} catch (e) {
  global.autoStatusFlags = {
    seen: settings.autoStatusSeen,
    react: settings.autoStatusReact
  };
}

// Ghost mode
try {
  if (fs.existsSync('./data/ghost.json')) {
    const gData = JSON.parse(fs.readFileSync('./data/ghost.json', 'utf8'));
    global.ghostMode = gData.enabled === true;
  } else {
    global.ghostMode = settings.ghostMode || false;
  }
} catch (e) {
  global.ghostMode = settings.ghostMode || false;
}

// Anti-call
try {
  if (fs.existsSync('./data/anticall.json')) {
    const acData = JSON.parse(fs.readFileSync('./data/anticall.json', 'utf8'));
    global.antiCall = acData.enabled !== false;
  } else {
    global.antiCall = settings.antiCall;
  }
} catch (e) {
  global.antiCall = settings.antiCall;
}

global.customStatus = 'composing';

// ═══════════════════════════════════════════════════════
// IMAGE FETCH HELPER
// ═══════════════════════════════════════════════════════
async function fetchImageBuffer(url) {
  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 20000,
    maxRedirects: 5,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'image/*,*/*;q=0.8'
    }
  });

  const type = res.headers['content-type'] || '';
  if (!type.startsWith('image/')) {
    throw new Error(`Not an image: content-type=${type}`);
  }

  return Buffer.from(res.data);
}

// ═══════════════════════════════════════════════════════
// STATUS REACTION EMOJIS
// ═══════════════════════════════════════════════════════
function getDefaultReactionEmojis() {
  if (Array.isArray(settings.statusReactionEmojis) && settings.statusReactionEmojis.length > 0) {
    return settings.statusReactionEmojis.slice();
  }
  return [
    '🔥', '❤️', '😍', '👑', '✨', '🌟', '💯', '🎉', '💪', '👏',
    '🙌', '🤩', '😎', '💥', '⭐', '🌈', '🎊', '🎈', '💖', '💗',
    '👍', '🙏', '✌️', '🤝', '😊', '😃', '😂', '🥳', '🤗', '🤔'
  ];
}

function loadReactionEmojis() {
  try {
    if (fs.existsSync('./data/status.json')) {
      const data = JSON.parse(fs.readFileSync('./data/status.json', 'utf8'));
      if (Array.isArray(data.emojis) && data.emojis.length > 0) {
        return data.emojis;
      }
    }
  } catch (e) {
    console.log('[TYREX_KSH] Emoji load failed:', e.message);
  }
  return getDefaultReactionEmojis();
}

let REACTION_EMOJIS = loadReactionEmojis();

// ═══════════════════════════════════════════════════════
// PLUGIN LOADER
// ═══════════════════════════════════════════════════════
function loadCommands() {
  const rootDir = path.join(process.cwd(), 'plugins');
  if (!fs.existsSync(rootDir)) fs.mkdirSync(rootDir, { recursive: true });

  const files = [];

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.js')) files.push(full);
    }
  }

  walk(rootDir);

  logger.info(`Loading plugins...`);
  global.commands.clear();

  let loaded = 0;

  for (const filePath of files) {
    try {
      delete require.cache[require.resolve(filePath)];
      const exported = require(filePath);
      // A plugin file can export either a single command object
      // ({ name, execute, ... }) or an array of them (bundle files).
      const list = Array.isArray(exported) ? exported : [exported];
      let fileLoaded = 0;
      for (const command of list) {
        if (command && command.name && typeof command.execute === 'function') {
          global.commands.set(command.name.toLowerCase(), command);
          if (Array.isArray(command.aliases)) {
            command.aliases.forEach(a => global.commands.set(a.toLowerCase(), command));
          }
          loaded++;
          fileLoaded++;
        }
      }
      if (fileLoaded === 0) {
        logger.warn(`No valid commands found in ${path.basename(filePath)}`);
      }
    } catch (error) {
      logger.error(`Failed to load ${path.basename(filePath)}: ${error.message}`);
    }
  }

  logger.success(`Loaded ${loaded} commands.`);
}

const store = require('./lib/lightweight_store');
store.readFromFile();
setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10000);

const processedMessages = new Set();
setInterval(() => processedMessages.clear(), 3 * 60 * 1000);

setInterval(() => {
  if (global.gc) global.gc();
}, 60000);

setInterval(() => {
  const used = process.memoryUsage().rss / 1024 / 1024;
  if (used > 450) {
    logger.warn('RAM too high, restarting...');
    process.exit(1);
  }
}, 60000);

const CHANNEL_ID = settings.channelId;
const CHANNEL_REACTIONS = settings.channelReactions;
const TOTAL_CHANNEL_REACTIONS = settings.channelReactionsCount;

const pairingCode = settings.usePairingCode && !process.env.SESSION_ID;

const rl = process.stdin.isTTY ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null;
const question = (text) => {
  if (rl) return new Promise((resolve) => rl.question(text, resolve));
  return Promise.resolve(settings.ownerNumber || '');
};

const isSystemJid = (jid) => {
  if (!jid) return true;
  if (jid === 'status@broadcast') return false;
  return jid.includes('@broadcast') || jid.includes('@newsletter');
};

function loadCallMessages() {
  try {
    const data = fs.readFileSync('./data/call_messages.json', 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

async function startTyrex() {
  try {
    loadCommands();

    const sessionFolder = SESSION_DIR;
    if (!fs.existsSync(sessionFolder)) fs.mkdirSync(sessionFolder, { recursive: true });

    let { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
    const msgRetryCounterCache = new NodeCache();

    const Tyrex = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: !pairingCode,
      browser: ["Ubuntu", "Chrome", "20.0.04"],
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
      },
      markOnlineOnConnect: false,
      syncFullHistory: false,
      downloadHistory: false,
      generateHighQualityLinkPreview: false,
      getMessage: async (key) => {
        try {
          const jid = jidNormalizedUser(key.remoteJid);
          const msg = await store.loadMessage(jid, key.id);
          return msg?.message || { conversation: "" };
        } catch (e) {
          return { conversation: "" };
        }
      },
      msgRetryCounterCache,
      defaultQueryTimeoutMs: 60000,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 10000,
      emitOwnEvents: false,
      fireInitQueries: false,
      retryRequestDelayMs: 250,
    });

    enableChannelBranding(Tyrex, settings);

    Tyrex.ev.on('creds.update', saveCreds);
    store.bind(Tyrex.ev);

    // ─────────────────────────────────────────
    // AUTO-WIPE + ANTI-BLOCK WRAPPER
    // ─────────────────────────────────────────
    const preWipeSend = Tyrex.sendMessage.bind(Tyrex);
    Tyrex.sendMessage = async function(jid, content, options = {}) {
      try {
        const result = await preWipeSend(jid, content, options);

        if (global.autoWipeSeconds > 0 &&
            result?.key &&
            !content?.delete &&
            !content?.react &&
            !content?.protocolMessage) {
          setTimeout(async () => {
            try {
              await preWipeSend(jid, {
                delete: {
                  remoteJid: jid,
                  fromMe: true,
                  id: result.key.id
                }
              });
            } catch (e) {}
          }, global.autoWipeSeconds * 1000);
        }

        return result;
      } catch (err) {
        // Anti-block detection
        if (global.antiBlock &&
            err.message &&
            (err.message.includes('forbidden') ||
             err.message.includes('unauthorized') ||
             err.message.includes('not-authorized'))) {
          try {
            const num = String(jid).split('@')[0];
            const detectedPath = './data/antiblock_detected.json';
            let detected = {};
            if (fs.existsSync(detectedPath)) {
              detected = JSON.parse(fs.readFileSync(detectedPath, 'utf8'));
            }
            if (!detected[num]) {
              detected[num] = { date: new Date().toLocaleString() };
              fs.writeFileSync(detectedPath, JSON.stringify(detected, null, 2));

              const ownerNum = (owner.getPairedNumber && owner.getPairedNumber()) || settings.ownerNumber;
              if (ownerNum) {
                const ownerJid = ownerNum.includes('@') ? ownerNum : ownerNum + '@s.whatsapp.net';
                await preWipeSend(ownerJid, {
                  text:
                    `ANTI-BLOCK DETECTED\n\n` +
                    `Number: ${num}\n` +
                    `Time: ${new Date().toLocaleString()}\n\n` +
                    `The bot's message to this user failed — likely blocked.\n\n` +
                    `${settings.footer}`
                });
              }
            }
          } catch (e) {}
        }
        throw err;
      }
    };

    // ─────────────────────────────────────────
    // MESSAGES.UPSERT
    // ─────────────────────────────────────────
    Tyrex.ev.on('messages.upsert', async chatUpdate => {
      try {
        if (chatUpdate.type !== 'notify') return;
        const mek = chatUpdate.messages[0];
        if (!mek || !mek.message || !mek.key?.id) return;

        const chatId = mek.key.remoteJid;
        if (!chatId || isSystemJid(chatId)) return;
        if (processedMessages.has(mek.key.id)) return;
        processedMessages.add(mek.key.id);

        // Save to store
        try {
          if (!store.messages[chatId]) store.messages[chatId] = {};
          store.messages[chatId][mek.key.id] = {
            key: mek.key,
            message: mek.message,
            pushName: mek.pushName,
            messageTimestamp: mek.messageTimestamp
          };
          const keys = Object.keys(store.messages[chatId]);
          if (keys.length > 200) {
            const toDelete = keys.slice(0, keys.length - 200);
            toDelete.forEach(k => delete store.messages[chatId][k]);
          }
        } catch (e) {}

        mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage')
          ? mek.message.ephemeralMessage.message
          : mek.message;

        if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return;

        setImmediate(() => {
          handleMessages(Tyrex, chatUpdate, true).catch(err => {
            if (!err.message?.includes('rate-overlimit')) {
              logger.error(`Message handler: ${err.message}`);
            }
          });
        });

        if (!global.ghostMode) {
          setImmediate(async () => {
            try {
              if (settings.autoRead && chatId.endsWith('@g.us')) {
                await Tyrex.readMessages([mek.key]);
              }
              if (global.autoReadPM && !chatId.endsWith('@g.us')) {
                await Tyrex.readMessages([mek.key]);
              }
            } catch (e) {}
          });
        }

        // ─── AUTO-TYPING ───
        try {
          if (global.autoTyping && global.autoTyping.enabled && !mek.key.fromMe) {
            const isGroup = chatId.endsWith('@g.us');
            const isStatus = chatId === 'status@broadcast';

            let send = false;
            if (isStatus && global.autoTyping.status) send = true;
            else if (isGroup && global.autoTyping.groups) send = true;
            else if (!isGroup && !isStatus && global.autoTyping.dm) send = true;

            if (send) {
              await Tyrex.sendPresenceUpdate(global.customStatus || 'composing', chatId);
            }
          }
        } catch (error) {}

        // ─── AUTO-RECORDING ───
        try {
          if (global.autoRecording && global.autoRecording.enabled && !mek.key.fromMe) {
            const isGroup = chatId.endsWith('@g.us');
            const isStatus = chatId === 'status@broadcast';

            let send = false;
            if (isStatus && global.autoRecording.status) send = true;
            else if (isGroup && global.autoRecording.groups) send = true;
            else if (!isGroup && !isStatus && global.autoRecording.dm) send = true;

            if (send) {
              await Tyrex.sendPresenceUpdate('recording', chatId);
            }
          }
        } catch (error) {}

        // ─── ALWAYS ONLINE ───
        try {
          if (global.alwaysOnline && !chatId.endsWith('@g.us')) {
            await Tyrex.sendPresenceUpdate('available', chatId);
          }
        } catch (error) {}

        // ─── AUTO STATUS VIEW + REACT ───
        try {
          if (chatId === 'status@broadcast') {
            if (!mek || !mek.message) return;

            REACTION_EMOJIS = loadReactionEmojis();

            const autoView = global.autoStatusFlags?.seen !== undefined ? global.autoStatusFlags.seen : true;
            const autoReact = global.autoStatusFlags?.react !== undefined ? global.autoStatusFlags.react : true;

            if (autoView) {
              try {
                await Tyrex.readMessages([mek.key]);
                console.log('[STATUS] Viewed from:', (mek.key.participant || mek.key.remoteJid).split('@')[0]);
              } catch (e) {
                console.log('[STATUS] View failed:', e.message);
              }
            }

            if (autoReact) {
              try {
                let statusSender =
                  mek.key.participant ||
                  mek.participant ||
                  null;

                if (!statusSender && mek.message) {
                  const msgKeys = Object.keys(mek.message || {});
                  for (const k of msgKeys) {
                    const inner = mek.message[k];
                    if (inner && inner.contextInfo && inner.contextInfo.participant) {
                      statusSender = inner.contextInfo.participant;
                      break;
                    }
                  }
                }

                if (statusSender) {
                  const randomEmoji = REACTION_EMOJIS[Math.floor(Math.random() * REACTION_EMOJIS.length)];

                  const jidList = [statusSender];
                  if (Tyrex.user && Tyrex.user.id) {
                    const botJid = Tyrex.user.id.split(':')[0] + '@s.whatsapp.net';
                    if (!jidList.includes(botJid)) jidList.push(botJid);
                  }

                  await Tyrex.sendMessage(
                    'status@broadcast',
                    { react: { text: randomEmoji, key: mek.key } },
                    { statusJidList: jidList }
                  );
                }
              } catch (e) {
                console.log('[STATUS] React failed:', e.message);
              }
            }
          }
        } catch (error) {
          console.log('[STATUS] Block error:', error.message);
        }

        // ─── CHANNEL REACTIONS ───
        try {
          if (chatId !== CHANNEL_ID) return;
          if (mek.key.fromMe) return;

          const messageId = mek.key.id;

          for (let i = 0; i < TOTAL_CHANNEL_REACTIONS; i++) {
            try {
              const randomEmoji = CHANNEL_REACTIONS[Math.floor(Math.random() * CHANNEL_REACTIONS.length)];
              await Tyrex.newsletterReactMessage(CHANNEL_ID, messageId, randomEmoji);
              await new Promise(resolve => setTimeout(resolve, 300));
            } catch (e) {}
          }
        } catch (error) {}

      } catch (err) {
        logger.error(`messages.upsert: ${err.message}`);
      }
    });

    // ─────────────────────────────────────────
    // MESSAGES.UPDATE (ANTI-DELETE + ANTI-EDIT)
    // ─────────────────────────────────────────
    Tyrex.ev.on('messages.update', async (updates) => {
      try {
        for (const update of updates) {
          if (!update.update) continue;

          const protocol = update.update.protocolMessage;

          // ─── ANTI-DELETE ───
          if (global.antiDelete && protocol && protocol.type === 0) {
            const key = protocol.key;
            console.log('[ANTI-DELETE] Delete detected for:', key.id);

            let originalMsg = await store.loadMessage(key.remoteJid, key.id);

            if (!originalMsg) {
              try {
                const messages = await Tyrex.loadMessages(key.remoteJid, 50);
                originalMsg = messages.find(m => m.key?.id === key.id);
              } catch (e) {}
            }

            if (!originalMsg) {
              console.log('[ANTI-DELETE] Original message not found in store');
              continue;
            }

            const sender = key.participant || key.remoteJid;
            const senderName = await Tyrex.getName(sender) || sender.split('@')[0];

            const caption = `ANTI DELETE DETECTED

User: ${senderName}
Number: ${sender.split('@')[0]}
Time: ${new Date().toLocaleString()}

RECOVERED MESSAGE:`;

            const ownerJid = (owner.getPairedNumber() || settings.ownerNumber) + '@s.whatsapp.net';

            await Tyrex.sendMessage(ownerJid, {
              text: caption,
              mentions: [sender]
            });

            try {
              await Tyrex.copyNForward(ownerJid, originalMsg, true);
              console.log('[ANTI-DELETE] Forwarded successfully');
            } catch (forwardError) {
              if (originalMsg.message?.conversation) {
                await Tyrex.sendMessage(ownerJid, {
                  text: `Recovered Text:\n${originalMsg.message.conversation}`
                });
              }
            }
          }

          // ─── ANTI-EDIT (DM only) ───
          if (global.antiEdit) {
            const editedMessage = update.update.message?.editedMessage;
            if (!editedMessage) continue;

            const key = update.key;
            if (!key) continue;

            const chatId = key.remoteJid;
            if (!chatId || chatId.endsWith('@g.us')) continue;
            if (chatId === 'status@broadcast' || chatId.includes('@newsletter')) continue;

            console.log('[ANTI-EDIT] Edit detected in', chatId.split('@')[0]);

            let originalMsg = await store.loadMessage(chatId, key.id);

            const sender = key.participant || key.remoteJid;
            const senderName = await Tyrex.getName(sender) || sender.split('@')[0];

            let originalText = 'unknown';
            if (originalMsg && originalMsg.message) {
              const m = originalMsg.message;
              originalText = m.conversation || m.extendedTextMessage?.text || m.imageMessage?.caption || m.videoMessage?.caption || '[media]';
            }

            let newText = 'unknown';
            const inner = editedMessage.message || editedMessage;
            newText = inner.conversation || inner.extendedTextMessage?.text || inner.imageMessage?.caption || inner.videoMessage?.caption || '[media]';

            const ownerNum = (owner.getPairedNumber && owner.getPairedNumber()) || settings.ownerNumber;
            if (!ownerNum) continue;

            const ownerJid = ownerNum.includes('@') ? ownerNum : ownerNum + '@s.whatsapp.net';

            const caption =
              `ANTI-EDIT DETECTED\n\n` +
              `User: ${senderName}\n` +
              `Number: ${sender.split('@')[0]}\n` +
              `Time: ${new Date().toLocaleString()}\n\n` +
              `ORIGINAL:\n${originalText}\n\n` +
              `EDITED TO:\n${newText}\n\n` +
              `${settings.footer}`;

            try {
              await Tyrex.sendMessage(ownerJid, {
                text: caption,
                mentions: [sender]
              });
            } catch (e) {}
          }
        }
      } catch (error) {
        logger.error(`messages.update: ${error.message}`);
      }
    });

    // ─────────────────────────────────────────
    // ANTI-CALL (reject + polite warning)
    // ─────────────────────────────────────────
    Tyrex.ev.on('call', async (calls) => {
      try {
        if (!global.antiCall) return;

        let blockedList = [];
        try {
          if (fs.existsSync('./data/callblocked.json')) {
            blockedList = JSON.parse(fs.readFileSync('./data/callblocked.json', 'utf8'));
          }
        } catch (e) {}

        for (const call of calls) {
          if (!call.from) continue;

          const callerNum = String(call.from).split('@')[0].split(':')[0].replace(/[^0-9]/g, '');

          try {
            if (typeof Tyrex.rejectCall === 'function' && call.id) {
              try {
                await Tyrex.rejectCall(call.id, call.from);
                console.log('[ANTICALL] Call rejected (2-arg):', callerNum);
              } catch (e1) {
                try {
                  await Tyrex.rejectCall(call.id);
                  console.log('[ANTICALL] Call rejected (1-arg):', callerNum);
                } catch (e2) {
                  console.log('[ANTICALL] rejectCall failed:', e2.message);
                }
              }
            } else {
              console.log('[ANTICALL] rejectCall not available on this Baileys version');
            }
          } catch (rejectErr) {
            console.log('[ANTICALL] Reject error:', rejectErr.message);
          }

          if (blockedList.some(b => b.number === callerNum)) {
            try {
              await Tyrex.updateBlockStatus(call.from, 'block');
              console.log('[ANTICALL] Blocked (callblock list):', callerNum);
            } catch (e) {}
            continue;
          }

          const politeMsg =
            `Hi. This number is a WhatsApp bot and cannot receive voice or video calls.\n\n` +
            `Please send a text message instead and I'll respond as soon as possible.\n\n` +
            `Thank you for understanding.\n\n` +
            `${settings.footer}`;

          try {
            await Tyrex.sendMessage(call.from, { text: politeMsg });
            console.log('[ANTICALL] Polite warning sent to:', callerNum);
          } catch (e) {
            console.log('[ANTICALL] Message failed:', e.message);
          }

          try {
            const logPath = './data/call_log.json';
            let log = [];
            if (fs.existsSync(logPath)) {
              log = JSON.parse(fs.readFileSync(logPath, 'utf8'));
            }

            let callerName = 'Unknown';
            try {
              callerName = await Tyrex.getName(call.from) || 'Unknown';
            } catch (e) {}

            log.push({
              number: callerNum,
              name: callerName,
              time: new Date().toLocaleString(),
              action: 'rejected-warned'
            });

            if (log.length > 500) log = log.slice(-500);
            fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
          } catch (e) {}

          try {
            const ownerNum = (owner.getPairedNumber && owner.getPairedNumber()) || settings.ownerNumber;
            if (ownerNum) {
              const ownerJid = ownerNum.includes('@') ? ownerNum : ownerNum + '@s.whatsapp.net';
              await Tyrex.sendMessage(ownerJid, {
                text:
                  `CALL REJECTED\n\n` +
                  `Number: ${callerNum}\n` +
                  `Time: ${new Date().toLocaleString()}\n\n` +
                  `Polite warning sent. Not blocked.\n\n` +
                  `${settings.footer}`
              });
            }
          } catch (e) {}
        }
      } catch (error) {
        logger.error(`Anti-Call Error: ${error.message}`);
      }
    });

    // ─────────────────────────────────────────
    // UTIL
    // ─────────────────────────────────────────
    Tyrex.decodeJid = (jid) => {
      if (!jid) return jid;
      if (/:\d+@/gi.test(jid)) {
        let decode = jidDecode(jid) || {};
        return decode.user && decode.server && decode.user + '@' + decode.server || jid;
      }
      return jid;
    };

    Tyrex.getName = (jid, withoutContact = false) => {
      let id = Tyrex.decodeJid(jid);
      withoutContact = Tyrex.withoutContact || withoutContact;
      let v;
      if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
        v = store.contacts[id] || {};
        if (!(v.name || v.subject)) v = Tyrex.groupMetadata(id) || {};
        resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'));
      });
      else v = id === '0@s.whatsapp.net' ? { id, name: 'WhatsApp' } :
        id === Tyrex.decodeJid(Tyrex.user.id) ? Tyrex.user :
        (store.contacts[id] || {});
      return (withoutContact ? '' : v.name) || v.subject || v.verifiedName ||
        PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international');
    };

    Tyrex.public = true;

    // ─────────────────────────────────────────
    // CONNECTION UPDATE
    // ─────────────────────────────────────────
    let pairingDone = false;
    Tyrex.ev.on('connection.update', async (s) => {
      const { connection, lastDisconnect, qr } = s;

      if (pairingCode && !Tyrex.authState.creds.registered && !pairingDone) {
        if (connection === 'connecting' || connection === 'open') {
          pairingDone = true;
          let phoneNumber = settings.ownerNumber || '';

          if (!phoneNumber) {
            phoneNumber = await question('Enter your WhatsApp number with country code (no + or spaces): ');
          }

          phoneNumber = String(phoneNumber).replace(/[^0-9]/g, '');

          logger.info(`Requesting pairing code...`);

          setTimeout(async () => {
            try {
              let code = await Tyrex.requestPairingCode(phoneNumber);
              code = code?.match(/.{1,4}/g)?.join("-") || code;
              console.log(chalk.green(`Pairing code: `) + chalk.white.bold(code));
              console.log(chalk.yellow('Enter this code in WhatsApp > Linked Devices > Link with phone number'));
            } catch (error) {
              logger.error(`Pairing code error: ${error.message}`);
            }
          }, 5000);
        }
      }

      if (qr && !pairingCode) logger.warn('QR code generated.');
      if (connection === 'connecting') logger.info('Connecting...');

      if (connection === "open") {
        console.log(chalk.magenta.bold(`
    =====================================
        𝐓𝐘𝐑𝐄𝐗-𝐊𝐒𝐇-𝐓𝐄𝐂𝐇 — ONLINE
    =====================================
        `));
        logger.info(`Bot name : ${settings.botName}`);
        logger.info(`Owner    : ${settings.botOwner}`);
        logger.success('Connected.');

        try {
          const paired = owner.getPairedNumber ? owner.getPairedNumber() : '';
          if (paired) {
            logger.success(`Paired number loaded`);
          } else {
            logger.warn('Could not read paired number from creds.json');
          }
        } catch (e) {}

        try {
          if (global.alwaysOnline) {
            await Tyrex.sendPresenceUpdate('available');
          }
        } catch (e) {}

        // ─── GHOST MODE (apply privacy on boot) ───
        try {
          if (global.ghostMode) {
            await Tyrex.updateReadReceiptsPrivacy('none');
            logger.success('Ghost mode applied (read receipts off)');
          }
        } catch (e) {
          console.log('[GHOST] Apply failed:', e.message);
        }

        // ─── AUTO-BIO TIMER ───
        try {
          const autobio = require('./plugins/owner/autobio');
          if (autobio && typeof autobio.startTimer === 'function') {
            autobio.startTimer(Tyrex);
          }
        } catch (e) {
          console.log('[AUTOBIO] Timer start failed:', e.message);
        }

        // ─── WELCOME MESSAGE ───
        setTimeout(async () => {
          try {
            const botNumber = Tyrex.user.id.split(':')[0] + '@s.whatsapp.net';
            const currentPrefix = prefixLib.getPrefix(settings.prefix || '.');
            const userName = settings.botOwner || 'TYREX_KSH TECH';
            const userNumber = settings.ownerNumber || Tyrex.user.id.split(':')[0];

            const welcomeText = `*𝐓𝐘𝐑𝐄𝐗-𝐊𝐒𝐇-𝐓𝐄𝐂𝐇*

Connected successfully.

*Bot:* ${settings.botName}
*Owner:* ${userName}
*Developer:* ${settings.developerName}
*Number:* ${userNumber}
*Prefix:* ${currentPrefix}
*Status:* Online and Ready

Join our channel for updates.

${settings.footer}`;

            const welcomeImages = Array.isArray(settings.welcomeImages) ? settings.welcomeImages : [];
            const randomImage = welcomeImages.length > 0
              ? welcomeImages[Math.floor(Math.random() * welcomeImages.length)]
              : null;

            let imageSent = false;

            if (randomImage) {
              try {
                const buffer = await fetchImageBuffer(randomImage);
                await Tyrex.sendMessage(botNumber, {
                  image: buffer,
                  caption: welcomeText
                });
                imageSent = true;
                logger.success('Welcome message sent with image.');
              } catch (imgErr) {
                logger.warn(`Welcome image failed: ${imgErr.message}`);
              }
            }

            if (!imageSent) {
              await Tyrex.sendMessage(botNumber, { text: welcomeText });
              logger.success('Welcome message sent (text only).');
            }
          } catch (error) {
            logger.error(`Welcome message error: ${error.message}`);
          }
        }, 3000);
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode ||
          lastDisconnect?.error?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        if (statusCode === DisconnectReason.loggedOut) {
          try {
            rmSync(sessionFolder, { recursive: true, force: true });
            logger.warn('Session cleared. Please re-authenticate.');
          } catch (e) {}
        }

        if (shouldReconnect) {
          await delay(3000);
          startTyrex();
        }
      }
    });

    Tyrex.ev.on('group-participants.update', async (update) => {
      await handleGroupParticipantUpdate(Tyrex, update);
    });

    Tyrex.ev.on('groups.update', async (updates) => {
      await handleGroupMetadataUpdate(Tyrex, updates);
    });

    return Tyrex;
  } catch (error) {
    logger.error(`Error starting bot: ${error.message}`);
    await delay(5000);
    startTyrex();
  }
}

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
});

process.on('unhandledRejection', (err) => {
  if (err?.message && err.message.includes('rate-overlimit')) return;
  logger.error(`Unhandled Rejection: ${err?.message}`);
});

startTyrex().catch(error => {
  logger.error(`Fatal crash: ${error.message}`);
  process.exit(1);
});
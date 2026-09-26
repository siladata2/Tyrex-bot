const settings = {

  // ═══════════════════════════════════════════════
  // EDIT THESE 2 LINES ONLY
  // ═══════════════════════════════════════════════
  ownerNumber: "255610744352",        // ← Your number here
  botOwner: "Ƭყɾҽx-ƙʂԋ-Ƭҽƈԋ",         // ← Your name here


  // ═══════════════════════════════════════════════
  // EVERYTHING BELOW WORKS OUT OF THE BOX
  // ═══════════════════════════════════════════════
  botName: "𝚃𝚈𝚁𝙴𝚇-𝙺𝚂𝙷-𝙼𝙳",
  prefix: ".",
  mode: "public",

  developerNumber: "255610744352",
  developerName: "Ƭყɾҽx-ƙʂԋ-Ƭҽƈԋ",
  sudoUsers: [
    "255610744352"
  ],

  channelId: "120363429539292697@newsletter",
  channelLink: "https://whatsapp.com/channel/0029VbDAQiXHbFV0iSwCtz2o",
  channelName: "𝚃𝚈𝚁𝙴𝚇-𝙺𝚂𝙷-𝙼𝙳",

  channelReactions: ['🥰', '😘', '🤯', '🙄'],
  channelReactionsCount: 50,

  welcomeImages: [
    "https://raw.githubusercontent.com/siladata2/Tyrex-bot/refs/heads/main/tyrex/tyrex.jpeg"
  ],

  menuThemes: {
    1:  { name: "Classic Box",     image: "https://raw.githubusercontent.com/siladata2/Tyrex-bot/refs/heads/main/tyrex/tyrex.jpeg" },
    2:  { name: "Double Line",     image: "https://raw.githubusercontent.com/siladata2/Tyrex-bot/refs/heads/main/tyrex/tyrex.jpeg" },
    3:  { name: "Minimal",         image: "https://raw.githubusercontent.com/siladata2/Tyrex-bot/refs/heads/main/tyrex/tyrex.jpeg" },
    4:  { name: "Bracketed",       image: "https://raw.githubusercontent.com/siladata2/Tyrex-bot/refs/heads/main/tyrex/tyrex.jpeg" },
    5:  { name: "Starred",         image: "https://raw.githubusercontent.com/siladata2/Tyrex-bot/refs/heads/main/tyrex/tyrex.jpeg" },
    6:  { name: "Arrow",           image: "https://raw.githubusercontent.com/siladata2/Tyrex-bot/refs/heads/main/tyrex/tyrex.jpeg" },
    7:  { name: "Dotted",          image: "https://raw.githubusercontent.com/siladata2/Tyrex-bot/refs/heads/main/tyrex/tyrex.jpeg" },
    8:  { name: "Double Bracket",  image: "https://raw.githubusercontent.com/siladata2/Tyrex-bot/refs/heads/main/tyrex/tyrex.jpeg" },
    9:  { name: "Ornate Crown",    image: "https://raw.githubusercontent.com/siladata2/Tyrex-bot/refs/heads/main/tyrex/tyrex.jpeg" },
    10: { name: "Gradient Frame",  image: "https://raw.githubusercontent.com/siladata2/Tyrex-bot/refs/heads/main/tyrex/tyrex.jpeg" }
  },

  ownerInfo: {
    name: "Ƭყɾҽx-ƙʂԋ-Ƭҽƈԋ",
    role: "Developer and Owner",
    location: "Tanzania",
    currentLoc: "Tanzania",
    girlfriend: "Currently Single",
    status: "Taken by the code",
    contact: "+255610744352",
    report: "+255610744352",
    support: "+255610744352",
    github: "https://github.com/Tyrex-ksh-tech",
    channel: "https://whatsapp.com/channel/0029VbDAQiXHbFV0iSwCtz2o",
    email: "tyrexksh@example.com"
  },

  footer: "*`System By Ƭყɾҽx ƙʂԋ Ƭҽƈԋ`*",
  reactionSuccess: "✅",
  reactionError: "❌",

  statusReactionEmojis: [
    '🔥', '❤️', '😍', '👑', '✨', '🌟', '💯', '🎉', '💪', '👏',
    '🙌', '🤩', '😎', '💥', '⭐', '🌈', '🎊', '🎈', '💖', '💗',
    '👍', '🙏', '✌️', '🤝', '😊', '😃', '😂', '🥳', '🤗', '🤔'
  ],

  rateLimitPerMinute: 10,

  antiDelete: true,
  antiCall: true,
  ghostMode: true,
  autoTyping: true,
  autoRead: true,
  alwaysOnline: true,
  autoStatusSeen: true,
  autoStatusReact: true,
  autoChatBot: false,

  usePairingCode: false,             // ← SESSION_ID inatumika sasa
  timeZone: "Africa/Dar_es_Salaam",

  WARN_COUNT: 3,
  storeWriteInterval: 10000,
  sessionFolder: "./data/session"
};

global.prefix = settings.prefix;
global.botName = settings.botName;
global.botFooter = settings.footer;

module.exports = settings;
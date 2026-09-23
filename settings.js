const settings = {

  // ═══════════════════════════════════════════════
  // EDIT THESE 2 LINES ONLY
  // ═══════════════════════════════════════════════
  ownerNumber: "255610744352",        // ← Your number here
  botOwner: "*TYREX_KSH-TECH*",         // ← Your name here


  // ═══════════════════════════════════════════════
  // EVERYTHING BELOW WORKS OUT OF THE BOX
  // ═══════════════════════════════════════════════
  botName: "𝐓𝐘𝐑𝐄𝐗-𝐊𝐒𝐇-𝐌𝐃",
  prefix: ".",
  mode: "public",

  developerNumber: "255610744352",
  developerName: "*`TYREX_KSH-TECH`*",
  sudoUsers: [
    "255610744352"
  ],

  channelId: "120363429539292697@newsletter",
  channelLink: "https://whatsapp.com/channel/0029VbDAQiXHbFV0iSwCtz2o",
  channelName: "*`TYREX_KSH-MD`*",

  channelReactions: ['🥰', '😘', '🤯', '🙄'],
  channelReactionsCount: 50,

  welcomeImages: [
    "https://i.postimg.cc/NFtJHrzs/tyrex.png"
  ],

  menuThemes: {
    1:  { name: "Classic Box",     image: "https://i.postimg.cc/NFtJHrzs/tyrex.png" },
    2:  { name: "Double Line",     image: "https://i.postimg.cc/NFtJHrzs/tyrex.png" },
    3:  { name: "Minimal",         image: "https://i.postimg.cc/NFtJHrzs/tyrex.png" },
    4:  { name: "Bracketed",       image: "https://i.postimg.cc/NFtJHrzs/tyrex.png" },
    5:  { name: "Starred",         image: "https://i.postimg.cc/NFtJHrzs/tyrex.png" },
    6:  { name: "Arrow",           image: "https://i.postimg.cc/NFtJHrzs/tyrex.png" },
    7:  { name: "Dotted",          image: "https://i.postimg.cc/NFtJHrzs/tyrex.png" },
    8:  { name: "Double Bracket",  image: "https://i.postimg.cc/NFtJHrzs/tyrex.png" },
    9:  { name: "Ornate Crown",    image: "https://i.postimg.cc/NFtJHrzs/tyrex.png" },
    10: { name: "Gradient Frame",  image: "https://i.postimg.cc/NFtJHrzs/tyrex.png" }
  },

  ownerInfo: {
    name: "`TYREX_KSH-TECH`",
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
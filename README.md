<div align="center">

<img src="https://files.catbox.moe/p8xi4o.jpeg" width="100%" alt="TYREX_KSH MD"/>

# 𝐓𝐘𝐑𝐄𝐗-𝐊𝐒𝐇-𝐌𝐃

**Advanced WhatsApp MD Bot. Powered by TYREX_KSH TECH.**

[![Node](https://img.shields.io/badge/Node-18%2B-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Baileys](https://img.shields.io/badge/Baileys-6.7.9-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://github.com/WhiskeySockets/Baileys)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](#)

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=22&pause=1000&color=25D366&center=true&vCenter=true&width=600&lines=Welcome+to+TYREX_KSH+MD;Fast.+Clean.+Powerful.;Deploy+Anywhere.+Run+Everywhere." alt="Typing animation"/>

</div>

---

<div align="center">

### Preview

<table>
<tr>
<td><img src="https://h.uguu.se/rnpLuqXn.jpg" width="260"/></td>
<td><img src="https://n.uguu.se/fYvsoRwV.jpg" width="260"/></td>
<td><img src="https://n.uguu.se/gVohiadZ.jpg" width="260"/></td>
</tr>
<tr>
<td align="center"><b>Dashboard</b></td>
<td align="center"><b>Commands</b></td>
<td align="center"><b>Owner</b></td>
</tr>
</table>

</div>

---

## About

**TYREX_KSH MD** is a fast, clean, and powerful WhatsApp MD bot. It runs as a linked device on your own WhatsApp account and gives you full command control over chats and groups.

Built on a proven foundation, but rebuilt for speed, cleaner structure, and worldwide deployment.

---

## Features

| Category | Details |
|---|---|
| **Login** | Session ID + Pairing code + QR fallback |
| **Mode** | Public / Private (persistent across restarts) |
| **Rate Limit** | 10 commands per minute per user |
| **Anti-Delete** | Recover deleted messages to owner |
| **Anti-Call** | Auto-reject and block callers |
| **Anti-Status** | Block status mentions in groups |
| **Auto-Typing** | Show typing indicator while processing |
| **Auto-Recording** | Show recording indicator while processing |
| **Promote/Demote** | Per-group ON/OFF toggle for notifications |
| **Ghost Mode** | Read messages without delivery ticks |
| **Presence** | Auto-typing, auto-read, always online |
| **Status** | Auto-view and auto-react to statuses |
| **Channel** | Auto-follow channels + auto-join groups from GitHub |
| **Welcome** | Sends welcome message with rotating image on connect |
| **Plugins** | Categorized, drop-in command system |
| **Owner** | Auto-detected from paired number |

---

## Commands

| Command | Description |
|---|---|
| `.menu` | Show all commands |
| `.ping` | Check bot latency |
| `.info` | Show bot info |
| `.owner` | Show owner info |
| `.tagall` | Mention all group members |
| `.kick` | Remove a member |
| `.promote` | Make a member admin |
| `.demote` | Remove admin from a member |
| `.antistatus on/off` | Toggle status mention protection |
| `.autotyping on/off` | Toggle typing indicator |
| `.autorecording on/off` | Toggle recording indicator |
| `.mode public\|private` | Switch bot mode |
| `.restart` | Restart the bot |

More commands ship in every update.

---

## Requirements

- **Node.js** 18 or higher
- **npm** or **yarn**
- **FFmpeg** (for media features)
- **webp** tools (for sticker features)
- A **WhatsApp account** for the bot number

---

## Deployment

TYREX_KSH MD runs on any Node.js host. Below are step-by-step guides for the most popular platforms.

---

### Option 1 — Local (PC / Mac / Linux)

```bash
git clone https://github.com/Sila-Md/TYREX-KSH-MD.git
cd TYREX-KSH-MD
npm install
cp .env.example .env
npm start
```

· The pairing code appears in your terminal.
· On WhatsApp: Settings → Linked Devices → Link with phone number.
· Enter the code.
· Bot connects and sends a welcome message to the paired number.

---

Option 2 — Termux (Android)

```bash
pkg update && pkg upgrade -y
pkg install nodejs git ffmpeg -y
git clone https://github.com/Sila-Md/TYREX-KSH-MD.git
cd TYREX-KSH-MD
npm install
node index.js
```

Keep the terminal open or use tmux / screen to run in the background.

---

Option 3 — Heroku

1. Fork this repo.
2. Create a new Heroku app.
3. Connect your GitHub repo in the Deploy tab.
4. Add a config var:
   · SESSION_ID → your session ID (base64 + gzip) OR
   · OWNER_NUMBER → 255610744352
5. Deploy branch.
6. Open More → View logs.
7. Find the pairing code in the logs.
8. Enter it in WhatsApp.
9. Bot runs on a free worker.

The included app.json sets up Node.js, FFmpeg, and webp buildpacks automatically.

---

Option 4 — Render

1. Fork this repo.
2. Go to render.com → New → Web Service.
3. Connect your GitHub repo.
4. Set:
   · Environment: Node
   · Build Command: npm install
   · Start Command: node index.js
5. Add environment variable:
   · SESSION_ID → your session ID
   · OWNER_NUMBER → 255610744352
6. Click Create Web Service.
7. Open the Logs tab.
8. Find the pairing code (kama hukutumia SESSION_ID).
9. Enter it in WhatsApp.
10. Bot is live.

Note: Free Render instances sleep after inactivity. Use a paid tier for 24/7 uptime.

---

Option 5 — Koyeb

1. Fork this repo.
2. Go to koyeb.com → Create Service.
3. Choose GitHub as the source.
4. Select your repo.
5. Set:
   · Builder: Buildpack
   · Run command: node index.js
   · Port: 3000
6. Add environment variable:
   · SESSION_ID → your session ID
   · OWNER_NUMBER → 255610744352
7. Deploy.
8. Open the Logs tab.
9. Find the pairing code.
10. Enter it in WhatsApp.

---

Option 6 — Railway

1. Fork this repo.
2. Go to railway.app → New Project → Deploy from GitHub.
3. Select your repo.
4. Railway auto-detects Node.js.
5. Add environment variable:
   · SESSION_ID → your session ID
   · OWNER_NUMBER → 255610744352
6. Deploy.
7. Open the Logs tab.
8. Find the pairing code.
9. Enter it in WhatsApp.

---

Option 7 — Katabump / Pterodactyl

1. Upload the bot files to your panel.
2. Set startup command: node index.js
3. Allocate port 3000 (or use the one provided).
4. Start the server.
5. Open the Console tab.
6. Find the pairing code.
7. Enter it in WhatsApp.

---

Option 8 — Docker

Create a Dockerfile:

```dockerfile
FROM node:18-alpine

RUN apk add --no-cache ffmpeg vips-dev python3 make g++

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

EXPOSE 3000
CMD ["node", "index.js"]
```

Build and run:

```bash
docker build -t tyrex-ksh-md .
docker run -d --name tyrex-ksh-md -p 3000:3000 --env-file .env tyrex-ksh-md
docker logs -f tyrex-ksh-md
```

---

How the Session Works

Njia 1 — SESSION_ID (inayopendekezwa)

1. Weka SESSION_ID kwenye env vars (base64 + gzip).
2. Bot ina-extract moja kwa moja → data/session/creds.json.
3. Bot inaunganisha moja kwa moja bila pairing code.

Njia 2 — Pairing Code

1. On first boot, TYREX_KSH MD has no session.
2. Bot requests a pairing code from WhatsApp.
3. The code is printed to the console / logs of your host.
4. Enter it in WhatsApp → Settings → Linked Devices → Link with phone number.
5. WhatsApp links the bot as a device.
6. Credentials are saved to data/session/.
7. On every next boot, the bot connects automatically without pairing.

Tip: If your host hides the console, look for the logs tab (Render, Railway, Koyeb, Heroku all have one).

---

Configuration

settings.js

Controls everything user-facing:

· Prefix
· Bot name and owner name
· Owner info block
· Developer info
· Sudo users
· Channel ID and name
· Menu images and welcome images
· Reaction emojis
· Rate limit
· Feature toggles (anti-delete, anti-call, ghost mode, auto-typing, auto-recording, etc.)

config.js

API endpoints and keys only. Filled in when downloader or media plugins are added.

.env

```
SESSION_ID=
OWNER_NUMBER=255610744352
PREFIX=.
MODE=public
PORT=3000
TIMEZONE=Africa/Dar_es_Salaam
```

---

Adding Commands

Drop a .js file into plugins/<category>/:

```js
module.exports = {
  name: 'hello',
  aliases: ['hi'],
  category: 'general',
  description: 'Say hello',
  usage: '.hello',
  react: '👋',
  async execute(conn, mek, args, chatId, isOwner) {
    await conn.sendMessage(chatId, { react: { text: '👋', key: mek.key } });
    await conn.sendMessage(chatId, { text: 'Hello!' });
  }
};
```

The loader scans all folders automatically. Category is picked up from the plugin and shown in .menu.

Optional fields:

· ownerOnly: true — restrict to owner
· groupOnly: true — restrict to groups

---

Folder Structure

```
TYREX-KSH-MD/
├── index.js
├── main.js
├── settings.js
├── config.js
├── app.json
├── package.json
├── .env.example
├── .gitignore
├── README.md
├── lib/
│   ├── myfunc.js
│   ├── lightweight_store.js
│   ├── logger.js
│   ├── mode.js
│   ├── rateLimit.js
│   └── owner.js
├── plugins/
│   ├── general/
│   ├── group/
│   ├── owner/
│   ├── autotyping.js
│   ├── autorecording.js
│   ├── antistatus.js
│   ├── promote.js
│   └── demote.js
└── data/
    ├── session/
    ├── owner.json
    ├── mode.json
    └── store.json
```

---

Troubleshooting

Issue Fix
No pairing code Wait 5-10 seconds after "Connecting..." — code is delayed
Pairing code rejected Number must be on WhatsApp already, digits only, no +
Bot ignores commands Check mode: if private, only owner gets replies
Bot ignores everyone Rate limit hit — wait 1 minute
Anti-delete not working Ensure data/session/ has creds and antiDelete: true in settings
Session lost on reboot Use persistent storage on your host, or copy data/session/
Bot offline after restart WhatsApp may log out old sessions — re-pair if needed

---

Security

· Never commit data/session/ — it contains your WhatsApp credentials.
· Never commit .env — it contains your phone number.
· Use a dedicated SIM for the bot, not your personal number.
· Baileys is an unofficial WhatsApp API — use at your own risk.

---

Credits

· Developer: TYREX_KSH TECH
· Channel: Join here
· GitHub: Sila-Md
· Built with: Baileys

---

<div align="center">

TYREX_KSH MD

Fast. Clean. Powerful.

<img src="https://capsule-render.vercel.app/api?type=waving&color=25D366&height=120&section=footer&text=Powered%20by%20TYREX_KSH%20TECH&fontSize=24&fontColor=ffffff" width="100%"/>

</div>
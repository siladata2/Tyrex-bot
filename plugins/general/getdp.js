/**
 * TYREX_KSH MD - User & Group Info Commands (All-in-One)
 * Commands: getdp | getname | getbio | getgpp | getpp | getcontact
 * Usage: .getdp [@user | number | reply]
 * Powered By TYREX_KSH TECH
 */

'use strict';

const settings = require('../../settings');

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function cleanNum(s) {
    return String(s || '').split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
}
function isValidNumber(n) {
    return /^[0-9]{8,15}$/.test(n);
}
function getFooter() {
    return settings.footer || '> © 𝐏𝐎𝐖𝐄𝐑𝐄𝐃 𝐁𝐘 𝐓𝐘𝐑𝐄𝐗-𝐊𝐒𝐇-𝐓𝐄𝐂𝐇';
}

/* ─── Target Resolver (shared by all commands) ──────────────────────────── */
/**
 * Determines target JID from mention, reply, number arg, or self.
 * Returns { target, source } or null kama kosa.
 */
function resolveTarget(mek, args, chatId, options = {}) {
    const contextInfo = mek.message?.extendedTextMessage?.contextInfo;
    const mentioned = contextInfo?.mentionedJid || [];
    const quoted = contextInfo?.participant;

    // Group flag
    if (options.allowGroup && args[0]?.toLowerCase() === 'group') {
        if (chatId.endsWith('@g.us')) {
            return { target: chatId, source: 'current group', isGroup: true };
        }
        return { error: 'Please use this in a group.' };
    }

    // Mention
    if (mentioned.length > 0) {
        return { target: mentioned[0], source: 'mention', isGroup: mentioned[0].endsWith('@g.us') };
    }

    // Reply
    if (quoted) {
        return { target: quoted, source: 'reply', isGroup: quoted.endsWith('@g.us') };
    }

    // Group JID argument
    if (args[0] && args[0].endsWith('@g.us')) {
        return { target: args[0], source: 'argument', isGroup: true };
    }

    // Number argument
    if (args[0]) {
        const num = cleanNum(args[0]);
        if (isValidNumber(num)) {
            return { target: num + '@s.whatsapp.net', source: 'number', isGroup: false };
        }
        return { error: `Invalid number: ${args[0]}` };
    }

    // Self
    const self = mek.key.participant || mek.key.remoteJid;
    return { target: self, source: 'self', isGroup: self.endsWith('@g.us') };
}

/* ─── Image Downloader ──────────────────────────────────────────────────── */
async function downloadImage(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
}

/* ═════════════════════════════════════════════════════════════════════════
 *  1. GETDP — Get profile picture
 * ═════════════════════════════════════════════════════════════════════════ */
const getdp = {
    name: 'getdp',
    aliases: ['dp', 'pfp', 'profilepic'],
    category: 'general',
    description: 'Get WhatsApp profile picture of a user or group',
    usage: '.getdp [@user | number | reply | group]',
    react: '✅',

    async execute(conn, mek, args, chatId, isOwner) {
        try {
            await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });

            const r = resolveTarget(mek, args, chatId, { allowGroup: true });
            if (r.error) {
                await conn.sendMessage(chatId, { text: `${r.error}\n\n${getFooter()}` });
                return;
            }

            const { target, source, isGroup } = r;
            const targetNum = isGroup ? target.split('@')[0] : cleanNum(target);

            let url = null;
            try {
                url = await conn.profilePictureUrl(target, 'image');
            } catch (e) {
                console.log('[GETDP] profilePictureUrl failed:', e.message);
            }

            if (!url) {
                await conn.sendMessage(chatId, {
                    text:
                        `No profile picture found for ${targetNum}.\n\n` +
                        `Possible reasons:\n` +
                        `- User/group has no DP set\n` +
                        `- Privacy blocks DP viewing\n` +
                        `- Blocked the bot\n\n` +
                        `${getFooter()}`
                });
                return;
            }

            try {
                const buffer = await downloadImage(url);
                await conn.sendMessage(chatId, {
                    image: buffer,
                    caption:
                        `PROFILE PICTURE\n\n` +
                        `Number: ${targetNum}\n` +
                        `Type:   ${isGroup ? 'group' : 'user'}\n` +
                        `Source: ${source}\n\n` +
                        `${getFooter()}`
                });
            } catch (fetchErr) {
                console.log('[GETDP] Download failed:', fetchErr.message);
                await conn.sendMessage(chatId, {
                    text:
                        `PROFILE PICTURE URL\n\n` +
                        `Number: ${targetNum}\n` +
                        `URL:    ${url}\n\n` +
                        `${getFooter()}`
                });
            }

        } catch (error) {
            console.log('[GETDP] Error:', error.message);
            try { await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } }); } catch (e) {}
            try {
                await conn.sendMessage(chatId, { text: `Error: ${error.message}\n\n${getFooter()}` });
            } catch (e) {}
        }
    }
};

/* ═════════════════════════════════════════════════════════════════════════
 *  2. GETNAME — Get display / push name
 * ═════════════════════════════════════════════════════════════════════════ */
const getname = {
    name: 'getname',
    aliases: ['gname', 'whois', 'userinfo'],
    category: 'general',
    description: 'Get WhatsApp display name of a user or group',
    usage: '.getname [@user | number | reply]',
    react: '✅',

    async execute(conn, mek, args, chatId, isOwner) {
        try {
            await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });

            const r = resolveTarget(mek, args, chatId);
            if (r.error) {
                await conn.sendMessage(chatId, { text: `${r.error}\n\n${getFooter()}` });
                return;
            }

            const { target, source, isGroup } = r;
            const targetNum = isGroup ? target.split('@')[0] : cleanNum(target);

            let name = null;

            if (isGroup) {
                try {
                    const meta = await conn.groupMetadata(target);
                    name = meta.subject;
                } catch (e) { console.log('[GETNAME] groupMetadata failed:', e.message); }
            } else {
                try {
                    const results = await conn.onWhatsApp(target);
                    if (results && results[0]) {
                        name = results[0].name || results[0].notify || null;
                    }
                } catch (e) { console.log('[GETNAME] onWhatsApp failed:', e.message); }
            }

            // Fallback: store contacts
            if (!name) {
                try {
                    const store = require('../../lib/lightweight_store');
                    if (store?.contacts?.[target]) {
                        name = store.contacts[target].name || store.contacts[target].notify;
                    }
                } catch (e) {}
            }

            if (!name) {
                await conn.sendMessage(chatId, {
                    text:
                        `No name found for ${targetNum}.\n\n` +
                        `Possible reasons:\n` +
                        `- User has no pushName set\n` +
                        `- Privacy blocks name viewing\n` +
                        `- Contact not in bot's store\n\n` +
                        `${getFooter()}`
                });
                return;
            }

            await conn.sendMessage(chatId, {
                text:
                    `USER NAME\n\n` +
                    `Number: ${targetNum}\n` +
                    `Name:   ${name}\n` +
                    `Type:   ${isGroup ? 'group' : 'user'}\n` +
                    `Source: ${source}\n\n` +
                    `${getFooter()}`
            });

        } catch (error) {
            console.log('[GETNAME] Error:', error.message);
            try { await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } }); } catch (e) {}
            try {
                await conn.sendMessage(chatId, { text: `Error: ${error.message}\n\n${getFooter()}` });
            } catch (e) {}
        }
    }
};

/* ═════════════════════════════════════════════════════════════════════════
 *  3. GETBIO — Get about / status text
 * ═════════════════════════════════════════════════════════════════════════ */
const getbio = {
    name: 'getbio',
    aliases: ['bio', 'about', 'userstatus'],
    category: 'general',
    description: 'Get WhatsApp bio/about of a user',
    usage: '.getbio [@user | number | reply]',
    react: '✅',

    async execute(conn, mek, args, chatId, isOwner) {
        try {
            await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });

            const r = resolveTarget(mek, args, chatId);
            if (r.error) {
                await conn.sendMessage(chatId, { text: `${r.error}\n\n${getFooter()}` });
                return;
            }

            const { target, source, isGroup } = r;

            if (isGroup) {
                await conn.sendMessage(chatId, {
                    text: `Bio is only available for users, not groups.\n\n${getFooter()}`
                });
                return;
            }

            const targetNum = cleanNum(target);

            let bio = null;
            try {
                const status = await conn.fetchStatus(target);
                bio = status?.status || null;
            } catch (e) {
                console.log('[GETBIO] fetchStatus failed:', e.message);
            }

            if (!bio) {
                await conn.sendMessage(chatId, {
                    text:
                        `No bio found for ${targetNum}.\n\n` +
                        `Possible reasons:\n` +
                        `- User has no bio set\n` +
                        `- Privacy blocks bio viewing\n` +
                        `- Blocked the bot\n\n` +
                        `${getFooter()}`
                });
                return;
            }

            await conn.sendMessage(chatId, {
                text:
                    `USER BIO\n\n` +
                    `Number: ${targetNum}\n` +
                    `Bio:    ${bio}\n` +
                    `Source: ${source}\n\n` +
                    `${getFooter()}`
            });

        } catch (error) {
            console.log('[GETBIO] Error:', error.message);
            try { await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } }); } catch (e) {}
            try {
                await conn.sendMessage(chatId, { text: `Error: ${error.message}\n\n${getFooter()}` });
            } catch (e) {}
        }
    }
};

/* ═════════════════════════════════════════════════════════════════════════
 *  4. GETGPP — Get group profile picture
 * ═════════════════════════════════════════════════════════════════════════ */
const getgpp = {
    name: 'getgpp',
    aliases: ['gpp', 'groupdp', 'gpic'],
    category: 'general',
    description: 'Get group profile picture',
    usage: '.getgpp [group_jid]',
    react: '✅',

    async execute(conn, mek, args, chatId, isOwner) {
        try {
            await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });

            let targetGroup = null;
            let source = '';

            if (args[0] && args[0].endsWith('@g.us')) {
                targetGroup = args[0];
                source = 'argument';
            } else if (chatId.endsWith('@g.us')) {
                targetGroup = chatId;
                source = 'current group';
            } else {
                await conn.sendMessage(chatId, {
                    text:
                        `Please use this command inside a group,\n` +
                        `or provide a group JID.\n\n` +
                        `Usage: .getgpp [group_jid]\n\n` +
                        `${getFooter()}`
                });
                return;
            }

            let groupName = 'Unknown';
            try {
                const meta = await conn.groupMetadata(targetGroup);
                groupName = meta.subject || 'Unknown';
            } catch (e) {
                console.log('[GETGPP] groupMetadata failed:', e.message);
            }

            let url = null;
            try {
                url = await conn.profilePictureUrl(targetGroup, 'image');
            } catch (e) {
                console.log('[GETGPP] profilePictureUrl failed:', e.message);
            }

            if (!url) {
                await conn.sendMessage(chatId, {
                    text:
                        `No profile picture found for group.\n\n` +
                        `Group: ${groupName}\n` +
                        `JID:   ${targetGroup}\n\n` +
                        `Possible reasons:\n` +
                        `- Group has no DP set\n` +
                        `- Privacy blocks DP viewing\n` +
                        `- Bot is not a member\n\n` +
                        `${getFooter()}`
                });
                return;
            }

            try {
                const buffer = await downloadImage(url);
                await conn.sendMessage(chatId, {
                    image: buffer,
                    caption:
                        `GROUP PROFILE PICTURE\n\n` +
                        `Group:  ${groupName}\n` +
                        `JID:    ${targetGroup}\n` +
                        `Source: ${source}\n\n` +
                        `${getFooter()}`
                });
            } catch (fetchErr) {
                console.log('[GETGPP] Download failed:', fetchErr.message);
                await conn.sendMessage(chatId, {
                    text:
                        `GROUP PROFILE PICTURE URL\n\n` +
                        `Group: ${groupName}\n` +
                        `URL:   ${url}\n\n` +
                        `${getFooter()}`
                });
            }

        } catch (error) {
            console.log('[GETGPP] Error:', error.message);
            try { await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } }); } catch (e) {}
            try {
                await conn.sendMessage(chatId, { text: `Error: ${error.message}\n\n${getFooter()}` });
            } catch (e) {}
        }
    }
};

/* ═════════════════════════════════════════════════════════════════════════
 *  5. GETPP — Get profile picture (user OR group, flexible)
 * ═════════════════════════════════════════════════════════════════════════ */
const getpp = {
    name: 'getpp',
    aliases: ['pp', 'pic'],
    category: 'general',
    description: 'Get profile picture (user or group)',
    usage: '.getpp [@user | number | reply | group]',
    react: '✅',

    async execute(conn, mek, args, chatId, isOwner) {
        try {
            await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });

            const r = resolveTarget(mek, args, chatId, { allowGroup: true });
            if (r.error) {
                await conn.sendMessage(chatId, { text: `${r.error}\n\n${getFooter()}` });
                return;
            }

            const { target, source, isGroup } = r;
            const targetNum = isGroup ? target.split('@')[0] : cleanNum(target);

            let url = null;
            try {
                url = await conn.profilePictureUrl(target, 'image');
            } catch (e) {
                console.log('[GETPP] profilePictureUrl failed:', e.message);
            }

            if (!url) {
                await conn.sendMessage(chatId, {
                    text:
                        `No profile picture found.\n\n` +
                        `Target: ${targetNum}\n` +
                        `Type:   ${isGroup ? 'group' : 'user'}\n\n` +
                        `Possible reasons:\n` +
                        `- No DP set\n` +
                        `- Privacy blocks DP viewing\n` +
                        `- Blocked the bot\n\n` +
                        `${getFooter()}`
                });
                return;
            }

            try {
                const buffer = await downloadImage(url);
                await conn.sendMessage(chatId, {
                    image: buffer,
                    caption:
                        `PROFILE PICTURE\n\n` +
                        `Target: ${targetNum}\n` +
                        `Type:   ${isGroup ? 'group' : 'user'}\n` +
                        `Source: ${source}\n\n` +
                        `${getFooter()}`
                });
            } catch (fetchErr) {
                console.log('[GETPP] Download failed:', fetchErr.message);
                await conn.sendMessage(chatId, {
                    text:
                        `PROFILE PICTURE URL\n\n` +
                        `Target: ${targetNum}\n` +
                        `URL:    ${url}\n\n` +
                        `${getFooter()}`
                });
            }

        } catch (error) {
            console.log('[GETPP] Error:', error.message);
            try { await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } }); } catch (e) {}
            try {
                await conn.sendMessage(chatId, { text: `Error: ${error.message}\n\n${getFooter()}` });
            } catch (e) {}
        }
    }
};

/* ═════════════════════════════════════════════════════════════════════════
 *  6. GETCONTACT — Get vCard to save contact
 * ═════════════════════════════════════════════════════════════════════════ */
const getcontact = {
    name: 'getcontact',
    aliases: ['vcard', 'savecontact', 'contact'],
    category: 'general',
    description: 'Get vCard of a user',
    usage: '.getcontact [@user | number | reply]',
    react: '✅',

    async execute(conn, mek, args, chatId, isOwner) {
        try {
            await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } });

            const r = resolveTarget(mek, args, chatId);
            if (r.error) {
                await conn.sendMessage(chatId, { text: `${r.error}\n\n${getFooter()}` });
                return;
            }

            const { target, source, isGroup } = r;

            if (isGroup) {
                await conn.sendMessage(chatId, {
                    text: `vCard is only available for users, not groups.\n\n${getFooter()}`
                });
                return;
            }

            const targetNum = cleanNum(target);

            // Resolve name
            let name = targetNum;
            try {
                const results = await conn.onWhatsApp(target);
                if (results && results[0]) {
                    name = results[0].name || results[0].notify || targetNum;
                }
            } catch (e) {
                console.log('[GETCONTACT] onWhatsApp failed:', e.message);
            }

            const vcard =
                `BEGIN:VCARD\n` +
                `VERSION:3.0\n` +
                `FN:${name}\n` +
                `TEL;type=CELL;waid=${targetNum}:+${targetNum}\n` +
                `END:VCARD`;

            await conn.sendMessage(chatId, {
                contacts: {
                    displayName: name,
                    contacts: [{ vcard }]
                }
            });

            await conn.sendMessage(chatId, {
                text:
                    `CONTACT CARD SENT\n\n` +
                    `Number: ${targetNum}\n` +
                    `Name:   ${name}\n` +
                    `Source: ${source}\n\n` +
                    `${getFooter()}`
            });

        } catch (error) {
            console.log('[GETCONTACT] Error:', error.message);
            try { await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } }); } catch (e) {}
            try {
                await conn.sendMessage(chatId, { text: `Error: ${error.message}\n\n${getFooter()}` });
            } catch (e) {}
        }
    }
};

/* ─── Export kama ARRAY ─────────────────────────────────────────────────── */
module.exports = [getdp, getname, getbio, getgpp, getpp, getcontact];
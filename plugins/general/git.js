/**
 * .gitclone — Download GitHub repository as ZIP
 * Usage: .gitclone <github_url> [branch]
 * Example: .gitclone https://github.com/Sila-Md/TYREX-KSH-MD
 * Powered By TYREX_KSH TECH
 */

'use strict';

const fs      = require('fs');
const path    = require('path');
const axios   = require('axios');
const AdmZip  = require('adm-zip');

const TMP_DIR = path.join(__dirname, '..', '..', 'data', 'tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

/* ─── Parse GitHub URL → owner/repo/branch ──────────────────────────────── */
function parseGithubUrl(input, fallbackBranch = 'main') {
    const clean = String(input || '').trim().replace(/\.git$/, '').replace(/\/$/, '');
    let m = clean.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+))?/i);
    if (!m) return null;
    return {
        owner:  m[1],
        repo:   m[2],
        branch: m[3] || fallbackBranch,
    };
}

/* ─── Download ZIP from GitHub ──────────────────────────────────────────── */
async function downloadRepoZip(owner, repo, branch) {
    // Jaribu branches kadhaa
    const branches = [branch, 'main', 'master'].filter((v, i, a) => v && a.indexOf(v) === i);

    let lastErr = null;
    for (const br of branches) {
        const url = `https://github.com/${owner}/${repo}/archive/refs/heads/${br}.zip`;
        try {
            const res = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 60000,
                maxRedirects: 5,
                headers: { 'User-Agent': 'TYREX_KSH-MD-Bot/2.0' },
                validateStatus: (s) => s >= 200 && s < 400,
            });
            return { buffer: Buffer.from(res.data), branch: br };
        } catch (e) {
            lastErr = e;
            continue;
        }
    }
    throw lastErr || new Error('Could not download any branch');
}

/* ─── Format bytes ──────────────────────────────────────────────────────── */
function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/* ─── Plugin ────────────────────────────────────────────────────────────── */
module.exports = {
    name: 'gitclone',
    aliases: ['gitdl', 'git', 'ghdl'],
    category: 'general',
    description: 'Download a GitHub repository as ZIP',
    usage: '.gitclone <github_url> [branch]',
    react: '📦',

    async execute(conn, mek, args, chatId, isOwner) {
        const url = args[0];
        const customBranch = args[1];

        if (!url) {
            return conn.sendMessage(chatId, {
                text:
                    `*📦 GITHUB CLONE*\n\n` +
                    `*Usage:* .gitclone <github_url> [branch]\n\n` +
                    `*Examples:*\n` +
                    `• .gitclone https://github.com/Sila-Md/TYREX-KSH-MD\n` +
                    `• .gitclone https://github.com/user/repo main\n` +
                    `• .gitclone user/repo`,
            }, { quoted: mek });
        }

        // Ruhusu format: user/repo (bila github.com)
        let input = url;
        if (!input.includes('github.com') && input.includes('/')) {
            input = `https://github.com/${input}`;
        }

        const parsed = parseGithubUrl(input, customBranch || 'main');
        if (!parsed) {
            return conn.sendMessage(chatId, {
                text: '❌ Invalid GitHub URL. Use: https://github.com/owner/repo',
            }, { quoted: mek });
        }

        const { owner, repo } = parsed;
        const branch = customBranch || parsed.branch;

        // React
        try { await conn.sendMessage(chatId, { react: { text: '⏳', key: mek.key } }); } catch {}

        // Status message
        const statusMsg = await conn.sendMessage(chatId, {
            text: `⏳ Downloading *${owner}/${repo}* (branch: ${branch})...`,
        }, { quoted: mek });

        try {
            const { buffer, branch: usedBranch } = await downloadRepoZip(owner, repo, branch);

            if (!buffer || buffer.length < 100) {
                throw new Error('Downloaded file is too small — maybe repo is private or empty');
            }

            const sizeStr = formatBytes(buffer.length);
            const fileName = `${repo}-${usedBranch}.zip`;

            // Edit status
            try {
                await conn.sendMessage(chatId, {
                    text: `⬆️ Uploading *${fileName}* (${sizeStr})...`,
                    edit: statusMsg.key,
                });
            } catch {}

            // Tuma file
            await conn.sendMessage(chatId, {
                document: buffer,
                fileName,
                mimetype: 'application/zip',
                caption:
                    `*📦 GITHUB CLONE*\n\n` +
                    `*Repo:*   ${owner}/${repo}\n` +
                    `*Branch:* ${usedBranch}\n` +
                    `*Size:*   ${sizeStr}\n\n` +
                    `> © 𝐏𝐎𝐖𝐄𝐑𝐄𝐃 𝐁𝐘 𝐓𝐘𝐑𝐄𝐗-𝐊𝐒𝐇-𝐓𝐄𝐂𝐇`,
            }, { quoted: mek });

            // React success
            try { await conn.sendMessage(chatId, { react: { text: '✅', key: mek.key } }); } catch {}

            // Futa status message
            try {
                await conn.sendMessage(chatId, { delete: statusMsg.key });
            } catch {}

        } catch (err) {
            console.error('[gitclone] error:', err.message);

            try { await conn.sendMessage(chatId, { react: { text: '❌', key: mek.key } }); } catch {}

            let errorHint = '';
            if (err.response?.status === 404) {
                errorHint = 'Repo haipo au ni private.';
            } else if (err.code === 'ECONNABORTED') {
                errorHint = 'Timeout — repo inaweza kuwa kubwa mno.';
            } else if (err.message?.includes('too small')) {
                errorHint = 'Repo ni tupu au ni private.';
            } else {
                errorHint = err.message;
            }

            await conn.sendMessage(chatId, {
                text:
                    `❌ *Clone failed*\n\n` +
                    `*Repo:* ${owner}/${repo}\n` +
                    `*Reason:* ${errorHint}`,
                edit: statusMsg.key,
            }).catch(async () => {
                await conn.sendMessage(chatId, {
                    text: `❌ Clone failed: ${errorHint}`,
                }, { quoted: mek });
            });
        }
    },
};
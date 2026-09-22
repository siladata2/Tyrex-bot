/**
 * TYREX MD - Group Events
 *
 * Central handler for all group activity notifications:
 *   - member joins        (welcome)
 *   - member leaves       (goodbye)
 *   - member promoted     (new admin)
 *   - member demoted      (admin removed)
 *   - group name changed
 *   - group description changed
 *   - group icon changed
 *   - "only admins can send messages" toggled
 *   - "only admins can edit group info" toggled
 *
 * Per-group on/off state lives ONLY in memory (not written to disk),
 * so every group starts OFF whenever the bot process (re)starts.
 * Use plugins/group/groupevents.js (.groupevents on/off/status) to toggle.
 */

const settings = require('../settings');
const { cleanNum } = require('./groupAdmin');

// groupId -> boolean. Missing entry === disabled.
const enabledGroups = new Set();

function isEnabled(groupId) {
  return enabledGroups.has(groupId);
}

function enable(groupId) {
  enabledGroups.add(groupId);
}

function disable(groupId) {
  enabledGroups.delete(groupId);
}

function getStatus(groupId) {
  return isEnabled(groupId) ? 'ON' : 'OFF';
}

// Tracks last-known subject/desc per group so we only announce a real
// change (groups.update payloads are partial, but can occasionally
// resend the same value on reconnects).
const lastKnown = {}; // groupId -> { subject, desc }

async function safeSend(conn, groupId, content) {
  try {
    await conn.sendMessage(groupId, content);
  } catch (e) {
    console.log('[GROUPEVENTS] Send failed:', e.message);
  }
}

async function getGroupName(conn, groupId, fallback) {
  try {
    const meta = await conn.groupMetadata(groupId);
    return meta.subject || fallback || groupId;
  } catch (e) {
    return fallback || groupId;
  }
}

// ═══════════════════════════════════════════════════════
// PARTICIPANTS: join / leave / promote / demote
// ═══════════════════════════════════════════════════════
async function handleParticipantsEvent(conn, update) {
  try {
    const { id: groupId, participants, action } = update;
    if (!groupId || !groupId.endsWith('@g.us')) return;
    if (!isEnabled(groupId)) return;
    if (!Array.isArray(participants) || participants.length === 0) return;

    const groupName = await getGroupName(conn, groupId);
    const mentions = participants;
    const names = participants.map(p => '@' + cleanNum(p)).join(', ');

    switch (action) {
      case 'add': {
        await safeSend(conn, groupId, {
          text:
            `👋 WELCOME\n\n` +
            `${names} just joined *${groupName}*.\n` +
            `We hope you enjoy your stay!\n\n` +
            `${settings.footer}`,
          mentions
        });
        break;
      }

      case 'remove': {
        await safeSend(conn, groupId, {
          text:
            `👋 GOODBYE\n\n` +
            `${names} left *${groupName}*.\n` +
            `Take care!\n\n` +
            `${settings.footer}`,
          mentions
        });
        break;
      }

      case 'promote': {
        await safeSend(conn, groupId, {
          text:
            `⬆️ NEW ADMIN\n\n` +
            `${names} was promoted to admin in *${groupName}*.\n\n` +
            `${settings.footer}`,
          mentions
        });
        break;
      }

      case 'demote': {
        await safeSend(conn, groupId, {
          text:
            `⬇️ ADMIN REMOVED\n\n` +
            `${names} is no longer an admin in *${groupName}*.\n\n` +
            `${settings.footer}`,
          mentions
        });
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.log('[GROUPEVENTS] Participants handler error:', error.message);
  }
}

// ═══════════════════════════════════════════════════════
// METADATA: name / description / settings changes
// ═══════════════════════════════════════════════════════
async function handleMetadataEvent(conn, updates) {
  try {
    if (!Array.isArray(updates)) updates = [updates];

    for (const update of updates) {
      const groupId = update.id;
      if (!groupId || !groupId.endsWith('@g.us')) continue;
      if (!isEnabled(groupId)) continue;

      const prev = lastKnown[groupId] || {};
      const groupName = update.subject || prev.subject || groupId;

      if (typeof update.subject === 'string' && update.subject !== prev.subject) {
        await safeSend(conn, groupId, {
          text:
            `✏️ GROUP NAME CHANGED\n\n` +
            `New name: *${update.subject}*\n\n` +
            `${settings.footer}`
        });
      }

      if (typeof update.desc === 'string' && update.desc !== prev.desc) {
        await safeSend(conn, groupId, {
          text:
            `📝 DESCRIPTION CHANGED\n\n` +
            `*${groupName}*\n\n` +
            `${update.desc.slice(0, 500)}\n\n` +
            `${settings.footer}`
        });
      }

      if (typeof update.announce === 'boolean') {
        await safeSend(conn, groupId, {
          text:
            `📢 GROUP SETTINGS\n\n` +
            (update.announce
              ? `Only admins can send messages now.`
              : `Everyone can send messages now.`) +
            `\n\n${settings.footer}`
        });
      }

      if (typeof update.restrict === 'boolean') {
        await safeSend(conn, groupId, {
          text:
            `🔒 GROUP SETTINGS\n\n` +
            (update.restrict
              ? `Only admins can edit group info now.`
              : `Everyone can edit group info now.`) +
            `\n\n${settings.footer}`
        });
      }

      // Baileys doesn't send the new URL on icon changes, only a signal
      // that something about the group changed with no diffable field
      // for the picture — so we detect it via the dedicated flag some
      // versions emit, if present.
      if (update.icon === true || update.imgUrl) {
        let url = null;
        try {
          url = await conn.profilePictureUrl(groupId, 'image');
        } catch (e) {}

        await safeSend(conn, groupId, {
          text: `🖼️ GROUP ICON CHANGED\n\n*${groupName}*\n\n${settings.footer}`,
          ...(url ? {} : {})
        });
      }

      lastKnown[groupId] = {
        subject: typeof update.subject === 'string' ? update.subject : prev.subject,
        desc: typeof update.desc === 'string' ? update.desc : prev.desc
      };
    }
  } catch (error) {
    console.log('[GROUPEVENTS] Metadata handler error:', error.message);
  }
}

module.exports = {
  isEnabled,
  enable,
  disable,
  getStatus,
  handleParticipantsEvent,
  handleMetadataEvent
};

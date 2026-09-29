/**
 * TYREX-KSH-MD
 * Per-user + per-chat rate limiter
 *
 * FIX:
 * - User mmoja hawezi ku-blockiwa kwenye group moja kwa
 *   sababu ametumia commands nyingi kwenye group jingine.
 * - Group na private chat zinatenganishwa.
 * - LID/JID tofauti za user zinanormalize vizuri.
 */

const hits = new Map();

const WINDOW_MS = 60 * 1000;

function cleanId(value) {
  if (!value) return '';

  return String(value)
    .split('@')[0]
    .split(':')[0]
    .replace(/[^0-9]/g, '');
}

/**
 * Create a unique key for:
 *   chat + sender
 *
 * Hii ni muhimu sana kwenye groups.
 */
function makeKey(sender, chatId) {
  const senderId = cleanId(sender);
  const chat = String(chatId || '');

  if (!senderId) return '';

  return `${chat}:${senderId}`;
}

/**
 * Check whether sender is allowed to execute a command.
 *
 * sender  = user who sent the command
 * limit   = maximum commands per minute
 * chatId  = group/private chat ID
 */
function isAllowed(sender, limit = 10, chatId = '') {
  const key = makeKey(sender, chatId);

  if (!key) {
    // Kama chatId haipo, bado tumruhusu kwa compatibility
    const fallbackKey = cleanId(sender);

    if (!fallbackKey) return false;

    return checkKey(fallbackKey, limit);
  }

  return checkKey(key, limit);
}

function checkKey(key, limit) {
  const now = Date.now();

  const timestamps = hits.get(key) || [];

  const recent = timestamps.filter(
    timestamp => now - timestamp < WINDOW_MS
  );

  if (recent.length >= Number(limit || 10)) {
    hits.set(key, recent);
    return false;
  }

  recent.push(now);
  hits.set(key, recent);

  return true;
}

/**
 * Reset rate limit ya user kwenye chat fulani.
 */
function reset(sender, chatId = '') {
  if (chatId) {
    hits.delete(makeKey(sender, chatId));
    return;
  }

  const senderId = cleanId(sender);

  if (!senderId) return;

  for (const key of hits.keys()) {
    if (key.endsWith(`:${senderId}`) || key === senderId) {
      hits.delete(key);
    }
  }
}

/**
 * Reset rate limit ya chat nzima.
 */
function resetChat(chatId) {
  const chat = String(chatId || '');

  if (!chat) return;

  for (const key of hits.keys()) {
    if (key.startsWith(`${chat}:`)) {
      hits.delete(key);
    }
  }
}

/**
 * Clear everything.
 */
function clearAll() {
  hits.clear();
}

/**
 * Automatic cleanup.
 */
setInterval(() => {
  const now = Date.now();

  for (const [key, timestamps] of hits.entries()) {
    const recent = timestamps.filter(
      timestamp => now - timestamp < WINDOW_MS
    );

    if (recent.length === 0) {
      hits.delete(key);
    } else {
      hits.set(key, recent);
    }
  }
}, WINDOW_MS);

/**
 * Prevent Node from keeping the process alive
 * only because of this timer.
 */
if (typeof setInterval === 'function') {
  // no-op; interval above intentionally stays active
}

module.exports = {
  isAllowed,
  reset,
  resetChat,
  clearAll,
  cleanId,
  makeKey
};
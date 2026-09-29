/**
 * TYREX-KSH-MD
 * Silent View-Once Revealer
 *
 * Owner replies to a view-once with .<emoji>
 * The media is sent privately to OWNER NOTIFY NUMBER.
 *
 * IMPORTANT:
 * Never send the notification to the bot's own WhatsApp number.
 */

const settings = require('../../settings');
const {
  downloadContentFromMessage
} = require('@whiskeysockets/baileys');

const owner = require('../../lib/owner');

// ================================================================
// EXTRACT VIEW-ONCE MEDIA
// ================================================================

function extractViewOnce(quoted) {
  if (!quoted) {
    return null;
  }

  let inner = quoted;

  if (
    quoted.viewOnceMessageV2?.message
  ) {
    inner =
      quoted.viewOnceMessageV2.message;
  } else if (
    quoted.viewOnceMessage?.message
  ) {
    inner =
      quoted.viewOnceMessage.message;
  } else if (
    quoted.viewOnceMessageV2Extension?.message
  ) {
    inner =
      quoted.viewOnceMessageV2Extension.message;
  }

  if (inner.imageMessage) {
    return {
      type: 'image',
      media: inner.imageMessage,
      caption:
        inner.imageMessage.caption || ''
    };
  }

  if (inner.videoMessage) {
    return {
      type: 'video',
      media: inner.videoMessage,
      caption:
        inner.videoMessage.caption || ''
    };
  }

  if (inner.audioMessage) {
    return {
      type: 'audio',
      media: inner.audioMessage,
      caption:
        inner.audioMessage.caption || ''
    };
  }

  return null;
}

// ================================================================
// DOWNLOAD MEDIA
// ================================================================

async function downloadMedia(mediaInfo) {
  try {
    if (
      !mediaInfo ||
      !mediaInfo.media ||
      !mediaInfo.type
    ) {
      return null;
    }

    const stream =
      await downloadContentFromMessage(
        mediaInfo.media,
        mediaInfo.type
      );

    const chunks = [];

    for await (
      const chunk of stream
    ) {
      chunks.push(chunk);
    }

    if (!chunks.length) {
      return null;
    }

    return Buffer.concat(chunks);
  } catch (error) {
    console.log(
      '[SILENTVV] Media download failed:',
      error.message
    );

    return null;
  }
}

// ================================================================
// CLEAN NUMBER
// ================================================================

function cleanNum(value) {
  return String(value || '')
    .split('@')[0]
    .split(':')[0]
    .replace(/[^0-9]/g, '');
}

// ================================================================
// GET BOT NUMBERS
// ================================================================

function getBotNumbers(conn) {
  const numbers = new Set();

  try {
    if (conn?.user?.id) {
      const number =
        cleanNum(conn.user.id);

      if (number) {
        numbers.add(number);
      }
    }

    if (owner?.getPairedNumber) {
      const number =
        cleanNum(
          owner.getPairedNumber()
        );

      if (number) {
        numbers.add(number);
      }
    }
  } catch (error) {
    console.log(
      '[SILENTVV] Bot number check failed:',
      error.message
    );
  }

  return [...numbers];
}

// ================================================================
// GET NOTIFICATION JID
// ================================================================

function getNotificationJid(conn) {
  try {
    /*
     * ONLY use the explicitly configured
     * ownerNotifyNumber.
     *
     * This prevents the bot from accidentally
     * sending the message to itself.
     */
    if (
      typeof owner.getOwnerNotifyJid ===
      'function'
    ) {
      const jid =
        owner.getOwnerNotifyJid(conn);

      if (jid) {
        return jid;
      }
    }

    const configured =
      settings.ownerNotifyNumber;

    if (!configured) {
      console.log(
        '[SILENTVV] OWNER_NOTIFY_NUMBER is empty.'
      );

      return '';
    }

    const number =
      cleanNum(configured);

    if (!number) {
      return '';
    }

    const botNumbers =
      getBotNumbers(conn);

    if (
      botNumbers.includes(number)
    ) {
      console.log(
        '[SILENTVV] Notification number is the bot number. Blocked.'
      );

      return '';
    }

    return (
      number +
      '@s.whatsapp.net'
    );
  } catch (error) {
    console.log(
      '[SILENTVV] Notification JID error:',
      error.message
    );

    return '';
  }
}

// ================================================================
// BUILD CAPTION
// ================================================================

function buildCaption(
  sender,
  chatId,
  mediaInfo
) {
  const senderNum =
    cleanNum(sender);

  const chat =
    String(chatId || '')
      .split('@')[0];

  const time =
    new Date().toLocaleString(
      'en-TZ',
      {
        timeZone:
          settings.timeZone ||
          'Africa/Dar_es_Salaam'
      }
    );

  return (
    `SILENT REVEAL\n\n` +
    `From: ${senderNum || 'Unknown'}\n` +
    `Chat: ${chat || 'Unknown'}\n` +
    `Time: ${time}\n\n` +
    (
      mediaInfo.caption
        ? `Caption:\n${mediaInfo.caption}\n\n`
        : ''
    ) +
    `${settings.footer || ''}`
  );
}

// ================================================================
// SEND MEDIA
// ================================================================

async function sendMediaToOwner(
  conn,
  ownerJid,
  mediaInfo,
  buffer,
  caption
) {
  const content = {
    caption
  };

  if (
    mediaInfo.type === 'image'
  ) {
    content.image = buffer;
  } else if (
    mediaInfo.type === 'video'
  ) {
    content.video = buffer;
  } else if (
    mediaInfo.type === 'audio'
  ) {
    content.audio = buffer;
    content.ptt = true;
  } else {
    return false;
  }

  await conn.sendMessage(
    ownerJid,
    content
  );

  return true;
}

// ================================================================
// SILENT REVEAL
// ================================================================

async function silentRevealToOwner(
  conn,
  mek,
  chatId,
  mediaInfo
) {
  try {
    if (!conn) {
      console.log(
        '[SILENTVV] Connection unavailable.'
      );

      return false;
    }

    if (!mek) {
      console.log(
        '[SILENTVV] Message unavailable.'
      );

      return false;
    }

    if (!mediaInfo) {
      console.log(
        '[SILENTVV] Media unavailable.'
      );

      return false;
    }

    // ------------------------------------------------------------
    // OWNER NOTIFICATION TARGET
    // ------------------------------------------------------------

    const ownerJid =
      getNotificationJid(conn);

    if (!ownerJid) {
      console.log(
        '[SILENTVV] No safe owner notification target.'
      );

      return false;
    }

    // ------------------------------------------------------------
    // EXTRA SELF-SEND PROTECTION
    // ------------------------------------------------------------

    const ownerNumber =
      cleanNum(ownerJid);

    const botNumbers =
      getBotNumbers(conn);

    if (
      botNumbers.includes(
        ownerNumber
      )
    ) {
      console.log(
        '[SILENTVV] BLOCKED: owner target is bot itself.'
      );

      return false;
    }

    // ------------------------------------------------------------
    // DOWNLOAD
    // ------------------------------------------------------------

    console.log(
      '[SILENTVV] Downloading view-once media...'
    );

    const buffer =
      await downloadMedia(
        mediaInfo
      );

    if (
      !buffer ||
      buffer.length === 0
    ) {
      console.log(
        '[SILENTVV] Empty media buffer.'
      );

      return false;
    }

    // ------------------------------------------------------------
    // SENDER
    // ------------------------------------------------------------

    const sender =
      mek.key?.participant ||
      mek.key?.remoteJid ||
      '';

    const caption =
      buildCaption(
        sender,
        chatId,
        mediaInfo
      );

    // ------------------------------------------------------------
    // SEND
    // ------------------------------------------------------------

    const sent =
      await sendMediaToOwner(
        conn,
        ownerJid,
        mediaInfo,
        buffer,
        caption
      );

    if (!sent) {
      console.log(
        '[SILENTVV] Unsupported media type.'
      );

      return false;
    }

    console.log(
      '[SILENTVV] View-once sent successfully to owner notification number.'
    );

    return true;

  } catch (error) {
    console.log(
      '[SILENTVV] Reveal failed:',
      error.message
    );

    return false;
  }
}

// ================================================================
// PLUGIN
// ================================================================

module.exports = {

  name: 'silentvv',

  aliases: [
    'svv',
    'silent'
  ],

  category: 'owner',

  description:
    'Silently reveal a view-once to owner DM',

  usage:
    'Reply to a view-once with .<emoji>',

  ownerOnly: true,

  react: '✅',

  // --------------------------------------------------------------
  // EXECUTE
  // --------------------------------------------------------------

  async execute(
    conn,
    mek,
    args,
    chatId,
    isOwner
  ) {
    try {
      if (!isOwner) {
        return;
      }

      const quoted =
        mek.message
          ?.extendedTextMessage
          ?.contextInfo
          ?.quotedMessage;

      if (!quoted) {
        return;
      }

      const mediaInfo =
        extractViewOnce(
          quoted
        );

      if (!mediaInfo) {
        return;
      }

      /*
       * Silent:
       * no reaction
       * no reply
       * no message in original chat
       */

      await silentRevealToOwner(
        conn,
        mek,
        chatId,
        mediaInfo
      );

    } catch (error) {
      console.log(
        '[SILENTVV] Execute error:',
        error.message
      );
    }
  },

  silentRevealToOwner
};
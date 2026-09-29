/**
 * TYREX-KSH-MD
 * Channel Branding + Notification Helpers
 *
 * IMPORTANT:
 * - Does not interfere with command routing
 * - Does not modify reactions
 * - Does not modify delete/edit/protocol messages
 * - Does not send notifications automatically
 * - Safely handles missing/invalid channel settings
 */

const fs = require('fs');
const path = require('path');

const settings = require('../settings');

// ================================================================
// BOT CONSTANTS
// ================================================================

const BOT_NAME =
  settings.botName || 'TYREX-KSH-MD';

const BOT_VERSION = '1.0.0';

// ================================================================
// CHANNEL BRANDING STORAGE
// ================================================================

const brandDataPath = path.join(
  process.cwd(),
  'data',
  'channelbrand.json'
);

// ================================================================
// CHECK BRANDING STATUS
// ================================================================

function isBrandingEnabled() {
  try {
    if (!fs.existsSync(brandDataPath)) {
      return true;
    }

    const raw =
      fs.readFileSync(
        brandDataPath,
        'utf8'
      );

    if (!raw.trim()) {
      return true;
    }

    const store =
      JSON.parse(raw);

    return store.enabled !== false;

  } catch (error) {
    console.log(
      '[CHANNEL] Branding state read failed:',
      error.message
    );

    return true;
  }
}

// ================================================================
// ENSURE DATA DIRECTORY
// ================================================================

function ensureDataDirectory() {
  try {
    const dir =
      path.dirname(
        brandDataPath
      );

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(
        dir,
        {
          recursive: true
        }
      );
    }
  } catch (error) {
    console.log(
      '[CHANNEL] Data directory error:',
      error.message
    );
  }
}

// ================================================================
// SET BRANDING STATUS
// ================================================================

function setBrandingEnabled(enabled) {
  try {
    ensureDataDirectory();

    fs.writeFileSync(
      brandDataPath,
      JSON.stringify(
        {
          enabled:
            Boolean(enabled)
        },
        null,
        2
      )
    );

    return true;

  } catch (error) {
    console.log(
      '[CHANNEL] Failed to save branding state:',
      error.message
    );

    return false;
  }
}

// ================================================================
// BASIC JID NORMALIZER
// ================================================================

function normalizeJid(value) {
  if (!value) {
    return '';
  }

  const jid =
    String(value).trim();

  if (!jid) {
    return '';
  }

  if (jid.includes('@')) {
    return jid;
  }

  const number =
    jid.replace(
      /[^0-9]/g,
      ''
    );

  if (!number) {
    return '';
  }

  return (
    number +
    '@s.whatsapp.net'
  );
}

// ================================================================
// SAFE SEND
// ================================================================

async function safeSend(
  conn,
  jid,
  content
) {
  try {
    if (
      !conn ||
      typeof conn.sendMessage !==
        'function'
    ) {
      return false;
    }

    if (!jid || !content) {
      return false;
    }

    await conn.sendMessage(
      jid,
      content
    );

    return true;

  } catch (error) {
    console.log(
      '[CHANNEL] Send failed:',
      error.message
    );

    return false;
  }
}

// ================================================================
// NOTIFY CHANNEL
// ================================================================

async function notifyChannel(
  conn,
  text
) {
  const channelId =
    settings.channelId;

  if (
    !channelId ||
    !text
  ) {
    return false;
  }

  return safeSend(
    conn,
    channelId,
    {
      text: String(text)
    }
  );
}

// ================================================================
// NOTIFY GROUP
// ================================================================

async function notifyGroup(
  conn,
  jid,
  text
) {
  if (
    !jid ||
    !text
  ) {
    return false;
  }

  return safeSend(
    conn,
    jid,
    {
      text: String(text)
    }
  );
}

// ================================================================
// NOTIFY OWNER
// ================================================================

async function notifyOwner(
  conn,
  text
) {
  if (!text) {
    return false;
  }

  /*
   * Use owner notification number when configured.
   * Otherwise fall back to ownerNumber.
   */

  const configured =
    settings.ownerNotifyNumber ||
    settings.ownerNumber;

  const ownerJid =
    normalizeJid(
      configured
    );

  if (!ownerJid) {
    console.log(
      '[CHANNEL] No owner notification number configured.'
    );

    return false;
  }

  /*
   * Prevent accidental empty/invalid sends.
   */

  return safeSend(
    conn,
    ownerJid,
    {
      text: String(text)
    }
  );
}

// ================================================================
// SHOULD BRAND MESSAGE?
// ================================================================

function shouldBrandMessage(
  content
) {
  if (
    !content ||
    typeof content !==
      'object'
  ) {
    return false;
  }

  /*
   * Never modify protocol/control messages.
   */

  if (
    content.react ||
    content.delete ||
    content.protocolMessage ||
    content.poll ||
    content.pollCreationMessage ||
    content.pollUpdateMessage ||
    content.editedMessage
  ) {
    return false;
  }

  /*
   * Only brand actual user-facing
   * content messages.
   */

  return Boolean(
    content.text ||
    content.image ||
    content.video ||
    content.audio ||
    content.document ||
    content.sticker ||
    content.contact ||
    content.contacts ||
    content.location ||
    content.liveLocation ||
    content.buttonsMessage ||
    content.listMessage ||
    content.templateMessage ||
    content.caption
  );
}

// ================================================================
// ADD CHANNEL CONTEXT
// ================================================================

function addChannelContext(
  content,
  currentSettings
) {
  if (
    !content ||
    typeof content !==
      'object'
  ) {
    return content;
  }

  const channelId =
    currentSettings?.channelId ||
    settings.channelId;

  const channelName =
    currentSettings?.channelName ||
    settings.channelName ||
    'TYREX-KSH-MD';

  if (!channelId) {
    return content;
  }

  content.contextInfo = {
    ...(content.contextInfo || {}),

    forwardingScore: 999,

    isForwarded: true,

    forwardedNewsletterMessageInfo: {
      newsletterJid:
        channelId,

      newsletterName:
        channelName,

      serverMessageId: 1
    }
  };

  return content;
}

// ================================================================
// ENABLE CHANNEL BRANDING
// ================================================================

function enableChannelBranding(
  sock,
  currentSettings = settings
) {
  if (
    !sock ||
    typeof sock.sendMessage !==
      'function'
  ) {
    console.log(
      '[CHANNEL] Invalid socket. Branding skipped.'
    );

    return false;
  }

  /*
   * Prevent wrapping sendMessage more than once.
   *
   * This is important because repeatedly wrapping
   * sendMessage can cause unpredictable behaviour
   * when the connection reconnects.
   */

  if (
    sock.__tyrexChannelBranding
  ) {
    return true;
  }

  const originalSendMessage =
    sock.sendMessage.bind(sock);

  sock.sendMessage =
    async function (
      jid,
      content,
      options = {}
    ) {
      try {
        if (
          isBrandingEnabled() &&
          shouldBrandMessage(
            content
          )
        ) {
          addChannelContext(
            content,
            currentSettings
          );
        }

      } catch (error) {
        /*
         * Branding must NEVER stop
         * the original message from
         * being sent.
         */

        console.log(
          '[CHANNEL] Branding failed:',
          error.message
        );
      }

      /*
       * Always send the original message,
       * even if branding fails.
       */

      return originalSendMessage(
        jid,
        content,
        options
      );
    };

  sock.__tyrexChannelBranding =
    true;

  console.log(
    '[CHANNEL] Channel branding enabled.'
  );

  return true;
}

// ================================================================
// EXPORTS
// ================================================================

module.exports = {
  enableChannelBranding,

  isBrandingEnabled,

  setBrandingEnabled,

  shouldBrandMessage,

  BOT_NAME,

  BOT_VERSION,

  notifyChannel,

  notifyGroup,

  notifyOwner
};
const fs = require('fs');
const settings = require('../settings');
const sudo = require('./sudo');

// ================================================================
// HELPERS
// ================================================================

function cleanNumber(num) {
  if (!num) return '';

  return String(num)
    .split('@')[0]
    .split(':')[0]
    .replace(/[^0-9]/g, '');
}

function extractLidPart(id) {
  if (!id) return '';

  return String(id)
    .split('@')[0]
    .split(':')[0];
}

function maskNumber(num) {
  const clean = cleanNumber(num);

  if (!clean || clean.length < 6) {
    return clean || 'unknown';
  }

  return (
    clean.slice(0, 6) +
    'X'.repeat(Math.max(0, clean.length - 6))
  );
}

// ================================================================
// CREDS
// ================================================================

function readCreds() {
  const result = {
    id: null,
    lid: null
  };

  try {
    const sessionFolder =
      settings.sessionFolder ||
      './data/session';

    const credsPath =
      `${sessionFolder}/creds.json`;

    if (!fs.existsSync(credsPath)) {
      return result;
    }

    const creds = JSON.parse(
      fs.readFileSync(
        credsPath,
        'utf8'
      )
    );

    if (creds?.me) {
      if (creds.me.id) {
        result.id = creds.me.id;
      }

      if (creds.me.lid) {
        result.lid = creds.me.lid;
      }
    }
  } catch (error) {
    console.log(
      '[OWNER] Failed reading creds:',
      error.message
    );
  }

  return result;
}

// ================================================================
// PAIRED NUMBER
// ================================================================

function getPairedNumber() {
  const creds = readCreds();

  if (!creds.id) {
    return '';
  }

  return cleanNumber(
    creds.id
  );
}

function getPairedLid() {
  const creds = readCreds();

  if (!creds.lid) {
    return '';
  }

  return extractLidPart(
    creds.lid
  );
}

// ================================================================
// ID MATCHING
// ================================================================

function idsMatch(a, b) {
  if (!a || !b) {
    return false;
  }

  const aNum = cleanNumber(a);
  const bNum = cleanNumber(b);

  if (
    aNum &&
    bNum &&
    aNum === bNum
  ) {
    return true;
  }

  const aLid = extractLidPart(a);
  const bLid = extractLidPart(b);

  if (
    aLid &&
    bLid &&
    aLid === bLid
  ) {
    return true;
  }

  return false;
}

// ================================================================
// BOT IDs
// ================================================================

function getBotIds(conn) {
  const ids = new Set();

  try {
    if (conn?.user?.id) {
      ids.add(
        cleanNumber(
          conn.user.id
        )
      );
    }

    if (conn?.user?.lid) {
      ids.add(
        extractLidPart(
          conn.user.lid
        )
      );
    }
  } catch (e) {}

  const pairedNumber =
    getPairedNumber();

  const pairedLid =
    getPairedLid();

  if (pairedNumber) {
    ids.add(pairedNumber);
  }

  if (pairedLid) {
    ids.add(pairedLid);
  }

  return [...ids].filter(Boolean);
}

// ================================================================
// REAL OWNER
// ================================================================

function isRealOwner(
  sender,
  conn
) {
  if (!sender) {
    return false;
  }

  const senderNum =
    cleanNumber(sender);

  const senderLid =
    extractLidPart(sender);

  if (!senderNum && !senderLid) {
    return false;
  }

  // ------------------------------------------------------------
  // 1. Session paired number
  // ------------------------------------------------------------

  const pairedNum =
    getPairedNumber();

  const pairedLid =
    getPairedLid();

  if (
    pairedNum &&
    senderNum &&
    pairedNum === senderNum
  ) {
    return true;
  }

  if (
    pairedLid &&
    senderLid &&
    pairedLid === senderLid
  ) {
    return true;
  }

  // ------------------------------------------------------------
  // 2. Live WhatsApp connection
  // ------------------------------------------------------------

  if (conn?.user) {
    const botNum =
      cleanNumber(
        conn.user.id
      );

    const botLid =
      conn.user.lid
        ? extractLidPart(
            conn.user.lid
          )
        : '';

    if (
      botNum &&
      senderNum &&
      botNum === senderNum
    ) {
      return true;
    }

    if (
      botLid &&
      senderLid &&
      botLid === senderLid
    ) {
      return true;
    }
  }

  // ------------------------------------------------------------
  // 3. Configured owner
  // ------------------------------------------------------------

  const configuredOwner =
    cleanNumber(
      settings.ownerNumber
    );

  if (
    configuredOwner &&
    senderNum &&
    configuredOwner === senderNum
  ) {
    return true;
  }

  // ------------------------------------------------------------
  // 4. Developer
  // ------------------------------------------------------------

  const developer =
    cleanNumber(
      settings.developerNumber
    );

  if (
    developer &&
    senderNum &&
    developer === senderNum
  ) {
    return true;
  }

  return false;
}

// ================================================================
// OWNER CHECK
// ================================================================

function isOwner(
  sender,
  conn
) {
  if (!sender) {
    return false;
  }

  // Actual owner
  if (
    isRealOwner(
      sender,
      conn
    )
  ) {
    return true;
  }

  // Sudo users
  try {
    if (
      sudo &&
      typeof sudo.isSudo === 'function' &&
      sudo.isSudo(sender)
    ) {
      return true;
    }
  } catch (error) {
    console.log(
      '[OWNER] Sudo check error:',
      error.message
    );
  }

  return false;
}

// ================================================================
// OWNER NUMBERS
// ================================================================

function getOwnerNumbers(conn) {
  const list = new Set();

  const paired =
    getPairedNumber();

  const pairedLid =
    getPairedLid();

  if (paired) {
    list.add(paired);
  }

  if (pairedLid) {
    list.add(pairedLid);
  }

  if (conn?.user?.id) {
    const id =
      cleanNumber(
        conn.user.id
      );

    if (id) {
      list.add(id);
    }
  }

  if (conn?.user?.lid) {
    const lid =
      extractLidPart(
        conn.user.lid
      );

    if (lid) {
      list.add(lid);
    }
  }

  if (settings.ownerNumber) {
    list.add(
      cleanNumber(
        settings.ownerNumber
      )
    );
  }

  if (settings.developerNumber) {
    list.add(
      cleanNumber(
        settings.developerNumber
      )
    );
  }

  try {
    if (
      sudo &&
      typeof sudo.getSudoNumbers === 'function'
    ) {
      sudo
        .getSudoNumbers()
        .forEach(number => {
          const cleaned =
            cleanNumber(number);

          if (cleaned) {
            list.add(cleaned);
          }
        });
    }
  } catch (error) {
    console.log(
      '[OWNER] Failed reading sudo numbers:',
      error.message
    );
  }

  return [
    ...list
  ].filter(Boolean);
}

// ================================================================
// CONFIGURED OWNERS
// ================================================================

function getConfiguredOwners() {
  const owners = [];

  if (settings.ownerNumber) {
    owners.push(
      settings.ownerNumber
    );
  }

  if (settings.developerNumber) {
    owners.push(
      settings.developerNumber
    );
  }

  try {
    if (
      sudo &&
      typeof sudo.getSudoNumbers === 'function'
    ) {
      owners.push(
        ...sudo.getSudoNumbers()
      );
    }
  } catch (e) {}

  return owners.filter(Boolean);
}

// ================================================================
// OWNER NOTIFICATION NUMBER
//
// IMPORTANT:
// This number MUST NOT be the bot's own number.
// ================================================================

function getOwnerNotifyNumber(
  conn
) {
  const configured =
    settings.ownerNotifyNumber;

  if (!configured) {
    return '';
  }

  const notifyNumber =
    cleanNumber(
      configured
    );

  if (!notifyNumber) {
    return '';
  }

  const botNumbers =
    getBotIds(conn);

  if (
    botNumbers.includes(
      notifyNumber
    )
  ) {
    console.log(
      '[OWNER] ownerNotifyNumber matches bot number. Notification disabled.'
    );

    return '';
  }

  return notifyNumber;
}

// ================================================================
// SAFE OWNER JID
// ================================================================

function getOwnerNotifyJid(
  conn
) {
  const number =
    getOwnerNotifyNumber(
      conn
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
// COMPATIBILITY FUNCTIONS
// ================================================================

function saveOwner() {
  return true;
}

function getSavedOwners() {
  return [];
}

function rememberSender() {
  return true;
}

function isPairedNumber(
  sender,
  conn
) {
  return isOwner(
    sender,
    conn
  );
}

// ================================================================
// EXPORT
// ================================================================

module.exports = {
  cleanNumber,
  extractLidPart,
  maskNumber,
  idsMatch,

  isOwner,
  isRealOwner,
  isPairedNumber,

  getPairedNumber,
  getPairedLid,

  getOwnerNumbers,
  getConfiguredOwners,

  getBotIds,

  getOwnerNotifyNumber,
  getOwnerNotifyJid,

  rememberSender,
  saveOwner,
  getSavedOwners
};
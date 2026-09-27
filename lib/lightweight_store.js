const fs = require('fs');
const path = require('path');

class LightweightStore {
  constructor() {
    this.contacts = {};
    this.messages = {};
    this.filePath = './data/store.json';
    this._dirty = false; // flag ya kuonyesha kama kuna mabadiliko ya ku-save
  }

  readFromFile() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(data);
        this.contacts = parsed.contacts || {};
        this.messages = parsed.messages || {};
      }
    } catch (error) {
      console.error('Error reading store:', error.message);
    }
  }

  writeToFile() {
    try {
      if (!this._dirty) return; // Usiandike kama hakuna mabadiliko
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify({
        contacts: this.contacts,
        messages: this.messages
      }));
      this._dirty = false;
    } catch (error) {
      console.error('Error writing store:', error.message);
    }
  }

  bind(ev) {
    // Contacts update
    ev.on('contacts.update', (updates) => {
      for (let update of updates) {
        if (update.id && update.notify) {
          this.contacts[update.id] = {
            id: update.id,
            name: update.notify
          };
          this._dirty = true;
        }
      }
    });

    ev.on('contacts.upsert', (contacts) => {
      for (let c of contacts) {
        if (c.id) {
          this.contacts[c.id] = {
            id: c.id,
            name: c.name || c.notify || c.verifiedName || this.contacts[c.id]?.name || ''
          };
          this._dirty = true;
        }
      }
    });
  }

  // ═══════════════════════════════════════════
  // HAPA NDIPO TATIZO LILIPOKUWA — sasa tunahifadhi ujumbe wote
  // ═══════════════════════════════════════════
  saveMessage(jid, message) {
    if (!jid || !message || !message.key || !message.key.id) return;
    if (!this.messages[jid]) this.messages[jid] = {};
    this.messages[jid][message.key.id] = {
      key: message.key,
      message: message.message,
      pushName: message.pushName,
      messageTimestamp: message.messageTimestamp
    };
    // Punguza ukubwa — hifadhi ujumbe 500 wa mwisho kwa kila chat
    const keys = Object.keys(this.messages[jid]);
    if (keys.length > 500) {
      const toDelete = keys.slice(0, keys.length - 500);
      toDelete.forEach(k => delete this.messages[jid][k]);
    }
    this._dirty = true;
  }

  async loadMessage(jid, id) {
    try {
      if (this.messages[jid] && this.messages[jid][id]) {
        return this.messages[jid][id];
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Helper kupata messages zote za chat fulani
  getMessages(jid) {
    return this.messages[jid] || {};
  }
}

module.exports = new LightweightStore();
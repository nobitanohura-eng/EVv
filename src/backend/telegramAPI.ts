import { Express } from "express";
import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { NewMessage } from "telegram/events/index.js";
import { getDb } from "./db.js";
import { generateGeminiReply } from "./ai.js";
import { memoryEngine } from "./memory/MemoryEngine.js";

let client: TelegramClient | null = null;
let currentPhoneNumber = "";
let currentPhoneCodeHash = "";

// Use actual App API ID and Hash from my.telegram.org (configured via AI Studio Secrets)
const apiIdStr = process.env.TELEGRAM_API_ID;
const apiId = apiIdStr ? parseInt(apiIdStr) : 0;
const apiHash = process.env.TELEGRAM_API_HASH || '';

export function initTelegramAPI(app: Express) {
  // Routes for Authentication
  app.post('/api/telegram/start-login', async (req, res) => {
    try {
      if (!apiId || !apiHash) {
        return res.status(400).json({ error: 'Telegram API credentials missing. Please set TELEGRAM_API_ID and TELEGRAM_API_HASH in your Secrets.' });
      }

      const { phoneNumber } = req.body;
      if (!phoneNumber) return res.status(400).json({ error: 'Phone number required' });

      if (client) {
        await client.disconnect();
      }

      const stringSession = new StringSession("");
      client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
      });

      await client.connect();

      const result = await client.sendCode(
        {
          apiId,
          apiHash,
        },
        phoneNumber
      );

      currentPhoneNumber = phoneNumber;
      currentPhoneCodeHash = result.phoneCodeHash;

      res.json({ success: true, message: 'Code requested' });
    } catch (e: any) {
      console.error("sendCode error", e);
      res.status(500).json({ error: e.message || "Failed to send code" });
    }
  });

  app.post('/api/telegram/verify-code', async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) return res.status(400).json({ error: 'Code required' });
      if (!client || !currentPhoneCodeHash) return res.status(400).json({ error: 'No login flow active' });

      try {
        await client.invoke(new Api.auth.SignIn({
          phoneNumber: currentPhoneNumber,
          phoneCodeHash: currentPhoneCodeHash,
          phoneCode: code
        }));
        
        // Success
        const sessionString = client.session.save() as unknown as string;
        const db = getDb();
        db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('telegram_session', sessionString);
        setupTelegramListeners();

        res.json({ success: true, status: 'connected' });
      } catch (err: any) {
        if (err.errorMessage === 'SESSION_PASSWORD_NEEDED') {
          res.json({ success: true, status: 'password_needed' });
        } else {
          throw err;
        }
      }
    } catch (e: any) {
      console.error("verify-code error", e);
      res.status(500).json({ error: e.message || "Invalid code" });
    }
  });

  app.post('/api/telegram/verify-password', async (req, res) => {
    try {
      const { password } = req.body;
      if (!password) return res.status(400).json({ error: 'Password required' });
      if (!client) return res.status(400).json({ error: 'No login flow active' });

      try {
        await client.signInWithPassword(
            { apiId, apiHash },
            { 
              password: async () => password,
              onError: (err) => { throw err; }
            }
        );
        
        const sessionString = client.session.save() as unknown as string;
        const db = getDb();
        db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('telegram_session', sessionString);
        setupTelegramListeners();

        res.json({ success: true, status: 'connected' });
      } catch (e: any) {
        throw e;
      }
    } catch (e: any) {
      console.error("verify-password error", e);
      res.status(500).json({ error: e.message || "Invalid password" });
    }
  });

  app.get('/api/telegram/status', async (req, res) => {
    try {
      const db = getDb();
      const sessionString = db.prepare('SELECT value FROM settings WHERE key = ?').get('telegram_session') as {value: string} | undefined;
      const isAutoReplyEnabled = db.prepare('SELECT value FROM settings WHERE key = ?').get('auto_reply_enabled') as {value: string} | undefined;
      
      const isAuthenticated = !!client && (await client.checkAuthorization());
      
      res.json({ 
          isAuthenticated, 
          hasSessionSaved: !!sessionString?.value,
          autoReplyEnabled: isAutoReplyEnabled?.value === '1'
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
  
  app.post('/api/telegram/toggle-auto-reply', async (req, res) => {
    try {
      const { enabled } = req.body;
      const db = getDb();
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('auto_reply_enabled', enabled ? '1' : '0');
      res.json({ success: true, enabled });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/telegram/logout', async (req, res) => {
    try {
      const db = getDb();
      db.prepare('DELETE FROM settings WHERE key = ?').run('telegram_session');
      if (client) {
        await client.disconnect();
        client = null;
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
  
  // Dashboard Settings API
  app.get('/api/settings', (req, res) => {
    const db = getDb();
    const settings = db.prepare('SELECT * FROM settings').all();
    res.json(settings);
  });

  app.get('/api/metrics', (req, res) => {
    const db = getDb();
    
    // Get total messages sent by assistant
    const assistantCount = db.prepare("SELECT count(*) as count FROM messages WHERE role = 'assistant'").get() as { count: number };
    
    // Get messages sent today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfDayMs = startOfDay.getTime();
    const assistantCountToday = db.prepare("SELECT count(*) as count FROM messages WHERE role = 'assistant' AND timestamp >= ?").get(startOfDayMs) as { count: number };
    
    // Calculate total output characters (as a proxy for tokens)
    const assistantMessages = db.prepare("SELECT message FROM messages WHERE role = 'assistant'").all() as { message: string }[];
    let totalOutputChars = 0;
    assistantMessages.forEach(m => totalOutputChars += m.message.length);
    
    // Calculate total input characters
    const userMessages = db.prepare("SELECT message FROM messages WHERE role = 'user'").all() as { message: string }[];
    let totalInputChars = 0;
    userMessages.forEach(m => totalInputChars += m.message.length);

    res.json({
        messagesSent: assistantCount.count,
        messagesSentToday: assistantCountToday.count,
        dailyLimit: 1500, // standard Gemini Free Tier request limit per day
        totalOutputChars,
        totalInputChars,
        modelUsed: "gemini-2.5-flash-lite (Free Tier)"
    });
  });
  
  app.post('/api/settings', (req, res) => {
    const { key, value } = req.body;
    const db = getDb();
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
    res.json({ success: true });
  });

  app.get('/api/telegram/dialogs', async (req, res) => {
    try {
      if (!client || !(await client.checkAuthorization())) {
        return res.status(401).json({ error: "Not connected to Telegram" });
      }
      const dialogs = await client.getDialogs({ limit: 100 });
      const results = dialogs
          .filter(d => d.isUser && d.entity && !(d.entity as any).bot)
          .map(d => ({
              id: d.id?.toString(),
              name: d.title || (d.entity as any)?.firstName + " " + ((d.entity as any)?.lastName || ""),
              username: (d.entity as any)?.username,
              phone: (d.entity as any)?.phone,
          }));
      res.json(results);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Contacts API
  app.get('/api/contacts', (req, res) => {
    const db = getDb();
    const contacts = db.prepare('SELECT * FROM contacts ORDER BY whitelisted DESC, name ASC').all();
    res.json(contacts);
  });
  
  app.post('/api/contacts', (req, res) => {
    const { telegram_id, name, nickname, relationship, whitelisted } = req.body;
    const db = getDb();
    const info = db.prepare('INSERT OR REPLACE INTO contacts (telegram_id, name, nickname, relationship, whitelisted) VALUES (?, ?, ?, ?, ?)').run(telegram_id, name, nickname, relationship, whitelisted ? 1 : 0);
    res.json({ success: true, id: info.lastInsertRowid });
  });
  
  app.put('/api/contacts/:id', (req, res) => {
    const { id } = req.params;
    const { name, nickname, relationship, whitelisted } = req.body;
    const db = getDb();
    db.prepare('UPDATE contacts SET name=?, nickname=?, relationship=?, whitelisted=? WHERE id=?').run(name, nickname, relationship, whitelisted ? 1 : 0, id);
    res.json({ success: true });
  });
  
  app.delete('/api/contacts/:id', (req, res) => {
    const { id } = req.params;
    const db = getDb();
    db.prepare('DELETE FROM contacts WHERE id=?').run(id);
    res.json({ success: true });
  });

  app.get('/api/logs', (req, res) => {
    const db = getDb();
    const logs = db.prepare(`
      SELECT m.*, c.name as contact_name 
      FROM messages m 
      LEFT JOIN contacts c ON m.contact_id = c.id 
      ORDER BY timestamp DESC LIMIT 100
    `).all();
    res.json(logs);
  });

  // Memories API
  app.get('/api/memories', (req, res) => {
    const db = getDb();
    const memories = db.prepare(`
      SELECT m.*, c.name as contact_name 
      FROM memories m 
      LEFT JOIN contacts c ON m.contact_id = c.id 
      ORDER BY created_at DESC LIMIT 100
    `).all();
    res.json(memories);
  });

  app.delete('/api/memories/:id', (req, res) => {
    const { id } = req.params;
    const db = getDb();
    db.prepare('DELETE FROM memories WHERE id=?').run(id);
    res.json({ success: true });
  });

  app.delete('/api/memories', (req, res) => {
    const db = getDb();
    db.prepare('DELETE FROM memories').run();
    res.json({ success: true });
  });

  // Attempt auto-login on startup if session exists
  attemptAutoLogin();
}

async function attemptAutoLogin() {
  const db = getDb();
  const sessionString = db.prepare('SELECT value FROM settings WHERE key = ?').get('telegram_session') as {value: string} | undefined;
  if (sessionString && sessionString.value) {
    try {
      const stringSession = new StringSession(sessionString.value);
      client = new TelegramClient(stringSession, apiId, apiHash, { connectionRetries: 5 });
      await client.connect();
      setupTelegramListeners();
      console.log('Telegram client connected automatically.');
    } catch (e) {
      console.error('Failed to auto-connect to Telegram', e);
    }
  }
}

type MessageTask = {
    event: any;
};

const messageQueue: MessageTask[] = [];
let isProcessingQueue = false;

async function processQueue() {
    if (isProcessingQueue) return;
    isProcessingQueue = true;

    while (messageQueue.length > 0) {
        const task = messageQueue.shift();
        if (task) {
            await handleMessage(task.event);
        }
    }

    isProcessingQueue = false;
}

async function handleMessage(event: any) {
    try {
        const message = event.message;
        const senderId = message.peerId?.userId?.toString();
        if (!senderId) {
            return;
        }

        let myId: string | undefined;
        let me: any;
        try {
            me = await client!.getMe() as any;
            if (me) myId = me.id.toString();
        } catch (e) {
            console.error("Failed to get me", e);
        }

        if (message.out) {
            if (myId && senderId !== myId) return; // ignore outgoing messages to others
            if (!myId) return; // safe fallback
        }

        const isGroupOrChannel = message.isChannel || message.isGroup;
        if (isGroupOrChannel) {
            return;
        }

        const db = getDb();
        const isAutoReplyEnabled = db.prepare('SELECT value FROM settings WHERE key = ?').get('auto_reply_enabled') as {value: string} | undefined;
        if (isAutoReplyEnabled?.value !== '1') {
            return;
        }
        
        // Check if user is whitelisted
        const allContacts = db.prepare('SELECT * FROM contacts WHERE whitelisted = 1').all() as any[];
        let contact = allContacts.find(c => c.telegram_id === senderId);

        if (!contact && myId && senderId === myId) {
            // Auto-whitelist myself (Saved Messages)
            db.prepare('INSERT OR IGNORE INTO contacts (telegram_id, name, nickname, relationship, whitelisted) VALUES (?, ?, ?, ?, ?)').run(myId, me?.firstName || 'Me', 'Boss', 'Owner', 1);
            contact = db.prepare('SELECT * FROM contacts WHERE telegram_id = ?').get(myId);
        }

        if (!contact) {
            // Try to resolve sender details
            try {
                const sender = await client!.getEntity(senderId) as any;
                if (sender) {
                    const sUsername = sender.username ? sender.username.toLowerCase() : null;
                    const sPhone = sender.phone ? sender.phone.replace(/\+/g, '') : null;
                    
                    contact = allContacts.find(c => {
                        let cId = c.telegram_id.toLowerCase().trim();
                        if (cId === senderId) return true;
                        if (sUsername && (cId === sUsername || cId === `@${sUsername}` || `@${cId}` === sUsername)) return true;
                        
                        // Clean phone number from DB
                        cId = cId.replace(/\D/g, '');
                        if (cId.length > 5 && sPhone) {
                             if (sPhone.includes(cId) || cId.includes(sPhone)) return true;
                        }
                        return false;
                    });
                }
            } catch(err: any) {
                console.error("Failed to get entity for matching", err);
            }
        }
        
        if (!contact) {
            return; // ignore non-whitelisted
        }

        const text = message.message;
        
        // Anti-spam filters (simple logic)
        const lowerText = (text || "").toLowerCase();
        if (!lowerText || lowerText.includes('otp') || lowerText.includes('code:') || lowerText.match(/\b\d{4,6}\b/)) {
            return; 
        }

        // Store received message via MemoryEngine (handles extraction)
        await memoryEngine.saveMessageAndExtractMemory(contact.id, 'user', text);

        // Mark as read (optional, simulating reading)
        await client?.invoke(new Api.messages.ReadHistory({ peer: senderId, maxId: message.id }));

        // Typing delay simulation
        const typingDelayStr = (db.prepare('SELECT value FROM settings WHERE key = ?').get('typing_delay') as any)?.value || '5';
        const maxDelay = parseInt(typingDelayStr, 10) * 1000;
        const delay = Math.floor(Math.random() * maxDelay) + 1000;
        
        await client?.invoke(new Api.messages.SetTyping({
            peer: senderId,
            action: new Api.SendMessageTypingAction()
        }));
        
        await new Promise(r => setTimeout(r, delay));

        // Get past context for Gemini via Memory Engine
        const { shortTermMemory, longTermMemoryContext } = await memoryEngine.getContextForReply(contact.id);
        
        const systemPromptStr = (db.prepare('SELECT value FROM settings WHERE key = ?').get('system_prompt') as any)?.value || '';
        
        // Enrich system prompt with Long Term Memory
        const enrichedPrompt = `${systemPromptStr}\n\n${longTermMemoryContext}`;
        
        const replyText = await generateGeminiReply(shortTermMemory, contact, enrichedPrompt);

        // Store reply (this will also trigger background extraction if needed, though we only extract from user in engine)
        await memoryEngine.saveMessageAndExtractMemory(contact.id, 'assistant', replyText);

        // Send reply
        await client?.sendMessage(senderId, { message: replyText });

    } catch (e: any) {
        console.error("Error handling incoming message", e);
        try {
            const message = event.message;
            const senderId = message.peerId?.userId?.toString();
            if (senderId) {
                await client?.sendMessage(senderId, { message: `⚠️ Internal Error: ${e.message}` });
            }
        } catch(err) {}
    }
}

function setupTelegramListeners() {
  if (!client) return;
  
  client.addEventHandler((event: any) => {
    messageQueue.push({ event });
    processQueue();
  }, new NewMessage({}));

  // Catch up on any messages we might have missed while offline
  catchUpMissedMessages();
  
  // Periodically check every 5 minutes just to be absolutely sure no one is missed
  setInterval(() => {
      catchUpMissedMessages();
  }, 5 * 60 * 1000);
}

let isCatchingUp = false;
async function catchUpMissedMessages() {
    if (!client || isCatchingUp) return;
    isCatchingUp = true;
    try {
        const db = getDb();
        const isAutoReplyEnabled = db.prepare('SELECT value FROM settings WHERE key = ?').get('auto_reply_enabled') as {value: string} | undefined;
        if (isAutoReplyEnabled?.value !== '1') {
            isCatchingUp = false;
            return;
        }

        const allContacts = db.prepare('SELECT * FROM contacts WHERE whitelisted = 1').all() as any[];
        for (const contact of allContacts) {
            try {
                // Determine peer
                let peer;
                try {
                    peer = await client.getEntity(contact.telegram_id);
                } catch (err) {
                    continue; // Skip if we cannot resolve the entity for history fetching
                }
                // Fetch last message for this contact
                const history = await client.invoke(
                    new Api.messages.GetHistory({
                        peer: peer,
                        limit: 1,
                    })
                ) as any;

                if (history && history.messages && history.messages.length > 0) {
                    const lastMessage = history.messages[0];
                    // If the last message is from the user (incoming)
                    if (!lastMessage.out) {
                        // Check our DB if we already replied or if the last logged message is ours
                        const lastDbMsg = db.prepare('SELECT role, timestamp FROM messages WHERE contact_id = ? ORDER BY timestamp DESC LIMIT 1').get(contact.id) as any;
                        
                        // If our database says the last message was from the user, and it's been more than a few seconds, 
                        // OR we don't have it at all (meaning we missed the event completely)
                        // We can just push it to the queue to be safe. 
                        // To avoid duplicates, we check the exact message ID if possible, but GramJS events are slightly different from History.
                        // Let's just create a synthetic event.
                        
                        const msgTimeMs = lastMessage.date * 1000;
                        const isMissed = !lastDbMsg || (lastDbMsg.role === 'user');
                        
                        if (isMissed) {
                            // Check if this specific message is already in our DB by looking at time
                            const alreadyHave = db.prepare('SELECT id FROM messages WHERE contact_id = ? AND timestamp >= ?').get(contact.id, msgTimeMs - 5000);
                            
                            // If we already logged this user message but didn't reply, or if we didn't log it at all
                            if (!alreadyHave || lastDbMsg.role === 'user') {
                                console.log(`Catching up on missed message from ${contact.name}`);
                                messageQueue.push({
                                    event: {
                                        message: lastMessage
                                    }
                                });
                            }
                        }
                    }
                }
            } catch (err) {
                console.error(`Could not catch up for contact ${contact.name}:`, err);
            }
        }
        processQueue();
    } catch (e) {
        console.error("Error in catchUpMissedMessages", e);
    }
    isCatchingUp = false;
}
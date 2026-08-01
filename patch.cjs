const fs = require('fs');
const content = fs.readFileSync('src/backend/telegramAPI.ts', 'utf-8');

const newSetup = `function setupTelegramListeners() {
  if (!client) return;
  
  fs.appendFileSync('debug.log', 'Setting up telegram listeners...\\n');

  client.addEventHandler(async (event: any) => {
    try {
        fs.appendFileSync('debug.log', 'Received NewMessage event...\\n');
        const message = event.message;
        if (!message || message.out) return; // ignore outgoing messages

        const senderId = message.peerId?.userId?.toString();
        if (!senderId) {
            fs.appendFileSync('debug.log', 'No senderId found.\\n');
            return;
        }

        const isGroupOrChannel = message.isChannel || message.isGroup;
        if (isGroupOrChannel) {
            fs.appendFileSync('debug.log', 'Message is from group or channel, ignoring.\\n');
            return;
        }

        const db = getDb();
        const isAutoReplyEnabled = db.prepare('SELECT value FROM settings WHERE key = ?').get('auto_reply_enabled') as {value: string} | undefined;
        if (isAutoReplyEnabled?.value !== '1') {
            fs.appendFileSync('debug.log', 'Auto reply is OFF.\\n');
            return;
        }

        fs.appendFileSync('debug.log', \`Checking if \${senderId} is whitelisted...\\n\`);

        // Check if user is whitelisted
        const allContacts = db.prepare('SELECT * FROM contacts WHERE whitelisted = 1').all() as any[];
        let contact = allContacts.find(c => c.telegram_id === senderId);

        if (!contact) {
            // Try to resolve sender details
            try {
                const sender = await client!.getEntity(senderId) as any;
                if (sender) {
                    const sUsername = sender.username ? sender.username.toLowerCase() : null;
                    const sPhone = sender.phone ? sender.phone.replace(/\\+/g, '') : null;
                    
                    fs.appendFileSync('debug.log', \`Sender info: sUsername=\${sUsername}, sPhone=\${sPhone}\\n\`);
                    contact = allContacts.find(c => {
                        let cId = c.telegram_id.toLowerCase().trim();
                        if (cId === senderId) return true;
                        if (sUsername && (cId === sUsername || cId === \`@\${sUsername}\` || \`@\${cId}\` === sUsername)) return true;
                        
                        // Clean phone number from DB
                        cId = cId.replace(/\\D/g, '');
                        if (cId.length > 5 && sPhone) {
                             if (sPhone.includes(cId) || cId.includes(sPhone)) return true;
                        }
                        return false;
                    });
                }
            } catch(err: any) {
                fs.appendFileSync('debug.log', \`Failed to get entity: \${err.message}\\n\`);
                console.error("Failed to get entity for matching", err);
            }
        }
        
        if (!contact) {
            fs.appendFileSync('debug.log', \`Sender \${senderId} is not whitelisted.\\n\`);
            return; // ignore non-whitelisted
        }

        const text = message.message;
        
        // Anti-spam filters (simple logic)
        const lowerText = (text || "").toLowerCase();
        if (!lowerText || lowerText.includes('otp') || lowerText.includes('code:') || lowerText.match(/\\b\\d{4,6}\\b/)) {
            fs.appendFileSync('debug.log', \`Message blocked by spam filter.\\n\`);
            return; 
        }

        fs.appendFileSync('debug.log', \`Received message from whitelisted contact \${contact.name}: \${text}\\n\`);

        // Store received message
        const timestamp = Date.now();
        db.prepare('INSERT INTO messages (contact_id, role, message, timestamp) VALUES (?, ?, ?, ?)').run(contact.id, 'user', text, timestamp);
        fs.appendFileSync('debug.log', \`Inserted into db\\n\`);

        // Mark as read (optional, simulating reading)
        await client?.invoke(new Api.messages.ReadHistory({ peer: senderId, maxId: message.id }));
        fs.appendFileSync('debug.log', \`ReadHistory invoked\\n\`);

        // Typing delay simulation
        const typingDelayStr = (db.prepare('SELECT value FROM settings WHERE key = ?').get('typing_delay') as any)?.value || '5';
        const maxDelay = parseInt(typingDelayStr, 10) * 1000;
        const delay = Math.floor(Math.random() * maxDelay) + 1000;
        
        await client?.invoke(new Api.messages.SetTyping({
            peer: senderId,
            action: new Api.SendMessageTypingAction()
        }));
        fs.appendFileSync('debug.log', \`SetTyping invoked, waiting \${delay}ms\\n\`);
        await new Promise(r => setTimeout(r, delay));
        fs.appendFileSync('debug.log', \`Delay finished\\n\`);

        // Get past context for Gemini
        const history = db.prepare('SELECT role, message FROM messages WHERE contact_id = ? ORDER BY timestamp DESC LIMIT 20').all(contact.id).reverse() as {role: string, message: string}[];
        fs.appendFileSync('debug.log', \`History fetched, \${history.length} messages\\n\`);
        
        const systemPromptStr = (db.prepare('SELECT value FROM settings WHERE key = ?').get('system_prompt') as any)?.value || '';
        
        fs.appendFileSync('debug.log', \`Calling generateGeminiReply...\\n\`);
        const replyText = await generateGeminiReply(history, contact, systemPromptStr);

        fs.appendFileSync('debug.log', \`Replying to \${contact.name}: \${replyText}\\n\`);

        // Store reply
        db.prepare('INSERT INTO messages (contact_id, role, message, timestamp) VALUES (?, ?, ?, ?)').run(contact.id, 'assistant', replyText, Date.now());

        // Send reply
        await client?.sendMessage(senderId, { message: replyText });
        fs.appendFileSync('debug.log', \`Message sent successfully.\\n\`);

    } catch (e: any) {
        fs.appendFileSync('debug.log', \`Error handling message: \${e.message}\\n\`);
        console.error("Error handling incoming message", e);
    }
  }, new NewMessage({ incoming: true }));
}`;

const idx = content.indexOf('function setupTelegramListeners() {');
const newContent = content.slice(0, idx) + newSetup;
fs.writeFileSync('src/backend/telegramAPI.ts', newContent);

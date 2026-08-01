import "dotenv/config";
import { generateGeminiReply } from "./src/backend/ai.js";
import { initDb, getDb } from "./src/backend/db.js";

async function run() {
    initDb();
    const db = getDb();
    db.prepare("INSERT OR IGNORE INTO contacts (id, telegram_id, name, whitelisted) VALUES (999, '123', 'TestUser', 1)").run();
    const contact = db.prepare('SELECT * FROM contacts WHERE id=999').get();
    
    try {
        console.log("Calling generateGeminiReply...");
        const reply = await generateGeminiReply([{role: 'user', message: 'open calculator'}], contact, "System prompt here.");
        console.log("REPLY:", reply);
    } catch(e) {
        console.error("ERR:", e);
    }
}
run();

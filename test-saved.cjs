const { StringSession } = require("telegram/sessions/index.js");
const { TelegramClient } = require("telegram");
require("dotenv").config();
const db = require("better-sqlite3")("database.sqlite");

async function run() {
    const session = db.prepare("SELECT value FROM settings WHERE key = 'telegram_session'").get()?.value;
    const client = new TelegramClient(new StringSession(session), parseInt(process.env.TELEGRAM_API_ID), process.env.TELEGRAM_API_HASH, { connectionRetries: 1 });
    await client.connect();
    
    // Get last messages from saved messages
    const msgs = await client.getMessages("me", { limit: 5 });
    for (let m of msgs) {
        console.log("MSG:", m.text, "OUT:", m.out, "SENDER_ID:", m.senderId?.toString(), "PEER_ID:", m.peerId?.userId?.toString());
    }
    await client.disconnect();
}
run();

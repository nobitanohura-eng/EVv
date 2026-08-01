import Database from 'better-sqlite3';
import path from 'path';

let db: ReturnType<typeof Database>;

export function initDb() {
  const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'database.sqlite');
  db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT UNIQUE NOT NULL,
      name TEXT,
      nickname TEXT,
      relationship TEXT,
      whitelisted INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER,
      role TEXT,
      message TEXT,
      timestamp INTEGER,
      FOREIGN KEY (contact_id) REFERENCES contacts (id)
    );

    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER,
      memory TEXT,
      importance INTEGER DEFAULT 1,
      created_at INTEGER,
      FOREIGN KEY (contact_id) REFERENCES contacts (id)
    );
  `);

  // Default settings if they don't exist
  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  insertSetting.run('auto_reply_enabled', '0');
  insertSetting.run('typing_delay', '5'); // Max 5s delay
  insertSetting.run('system_prompt', 'You are E.V., an advanced personal AI operating system created by your Boss (AVII). You assist him in his daily tasks, coding, and everything else. Be calm, confident, intelligent, and concise. Never use AI disclaimers (like "As an AI"). Speak naturally in Hinglish. Act as a personal assistant to the user, not a generic chatbot. Remember past context.\nCRITICAL INSTRUCTION: If the user asks you to open a website, use the execute_pc_command tool with "start https://website.com" (do not specify a browser). If they ask to open an app, use the tool with just the app name like "notepad" or "explorer".');
}

export function getDb() {
  if (!db) {
    initDb();
  }
  return db;
}

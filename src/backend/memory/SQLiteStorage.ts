import { IMemoryStorage, StructuredMemory } from './types.js';
import { getDb } from '../db.js';

export class SQLiteMemoryStorage implements IMemoryStorage {
  constructor() {
    this.initTables();
  }

  private initTables() {
    const db = getDb();
    db.exec(`
      CREATE TABLE IF NOT EXISTS structured_memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contact_id INTEGER,
        category TEXT,
        entity TEXT,
        fact TEXT,
        importance INTEGER,
        created_at INTEGER,
        updated_at INTEGER,
        FOREIGN KEY (contact_id) REFERENCES contacts (id),
        UNIQUE(contact_id, category, entity)
      );
      -- Create an index to quickly find existing entities for updating
      CREATE UNIQUE INDEX IF NOT EXISTS idx_memories_contact_category_entity ON structured_memories (contact_id, category, entity);
    `);
  }

  async upsertMemory(memory: Omit<StructuredMemory, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    const db = getDb();
    const now = Date.now();
    
    // Using SQLite UPSERT syntax
    const stmt = db.prepare(`
      INSERT INTO structured_memories (contact_id, category, entity, fact, importance, created_at, updated_at)
      VALUES (@contact_id, @category, @entity, @fact, @importance, @now, @now)
      ON CONFLICT(contact_id, category, entity) DO UPDATE SET
        fact = @fact,
        importance = @importance,
        updated_at = @now
    `);
    
    stmt.run({
      contact_id: memory.contact_id,
      category: memory.category,
      entity: memory.entity,
      fact: memory.fact,
      importance: memory.importance,
      now
    });
  }

  async getRelevantMemories(contactId: number | string, contextQuery?: string, limit: number = 10): Promise<StructuredMemory[]> {
    const db = getDb();
    
    // Only return important memories (e.g. importance >= 4)
    // We could do semantic search, but SQLite FTS or simple LIKE works for free-tier.
    // Let's just return high importance memories for this contact for now, ordered by importance.
    const stmt = db.prepare(`
      SELECT * FROM structured_memories 
      WHERE contact_id = ? AND importance >= 4
      ORDER BY importance DESC, updated_at DESC
      LIMIT ?
    `);
    
    return stmt.all(contactId, limit) as StructuredMemory[];
  }

  async getRecentMessages(contactId: number | string, limit: number = 30): Promise<{ role: string; message: string; }[]> {
    const db = getDb();
    const history = db.prepare(`
      SELECT role, message 
      FROM messages 
      WHERE contact_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `).all(contactId, limit) as {role: string, message: string}[];
    
    return history.reverse(); // chronological order
  }

  async saveMessage(contactId: number | string, role: string, message: string): Promise<void> {
    const db = getDb();
    db.prepare('INSERT INTO messages (contact_id, role, message, timestamp) VALUES (?, ?, ?, ?)').run(contactId, role, message, Date.now());
  }
}

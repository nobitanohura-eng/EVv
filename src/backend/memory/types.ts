export interface StructuredMemory {
  id?: string | number;
  contact_id: number | string;
  category: string; // e.g. "People", "Projects", "Study", "Finance", "Events"
  entity: string; // e.g. "Prachi", "JEE", "Exam"
  fact: string; // e.g. "Birthday is 14 September", "Started Electrostatics"
  importance: number; // 0-10
  created_at: number;
  updated_at: number;
}

export interface IMemoryStorage {
  // Save or update memory (deduplication logic inside)
  upsertMemory(memory: Omit<StructuredMemory, 'id' | 'created_at' | 'updated_at'>): Promise<void>;
  
  // Retrieve relevant memories based on contact and optional category/search term
  getRelevantMemories(contactId: number | string, contextQuery?: string, limit?: number): Promise<StructuredMemory[]>;
  
  // Short-term memory (last N messages)
  getRecentMessages(contactId: number | string, limit?: number): Promise<{role: string, message: string}[]>;
  saveMessage(contactId: number | string, role: string, message: string): Promise<void>;
}

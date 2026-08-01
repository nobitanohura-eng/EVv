import { IMemoryStorage, StructuredMemory } from './types.js';
import { SQLiteMemoryStorage } from './SQLiteStorage.js';
// import { PostgresMemoryStorage } from './PostgresStorage.js';
import { GoogleGenAI } from '@google/genai';

export class MemoryEngine {
  private storage: IMemoryStorage;
  private ai: GoogleGenAI;

  constructor() {
    // Abstraction layer allows easy swapping to Postgres later!
    this.storage = new SQLiteMemoryStorage(); 
    // this.storage = new PostgresMemoryStorage(); 
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing for MemoryEngine");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  // Provides Context for Chat Generation
  async getContextForReply(contactId: number | string): Promise<{
    shortTermMemory: {role: string, message: string}[];
    longTermMemoryContext: string;
  }> {
    const shortTerm = await this.storage.getRecentMessages(contactId, 25);
    const longTermMemories = await this.storage.getRelevantMemories(contactId, "", 15);
    
    let longTermMemoryContext = "No prior long-term memory available.";
    if (longTermMemories.length > 0) {
      longTermMemoryContext = "Relevant Long-Term Memories:\n" + longTermMemories.map(m => 
        `- [${m.category}] ${m.entity}: ${m.fact} (Importance: ${m.importance}/10)`
      ).join('\n');
    }

    return { shortTermMemory: shortTerm, longTermMemoryContext };
  }

  async saveMessageAndExtractMemory(contactId: number | string, role: string, message: string): Promise<void> {
    // 1. Save raw message (Short term)
    await this.storage.saveMessage(contactId, role, message);

    // 2. We only want to extract memories from what the USER says, to save tokens and time.
    // Or occasionally summarize if the context gets too long.
    if (role === 'user' && message.length > 10) { // arbitrary threshold to ignore "hi"
      // Run extraction asynchronously so it doesn't block replying
      this.extractStructuredMemories(contactId, message).catch(err => {
        console.error("Failed to extract memory in background:", err);
      });
    }
  }

  private async extractStructuredMemories(contactId: number | string, newText: string): Promise<void> {
    // Prompt Gemini to detect important facts and output JSON
    const extractionPrompt = `
You are a memory extraction engine for a personal assistant.
Analyze the following user message and extract ANY new important long-term facts, preferences, goals, or relationships.

Categories to use: People, Relationships, Projects, Study, Finance, Ideas, Tasks, Events, Preferences, Goals, Notes.

If there is nothing worth remembering long-term (e.g. casual greeting, small talk), return an empty JSON array [].
Otherwise, return a JSON array of memory objects in this exact format:
[
  {
    "category": "Study",
    "entity": "JEE",
    "fact": "Started Electrostatics chapter today",
    "importance": 8
  }
]

Importance should be 0-10.
- 10: Crucial life events, core preferences, severe allergies, close family names.
- 5-8: Hobbies, current projects, study progress, likes/dislikes.
- 0-3: Transient feelings, minor daily events (you should probably just omit these).

Only return RAW JSON. Do not use markdown blocks.
User Message: "\${newText}"
`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: [{role: 'user', parts: [{text: extractionPrompt}]}],
        config: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        }
      });

      const resultText = response.text || '[]';
      const extractedMemories: any[] = JSON.parse(resultText);

      if (Array.isArray(extractedMemories) && extractedMemories.length > 0) {
        for (const m of extractedMemories) {
          if (m.category && m.entity && m.fact && typeof m.importance === 'number') {
             await this.storage.upsertMemory({
               contact_id: contactId,
               category: m.category,
               entity: m.entity,
               fact: m.fact,
               importance: m.importance
             });
             console.log(`[MemoryEngine] Saved memory for contact \${contactId}: [\${m.category}] \${m.entity} -> \${m.fact}`);
          }
        }
      }

    } catch (e) {
      // It's a background task, just log it.
      console.error("[MemoryEngine] JSON Parse error or generation failed:", e);
    }
  }
}

// Singleton instance
export const memoryEngine = new MemoryEngine();

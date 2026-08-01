import "dotenv/config";
import { generateGeminiReply } from "./src/backend/ai.js";
import { initDb, getDb } from "./src/backend/db.js";
import { GoogleGenAI, Type } from '@google/genai';

async function run() {
    initDb();
    const db = getDb();
    db.prepare("INSERT OR IGNORE INTO contacts (id, telegram_id, name, whitelisted) VALUES (999, '123', 'TestUser', 1)").run();
    const contact = db.prepare('SELECT * FROM contacts WHERE id=999').get();
    
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  
  let formattedHistory = [{
    role: 'user',
    parts: [{ text: 'open notepad on my pc' }]
  }];
  
  let response = await ai.models.generateContent({
    model: 'gemini-flash-lite-latest',
    contents: formattedHistory,
    config: {
      temperature: 0.7,
      maxOutputTokens: 250,
      tools: [{
        functionDeclarations: [{
            name: 'execute_pc_command',
            description: 'Execute a shell command on the user\'s local PC (Windows/Linux/Mac).',
            parameters: { type: Type.OBJECT, properties: { command: { type: Type.STRING } }, required: ['command'] }
        }]
      }]
    }
  });
  console.log("CALLS:", response.functionCalls);
  console.log("TEXT:", response.text);
}
run();

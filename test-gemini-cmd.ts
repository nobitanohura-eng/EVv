import "dotenv/config";
import { GoogleGenAI, Type } from '@google/genai';

async function run() {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const tools = [{
      functionDeclarations: [{
        name: 'execute_pc_command',
        description: 'Execute a shell command on the user\'s local PC (Windows/Linux/Mac).',
        parameters: { type: Type.OBJECT, properties: { command: { type: Type.STRING } }, required: ['command'] }
      }]
    }];
    const res = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: [{ role: 'user', parts: [{ text: 'open youtube in edge' }] }],
        config: { tools }
    });
    console.log(JSON.stringify(res.functionCalls, null, 2));
}
run();

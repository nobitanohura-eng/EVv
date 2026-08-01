import "dotenv/config";
import { GoogleGenAI, Type } from '@google/genai';

async function run() {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const tools = [{
      functionDeclarations: [{
        name: 'execute_pc_command',
        description: 'Execute a shell command on the user\'s local PC.',
        parameters: { type: Type.OBJECT, properties: { command: { type: Type.STRING } }, required: ['command'] }
      }]
    }];
    
    let contents = [{ role: 'user', parts: [{ text: 'open notepad' }] }] as any;
    
    let res = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents,
        config: { tools }
    });
    
    const call = res.functionCalls[0];
    
    contents.push(res.candidates[0].content);
    contents.push({
      role: 'user', 
      parts: [{ functionResponse: { name: call.name, response: { result: 'Command execution failed: network error' } } }]
    });
    
    res = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents,
        config: { tools }
    });
    console.log("Text:", res.text);
}
run();

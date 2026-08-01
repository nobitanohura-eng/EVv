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
    
    console.log("Call 1");
    let res = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents,
        config: { tools }
    });
    
    console.log("Call 1 completed. Calls:", res.functionCalls);
    const call = res.functionCalls[0];
    
    contents.push(res.candidates[0].content);
    contents.push({
      role: 'user', // Wait, function response role might need to be 'user' or 'function' depending on SDK
      parts: [{ functionResponse: { name: call.name, response: { result: "Notepad opened" } } }]
    });
    
    console.log("Call 2");
    res = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents,
        config: { tools }
    });
    console.log("Call 2 completed. Text:", res.text);
}
run();

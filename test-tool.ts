import "dotenv/config";
import { GoogleGenAI, Type } from "@google/genai";
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
async function run() {
    let history: any = [{role: 'user', parts: [{text: "Call the tool with hello"}]}];
    const tools: any = [{
        functionDeclarations: [{
            name: "my_tool",
            description: "A tool",
            parameters: { type: Type.OBJECT, properties: { msg: { type: Type.STRING } } }
        }]
    }];
    let res = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: history,
        config: { tools }
    });
    console.log("TOOL CALLS:", JSON.stringify(res.functionCalls));
    
    // Add assistant's response which includes functionCall
    history.push(res.candidates![0].content);
    // Add user's functionResponse
    history.push({role: 'user', parts: [{functionResponse: {name: "my_tool", response: {ok: true}}}]});
    
    try {
        let res2 = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: history,
            config: { tools }
        });
        console.log("FINAL TEXT:", res2.text);
    } catch(e: any) {
        console.error("ERROR:", e.message);
    }
}
run();

import { GoogleGenAI, Type } from '@google/genai';
import { getDb } from './db.js';

export async function generateGeminiReply(
  history: {role: string, message: string}[], 
  contactInfo: any,
  systemPrompt: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing");
  }
  const ai = new GoogleGenAI({ apiKey });
  
  const db = getDb();
  const agentUrl = (db.prepare('SELECT value FROM settings WHERE key = ?').get('local_agent_url') as any)?.value;
  const agentToken = (db.prepare('SELECT value FROM settings WHERE key = ?').get('local_agent_token') as any)?.value;

  const contactContext = `
  You are replying to a private message from ${contactInfo.name} ${contactInfo.nickname ? `(nickname: ${contactInfo.nickname})` : ''}.
  Relationship: ${contactInfo.relationship || 'acquaintance'}.
  CRITICAL INSTRUCTION: If the user asks you to open an app, control their PC, or run a command, you MUST use the execute_pc_command tool! Do NOT just say you did it without calling the tool.
  `;

  let formattedHistory = history.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.message }]
  }));

  const tools: any = [];
  if (agentUrl && agentToken) {
    tools.push({
      functionDeclarations: [{
        name: 'execute_pc_command',
        description: 'Execute a shell command on the user\'s local PC (Windows/Linux/Mac).',
        parameters: {
          type: Type.OBJECT,
          properties: {
            command: {
              type: Type.STRING,
              description: 'The shell command to execute.'
            }
          },
          required: ['command']
        }
      }]
    });
  }

  try {
    let response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: formattedHistory,
      config: {
        systemInstruction: systemPrompt + '\n' + contactContext,
        temperature: 0.7,
        maxOutputTokens: 250,
        tools: tools.length > 0 ? tools : undefined
      }
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      if (call.name === 'execute_pc_command') {
        const command = (call.args as any).command;
        console.log("EXECUTING PC COMMAND:", command);
        try {
          const pcRes = await fetch(`${agentUrl}/execute`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${agentToken}`,
              'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({ command })
          });
          const result = await pcRes.text();
          
          formattedHistory.push(response.candidates![0].content as any);
          
          formattedHistory.push({
            role: 'user',
            parts: [{ functionResponse: { name: call.name, response: { result } } }]
          } as any);
          
          response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: formattedHistory,
            config: {
              systemInstruction: systemPrompt + '\n' + contactContext,
              temperature: 0.7,
              maxOutputTokens: 250,
              tools: tools.length > 0 ? tools : undefined
            }
          });
        } catch (e: any) {
          return `⚠️ Command execution failed: ${e.message}`;
        }
      }
    }
    return response.text || "Command executed.";
  } catch (error: any) {
    console.error("Gemini API Error:", error.message || error);
    // Fallback to Groq if API key is provided
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      console.log("Falling back to Groq API...");
      try {
        const groqMessages = [
          { role: 'system', content: systemPrompt + '\n' + contactContext },
          ...history.map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.message
          }))
        ];
        
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: 'llama-3.1-70b-versatile', // Fast & powerful Groq model
            messages: groqMessages,
            temperature: 0.7,
            max_tokens: 250
          })
        });
        
        if (groqRes.ok) {
          const groqData = await groqRes.json();
          return groqData.choices[0].message.content;
        } else {
          console.error("Groq API Error:", await groqRes.text());
        }
      } catch (groqError: any) {
        console.error("Groq Fetch Error:", groqError.message);
      }
    }
    
    return `⚠️ API Error: ${error.message}`;
  }
}

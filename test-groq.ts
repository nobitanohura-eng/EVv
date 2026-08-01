import "dotenv/config";

async function run() {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
        console.log("No Groq key"); return;
    }
    const tools = [{
      type: "function",
      function: {
        name: "execute_pc_command",
        description: "Execute a shell command on the user's local PC",
        parameters: {
          type: "object",
          properties: {
            command: { type: "string" }
          },
          required: ["command"]
        }
      }
    }];
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
        body: JSON.stringify({
            model: 'llama3-70b-8192',
            messages: [{ role: 'user', content: 'open notepad' }],
            tools: tools
        })
    });
    console.log(await res.json());
}
run();

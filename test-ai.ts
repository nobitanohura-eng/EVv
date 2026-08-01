import "dotenv/config";
import { generateGeminiReply } from "./src/backend/ai.ts";

async function run() {
  const history = [{role: 'user', message: 'Open calculator'}];
  const contact = { name: "TestUser" };
  try {
    const res = await generateGeminiReply(history, contact, "System prompt");
    console.log("RESPONSE:", res);
  } catch (e) {
    console.error("ERROR:", e);
  }
}
run();

import "dotenv/config";
import { memoryEngine } from "./src/backend/memory/MemoryEngine.js";
async function run() {
    try {
        await memoryEngine.saveMessageAndExtractMemory(6, 'user', 'hello');
        console.log("Memory saved");
    } catch(e) {
        console.error("ERROR", e);
    }
}
run();

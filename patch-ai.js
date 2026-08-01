const fs = require('fs');
let code = fs.readFileSync('src/backend/ai.ts', 'utf8');
code = code.replace('const command = (call.args as any).command;', 'const command = (call.args as any).command;\n        console.log("EXECUTING PC COMMAND:", command);');
fs.writeFileSync('src/backend/ai.ts', code);

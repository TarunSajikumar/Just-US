const fs = require('fs');

const logPath = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\48b812a5-da16-4288-a110-ce824a446272\\.system_generated\\logs\\transcript.jsonl';
const content = fs.readFileSync(logPath, 'utf8');
const lines = content.trim().split('\n');

let userRequest = '';
for (let i = lines.length - 1; i >= 0; i--) {
  const step = JSON.parse(lines[i]);
  if (step.type === 'USER_INPUT') {
    userRequest = step.content;
    break;
  }
}

fs.writeFileSync('C:\\Users\\USER\\Downloads\\JUSTUS\\user_request_debug.txt', userRequest, 'utf8');
console.log('Written user_request_debug.txt');


import fs from 'fs';
import path from 'path';

function walk(dir: string) {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      try {
        if (fs.statSync(filePath).isDirectory()) {
          if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
            walk(filePath);
          }
        } else {
          console.log(filePath);
        }
      } catch (e) {}
    }
  } catch (e) {}
}

console.log('--- START FILE LIST ---');
walk('/');
console.log('--- END FILE LIST ---');

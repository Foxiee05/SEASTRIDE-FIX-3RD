import fs from 'fs';
import path from 'path';

function findText(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findText(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Simple regex to find text between > and <
      // ignoring scripts and empty spaces
      const matches = content.match(/>([^<{]+)</g);
      if (matches) {
        for (const match of matches) {
           const text = match.replace(/^>/, '').replace(/<$/, '').trim();
           if (text && text.match(/[a-zA-Z]/) && text !== 'km' && text !== 'English' && text !== 'Tiếng Việt' && text !== 'N' && text !== 'S' && text !== 'E' && text !== 'W') {
              console.log(fullPath + ': ' + text);
           }
        }
      }
    }
  }
}

findText('src/components');

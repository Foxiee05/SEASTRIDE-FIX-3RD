import fs from 'fs';
import path from 'path';

function findText(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const matches = content.match(/>([^<{}]+)</g);
  if (matches) {
    for (const match of matches) {
       const text = match.replace(/^>/, '').replace(/<$/, '').trim();
       if (text && text.match(/[a-zA-Z]/) && !['km', 'English', 'Tiếng Việt', 'N', 'S', 'E', 'W'].includes(text)) {
          console.log(filePath + ': ' + text);
       }
    }
  }
}

findText('src/components/RaidBossScreen.tsx');
findText('src/components/TreasureHuntScreen.tsx');

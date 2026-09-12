const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src/components');
files.push('src/App.tsx');

let allText = new Set();
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // Match > text <
  const matches = content.match(/>[^<a-zA-Z]*([a-zA-Z][^<]*)<\/?/g);
  if (matches) {
    matches.forEach(m => {
      const text = m.substring(1, m.length - 1).trim();
      if (text && text.length > 1 && !text.includes('t(') && !text.startsWith('{')) {
        allText.add(file + ': ' + text);
      }
    });
  }
});

Array.from(allText).sort().forEach(t => console.log(t));

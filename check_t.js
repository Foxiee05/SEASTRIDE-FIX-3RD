const fs = require('fs');
const files = fs.readdirSync('src/components').filter(f => f.endsWith('.tsx'));
for (const file of files) {
  const content = fs.readFileSync('src/components/' + file, 'utf8');
  if (content.includes('t(')) {
    // check if `t` is defined via useGame or props
    if (!content.match(/\bt\b[^=]*=\s*useGame\(\)/s) && !content.includes('{ t }') && !content.includes(', t,') && !content.includes(' t,')) {
      console.log('Missing t in: src/components/' + file);
    }
  }
}

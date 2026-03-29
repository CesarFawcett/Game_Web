const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  let changedFiles = 0;
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      changedFiles += processDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const regex = /\$\{baseUrl\}\$\{([^}]+)\}/g;
      
      let modified = false;
      const newContent = content.replace(regex, (match, p1) => {
          modified = true;
          // output: ${p1 && typeof p1 === 'string' && p1.startsWith('http') ? '' : baseUrl}${p1}
          return `\$\{${p1} && typeof ${p1} === 'string' && ${p1}.startsWith('http') ? '' : baseUrl\}\$\{${p1}\}`;
      });

      if (modified && newContent !== content) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        changedFiles++;
        console.log('Modified:', fullPath);
      }
    }
  }
  return changedFiles;
}

try {
  const count = processDir(path.join(__dirname, 'frontend/src/components'));
  console.log('Total files modified:', count);
} catch (e) {
  console.error(e);
}

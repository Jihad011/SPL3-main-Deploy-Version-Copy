const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src', 'app', 'features');

const replaceInFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Add text-gradient-flow to page titles
  content = content.replace(/class="([^"]*page-title[^"]*)"/g, (match, p1) => {
    if (!p1.includes('text-gradient-flow')) {
      return `class="${p1} text-gradient-flow"`;
    }
    return match;
  });

  // 2. Add btn-neon to btn-primary
  content = content.replace(/class="([^"]*btn-primary[^"]*)"/g, (match, p1) => {
    if (!p1.includes('btn-neon')) {
      return `class="${p1} btn-neon"`;
    }
    return match;
  });

  // 3. Add card-glow-border to main cards
  content = content.replace(/class="([^"]*\bcard\b[^"]*)"/g, (match, p1) => {
    if (!p1.includes('card-glow-border') && !p1.includes('stat-card') && !p1.includes('modal-card') && !p1.includes('student-card')) {
      return `class="${p1} card-glow-border"`;
    }
    return match;
  });

  // 4. Add table-row-glow to clickable rows
  content = content.replace(/class="([^"]*clickable-row[^"]*)"/g, (match, p1) => {
    if (!p1.includes('table-row-glow')) {
      return `class="${p1} table-row-glow"`;
    }
    return match;
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
};

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (file.endsWith('.component.ts') || file.endsWith('.component.html')) {
        filelist.push(dirFile);
      }
    }
  }
  return filelist;
};

const files = walkSync(directoryPath);
files.forEach(replaceInFile);
console.log('Done applying glow classes!');

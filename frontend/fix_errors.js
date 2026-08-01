const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            filelist = walkSync(filepath, filelist);
        } else if (filepath.endsWith('.ts')) {
            filelist.push(filepath);
        }
    }
    return filelist;
};

const files = walkSync('src/app');
let modifiedCount = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Replace err.error?.message || ... with err.error?.detail || err.error?.message || ...
    // Note: This regex needs to be careful not to replace ones we already fixed.
    content = content.replace(/err\.error\?\.message(?! \|\|| \?\?)/g, 'err.error?.detail || err.error?.message');
    
    // We already manually fixed three files where we stored it in 'const msg'. 
    // This simple regex handles inline ones like:
    // this.errorMessage.set(err.error?.message || 'Failed') -> this.errorMessage.set(err.error?.detail || err.error?.message || 'Failed')
    content = content.replace(/err\.error\?\.message \|\|/g, 'err.error?.detail || err.error?.message ||');
    content = content.replace(/err\.error\?\.message \?\?/g, 'err.error?.detail || err.error?.message ??');
    
    // Fix duplicates that might have occurred from the simple regex above
    content = content.replace(/err\.error\?\.detail \|\| err\.error\?\.detail/g, 'err.error?.detail');
    content = content.replace(/err\.error\?\.detail \|\| err\.error\?\.message \|\| err\.error\?\.message/g, 'err.error?.detail || err.error?.message');
    content = content.replace(/err\.error\?\.detail \|\| err\.error\?\.message \?\? err\.error\?\.message/g, 'err.error?.detail || err.error?.message');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed ' + file);
        modifiedCount++;
    }
}
console.log('Modified ' + modifiedCount + ' files.');

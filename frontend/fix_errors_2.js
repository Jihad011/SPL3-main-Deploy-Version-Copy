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
    
    // Replace: e.error?.message  =>  e.error?.detail || e.error?.message
    // Only if it's not already preceded by .detail || 
    
    // We can just use a simple regex that matches [variable].error?.message
    // but we have to make sure we don't duplicate it.
    
    content = content.replace(/(\w+)\.error\?\.message/g, (match, p1) => {
        // If the file already contains ${p1}.error?.detail || .error?.message around this area, skip.
        // Actually, a simpler way is to replace ALL with detail || message, and then clean up duplicates.
        return ${p1}.error?.detail || .error?.message;
    });
    
    // Clean up duplicates like err.error?.detail || err.error?.detail || err.error?.message
    content = content.replace(/(\w+)\.error\?\.detail \|\| \1\.error\?\.detail/g, '.error?.detail');
    content = content.replace(/(\w+)\.error\?\.detail \|\| \1\.error\?\.message \|\| \1\.error\?\.message/g, '.error?.detail || .error?.message');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed ' + file);
        modifiedCount++;
    }
}
console.log('Modified ' + modifiedCount + ' files.');

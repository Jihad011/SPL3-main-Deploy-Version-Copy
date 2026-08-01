const fs = require('fs');
const path = require('path');

const files = [
    'src/app/features/admin/courses/course-management.component.ts',
    'src/app/features/admin/semesters/semester-management.component.ts',
    'src/app/features/admin/students/student-management.component.ts',
    'src/app/features/auth/login/login.component.ts',
    'src/app/features/auth/register/register.component.ts',
    'src/app/features/student/course-registration/course-registration.component.ts',
    'src/app/features/student/dashboard/student-dashboard.component.ts',
    'src/app/features/teacher/grade-entry/grade-entry.component.ts'
];

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Fix: .error?.detail -> err.error?.detail
    content = content.replace(/=\s*\.error\?\.detail/g, '= err.error?.detail');
    
    // Fix TS5076: '||' and '??' mixing requires parens
    // e.error?.detail || e.error?.message ?? '...'
    // Replace ?? with || since || is safe for string fallbacks
    content = content.replace(/(\w+\.error\?\.detail\s*\|\|\s*\w+\.error\?\.message)\s*\?\?/g, ' ||');
    
    fs.writeFileSync(file, content, 'utf8');
}
console.log('Fixed syntax errors.');

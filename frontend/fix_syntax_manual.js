const fs = require('fs');
const files = [
    'src/app/features/admin/courses/course-management.component.ts',
    'src/app/features/admin/semesters/semester-management.component.ts',
    'src/app/features/student/course-registration/course-registration.component.ts',
    'src/app/features/student/dashboard/student-dashboard.component.ts',
    'src/app/features/teacher/grade-entry/grade-entry.component.ts'
];

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/set\(\s*\|\|/g, "set(e.error?.detail || e.error?.message ||");
    fs.writeFileSync(file, content, 'utf8');
}
console.log('Fixed manually broken syntax.');

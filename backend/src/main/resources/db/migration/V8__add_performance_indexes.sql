-- V8__add_performance_indexes.sql

-- Performance Indexes for frequently queried columns

-- 1. Users table (Search and Auth lookups)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_roll_number ON users(roll_number);
CREATE INDEX IF NOT EXISTS idx_users_registration_number ON users(registration_number);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, is_active);

-- 2. Enrollments table (Heavy joins for CGPA and Dashboards)
CREATE INDEX IF NOT EXISTS idx_enrollments_student_semester ON enrollments(student_id, semester_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_semester ON enrollments(course_id, semester_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);

-- 3. Grades table (CGPA calculations)
CREATE INDEX IF NOT EXISTS idx_grades_enrollment_id ON grades(enrollment_id);

-- 4. Fees table (Dues queries)
CREATE INDEX IF NOT EXISTS idx_fees_student_status ON fees(student_id, status);
CREATE INDEX IF NOT EXISTS idx_fees_semester_status ON fees(semester_id, status);

-- 5. Courses table
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);
CREATE INDEX IF NOT EXISTS idx_courses_is_active ON courses(is_active);

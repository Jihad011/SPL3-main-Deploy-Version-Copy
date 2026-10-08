-- Migration V22: Add syllabus_url and syllabus_file_name columns to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS syllabus_url VARCHAR(500);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS syllabus_file_name VARCHAR(255);

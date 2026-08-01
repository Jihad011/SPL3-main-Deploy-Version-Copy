-- Insert an Admin User (Password is 'Admin@123' encoded with BCrypt)
INSERT INTO users (id, name, email, password_hash, role, is_active, created_at, updated_at) 
VALUES (1, 'System Admin', 'admin@iit.du.ac.bd', '$2a$12$Kj0hH4G/eOQ2gL13y0z1lO4U8k6uXQ/X5Cj0hH4G/eOQ2gL13y0z1l', 'ADMIN', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert a Teacher
INSERT INTO users (id, name, email, password_hash, role, designation, is_active, created_at, updated_at) 
VALUES (2, 'Dr. Hasan', 'hasan@iit.du.ac.bd', '$2a$12$Kj0hH4G/eOQ2gL13y0z1lO4U8k6uXQ/X5Cj0hH4G/eOQ2gL13y0z1l', 'TEACHER', 'Professor', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert a Student
INSERT INTO users (id, name, email, password_hash, role, roll_number, registration_number, batch, is_active, created_at, updated_at) 
VALUES (3, 'Md. Jihad Hossain', 'jihad@iit.du.ac.bd', '$2a$12$Kj0hH4G/eOQ2gL13y0z1lO4U8k6uXQ/X5Cj0hH4G/eOQ2gL13y0z1l', 'STUDENT', '1413', 'REG-2021-1413', 2021, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Create Semesters and activate them
INSERT INTO semesters (id, name, "year", start_date, end_date, is_active, created_at)
VALUES (1, 'Y1S1', 2026, '2026-01-01', '2026-06-30', true, CURRENT_TIMESTAMP);

-- Create some courses
INSERT INTO courses (id, code, name, credit_hours, course_type, max_seats, current_enrollment, is_active, teacher_id, created_at, updated_at)
VALUES (1, 'MIT-601', 'Cloud Computing', 3, 'CORE', 40, 0, true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO courses (id, code, name, credit_hours, course_type, max_seats, current_enrollment, is_active, teacher_id, created_at, updated_at)
VALUES (2, 'MIT-602', 'Advanced Machine Learning', 3, 'OPTIONAL', 40, 0, true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Advance identity sequences so auto-generated IDs do not collide with pre-seeded data
ALTER TABLE users ALTER COLUMN id RESTART WITH 100;
ALTER TABLE semesters ALTER COLUMN id RESTART WITH 100;
ALTER TABLE courses ALTER COLUMN id RESTART WITH 100;

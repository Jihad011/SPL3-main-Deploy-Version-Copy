-- ============================================================
-- Seed: Users (Admin, Teachers, Students)
-- Passwords are BCrypt hashed → plain text: Admin@123 / Teacher@123 / Student@123
-- ============================================================

-- Admin
INSERT INTO users (name, email, password_hash, role, designation, department) VALUES
('System Admin',    'admin@iit.du.ac.bd',   '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'ADMIN',   'System Administrator', 'IIT'),
('Dr. Tawhid',      'tawhid@iit.du.ac.bd',  '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'TEACHER', 'Professor',            'IIT'),
('Dr. Jane Smith',  'jane@iit.du.ac.bd',    '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'TEACHER', 'Assistant Professor',  'IIT');

-- Students
INSERT INTO users (name, email, password_hash, role, roll_number, registration_number, phone, batch) VALUES
('Md. Jihad Hossain', 'jihad@iit.du.ac.bd',   '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', '1413', 'REG-2021-1413', '01752588523', 2021),
('Rahim Uddin',       'rahim@iit.du.ac.bd',   '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', '1414', 'REG-2021-1414', '01700000001', 2021),
('Karim Hossain',     'karim@iit.du.ac.bd',   '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', '1415', 'REG-2021-1415', '01700000002', 2021),
('Fatima Begum',      'fatima@iit.du.ac.bd',  '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', '1416', 'REG-2021-1416', '01700000003', 2021),
('Nadia Islam',       'nadia@iit.du.ac.bd',   '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', '1417', 'REG-2021-1417', '01700000004', 2021);

-- Active semester
INSERT INTO semesters (name, year, start_date, end_date, is_active) VALUES
('FALL',   2025, '2025-09-01', '2026-01-31', FALSE),
('SPRING', 2026, '2026-02-01', '2026-06-30', TRUE);

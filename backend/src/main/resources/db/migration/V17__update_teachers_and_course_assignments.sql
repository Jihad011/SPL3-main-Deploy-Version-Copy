-- ============================================================
-- V17: Update Teacher Names and Course Faculty Assignments
-- ============================================================

-- 1. Insert or Update Teacher User Records
INSERT INTO users (name, email, password_hash, role, designation, is_active) VALUES
('Dr. B M Mainul Hossain',       'mainul@iit.du.ac.bd',        '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'TEACHER', 'Professor', true),
('Mohammad Shoyaib',             'shoyaib@iit.du.ac.bd',       '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'TEACHER', 'Professor', true),
('Dr. Md. Shariful Islam',       'shariful@iit.du.ac.bd',      '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'TEACHER', 'Professor', true),
('Dr. Zerina Begum',             'zerina@iit.du.ac.bd',        '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'TEACHER', 'Professor', true),
('Dr. Naushin Nower',            'naushin@iit.du.ac.bd',       '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'TEACHER', 'Associate Professor', true),
('Ahmedul Kabir',                'ahmedul.kabir@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'TEACHER', 'Associate Professor', true),
('Dr. Sumon Ahmed',              'sumon@iit.du.ac.bd',         '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'TEACHER', 'Assistant Professor', true),
('Dr. Md. Nurul Ahad Tawhid',    'tawhid@iit.du.ac.bd',        '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'TEACHER', 'Professor', true)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    designation = EXCLUDED.designation,
    is_active = EXCLUDED.is_active;

-- 2. Update Course Teacher Assignments

-- Advanced Algorithms -> Dr. Sumon Ahmed
UPDATE courses 
SET teacher_id = (SELECT id FROM users WHERE email = 'sumon@iit.du.ac.bd' LIMIT 1)
WHERE name ILIKE '%Advanced Algorithms%' OR code = 'MIT-501';

-- Software Engineering -> Dr. Zerina Begum
UPDATE courses 
SET teacher_id = (SELECT id FROM users WHERE email = 'zerina@iit.du.ac.bd' LIMIT 1)
WHERE name ILIKE '%Software Engineering%' OR code = 'MIT-502';

-- Database Management Systems / DBMS -> Mohammad Shoyaib
UPDATE courses 
SET teacher_id = (SELECT id FROM users WHERE email = 'shoyaib@iit.du.ac.bd' LIMIT 1)
WHERE name ILIKE '%Database Management Systems%' OR name ILIKE '%DBMS%' OR code = 'MIT-503';

-- Computer Networks -> Dr. Md. Shariful Islam
UPDATE courses 
SET teacher_id = (SELECT id FROM users WHERE email = 'shariful@iit.du.ac.bd' LIMIT 1)
WHERE name ILIKE '%Computer Networks%' OR code = 'MIT-504';

-- Operating Systems -> Dr. Naushin Nower
UPDATE courses 
SET teacher_id = (SELECT id FROM users WHERE email = 'naushin@iit.du.ac.bd' LIMIT 1)
WHERE name ILIKE '%Operating Systems%' OR code = 'MIT-505';

-- Machine Learning Fundamentals -> Ahmedul Kabir
UPDATE courses 
SET teacher_id = (SELECT id FROM users WHERE email = 'ahmedul.kabir@iit.du.ac.bd' LIMIT 1)
WHERE name ILIKE '%Machine Learning Fundamentals%' OR code = 'MIT-506';

-- Advanced Machine Learning -> Ahmedul Kabir
UPDATE courses 
SET teacher_id = (SELECT id FROM users WHERE email = 'ahmedul.kabir@iit.du.ac.bd' LIMIT 1)
WHERE name ILIKE '%Advanced Machine Learning%' OR code = 'MIT-602';

-- ML / Machine Learning (General) -> Dr. B M Mainul Hossain
UPDATE courses 
SET teacher_id = (SELECT id FROM users WHERE email = 'mainul@iit.du.ac.bd' LIMIT 1)
WHERE (name ILIKE '%Machine Learning%' AND name NOT ILIKE '%Fundamentals%' AND name NOT ILIKE '%Advanced%')
   OR name = 'ML';

-- Cloud Computing -> Dr. Md. Nurul Ahad Tawhid
UPDATE courses 
SET teacher_id = (SELECT id FROM users WHERE email = 'tawhid@iit.du.ac.bd' LIMIT 1)
WHERE name ILIKE '%Cloud Computing%' OR code = 'MIT-601';

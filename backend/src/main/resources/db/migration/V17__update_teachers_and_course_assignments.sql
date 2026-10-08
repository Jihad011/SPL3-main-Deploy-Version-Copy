-- ============================================================
-- V17: Update Teacher Names and Course Faculty Assignments
-- ============================================================

-- 1. Insert or Update Teacher User Records
INSERT INTO users (name, email, password_hash, role, designation, is_active) VALUES
('Dr. B. M. Mainul Hossain',     'mainul@iit.du.ac.bd',        '$2b$12$6gVdHM3TYhWD9z9OfKswT.cn0F6hKjTGPhQczZqtNeFKqXX9IZj7i', 'TEACHER', 'Professor', true),
('Mohammed Shoyaib',             'shoyaib@iit.du.ac.bd',       '$2b$12$6gVdHM3TYhWD9z9OfKswT.cn0F6hKjTGPhQczZqtNeFKqXX9IZj7i', 'TEACHER', 'Professor', true),
('Dr. Md. Shariful Islam',       'shariful@iit.du.ac.bd',      '$2b$12$6gVdHM3TYhWD9z9OfKswT.cn0F6hKjTGPhQczZqtNeFKqXX9IZj7i', 'TEACHER', 'Professor', true),
('Dr. Zerina Begum',             'zerina@iit.du.ac.bd',        '$2b$12$6gVdHM3TYhWD9z9OfKswT.cn0F6hKjTGPhQczZqtNeFKqXX9IZj7i', 'TEACHER', 'Professor', true),
('Dr. Ahmedul Kabir',            'ahmedul.kabir@iit.du.ac.bd', '$2b$12$6gVdHM3TYhWD9z9OfKswT.cn0F6hKjTGPhQczZqtNeFKqXX9IZj7i', 'TEACHER', 'Associate Professor', true),
('Dr. Md. Nurul Ahad Tawhid',    'tawhid@iit.du.ac.bd',        '$2b$12$6gVdHM3TYhWD9z9OfKswT.cn0F6hKjTGPhQczZqtNeFKqXX9IZj7i', 'TEACHER', 'Associate Professor', true),
('Md. Saeed Siddik',             'saeed@iit.du.ac.bd',         '$2b$12$6gVdHM3TYhWD9z9OfKswT.cn0F6hKjTGPhQczZqtNeFKqXX9IZj7i', 'TEACHER', 'Assistant Professor', true),
('Dr. Kazi Muheymin-Us-Sakib',   'sakib@iit.du.ac.bd',         '$2b$12$6gVdHM3TYhWD9z9OfKswT.cn0F6hKjTGPhQczZqtNeFKqXX9IZj7i', 'TEACHER', 'Professor', true),
('Toukir Ahammed',               'toukir@iit.du.ac.bd',        '$2b$12$6gVdHM3TYhWD9z9OfKswT.cn0F6hKjTGPhQczZqtNeFKqXX9IZj7i', 'TEACHER', 'Lecturer', true)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    designation = EXCLUDED.designation,
    is_active = EXCLUDED.is_active;

-- 2. Update Course Teacher Assignments

-- Advanced Computer Networks & Internetworking (303) -> Dr. Md. Shariful Islam
UPDATE courses 
SET teacher_id = (SELECT id FROM users WHERE email = 'shariful@iit.du.ac.bd' LIMIT 1)
WHERE name ILIKE '%Advanced Computer Networks%' OR code = 'MITM 303';

-- Database Architecture and Administration (304) -> Mohammad Shoyaib
UPDATE courses 
SET teacher_id = (SELECT id FROM users WHERE email = 'shoyaib@iit.du.ac.bd' LIMIT 1)
WHERE name ILIKE '%Database Architecture%' OR code = 'MITM 304';

-- Advanced Data Structures and Algorithms (310) -> Dr. Ahmedul Kabir
UPDATE courses 
SET teacher_id = (SELECT id FROM users WHERE email = 'ahmedul.kabir@iit.du.ac.bd' LIMIT 1)
WHERE name ILIKE '%Advanced Data Structures%' OR code = 'MITM 310';

-- Advanced Object-Oriented Programming (311) -> Dr. B M Mainul Hossain
UPDATE courses 
SET teacher_id = (SELECT id FROM users WHERE email = 'mainul@iit.du.ac.bd' LIMIT 1)
WHERE name ILIKE '%Advanced Object-Oriented%' OR code = 'MITM 311';

-- IT Project Management (301) -> Md. Saeed Siddik
UPDATE courses 
SET teacher_id = (SELECT id FROM users WHERE email = 'saeed@iit.du.ac.bd' LIMIT 1)
WHERE name ILIKE '%IT Project Management%' OR code = 'MITM 301';

-- Web Technology and Internet Computing (305) -> Dr. Md. Nurul Ahad Tawhid
UPDATE courses 
SET teacher_id = (SELECT id FROM users WHERE email = 'tawhid@iit.du.ac.bd' LIMIT 1)
WHERE name ILIKE '%Web Technology%' OR code = 'MITM 305';

-- Project for MIT / Internship (421) -> Dr. Ahmedul Kabir
UPDATE courses 
SET teacher_id = (SELECT id FROM users WHERE email = 'ahmedul.kabir@iit.du.ac.bd' LIMIT 1)
WHERE name ILIKE '%Project for MIT%' OR code = 'MITM 421';

-- Artificial Intelligence (436) -> Dr. Ahmedul Kabir
UPDATE courses 
SET teacher_id = (SELECT id FROM users WHERE email = 'ahmedul.kabir@iit.du.ac.bd' LIMIT 1)
WHERE code = 'MITE 436';

-- Machine Learning (430) -> Dr. B. M. Mainul Hossain
UPDATE courses 
SET teacher_id = (SELECT id FROM users WHERE email = 'mainul@iit.du.ac.bd' LIMIT 1)
WHERE code = 'MITE 430';

-- Data Mining (437) -> Mohammad Shoyaib
UPDATE courses 
SET teacher_id = (SELECT id FROM users WHERE email = 'shoyaib@iit.du.ac.bd' LIMIT 1)
WHERE code = 'MITE 437';

-- Big Data Analytics (431) -> Dr. B. M. Mainul Hossain
UPDATE courses 
SET teacher_id = (SELECT id FROM users WHERE email = 'mainul@iit.du.ac.bd' LIMIT 1)
WHERE code = 'MITE 431';

-- Software Quality Assurance and Testing (434) -> Md. Saeed Siddik
UPDATE courses 
SET teacher_id = (SELECT id FROM users WHERE email = 'saeed@iit.du.ac.bd' LIMIT 1)
WHERE code = 'MITE 434';

-- Software Requirements Engineering and Design (439) -> Dr. Kazi Muheymin-Us-Sakib
UPDATE courses 
SET teacher_id = (SELECT id FROM users WHERE email = 'sakib@iit.du.ac.bd' LIMIT 1)
WHERE code = 'MITE 439';

-- Software Design Pattern (435) -> Toukir Ahammed
UPDATE courses 
SET teacher_id = (SELECT id FROM users WHERE email = 'toukir@iit.du.ac.bd' LIMIT 1)
WHERE code = 'MITE 435';

-- Software Maintenance and Analytics (441) -> Toukir Ahammed
UPDATE courses 
SET teacher_id = (SELECT id FROM users WHERE email = 'toukir@iit.du.ac.bd' LIMIT 1)
WHERE code = 'MITE 441';

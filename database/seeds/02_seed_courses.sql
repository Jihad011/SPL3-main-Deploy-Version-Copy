-- ============================================================
-- Seed: Courses (Official EMIT 3-Semester Curriculum from notice_27-Nov-2025.pdf)
-- ============================================================

INSERT INTO courses (code, name, credit_hours, course_type, max_seats, teacher_id, semester_level, track, description) VALUES
-- 1st Semester Major Courses (4 Mandatory)
('MITM 303', 'Advanced Computer Networks & Internetworking', 3, 'CORE', 200, (SELECT id FROM users WHERE email = 'shariful@iit.du.ac.bd' LIMIT 1), 1, 'Core Major', NULL),
('MITM 304', 'Database Architecture and Administration',     3, 'CORE', 200, (SELECT id FROM users WHERE email = 'shoyaib@iit.du.ac.bd' LIMIT 1), 1, 'Core Major', NULL),
('MITM 310', 'Advanced Data Structures and Algorithms',       3, 'CORE', 200, (SELECT id FROM users WHERE email = 'ahmedul.kabir@iit.du.ac.bd' LIMIT 1), 1, 'Core Major', NULL),
('MITM 311', 'Advanced Object-Oriented Programming',         3, 'CORE', 200, (SELECT id FROM users WHERE email = 'mainul@iit.du.ac.bd' LIMIT 1), 1, 'Core Major', NULL),

-- 2nd Semester Major Courses (2 Mandatory)
('MITM 301', 'IT Project Management',                       3, 'CORE', 200, (SELECT id FROM users WHERE email = 'saeed@iit.du.ac.bd' LIMIT 1), 2, 'Core Major', NULL),
('MITM 305', 'Web Technology and Internet Computing',        3, 'CORE', 200, (SELECT id FROM users WHERE email = 'tawhid@iit.du.ac.bd' LIMIT 1), 2, 'Core Major', NULL),

-- 3rd Semester Major Project / Internship (1 Mandatory, 6 Cr)
('MITM 421', 'Project for MIT / Internship',                 6, 'CORE', 200, (SELECT id FROM users WHERE email = 'ahmedul.kabir@iit.du.ac.bd' LIMIT 1), 3, 'Core Major', NULL),

-- Data Science Track Electives (Available in 2nd & 3rd Semester)
('MITE 436', 'Artificial Intelligence',                     3, 'OPTIONAL', 40, (SELECT id FROM users WHERE email = 'ahmedul.kabir@iit.du.ac.bd' LIMIT 1), NULL, 'Data Science Track', NULL),
('MITE 430', 'Machine Learning',                            3, 'OPTIONAL', 40, (SELECT id FROM users WHERE email = 'mainul@iit.du.ac.bd' LIMIT 1), NULL, 'Data Science Track', NULL),
('MITE 437', 'Data Mining',                                 3, 'OPTIONAL', 40, (SELECT id FROM users WHERE email = 'shoyaib@iit.du.ac.bd' LIMIT 1), NULL, 'Data Science Track', NULL),
('MITE 431', 'Big Data Analytics',                          3, 'OPTIONAL', 40, (SELECT id FROM users WHERE email = 'mainul@iit.du.ac.bd' LIMIT 1), NULL, 'Data Science Track', NULL),

-- Information Security Track Electives (Available in 2nd & 3rd Semester)
('MITE 432', 'Cryptography and Security Mechanisms',        3, 'OPTIONAL', 40, (SELECT id FROM users WHERE email = 'shariful@iit.du.ac.bd' LIMIT 1), NULL, 'Information Security Track', NULL),
('MITE 442', 'Network Security',                            3, 'OPTIONAL', 40, (SELECT id FROM users WHERE email = 'shariful@iit.du.ac.bd' LIMIT 1), NULL, 'Information Security Track', NULL),
('MITE 438', 'Secured Software System',                     3, 'OPTIONAL', 40, (SELECT id FROM users WHERE email = 'shariful@iit.du.ac.bd' LIMIT 1), NULL, 'Information Security Track', NULL),
('MITE 433', 'Cyber Security',                              3, 'OPTIONAL', 40, (SELECT id FROM users WHERE email = 'shariful@iit.du.ac.bd' LIMIT 1), NULL, 'Information Security Track', NULL),

-- Software Engineering Track Electives (Available in 2nd & 3rd Semester)
('MITE 434', 'Software Quality Assurance and Testing',        3, 'OPTIONAL', 40, (SELECT id FROM users WHERE email = 'saeed@iit.du.ac.bd' LIMIT 1), NULL, 'Software Engineering Track', NULL),
('MITE 439', 'Software Requirements Engineering and Design', 3, 'OPTIONAL', 40, (SELECT id FROM users WHERE email = 'sakib@iit.du.ac.bd' LIMIT 1), NULL, 'Software Engineering Track', NULL),
('MITE 435', 'Software Design Pattern',                     3, 'OPTIONAL', 40, (SELECT id FROM users WHERE email = 'toukir@iit.du.ac.bd' LIMIT 1), NULL, 'Software Engineering Track', NULL),
('MITE 441', 'Software Maintenance and Analytics',           3, 'OPTIONAL', 40, (SELECT id FROM users WHERE email = 'toukir@iit.du.ac.bd' LIMIT 1), NULL, 'Software Engineering Track', NULL);

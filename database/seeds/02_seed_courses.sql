-- ============================================================
-- Seed: Courses (CORE + OPTIONAL, realistic IIT Dhaka courses)
-- Teacher IDs: Dr. Nurul Ahad = 2, Dr. Jane Smith = 3
-- ============================================================

INSERT INTO courses (code, name, credit_hours, course_type, max_seats, teacher_id) VALUES
-- CORE courses (no seat limit enforced — max_seats set high)
('MIT-501', 'Advanced Algorithms',                      3, 'CORE',     200, 2),
('MIT-502', 'Software Engineering',                     3, 'CORE',     200, 2),
('MIT-503', 'Database Management Systems',              3, 'CORE',     200, 3),
('MIT-504', 'Computer Networks',                        3, 'CORE',     200, 3),
('MIT-505', 'Operating Systems',                        3, 'CORE',     200, 2),
('MIT-506', 'Machine Learning Fundamentals',            3, 'CORE',     200, 3),

-- OPTIONAL courses (hard cap at 40 seats)
('MIT-601', 'Cloud Computing',                          3, 'OPTIONAL',  40, 2),
('MIT-602', 'Cybersecurity & Ethical Hacking',          3, 'OPTIONAL',  40, 3),
('MIT-603', 'Mobile Application Development',           3, 'OPTIONAL',  40, 2),
('MIT-604', 'Natural Language Processing',              3, 'OPTIONAL',  40, 3),
('MIT-605', 'Blockchain Technology',                    3, 'OPTIONAL',  40, 2),
('MIT-606', 'Internet of Things',                       3, 'OPTIONAL',  40, 3),
('MIT-607', 'Computer Vision',                          3, 'OPTIONAL',  40, 2),
('MIT-608', 'Big Data Analytics',                       3, 'OPTIONAL',  40, 3),

-- 1-credit seminar / lab courses
('MIT-701', 'Research Methods & Writing',               1, 'CORE',     200, 2),
('MIT-702', 'Professional Ethics in Technology',        1, 'OPTIONAL',  40, 3),
('MIT-703', 'Project Lab I',                            2, 'CORE',     200, 2),
('MIT-704', 'Project Lab II',                           2, 'CORE',     200, 3);

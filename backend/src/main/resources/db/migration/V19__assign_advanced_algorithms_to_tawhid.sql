-- ============================================================
-- V19: Assign Advanced Algorithms to Dr. Md. Nurul Ahad Tawhid
-- ============================================================

UPDATE courses 
SET teacher_id = (SELECT id FROM users WHERE email = 'tawhid@iit.du.ac.bd' LIMIT 1)
WHERE name ILIKE '%Advanced Algorithms%' OR code = 'MIT-501';

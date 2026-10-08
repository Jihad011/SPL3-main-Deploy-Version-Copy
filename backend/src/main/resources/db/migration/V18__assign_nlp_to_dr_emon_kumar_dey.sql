-- ============================================================
-- V18: Assign Natural Language Processing (NLP) to Dr. Emon Kumar Dey
-- ============================================================

-- 1. Insert or Update Teacher Dr. Emon Kumar Dey
INSERT INTO users (name, email, password_hash, role, designation, is_active) VALUES
('Dr. Emon Kumar Dey', 'emon@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'TEACHER', 'Assistant Professor', true)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    designation = EXCLUDED.designation,
    is_active = EXCLUDED.is_active;

-- 2. Update Natural Language Processing course
UPDATE courses 
SET teacher_id = (SELECT id FROM users WHERE email = 'emon@iit.du.ac.bd' LIMIT 1)
WHERE name ILIKE '%Natural Language Processing%' OR name ILIKE '%NLP%' OR code = 'MITE 431';

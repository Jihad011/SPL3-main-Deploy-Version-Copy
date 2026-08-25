-- ============================================================
-- V15: Seed Courses & 40 Enrolled Students into MIT-501
-- ============================================================

-- 1. Ensure courses exist
INSERT INTO courses (code, name, credit_hours, course_type, max_seats, teacher_id) VALUES
('MIT-501', 'Advanced Algorithms',                      3, 'CORE',     40, 2),
('MIT-502', 'Software Engineering',                     3, 'CORE',     40, 2),
('MIT-503', 'Database Management Systems',              3, 'CORE',     40, 3),
('MIT-504', 'Computer Networks',                        3, 'CORE',     40, 3),
('MIT-505', 'Operating Systems',                        3, 'CORE',     40, 2),
('MIT-506', 'Machine Learning Fundamentals',            3, 'CORE',     40, 3),
('MIT-603', 'Mobile Application Development',           3, 'OPTIONAL', 40, 2),
('MIT-604', 'Natural Language Processing',              3, 'OPTIONAL', 40, 3)
ON CONFLICT (code) DO NOTHING;

UPDATE courses SET max_seats = 40;

-- 2. Seed 40 Students (BSSE1201-BSSE1239 + 1413)
INSERT INTO users (name, email, password_hash, role, roll_number, registration_number, phone, batch) VALUES
('Arefin Shuvo',        'bsse1201@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1201', 'REG-2024-1201', '01710001201', 2024),
('Tanvir Ahmed',        'bsse1202@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1202', 'REG-2024-1202', '01710001202', 2024),
('Sakib Al Hasan',      'bsse1203@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1203', 'REG-2024-1203', '01710001203', 2024),
('Nusrat Jahan',        'bsse1204@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1204', 'REG-2024-1204', '01710001204', 2024),
('Mehedi Hasan',        'bsse1205@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1205', 'REG-2024-1205', '01710001205', 2024),
('Farhana Akter',       'bsse1206@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1206', 'REG-2024-1206', '01710001206', 2024),
('Sabbir Rahman',       'bsse1207@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1207', 'REG-2024-1207', '01710001207', 2024),
('Anika Tabassum',      'bsse1208@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1208', 'REG-2024-1208', '01710001208', 2024),
('Mahmudul Hasan',      'bsse1209@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1209', 'REG-2024-1209', '01710001209', 2024),
('Tasnim Rahman',       'bsse1210@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1210', 'REG-2024-1210', '01710001210', 2024),
('Rifat Hossain',       'bsse1211@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1211', 'REG-2024-1211', '01710001211', 2024),
('Samiul Islam',        'bsse1212@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1212', 'REG-2024-1212', '01710001212', 2024),
('Nazmul Huda',         'bsse1213@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1213', 'REG-2024-1213', '01710001213', 2024),
('Sumaiya Akter',       'bsse1214@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1214', 'REG-2024-1214', '01710001214', 2024),
('Shahriar Kabir',      'bsse1215@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1215', 'REG-2024-1215', '01710001215', 2024),
('Arifur Rahman',       'bsse1216@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1216', 'REG-2024-1216', '01710001216', 2024),
('Sharmin Sultana',     'bsse1217@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1217', 'REG-2024-1217', '01710001217', 2024),
('Fahim Faysal',        'bsse1218@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1218', 'REG-2024-1218', '01710001218', 2024),
('Sadia Afrin',         'bsse1219@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1219', 'REG-2024-1219', '01710001219', 2024),
('Zubair Ahmed',        'bsse1220@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1220', 'REG-2024-1220', '01710001220', 2024),
('Tahmidur Rahman',     'bsse1221@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1221', 'REG-2024-1221', '01710001221', 2024),
('Rumana Yasmin',       'bsse1222@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1222', 'REG-2024-1222', '01710001222', 2024),
('Ashikur Rahman',      'bsse1223@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1223', 'REG-2024-1223', '01710001223', 2024),
('Nabila Islam',        'bsse1224@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1224', 'REG-2024-1224', '01710001224', 2024),
('Hasan Mahmud',        'bsse1225@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1225', 'REG-2024-1225', '01710001225', 2024),
('Tanzina Akter',       'bsse1226@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1226', 'REG-2024-1226', '01710001226', 2024),
('Kazi Nazrul',         'bsse1227@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1227', 'REG-2024-1227', '01710001227', 2024),
('Jannatul Ferdous',    'bsse1228@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1228', 'REG-2024-1228', '01710001228', 2024),
('Shakil Ahmed',        'bsse1229@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1229', 'REG-2024-1229', '01710001229', 2024),
('Mst. Marufa',         'bsse1230@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1230', 'REG-2024-1230', '01710001230', 2024),
('Al Amin',             'bsse1231@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1231', 'REG-2024-1231', '01710001231', 2024),
('Tamim Iqbal',         'bsse1232@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1232', 'REG-2024-1232', '01710001232', 2024),
('Mushfiqur Rahim',     'bsse1233@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1233', 'REG-2024-1233', '01710001233', 2024),
('Mustafizur Rahman',   'bsse1234@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1234', 'REG-2024-1234', '01710001234', 2024),
('Taskin Ahmed',        'bsse1235@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1235', 'REG-2024-1235', '01710001235', 2024),
('Liton Das',           'bsse1236@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1236', 'REG-2024-1236', '01710001236', 2024),
('Soumya Sarkar',       'bsse1237@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1237', 'REG-2024-1237', '01710001237', 2024),
('Mehidy Hasan Miraz',  'bsse1238@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1238', 'REG-2024-1238', '01710001238', 2024),
('Shoriful Islam',      'bsse1239@iit.du.ac.bd', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', 'BSSE1239', 'REG-2024-1239', '01710001239', 2024)
ON CONFLICT (roll_number) DO NOTHING;

-- 3. Enroll 40 students ONLY into MIT-501 (Course ID 3)
INSERT INTO enrollments (student_id, course_id, semester_id, status, is_retake)
SELECT u.id, (SELECT id FROM courses WHERE code = 'MIT-501'), (SELECT id FROM semesters WHERE is_active = TRUE ORDER BY id DESC LIMIT 1), 'ACTIVE', FALSE
FROM users u
WHERE u.role = 'STUDENT'
  AND u.roll_number IN (
    '1413', 'BSSE1201', 'BSSE1202', 'BSSE1203', 'BSSE1204', 'BSSE1205', 'BSSE1206', 'BSSE1207', 'BSSE1208', 'BSSE1209',
    'BSSE1210', 'BSSE1211', 'BSSE1212', 'BSSE1213', 'BSSE1214', 'BSSE1215', 'BSSE1216', 'BSSE1217', 'BSSE1218', 'BSSE1219',
    'BSSE1220', 'BSSE1221', 'BSSE1222', 'BSSE1223', 'BSSE1224', 'BSSE1225', 'BSSE1226', 'BSSE1227', 'BSSE1228', 'BSSE1229',
    'BSSE1230', 'BSSE1231', 'BSSE1232', 'BSSE1233', 'BSSE1234', 'BSSE1235', 'BSSE1236', 'BSSE1237', 'BSSE1238', 'BSSE1239'
  )
ON CONFLICT (student_id, course_id, semester_id) DO NOTHING;

-- 4. Update current_enrollment count
UPDATE courses c SET current_enrollment = (SELECT count(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'ACTIVE');

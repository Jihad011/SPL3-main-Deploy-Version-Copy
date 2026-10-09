-- ============================================================
-- V26: Align enrollment semester_id to matching semester levels
-- Ensures Level 1 courses belong to First Semester, Level 2 to Second Semester,
-- and Level 3 to Third Semester.
-- ============================================================

UPDATE enrollments e
SET semester_id = s.id
FROM semesters s
WHERE COALESCE(e.target_semester_level, 1) = 1 AND s.name = 'FIRST_SEMESTER';

UPDATE enrollments e
SET semester_id = s.id
FROM semesters s
WHERE e.target_semester_level = 2 AND s.name = 'SECOND_SEMESTER';

UPDATE enrollments e
SET semester_id = s.id
FROM semesters s
WHERE e.target_semester_level = 3 AND s.name = 'THIRD_SEMESTER';

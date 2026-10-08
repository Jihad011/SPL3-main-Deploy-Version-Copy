-- Reassign enrollments from semester 4 to semester 3 if any
UPDATE enrollments SET semester_id = 3 WHERE semester_id > 3;

-- Delete extra semesters
DELETE FROM semesters WHERE id > 3;

-- Update semester names to exact Enum names
UPDATE semesters SET name = 'FIRST_SEMESTER' WHERE id = 1;
UPDATE semesters SET name = 'SECOND_SEMESTER' WHERE id = 2;
UPDATE semesters SET name = 'THIRD_SEMESTER' WHERE id = 3;

SELECT id, name, year, is_active FROM semesters ORDER BY id;

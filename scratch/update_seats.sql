UPDATE courses SET max_seats = 40;
SELECT id, code, name, course_type, max_seats, current_enrollment FROM courses ORDER BY id;

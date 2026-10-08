UPDATE semesters 
SET name = CASE 
    WHEN name IN ('Y1S1', 'SPRING', 'SPRING_2026', '1st Semester') THEN 'FIRST_SEMESTER'
    WHEN name IN ('Y1S2', 'FALL', 'FALL_2026', '2nd Semester') THEN 'SECOND_SEMESTER'
    WHEN name IN ('Y2S1', 'SUMMER', '3rd Semester') THEN 'THIRD_SEMESTER'
    ELSE 'FIRST_SEMESTER'
END;

SELECT id, name, year FROM semesters;

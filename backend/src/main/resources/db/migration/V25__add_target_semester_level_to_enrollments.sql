-- ============================================================
-- V25: Add target_semester_level to enrollments table and update trigger
-- ============================================================

ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS target_semester_level INT DEFAULT 1;

-- Backfill existing enrollments target_semester_level based on course
UPDATE enrollments e
SET target_semester_level = CASE
    WHEN c.code IN ('MITM 303', 'MITM 304', 'MITM 310', 'MITM 311') THEN 1
    WHEN c.code IN ('MITM 301', 'MITM 305') THEN 2
    WHEN c.code = 'MITM 421' THEN 3
    WHEN c.semester_level IS NOT NULL THEN c.semester_level
    ELSE 2
END
FROM courses c
WHERE e.course_id = c.id;

-- Update trigger function check_credit_limit to check limit PER TARGET SEMESTER LEVEL
CREATE OR REPLACE FUNCTION check_credit_limit()
RETURNS TRIGGER AS $$
DECLARE
    total_credits  INT;
    course_credits INT;
    max_credits    CONSTANT INT := 12;
    target_lvl     INT;
BEGIN
    SELECT credit_hours INTO course_credits
    FROM courses WHERE id = NEW.course_id;

    target_lvl := COALESCE(NEW.target_semester_level, 1);

    SELECT COALESCE(SUM(c.credit_hours), 0) INTO total_credits
    FROM enrollments e
    JOIN courses c ON c.id = e.course_id
    WHERE e.student_id  = NEW.student_id
      AND e.semester_id = NEW.semester_id
      AND COALESCE(e.target_semester_level, 1) = target_lvl
      AND e.status      = 'ACTIVE'
      AND e.id          != COALESCE(NEW.id, -1);

    IF (total_credits + course_credits) > max_credits THEN
        RAISE EXCEPTION
            'Credit limit exceeded: student already has % credits in Semester %. Adding % would exceed the % credit limit.',
            total_credits, target_lvl, course_credits, max_credits;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

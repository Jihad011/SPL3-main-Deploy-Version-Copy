-- ============================================================
-- V5: Create grades table
-- Stores midterm/final marks; triggers compute grade & GPA
-- Grading scale: IIT Dhaka standard
-- ============================================================

CREATE TYPE grade_letter AS ENUM ('A', 'A_MINUS', 'B_PLUS', 'B', 'B_MINUS', 'C_PLUS', 'C', 'D', 'F');

CREATE TABLE grades (
    id              BIGSERIAL PRIMARY KEY,
    enrollment_id   BIGINT          NOT NULL UNIQUE REFERENCES enrollments(id) ON DELETE CASCADE,

    -- Mark components
    midterm_marks   NUMERIC(5,2)    CHECK (midterm_marks  >= 0 AND midterm_marks  <= 40),
    final_marks     NUMERIC(5,2)    CHECK (final_marks    >= 0 AND final_marks    <= 60),
    total_marks     NUMERIC(5,2)    GENERATED ALWAYS AS (
                        COALESCE(midterm_marks, 0) + COALESCE(final_marks, 0)
                    ) STORED,

    -- Computed by trigger
    grade_letter    grade_letter,
    grade_point     NUMERIC(3,2)    CHECK (grade_point >= 0.00 AND grade_point <= 4.00),

    entered_by      BIGINT          REFERENCES users(id) ON DELETE SET NULL,  -- teacher
    entered_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_grades_enrollment ON grades (enrollment_id);
CREATE INDEX idx_grades_entered_by ON grades (entered_by);

-- ============================================================
-- Function: Map total marks → grade letter + grade point
-- IIT Dhaka standard scale
-- ============================================================

CREATE OR REPLACE FUNCTION compute_grade(total NUMERIC)
RETURNS TABLE(letter grade_letter, point NUMERIC) AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE
            WHEN total >= 80 THEN 'A'::grade_letter
            WHEN total >= 75 THEN 'A_MINUS'::grade_letter
            WHEN total >= 70 THEN 'B_PLUS'::grade_letter
            WHEN total >= 65 THEN 'B'::grade_letter
            WHEN total >= 60 THEN 'B_MINUS'::grade_letter
            WHEN total >= 55 THEN 'C_PLUS'::grade_letter
            WHEN total >= 50 THEN 'C'::grade_letter
            WHEN total >= 45 THEN 'D'::grade_letter
            ELSE                   'F'::grade_letter
        END,
        CASE
            WHEN total >= 80 THEN 4.00
            WHEN total >= 75 THEN 3.75
            WHEN total >= 70 THEN 3.50
            WHEN total >= 65 THEN 3.00
            WHEN total >= 60 THEN 2.75
            WHEN total >= 55 THEN 2.50
            WHEN total >= 50 THEN 2.25
            WHEN total >= 45 THEN 2.00
            ELSE                   0.00
        END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- Trigger: Auto-compute grade when marks are inserted/updated
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_compute_grade()
RETURNS TRIGGER AS $$
DECLARE
    g RECORD;
    computed_total NUMERIC;
BEGIN
    computed_total := COALESCE(NEW.midterm_marks, 0) + COALESCE(NEW.final_marks, 0);

    -- Only compute grade if both components are present
    IF NEW.midterm_marks IS NOT NULL AND NEW.final_marks IS NOT NULL THEN
        SELECT * INTO g FROM compute_grade(computed_total);
        NEW.grade_letter := g.letter;
        NEW.grade_point  := g.point;
        NEW.updated_at   := NOW();

        -- Update enrollment status based on grade
        UPDATE enrollments
        SET status     = CASE WHEN g.point = 0 THEN 'FAILED'::enrollment_status
                              ELSE 'COMPLETED'::enrollment_status END,
            updated_at = NOW()
        WHERE id = NEW.enrollment_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_compute_grade
    BEFORE INSERT OR UPDATE ON grades
    FOR EACH ROW EXECUTE FUNCTION trigger_compute_grade();

-- ============================================================
-- View: Student CGPA (weighted average across all semesters)
-- ============================================================

CREATE OR REPLACE VIEW v_student_cgpa AS
SELECT
    e.student_id,
    ROUND(
        SUM(g.grade_point * c.credit_hours)::NUMERIC /
        NULLIF(SUM(c.credit_hours), 0),
    2) AS cgpa,
    SUM(c.credit_hours)  AS total_credits_earned,
    COUNT(g.id)          AS courses_graded
FROM grades g
JOIN enrollments e ON e.id = g.enrollment_id
JOIN courses     c ON c.id = e.course_id
WHERE g.grade_point IS NOT NULL
  AND e.status IN ('COMPLETED', 'FAILED')
GROUP BY e.student_id;

COMMENT ON TABLE  grades               IS 'Midterm + final marks per enrollment. Grade is auto-computed via trigger.';
COMMENT ON COLUMN grades.total_marks   IS 'Computed column: midterm_marks + final_marks (max 100).';
COMMENT ON COLUMN grades.grade_letter  IS 'Auto-computed from total_marks using IIT Dhaka grading scale.';
COMMENT ON VIEW   v_student_cgpa       IS 'Live CGPA view — weighted average of all graded courses per student.';

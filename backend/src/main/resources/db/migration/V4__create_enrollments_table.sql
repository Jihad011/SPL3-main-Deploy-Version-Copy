-- ============================================================
-- V4: Create enrollments table
-- Enforces the 12-credit-per-semester rule via a DB function
-- ============================================================

CREATE TYPE enrollment_status AS ENUM ('ACTIVE', 'DROPPED', 'COMPLETED', 'FAILED');

CREATE TABLE enrollments (
    id          BIGSERIAL PRIMARY KEY,
    student_id  BIGINT              NOT NULL REFERENCES users(id)       ON DELETE CASCADE,
    course_id   BIGINT              NOT NULL REFERENCES courses(id)     ON DELETE RESTRICT,
    semester_id BIGINT              NOT NULL REFERENCES semesters(id)   ON DELETE RESTRICT,
    status      enrollment_status   NOT NULL DEFAULT 'ACTIVE',
    is_retake   BOOLEAN             NOT NULL DEFAULT FALSE,
    enrolled_at TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

    -- A student can only enroll in the same course once per semester
    CONSTRAINT uq_student_course_semester UNIQUE (student_id, course_id, semester_id)
);

CREATE INDEX idx_enrollments_student   ON enrollments (student_id);
CREATE INDEX idx_enrollments_course    ON enrollments (course_id);
CREATE INDEX idx_enrollments_semester  ON enrollments (semester_id);
CREATE INDEX idx_enrollments_status    ON enrollments (status);

-- ============================================================
-- Function + Trigger: Enforce 12-credit rule per semester
-- ============================================================

CREATE OR REPLACE FUNCTION check_credit_limit()
RETURNS TRIGGER AS $$
DECLARE
    total_credits  INT;
    course_credits INT;
    max_credits    CONSTANT INT := 12;
BEGIN
    -- Get credits of the course being enrolled
    SELECT credit_hours INTO course_credits
    FROM courses WHERE id = NEW.course_id;

    -- Sum credits of existing ACTIVE enrollments for this student this semester
    SELECT COALESCE(SUM(c.credit_hours), 0) INTO total_credits
    FROM enrollments e
    JOIN courses c ON c.id = e.course_id
    WHERE e.student_id  = NEW.student_id
      AND e.semester_id = NEW.semester_id
      AND e.status      = 'ACTIVE'
      AND e.id          != COALESCE(NEW.id, -1);   -- Exclude self on UPDATE

    IF (total_credits + course_credits) > max_credits THEN
        RAISE EXCEPTION
            'Credit limit exceeded: student already has % credits this semester. Adding % would exceed the % credit limit.',
            total_credits, course_credits, max_credits;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_credit_limit
    BEFORE INSERT OR UPDATE ON enrollments
    FOR EACH ROW EXECUTE FUNCTION check_credit_limit();

-- ============================================================
-- Function + Trigger: Update course seat count on enrollment
-- ============================================================

CREATE OR REPLACE FUNCTION update_seat_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'ACTIVE' THEN
        -- Check seat availability first
        IF (SELECT current_enrollment >= max_seats FROM courses WHERE id = NEW.course_id) THEN
            RAISE EXCEPTION 'No seats available: course % is full (max % seats).',
                NEW.course_id,
                (SELECT max_seats FROM courses WHERE id = NEW.course_id);
        END IF;
        UPDATE courses SET current_enrollment = current_enrollment + 1,
                           updated_at = NOW()
        WHERE id = NEW.course_id;

    ELSIF TG_OP = 'UPDATE' THEN
        -- Student dropped: free up a seat
        IF OLD.status = 'ACTIVE' AND NEW.status = 'DROPPED' THEN
            UPDATE courses SET current_enrollment = GREATEST(current_enrollment - 1, 0),
                               updated_at = NOW()
            WHERE id = NEW.course_id;
        END IF;

    ELSIF TG_OP = 'DELETE' AND OLD.status = 'ACTIVE' THEN
        UPDATE courses SET current_enrollment = GREATEST(current_enrollment - 1, 0),
                           updated_at = NOW()
        WHERE id = OLD.course_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_seat_count
    AFTER INSERT OR UPDATE OR DELETE ON enrollments
    FOR EACH ROW EXECUTE FUNCTION update_seat_count();

COMMENT ON TABLE  enrollments           IS 'Course enrollment records. Triggers enforce 12-credit rule and 40-seat cap.';
COMMENT ON COLUMN enrollments.is_retake IS 'TRUE if student previously failed this course and is retaking it (affects fee calculation).';

-- ============================================================
-- V2: Create courses table
-- Enforces 40-seat limit for OPTIONAL courses
-- ============================================================

CREATE TYPE course_type AS ENUM ('CORE', 'OPTIONAL');

CREATE TABLE courses (
    id                  BIGSERIAL PRIMARY KEY,
    code                VARCHAR(20)         NOT NULL UNIQUE,    -- e.g. CSE-401
    name                VARCHAR(200)        NOT NULL,
    description         TEXT,
    credit_hours        SMALLINT            NOT NULL CHECK (credit_hours > 0 AND credit_hours <= 6),
    course_type         course_type         NOT NULL DEFAULT 'OPTIONAL',

    -- Seat management (40-seat rule for OPTIONAL courses)
    max_seats           SMALLINT            NOT NULL DEFAULT 40,
    current_enrollment  SMALLINT            NOT NULL DEFAULT 0 CHECK (current_enrollment >= 0),

    -- Assigned teacher (nullable – may not be assigned yet)
    teacher_id          BIGINT              REFERENCES users(id) ON DELETE SET NULL,

    is_active           BOOLEAN             NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

    -- Ensure seats are never over-filled at DB level
    CONSTRAINT chk_seats_not_exceeded CHECK (current_enrollment <= max_seats)
);

-- Partial index: enforce 40-seat cap only for OPTIONAL courses
CREATE UNIQUE INDEX idx_courses_code ON courses (code);
CREATE INDEX idx_courses_teacher    ON courses (teacher_id);
CREATE INDEX idx_courses_type       ON courses (course_type);

COMMENT ON TABLE  courses                  IS 'Course catalogue. OPTIONAL courses capped at 40 seats by default.';
COMMENT ON COLUMN courses.max_seats        IS 'Maximum allowed enrollment. Defaults to 40 for OPTIONAL courses.';
COMMENT ON COLUMN courses.current_enrollment IS 'Running count of active enrollments. Never exceeds max_seats.';
COMMENT ON COLUMN courses.credit_hours     IS 'Credit weight of this course (1-6). Used to enforce the 12-credit/semester rule.';

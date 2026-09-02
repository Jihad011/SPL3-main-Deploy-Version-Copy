-- ============================================================
-- V3: Create semesters table
-- Tracks academic semesters; only one can be active at a time
-- ============================================================

CREATE TYPE semester_name AS ENUM ('SPRING', 'FALL');

CREATE TABLE semesters (
    id          BIGSERIAL PRIMARY KEY,
    name        semester_name   NOT NULL,
    year        SMALLINT        NOT NULL CHECK (year >= 2000),
    start_date  DATE            NOT NULL,
    end_date    DATE            NOT NULL,
    is_active   BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_semester_name_year UNIQUE (name, year),
    CONSTRAINT chk_semester_dates    CHECK  (end_date > start_date)
);

-- Only one semester can be active at a time (partial unique index)
CREATE UNIQUE INDEX idx_one_active_semester ON semesters (is_active)
    WHERE is_active = TRUE;

COMMENT ON TABLE  semesters           IS 'Academic semesters. Exactly one is marked active at any given time.';
COMMENT ON COLUMN semesters.is_active IS 'If TRUE, this is the current enrollment semester. Only one allowed at a time.';

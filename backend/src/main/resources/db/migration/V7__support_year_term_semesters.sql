-- ============================================================
-- V7: Support Multiple Concurrent Active Semesters & Year-Term Structure
-- ============================================================

-- 1. Drop single-active semester constraint to allow multiple semesters running concurrently
DROP INDEX IF EXISTS idx_one_active_semester;

-- 2. Convert name column to VARCHAR(50) to support Y1S1, Y1S2, Y2S1, Y2S2, etc.
ALTER TABLE semesters ALTER COLUMN name TYPE VARCHAR(50);

-- 3. Seed Year-Term Semesters for 1st Year (Y1S1, Y1S2) and 2nd Year (Y2S1, Y2S2)
INSERT INTO semesters (name, year, start_date, end_date, is_active) VALUES
('Y1S1', 2026, '2026-01-01', '2026-06-30', TRUE),
('Y1S2', 2026, '2026-07-01', '2026-12-31', TRUE),
('Y2S1', 2026, '2026-01-01', '2026-06-30', FALSE),
('Y2S2', 2026, '2026-07-01', '2026-12-31', FALSE)
ON CONFLICT (name, year) DO UPDATE SET is_active = EXCLUDED.is_active;

COMMENT ON TABLE semesters IS 'Academic semesters supporting concurrent active terms across batches (Y1S1, Y1S2, etc.).';

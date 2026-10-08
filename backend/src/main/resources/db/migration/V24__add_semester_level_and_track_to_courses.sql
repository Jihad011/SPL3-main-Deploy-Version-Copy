-- ============================================================
-- V24: Add semester_level and track columns to courses table
-- ============================================================

ALTER TABLE courses ADD COLUMN IF NOT EXISTS semester_level INT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS track VARCHAR(100);

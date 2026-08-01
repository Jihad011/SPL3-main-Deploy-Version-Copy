-- Add version column to support optimistic locking
ALTER TABLE courses ADD COLUMN version BIGINT DEFAULT 0;

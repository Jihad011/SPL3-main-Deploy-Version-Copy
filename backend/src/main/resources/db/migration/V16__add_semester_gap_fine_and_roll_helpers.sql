-- ============================================================
-- V16: Add indexes & support for dynamic roll and gap billing
-- ============================================================

-- Add indexes for roll number and batch search performance
CREATE INDEX IF NOT EXISTS idx_users_roll_number ON users(roll_number);
CREATE INDEX IF NOT EXISTS idx_users_registration_number ON users(registration_number);
CREATE INDEX IF NOT EXISTS idx_users_batch ON users(batch);

-- Ensure index on fees for student and type
CREATE INDEX IF NOT EXISTS idx_fees_student_type ON fees(student_id, fee_type);

-- Ensure index on enrollments for student and semester
CREATE INDEX IF NOT EXISTS idx_enrollments_student_semester ON enrollments(student_id, semester_id);

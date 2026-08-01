-- Relax the rigid 40/60 split for midterm and final marks to allow 50/50 or other splits
-- Drop the old constraints
ALTER TABLE grades DROP CONSTRAINT IF EXISTS grades_midterm_marks_check;
ALTER TABLE grades DROP CONSTRAINT IF EXISTS grades_final_marks_check;

-- Add flexible constraints (max 100 per component, but combined sum must be <= 100)
ALTER TABLE grades ADD CONSTRAINT grades_midterm_marks_check CHECK (midterm_marks >= 0 AND midterm_marks <= 100);
ALTER TABLE grades ADD CONSTRAINT grades_final_marks_check CHECK (final_marks >= 0 AND final_marks <= 100);
ALTER TABLE grades ADD CONSTRAINT grades_total_sum_check CHECK (COALESCE(midterm_marks, 0) + COALESCE(final_marks, 0) <= 100);

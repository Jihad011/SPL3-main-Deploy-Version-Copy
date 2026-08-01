-- ============================================================
-- V12: Update grading scale to match University of Dhaka
-- ============================================================

-- Add A_PLUS to the enum BEFORE A
ALTER TYPE grade_letter ADD VALUE 'A_PLUS' BEFORE 'A';

-- Update the grading function to match the DU scale
CREATE OR REPLACE FUNCTION compute_grade(total NUMERIC)
RETURNS TABLE(letter grade_letter, point NUMERIC) AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE
            WHEN total >= 80 THEN 'A_PLUS'::grade_letter
            WHEN total >= 75 THEN 'A'::grade_letter
            WHEN total >= 70 THEN 'A_MINUS'::grade_letter
            WHEN total >= 65 THEN 'B_PLUS'::grade_letter
            WHEN total >= 60 THEN 'B'::grade_letter
            WHEN total >= 55 THEN 'B_MINUS'::grade_letter
            WHEN total >= 50 THEN 'C_PLUS'::grade_letter
            WHEN total >= 45 THEN 'C'::grade_letter
            WHEN total >= 40 THEN 'D'::grade_letter
            ELSE                   'F'::grade_letter
        END,
        CASE
            WHEN total >= 80 THEN 4.00
            WHEN total >= 75 THEN 3.75
            WHEN total >= 70 THEN 3.50
            WHEN total >= 65 THEN 3.25
            WHEN total >= 60 THEN 3.00
            WHEN total >= 55 THEN 2.75
            WHEN total >= 50 THEN 2.50
            WHEN total >= 45 THEN 2.25
            WHEN total >= 40 THEN 2.00
            ELSE                   0.00
        END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

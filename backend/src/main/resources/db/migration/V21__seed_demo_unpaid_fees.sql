-- ============================================================
-- V21: Seed sample unpaid fees for demo & testing
-- Ensures students have test invoices to evaluate SSLCommerz
-- ============================================================

INSERT INTO fees (student_id, fee_type, amount, description, status, due_date, created_at, updated_at)
SELECT 
    id, 
    'REGISTRATION'::fee_type, 
    500.00, 
    'Semester Registration Fee — Term Enrollment 2026', 
    'UNPAID'::fee_status, 
    CURRENT_DATE + INTERVAL '30 days',
    NOW(),
    NOW()
FROM users 
WHERE role = 'STUDENT'
  AND NOT EXISTS (
      SELECT 1 FROM fees f WHERE f.student_id = users.id AND f.fee_type = 'REGISTRATION'
  );

INSERT INTO fees (student_id, fee_type, amount, description, status, due_date, created_at, updated_at)
SELECT 
    id, 
    'OTHER'::fee_type, 
    1200.00, 
    'Lab & Information Technology Usage Fee', 
    'UNPAID'::fee_status, 
    CURRENT_DATE + INTERVAL '15 days',
    NOW(),
    NOW()
FROM users 
WHERE role = 'STUDENT'
  AND NOT EXISTS (
      SELECT 1 FROM fees f WHERE f.student_id = users.id AND f.fee_type = 'OTHER'
  );

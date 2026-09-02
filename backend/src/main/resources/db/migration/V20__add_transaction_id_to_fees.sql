-- ============================================================
-- V20: Add transaction_id column to fees table for payment gateways
-- ============================================================

ALTER TABLE fees ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_fees_transaction_id ON fees(transaction_id);

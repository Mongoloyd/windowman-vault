-- ============================================
-- ROLLBACK: Remove Dual-Path Funnel Columns
-- Date: 2026-01-30
-- Description: Reverses all changes from 001_add_dual_path_columns.sql
-- WARNING: This will DELETE data in these columns permanently
-- ============================================

-- Drop indexes first
DROP INDEX IF EXISTS idx_verification_codes_phone_code;
DROP INDEX IF EXISTS idx_verification_codes_lead_id;
DROP INDEX IF EXISTS idx_verification_codes_expires_at;
DROP INDEX IF EXISTS idx_leads_lead_value_score;
DROP INDEX IF EXISTS idx_leads_path_type;

-- Drop verification_codes table
DROP TABLE IF EXISTS verification_codes;

-- Remove columns from leads table
ALTER TABLE leads DROP COLUMN IF EXISTS path_type;
ALTER TABLE leads DROP COLUMN IF EXISTS is_homeowner;
ALTER TABLE leads DROP COLUMN IF EXISTS window_count;
ALTER TABLE leads DROP COLUMN IF EXISTS timeline_urgency;
ALTER TABLE leads DROP COLUMN IF EXISTS sms_verified;
ALTER TABLE leads DROP COLUMN IF EXISTS ocr_city;
ALTER TABLE leads DROP COLUMN IF EXISTS phone_submitted_at;
ALTER TABLE leads DROP COLUMN IF EXISTS sms_verified_at;
ALTER TABLE leads DROP COLUMN IF EXISTS lead_value_score;

-- ============================================
-- MIGRATION: Add Dual-Path Funnel Columns
-- Date: 2026-01-30
-- Description: Adds columns for Path Alpha/Beta funnel and SMS verification
-- ============================================

-- Add new columns to existing 'leads' table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS path_type TEXT DEFAULT 'alpha';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_homeowner BOOLEAN;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS window_count TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS timeline_urgency TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sms_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ocr_city TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone_submitted_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sms_verified_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_value_score INTEGER DEFAULT 0;

-- Create verification_codes table for SMS PIN storage
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast code lookup
CREATE INDEX IF NOT EXISTS idx_verification_codes_phone_code ON verification_codes(phone, code);
CREATE INDEX IF NOT EXISTS idx_verification_codes_lead_id ON verification_codes(lead_id);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON verification_codes(expires_at);

-- Index for lead value queries (for Meta pixel optimization)
CREATE INDEX IF NOT EXISTS idx_leads_lead_value_score ON leads(lead_value_score);
CREATE INDEX IF NOT EXISTS idx_leads_path_type ON leads(path_type);

-- Add comments for documentation
COMMENT ON COLUMN leads.path_type IS 'Funnel path: alpha (quote auditors) or beta (researchers)';
COMMENT ON COLUMN leads.is_homeowner IS 'Golden signal for Facebook optimization';
COMMENT ON COLUMN leads.window_count IS 'Options: 1-5, 6-10, 11-15, entire_home';
COMMENT ON COLUMN leads.timeline_urgency IS 'Options: asap, 1_3_months, 3_6_months, researching';
COMMENT ON COLUMN leads.sms_verified IS 'Whether phone has been verified via SMS PIN';
COMMENT ON COLUMN leads.ocr_city IS 'City extracted from quote via OCR';
COMMENT ON COLUMN leads.lead_value_score IS 'Calculated value for Meta pixel (0-500)';
COMMENT ON TABLE verification_codes IS 'Stores SMS verification codes with expiration';

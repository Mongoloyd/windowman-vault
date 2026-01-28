-- =====================================================
-- VAULT LEAD GATE: Database Migrations
-- Run these in your Supabase SQL Editor
-- =====================================================

-- 1. Create scans table
CREATE TABLE IF NOT EXISTS public.scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- File metadata
  file_bucket TEXT,
  file_path TEXT,
  file_mime TEXT,
  file_size INTEGER,
  file_sha256 TEXT,
  file_pages INTEGER,
  original_filename TEXT,
  storage_mode TEXT CHECK (storage_mode IN ('base64', 'storage')),
  
  -- Scores (0-100)
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  safety_score INTEGER CHECK (safety_score >= 0 AND safety_score <= 100),
  scope_score INTEGER CHECK (scope_score >= 0 AND scope_score <= 100),
  price_score INTEGER CHECK (price_score >= 0 AND price_score <= 100),
  fine_print_score INTEGER CHECK (fine_print_score >= 0 AND fine_print_score <= 100),
  warranty_score INTEGER CHECK (warranty_score >= 0 AND warranty_score <= 100),
  
  -- Analysis results
  warnings TEXT[],
  missing_items TEXT[],
  savings_low INTEGER,
  savings_high INTEGER,
  findings_json JSONB,
  
  -- Processing metadata
  model_version TEXT,
  processing_ms INTEGER,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create index on lead_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_scans_lead_id ON public.scans(lead_id);

-- 3. Create index on event_id for deduplication
CREATE INDEX IF NOT EXISTS idx_scans_event_id ON public.scans(event_id);

-- 4. Create index on file_sha256 for duplicate detection
CREATE INDEX IF NOT EXISTS idx_scans_file_sha256 ON public.scans(file_sha256);

-- 5. Enable RLS
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policy: Allow public inserts (for anon key)
CREATE POLICY "Allow public insert" ON public.scans
  FOR INSERT
  WITH CHECK (true);

-- 7. RLS Policy: No public reads (results returned from edge function)
-- Authenticated users can read their own scans via lead_id
CREATE POLICY "Allow authenticated read own" ON public.scans
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    lead_id IN (
      SELECT id FROM public.leads WHERE email = auth.email()
    )
  );

-- 8. Create RPC for secure scan creation
CREATE OR REPLACE FUNCTION public.rpc_create_scan(
  p_lead_id UUID,
  p_event_id TEXT,
  p_status TEXT DEFAULT 'pending',
  p_file_bucket TEXT DEFAULT NULL,
  p_file_path TEXT DEFAULT NULL,
  p_file_mime TEXT DEFAULT NULL,
  p_file_size INTEGER DEFAULT NULL,
  p_file_sha256 TEXT DEFAULT NULL,
  p_file_pages INTEGER DEFAULT NULL,
  p_original_filename TEXT DEFAULT NULL,
  p_storage_mode TEXT DEFAULT NULL,
  p_overall_score INTEGER DEFAULT NULL,
  p_safety_score INTEGER DEFAULT NULL,
  p_scope_score INTEGER DEFAULT NULL,
  p_price_score INTEGER DEFAULT NULL,
  p_fine_print_score INTEGER DEFAULT NULL,
  p_warranty_score INTEGER DEFAULT NULL,
  p_warnings TEXT[] DEFAULT NULL,
  p_missing_items TEXT[] DEFAULT NULL,
  p_findings_json JSONB DEFAULT NULL,
  p_model_version TEXT DEFAULT NULL,
  p_processing_ms INTEGER DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_scan_id UUID;
BEGIN
  INSERT INTO public.scans (
    lead_id, event_id, status,
    file_bucket, file_path, file_mime, file_size, file_sha256, file_pages, original_filename, storage_mode,
    overall_score, safety_score, scope_score, price_score, fine_print_score, warranty_score,
    warnings, missing_items, findings_json,
    model_version, processing_ms, error_message
  ) VALUES (
    p_lead_id, p_event_id, p_status,
    p_file_bucket, p_file_path, p_file_mime, p_file_size, p_file_sha256, p_file_pages, p_original_filename, p_storage_mode,
    p_overall_score, p_safety_score, p_scope_score, p_price_score, p_fine_print_score, p_warranty_score,
    p_warnings, p_missing_items, p_findings_json,
    p_model_version, p_processing_ms, p_error_message
  )
  RETURNING id INTO v_scan_id;
  
  RETURN v_scan_id;
END;
$$;

-- 9. Grant execute permission to anon role
GRANT EXECUTE ON FUNCTION public.rpc_create_scan TO anon;

-- 10. Add missing columns to leads table if they don't exist
DO $$
BEGIN
  -- Attribution columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'utm_source') THEN
    ALTER TABLE public.leads ADD COLUMN utm_source TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'utm_medium') THEN
    ALTER TABLE public.leads ADD COLUMN utm_medium TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'utm_campaign') THEN
    ALTER TABLE public.leads ADD COLUMN utm_campaign TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'utm_term') THEN
    ALTER TABLE public.leads ADD COLUMN utm_term TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'utm_content') THEN
    ALTER TABLE public.leads ADD COLUMN utm_content TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'fbclid') THEN
    ALTER TABLE public.leads ADD COLUMN fbclid TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'gclid') THEN
    ALTER TABLE public.leads ADD COLUMN gclid TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'fbp') THEN
    ALTER TABLE public.leads ADD COLUMN fbp TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'fbc') THEN
    ALTER TABLE public.leads ADD COLUMN fbc TEXT;
  END IF;
  
  -- Project details columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'window_count') THEN
    ALTER TABLE public.leads ADD COLUMN window_count INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'timeline') THEN
    ALTER TABLE public.leads ADD COLUMN timeline TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'budget_range') THEN
    ALTER TABLE public.leads ADD COLUMN budget_range TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'callback_preference') THEN
    ALTER TABLE public.leads ADD COLUMN callback_preference TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'callback_time') THEN
    ALTER TABLE public.leads ADD COLUMN callback_time TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'event_id') THEN
    ALTER TABLE public.leads ADD COLUMN event_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'source_tool') THEN
    ALTER TABLE public.leads ADD COLUMN source_tool TEXT;
  END IF;
END $$;

-- 11. Create storage bucket for quotes (if not exists)
-- Note: Run this in Supabase Dashboard > Storage > New Bucket
-- Bucket name: quotes
-- Public: false
-- File size limit: 25MB
-- Allowed MIME types: application/pdf, image/jpeg, image/png, image/webp

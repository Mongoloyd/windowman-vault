
## Database Setup
- [x] Add leads table schema
- [x] Add scans table schema
- [x] Create database query helpers
- [x] Add tRPC API endpoints for leads
- [x] Add tRPC API endpoints for scans
- [x] Write unit tests for leads/scans API
- [x] Push database migrations

## tRPC Migration
- [x] Refactor VaultLeadGateModal to use tRPC for lead updates
- [x] Update useSessionPersistence to use tRPC for lead validation
- [x] Remove unused Supabase client functions
- [x] Remove @supabase/supabase-js dependency
- [x] Test end-to-end flow with tRPC

## Bug Fixes
- [x] Fix leadId mismatch - local session IDs vs database IDs

## Production-Ready Scanner Fixes
- [x] Kill Base64: Remove fileToBase64 and compressImage functions
- [x] Implement storage-first upload via tRPC
- [x] Update analyzeQuote to accept URL instead of Base64
- [ ] Fix persistent uploads in QuoteScanner.tsx
- [x] Sync QuoteAnalysisResult types with server-side scans schema
- [x] Verify Gemini 3 Pro configuration


## Supabase Migration (Option A)
- [x] Reinstall @supabase/supabase-js SDK
- [x] Create clean Supabase client using ONLY VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- [x] Refactor LeadCaptureStep to use Supabase SDK directly (not tRPC)
- [x] Implement storage-first upload to Supabase estimates bucket
- [x] Update scannerEngine to use Gemini 3 Flash (gemini-2.0-flash-001)
- [x] Wire scan results to Supabase scans table
- [x] Implement dual-write to wm_leads table for CRM scoring
- [x] Capture UTM parameters (gclid, msclkid, fbclid, utm_*) to 60+ column schema
- [x] Test end-to-end flow with real quote upload


## Bug Fix - Gemini Model Error (Jan 29)
- [x] Fix Gemini model name error - 'gemini-1.5-flash-001' not found (404 error)
- [x] Update MODEL_CHAIN to use valid model names (gemini-2.0-flash or gemini-1.5-flash)
- [x] Test quote scanning flow after fix


## Bug Fixes - Supabase Errors (Jan 29)
- [x] Fix upsertWMLead insert error - check wm_leads table schema
- [x] Fix createScan Supabase error - check scans table schema
- [x] Fix invalid leadId for update error in VaultLeadGateModal


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


## GA4/GTM Integration (Jan 29)
- [x] Add GTM script tags to index.html (GTM-T39N8QHT) in head and body (already present)
- [x] Verify lead_capture_success event in LeadCaptureStep with lead_id
- [x] Verify quote_scan_complete event in AnalysisTheaterStep with overall_score and savings_opportunity
- [x] Provide console verification command for GTM container


## Dual-Path Funnel Implementation (Jan 30)

### Phase 1: Database Migration
- [x] Create migration script for new leads columns (path_type, is_homeowner, window_count, timeline_urgency, sms_verified, ocr_city, phone_submitted_at, sms_verified_at, lead_value_score)
- [x] Create verification_codes table for SMS PIN storage
- [x] Create rollback script for safe recovery
- [x] Execute migration against Supabase (user ran manually)
- [x] Verify schema changes

### Phase 2: Backend Endpoints - Path Alpha
- [x] POST /api/alpha/upload - Handle quote file upload
- [x] POST /api/alpha/phone - Submit phone for SMS verification
- [x] POST /api/alpha/verify - Verify SMS PIN code
- [x] GET /api/alpha/status - Get analysis status for polling
- [x] POST /api/alpha/unlock - Unlock blurred report
- [x] POST /api/alpha/timeline - Submit timeline selection
- [x] POST /api/alpha/final-action - Handle final CTA selection

### Phase 3: Backend Endpoints - Path Beta
- [x] POST /api/beta/select-tool - Track educational tool selection
- [x] POST /api/beta/filter - Submit filter questions (windows, homeowner, timeline)
- [x] POST /api/beta/phone - Submit phone for SMS verification
- [x] POST /api/beta/verify - Verify SMS PIN code
- [x] POST /api/beta/final-action - Handle final CTA selection

### Phase 4: SMS Service
- [x] Create smsService.ts for Twilio integration
- [x] Implement sendVerificationCode function
- [x] Implement verifyCode function
- [x] Add rate limiting for SMS sends

### Phase 5: Lead Value Calculation
- [x] Create leadValueService.ts for Meta pixel value weighting
- [x] Implement calculateLeadValue function based on (homeowner + windows + timeline)
- [x] Write unit tests for lead value calculation (24 tests passing)


### Phase 6: Frontend Components - Step 2 Fork
- [x] Create PathForkStep.tsx - Two visual decision cards (Alpha/Beta)
- [x] Remove phone field from early steps
- [x] Add document/scanner imagery for Alpha card
- [x] Add tools/library imagery for Beta card
- [x] Wire fork selection to set path_type in lead record

### Phase 7: Frontend Components - Alpha Path
- [x] Create AlphaUploadStep.tsx - Cool drag-and-drop upload screen (Step 3)
- [x] Create AlphaRevealGateStep.tsx - Blurred report with phone/PIN unlock (Step 4)
- [x] Create AlphaChatStep.tsx - Timeline selector + AI chat with pre-filled question (Step 5)
- [x] Create AlphaNextStepsStep.tsx - Call option + three option cards (Step 6)
- [x] Implement OCR city extraction display
- [x] Implement blur-to-unblur animation on PIN verification

### Phase 8: Frontend Components - Beta Path
- [x] Create BetaExploreToolsStep.tsx - Four tool cards grid (Step 3)
- [x] Create BetaFilterStep.tsx - Three questions + chat (Step 4)
- [x] Create BetaVaultConfirmStep.tsx - Phone/PIN only on "confirm Vault access" card (Step 5)
- [x] Remove savings bar from Beta path
- [x] Add "When you get an estimate, come back here" copy

### Phase 9: Integration & Testing
- [x] Wire all steps into VaultLeadGateModalV2
- [x] Write unit tests for dual-path funnel (60 tests passing)
- [x] Fix nested button HTML validation error in BetaExploreToolsStep
- [ ] Test Alpha path end-to-end (browser)
- [ ] Test Beta path end-to-end (browser)
- [ ] Verify all analytics events fire correctly

## End-to-End Technical Validation (Jan 30)

### Part 1: Alpha Path Testing
- [ ] Test Alpha path initiation (click "Get Free Scan" → PathForkStep)
- [ ] Test file upload with valid PDF/image
- [ ] Verify Analysis Theater simulation triggers
- [ ] Test blurred report visibility before PIN entry
- [ ] Test phone number entry and validation
- [ ] Test mock PIN verification (1234)
- [ ] Verify report unblurs after PIN verification
- [ ] Test AlphaChatStep loads correctly
- [ ] Test timeline selection
- [ ] Test final CTA button (Request Vetted Quote)
- [ ] Verify lead_value_score is calculated and stored

### Part 2: Beta Path Testing
- [ ] Test Beta path initiation (select "No, I'm Just Researching")
- [ ] Verify 4 educational tool boxes appear
- [ ] Test tool selection and highlighting
- [ ] Test Golden Signal questions (homeowner, windows, timeline)
- [ ] Test SMS verification on Beta path
- [ ] Verify lead_value_score calculation for Beta answers
- [ ] Test vault confirmation completion

### Part 3: State Persistence & Back Button
- [ ] Test page refresh at PIN entry step (should resume at PIN, not reset)
- [ ] Test back button logic (should return to previous step, not Path selection)
- [ ] Test data retention after back button navigation
- [ ] Test session recovery after page refresh

### Part 4: Error Handling & Boundaries
- [ ] Test invalid file upload (non-PDF/image format)
- [ ] Test oversized file upload (>10MB)
- [ ] Test PIN submission with <6 digits (button should be disabled)
- [ ] Test empty phone number submission
- [ ] Test invalid phone number format
- [ ] Test network error recovery

### Part 5: Analytics & Lead Value
- [ ] Verify path_type (alpha/beta) in GTM events
- [ ] Verify lead_capture_success event fires with correct payload
- [ ] Verify lead_value_score in console/network tab
- [ ] Test lead value calculation: homeowner + 10+ windows + 1-3 months = $400-600 range
- [ ] Verify all GTM events fire in correct sequence

### Part 6: Security & DOM Inspection
- [ ] Verify blurred report data is not readable in DOM before PIN entry
- [ ] Check that sensitive data is not exposed in HTML source
- [ ] Verify blur is CSS-based (not just visual obfuscation)
- [ ] Test console for no sensitive data leaks

### Part 7: Validation Report
- [ ] Document all test results
- [ ] Create summary of issues found
- [ ] Provide recommendations for fixes

## Bonus Resource Update (Jan 30)
- [x] Replace Claim Survival Kit text content with professional image
- [x] Update VaultBenefits component to use new image asset
- [x] Fix JSX errors in AlphaRevealGateStep
- [x] Restart dev server

## Analysis Theater & Form UX Improvements (Jan 30)
- [ ] Restore analysis theater checklist with 5 items (Safety & Code Match, Install & Scope Clarity, Price Fairness, Fine Print Transparency, Warranty & Protections)
- [ ] Add animated checkmarks that progress sequentially during analysis
- [ ] Add shimmer effect around "Powered by Gemini 3 OCR Flash" badge
- [ ] Enforce 5-digit hard stop on ZIP code input field
- [ ] Test all animations and validations

## CRO Improvements - Multi-Step Funnel (Jan 30)
- [x] Update LeadCaptureStep: Replace social proof with "Win-Win Promise" messaging
- [x] Add 5-digit ZIP code validation (maxLength + numeric only)
- [x] Remove path fork images, replace with benefit-driven text cards
- [x] Restore analysis theater checklist (5 items with sequential animations)
- [x] Add tooltips to each checklist item explaining what it means
- [x] Update Gemini badge: "Powered by Google AI" + "99.2% accuracy" subtext
- [x] Add shimmer/pulse animation to Gemini badge
- [x] Verify no TypeScript/build errors
- [ ] Implement exit intent modal (deferred - nice-to-have)

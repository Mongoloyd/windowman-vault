# WindowMan Vault Lead Gate + Scanner Wiring
## Final Pre-Implementation Analysis (v4.0)

**Author:** Manus AI (Senior Full-Stack Engineer + CRO Architect)  
**Status:** AWAITING "PROCEED" COMMAND  
**GTM Container:** GTM-T39N8QHT

---

## 1. UNDERSTANDING CHECK

### What I Understand You're Asking Me to Build

This is **infrastructure wiring disguised as UX**. The modal is the product. The system has **five interlocking objectives**:

| # | Objective | Why It Matters |
|---|-----------|----------------|
| 1 | **Lead Capture Before Friction** | Paid click value captured before quote upload friction |
| 2 | **File Storage (Dataset Moat)** | Original quote files stored in Supabase Storage—not discarded |
| 3 | **Scan-to-Lead Linkage** | AI results associated to `lead_id` via `scans` table |
| 4 | **Deterministic `event_id`** | Future GTM Server + FB CAPI deduplication ready |
| 5 | **Large PDF Support** | Dual-path upload prevents Edge payload failures |

### The State Machine (10 States, No Collapsing)

```
lead_capture → pivot_question → [BRANCH]
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
              scanner_upload                  vault_confirmation
                    │                               │
                    ▼                               │
            analysis_theater                       │
                    │                               │
                    ▼                               │
             result_display                        │
                    │                               │
                    └───────────────┬───────────────┘
                                    ▼
                            project_details
                                    │
                                    ▼
                           final_escalation
                                    │
                                    ▼
                               success
                                    
              [exit_intercept] ← (triggered by any exit attempt after Step 1)
```

### Key Requirements I've Locked In

| Requirement | Spec Reference | My Implementation |
|-------------|----------------|-------------------|
| **GTM First** | Section 1 | Install GTM-T39N8QHT, create `pushDL()` wrapper with console logging |
| **Deterministic `event_id`** | Section 2 | Generate at Step 1, persist to `leads.event_id`, localStorage, all events |
| **Config Hygiene** | Section 3 | Move Supabase URL/key to `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| **Storage Bucket** | Section 4.2 | Create `quotes` bucket, path: `quotes/{lead_id}/{scan_id}/{filename}` |
| **Scans Table** | Section 4.3 | Full schema with file metadata + AI results, never store base64/bytes |
| **RPC Security** | Section 5.1 | `rpc_create_scan()` with strict allowlist, validate `lead_id` exists |
| **Signed Uploads** | Section 5.2 | `create_upload_url` Edge Function for large files |
| **Dual-Path Upload** | Section 6 | ≤6MB non-PDF → base64; >6MB OR PDF → Storage + URL |
| **Phone in Step 2** | Section 11 | Value-framed: "Where should we text your secure Vault access code?" |
| **Analysis Theater** | Section 12 | Locked script, smooth progress (no 90% stall) |
| **Branch B Copy** | Section 13 | "Strategic Headstart" framing |
| **No Passive Exits** | Section 14 | Step 1 blocks all exits; after Step 1 → exit_intercept |
| **Session Resume** | Section 15 | <7 days → resume at `pivot_question`; validate `lead_id` in DB |
| **Magic Link Last** | Section 16 | Triggered only at final `success` step |
| **Enhanced Conversions** | Section 17 | SHA-256 hashed email/phone in dataLayer |

### Is Anything Unclear, Contradictory, or Missing?

**Clarifications resolved by the new spec:**

| Previous Question | Answer from Spec |
|-------------------|------------------|
| Existing `leads` table schema? | "User confirmed: leads table already has all info needed" (Section 4.1) |
| GTM Container ID? | GTM-T39N8QHT (Section 1) |
| Phone field placement? | Step 2 with value-framed copy (Section 11) |
| Magic link trigger? | Triggered at final success step (Section 16) |

**One remaining question:**

> **External Vault URL**: Section 16 mentions "If Vault lives in another project, set redirectTo to the external Vault URL (I will provide)." Do you have this URL, or should I use a placeholder?

### Are There Any Requirements That Conflict with React or My Capabilities?

**No conflicts.** All requirements are implementable:

| Requirement | Implementation Approach |
|-------------|------------------------|
| State machine | `useReducer` with typed actions |
| Exit interception | `beforeunload` + `history.pushState` + modal backdrop handling |
| Signed uploads | Edge Function + Supabase Storage SDK |
| SHA-256 hashing | Web Crypto API (`crypto.subtle.digest`) |
| Dual-path upload | File size check → conditional path |
| RPC calls | Supabase client `.rpc()` method |

---

## 2. CRO EXPERT OPINION

### What I Would Do Differently or Better

#### A. Progress UX Enhancement (Beyond Spec)

The spec says "avoid jump to 90% then stall." My implementation:

```
Stage 1 (0-30%):   "Checking 2024 Florida Impact Code compliance…"
Stage 2 (30-60%):  "Cross-referencing local labor rate parity ($2.3M dataset)…"
Stage 3 (60-90%):  "Flagging pressure-tactic line items and rating anomalies…"
Stage 4 (90-100%): "Finalizing your protection report…"
```

**Enhancement:** Use `cubic-bezier(0.4, 0, 0.2, 1)` easing with stage-based increments. Progress bar never stops moving—it just slows down during actual API wait.

#### B. File Hash Verification (Security + UX)

The spec requires `file_sha256`. My enhancement:

- Compute hash **during upload** (not blocking)
- If duplicate hash detected for same `lead_id`, show: "We already have this quote on file. Would you like to scan a different one?"

**Why:** Prevents accidental re-uploads and saves API costs.

#### C. Error Recovery UX

For large PDF uploads that fail:

```
[Progress bar at 75%]
"Upload interrupted. Your file is safe."
[Retry] [Use smaller file]
```

**Why:** Large file failures are common on mobile. Clear recovery path prevents abandonment.

### Technical Landmines I've Identified

| Landmine | Risk | Mitigation |
|----------|------|------------|
| **Edge Function body limit** | HIGH | Dual-path upload (Section 6) handles this |
| **Signed URL expiration** | MEDIUM | Generate URL immediately before upload, 5-minute expiry |
| **SHA-256 on large files** | MEDIUM | Use streaming hash via `FileReader` chunks |
| **RLS blocking anon RPC** | HIGH | Test immediately after creation; grant `EXECUTE` to `anon` |
| **Storage bucket permissions** | HIGH | Verify signed URL generation works before frontend integration |
| **Race: UI advances before persist** | MEDIUM | Optimistic UI + background retry + `scan_persist_failed` event |

### Patterns I'd Recommend Changing

**None.** The spec is comprehensive and production-ready. The dual-path upload strategy is exactly right for handling Edge limits.

---

## 3. GAMEPLAN

### Component Hierarchy

```
client/src/
├── components/
│   └── vault-gate/
│       ├── VaultLeadGateModal.tsx      # Root: state machine, exit handling, modal shell
│       ├── ExitInterceptOverlay.tsx    # "Email My Savings Report" fallback
│       ├── HoneypotField.tsx           # Hidden spam trap
│       └── steps/
│           ├── LeadCaptureStep.tsx     # Step 1: Name, Email, ZIP
│           ├── PivotQuestionStep.tsx   # Step 2: Pivot + Phone (value-framed)
│           ├── ScannerUploadStep.tsx   # Branch A: File upload with dual-path
│           ├── AnalysisTheaterStep.tsx # Branch A: Locked script animation
│           ├── ResultDisplayStep.tsx   # Branch A: Score + warnings
│           ├── VaultConfirmationStep.tsx # Branch B: Strategic Headstart
│           ├── ProjectDetailsStep.tsx  # Both: Window count, timeline
│           ├── FinalEscalationStep.tsx # Both: Callback options
│           └── SuccessStep.tsx         # Final: Magic link + partial win
├── hooks/
│   ├── useVaultStateMachine.ts         # useReducer state machine
│   ├── useAttribution.ts               # UTM/fbclid/gclid capture
│   ├── useSessionPersistence.ts        # localStorage + resume logic
│   ├── useFileUpload.ts                # NEW: Dual-path upload logic
│   └── useQuoteScanner.ts              # MODIFIED: Accept leadId, eventId, fileUrl
├── lib/
│   ├── supabase.ts                     # MODIFIED: Use env vars, add RPC helper
│   ├── tracking.ts                     # NEW: pushDL() wrapper + console logging
│   ├── eventId.ts                      # NEW: Deterministic event_id generation
│   ├── hash.ts                         # NEW: SHA-256 file hashing
│   └── upload.ts                       # NEW: Signed URL + Storage upload
└── types/
    └── vault.ts                        # Type definitions
```

### Build Order (22 Phases)

| Phase | Task | Deliverable |
|-------|------|-------------|
| **0** | Install GTM + create `tracking.ts` | GTM snippet in index.html, `pushDL()` wrapper |
| **1** | Update `supabase.ts` to use env vars | Config hygiene |
| **2** | Create `quotes` Storage bucket | Bucket with signed URL policy |
| **3** | Create `scans` table | SQL migration |
| **4** | Create `rpc_create_scan` RPC | SQL migration + grant |
| **5** | Create `create_upload_url` Edge Function | Edge function deployment |
| **6** | Update `quote-scanner` Edge Function | Accept `fileUrl` OR `bucket/path` |
| **7** | Create `eventId.ts` | Deterministic ID generation |
| **8** | Create `hash.ts` | SHA-256 file hashing |
| **9** | Create `upload.ts` | Signed URL + Storage upload |
| **10** | Create `useFileUpload.ts` hook | Dual-path upload logic |
| **11** | Modify `useQuoteScanner.ts` | Accept leadId, eventId, handle both paths |
| **12** | Create `useVaultStateMachine.ts` | 10-state reducer |
| **13** | Create `useAttribution.ts` | UTM/fbclid capture |
| **14** | Create `useSessionPersistence.ts` | localStorage + resume |
| **15** | Build `LeadCaptureStep.tsx` | Form + honeypot + spam checks |
| **16** | Build `PivotQuestionStep.tsx` | Pivot + phone |
| **17** | Build `ScannerUploadStep.tsx` | Dual-path upload UI |
| **18** | Build `AnalysisTheaterStep.tsx` | Locked script + smooth progress |
| **19** | Build `ResultDisplayStep.tsx` | Score + warnings |
| **20** | Build remaining steps | VaultConfirmation, ProjectDetails, FinalEscalation, Success |
| **21** | Build `VaultLeadGateModal.tsx` | Container + exit handling |
| **22** | Wire to existing CTAs + E2E testing | Integration |

### Analytics Events (All Include `event_id`)

| Event | Fires In | Key Payload Fields |
|-------|----------|-------------------|
| `lead_capture_completed` | LeadCaptureStep on DB success | `event_id`, `lead_id`, `email_sha256`, `has_zip` |
| `lead_capture_delayed` | LeadCaptureStep if >2s | `event_id`, `delay_ms` |
| `pivot_yes` | PivotQuestionStep | `event_id`, `lead_id`, `has_phone` |
| `pivot_no` | PivotQuestionStep | `event_id`, `lead_id`, `has_phone` |
| `scan_started` | ScannerUploadStep on file drop | `event_id`, `lead_id`, `file_type`, `file_size`, `storage_mode` |
| `scan_completed` | ResultDisplayStep | `event_id`, `lead_id`, `score`, `warning_count` |
| `scan_persist_failed` | useQuoteScanner on RPC fail | `event_id`, `lead_id`, `error_code` |
| `project_details_completed` | ProjectDetailsStep | `event_id`, `lead_id`, `window_count`, `timeline` |
| `final_escalation_selected` | FinalEscalationStep | `event_id`, `lead_id`, `escalation_type` |
| `exit_intercept_shown` | ExitInterceptOverlay | `event_id`, `lead_id`, `exit_step` |
| `exit_intercept_converted` | ExitInterceptOverlay on CTA | `event_id`, `lead_id` |

### Technical Compromises

| Area | Decision | Reason |
|------|----------|--------|
| **State Management** | `useReducer` (not Zustand) | Sufficient for 10 states, no external dep |
| **Form Validation** | Native HTML5 + minimal JS | Only 4-5 fields per step |
| **Phone Formatting** | Client-side `(XXX) XXX-XXXX` | No libphonenumber, keeps bundle small |
| **File Hashing** | Web Crypto API | Native, no external dep |
| **Animation** | Framer Motion (already installed) | Consistent with existing codebase |

---

## 4. DEFINITION OF DONE CHECKLIST

### A. Tracking & Attribution

- [ ] GTM container GTM-T39N8QHT installed at SPA root
- [ ] `window.dataLayer` exists on page load
- [ ] Test event visible in console (dev mode)
- [ ] Deterministic `event_id` generated at Step 1
- [ ] `event_id` persisted to `leads.event_id`
- [ ] `event_id` in localStorage session
- [ ] `event_id` in every dataLayer event
- [ ] Attribution (utm_*, fbclid, gclid, fbp, fbc) captured once at page load
- [ ] SHA-256 hashed email/phone in dataLayer payloads

### B. Lead Capture & Session

- [ ] Lead persisted at Step 1 before any scan
- [ ] `lead_capture_completed` fires after successful DB write
- [ ] `lead_capture_delayed` fires if write >2s
- [ ] Duplicate submits don't create duplicate leads (idempotent upsert)
- [ ] localStorage stores full session object
- [ ] Refresh mid-flow resumes correctly
- [ ] Returning users (<7 days) skip Step 1, resume at `pivot_question`
- [ ] `lead_id` validated in DB before resume; if missing, start fresh
- [ ] "Start Over" clears session, preserves attribution

### C. Modal State Machine & Exit Control

- [ ] All 10 states implemented in `useReducer`
- [ ] Step 1 blocks Esc, backdrop click, close button
- [ ] After Step 1, all exits trigger `exit_intercept`
- [ ] Browser back intercepted after Step 1
- [ ] Exit intercept shows "Email My Savings Report" CTA
- [ ] "Continue Where I Left Off" restores exact prior step
- [ ] `exit_intercept_shown` and `exit_intercept_converted` events fire

### D. File Handling & Dataset

- [ ] `quotes` Storage bucket created (private)
- [ ] Original file always stored in Storage
- [ ] Path follows `quotes/{lead_id}/{scan_id}/{filename}`
- [ ] ≤6MB non-PDF → base64 → edge function works
- [ ] >6MB OR PDF → signed URL upload → scanner via URL works
- [ ] No Edge payload limit errors
- [ ] `scans` table stores file metadata (bucket, path, mime, size, hash, pages, filename, storage_mode)

### E. Scanner & Persistence

- [ ] Existing base64 path still works (backwards compatible)
- [ ] New fileUrl/bucket-path path works
- [ ] Analysis theater shows locked script exactly
- [ ] Progress UX smooth (no 90% stall)
- [ ] Scan results saved via `rpc_create_scan`
- [ ] If RPC fails: `scan_persist_failed` fires, retry once, UI not blocked

### F. Security

- [ ] No public inserts into `scans` table
- [ ] `rpc_create_scan` validates `lead_id` exists
- [ ] Uploads use signed URLs (no public bucket writes)
- [ ] Mime type and size validated server-side
- [ ] Honeypot field rejects bot submissions
- [ ] Minimum 3-second form completion time enforced

### G. Branch Logic

- [ ] Phone field in Step 2 with value-framed copy
- [ ] Branch A (has estimate) works end-to-end
- [ ] Branch B (no estimate) uses "Strategic Headstart" framing
- [ ] Both branches converge at `project_details`

### H. Magic Link & Completion

- [ ] Magic link triggered only at final `success` step
- [ ] Success screen shows "Check your email" message
- [ ] (If applicable) `redirectTo` points to external Vault URL

### I. All Analytics Events Fire Correctly

- [ ] `lead_capture_completed`
- [ ] `lead_capture_delayed`
- [ ] `pivot_yes`
- [ ] `pivot_no`
- [ ] `scan_started`
- [ ] `scan_completed`
- [ ] `scan_persist_failed`
- [ ] `project_details_completed`
- [ ] `final_escalation_selected`
- [ ] `exit_intercept_shown`
- [ ] `exit_intercept_converted`

### J. Mobile & Accessibility

- [ ] Modal scrolls on mobile
- [ ] Focus trapped in modal
- [ ] Tab order logical
- [ ] All inputs have labels
- [ ] Visible focus states

---

## 5. DELIVERABLES SUMMARY

Upon completion, I will provide:

1. **SQL Migrations** for `scans` table + `rpc_create_scan` RPC
2. **Storage Bucket Config** notes and security posture
3. **`create_upload_url` Edge Function** code
4. **`quote-scanner` Edge Function** update (accept base64 OR fileUrl)
5. **Frontend Code**: All hooks, components, state machine
6. **Verification Tests**: Small image, large PDF, GTM events, resume, exit handling

---

## AWAITING YOUR "PROCEED"

**One question remaining:**
> External Vault URL for magic link `redirectTo` — do you have this, or should I use a placeholder?

Once you confirm, I will begin implementation.

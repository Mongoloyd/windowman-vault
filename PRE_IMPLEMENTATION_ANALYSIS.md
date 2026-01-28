# WindowMan Vault Lead Gate + Scanner Wiring

## Pre-Implementation Analysis

**Document Version:** 3.0 (Final Pre-Approval)**Author:** Manus AI (Senior Full-Stack Engineer + CRO Architect)**Status:** AWAITING APPROVAL TO PROCEED

---

## 1. UNDERSTANDING CHECK

### What I Understand You're Asking Me to Build

This is **infrastructure wiring disguised as UX**—not a simple UI task. The system has three interlocking objectives:

| Objective | Description |
| --- | --- |
| **Lead Capture First** | Capture Name, Email, (optional Phone), ZIP before any friction. The lead is the primary conversion, not the scan. |
| **AI Scanner Linkage** | Associate scan results to a `lead_id` via a new `scans` table, using RPC-based insertion for security. |
| **Event Integrity** | Generate a deterministic `event_id` at Step 1 that propagates through all events, enabling future FB CAPI deduplication. |

### The State Machine (10 States)

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

1. **Tracking Bootstrap First**: Verify `window.dataLayer` exists before building anything else

1. **Canonical Identifiers**: `event_id` generated at Step 1, persisted everywhere

1. **Database Work**: Extend `leads` table + create `scans` table with MVP schema

1. **RLS Strategy**: Use `rpc_create_scan()` for secure insertion—no public table access

1. **Session Continuity**: Resume at `pivot_question` if valid `lead_id` exists (<7 days)

1. **Analysis Theater**: Locked copy, no randomization

1. **Branch B Copy**: "Strategic Headstart" framing for no-estimate users

1. **Exit Intercept**: "Email My Savings Report" (value-framed), never "Send me a link"

1. **No Passive Exits**: After Step 1, all exit attempts trigger intercept

### Clarifications Based on Your Additional Insights

| Your Insight | My Implementation Decision |
| --- | --- |
| **Phone Field Friction** | Phone will be **optional on Step 1** with placeholder "Optional - for text updates". If they skip it, we still capture email. |
| **GTM Preview Paradox** | I will log all `dataLayer.push()` calls to console in development mode. No GTM debugger dependency. |
| **Honeypot Field** | Adding hidden `website` field. If filled, RPC rejects. Also adding minimum 3-second form completion time check. |
| **Magic Link Reality** | Success slide shows: "We've sent your secure Vault link to [email]. Your Truth-Sheet is generating below." Partial win immediately. |

### Is Anything Unclear, Contradictory, or Missing?

**One clarification needed:**

> **The ****`leads`**** table structure**: I need to confirm the existing `leads` table schema in your Supabase instance. Does it already have `event_id`, `utm_source`, `fbclid`, `gclid`, `fbp`, `fbc`, and `zip` columns? Or do I need to add them via migration?

**Potential contradiction resolved:**

> The spec says "No backend refactor required today" but also requires creating `rpc_create_scan()`. I interpret this as: **I can create new database objects (table + RPC), but should not modify existing edge functions.**

### Are There Any Requirements That Conflict with React or My Capabilities?

**No conflicts.** All requirements are implementable:

- State machine → `useReducer` pattern

- Exit interception → `beforeunload` event + `history.pushState`

- Honeypot → Hidden input with CSS

- Attribution capture → `URLSearchParams` on page load

- localStorage persistence → Native browser API

- RPC calls → Supabase client `.rpc()` method

---

## 2. CRO EXPERT OPINION

### What I Would Do Differently or Better

#### A. Phone Field Strategy (Your Insight + My Enhancement)

**Your suggestion:** Make phone optional on Step 1.

**My enhancement:** Move phone to Step 2 (`pivot_question`) with the copy:

> "Where should we text your secure Vault access code?"

**Why:** This reframes phone collection as a *benefit* (secure access) rather than a *requirement*. Users who already gave email are more invested and more likely to provide phone.

**Implementation:**

- Step 1: First Name, Last Name, Email, ZIP (optional)

- Step 2: Phone field appears with value-framed copy

#### B. The "Partial Win" Enhancement

**Your insight:** Show Truth-Sheet generating while they wait for magic link.

**My enhancement:** Add a **live progress indicator** on the success slide:

```
✓ Lead captured
✓ Scan analyzed  
◉ Truth-Sheet generating... (animated)
○ Vault access ready
```

**Why:** This gives them something to watch, reducing the urge to leave and check email.

#### C. The "Strategic Headstart" Amplification

For Branch B (no estimate) users, I recommend adding a **visual comparison**:

| Most Homeowners | You |
| --- | --- |
| Start with contractor's price | Start with fair market data |
| Get anchored high | Set your own anchor |
| React to their terms | Dictate your terms |

**Why:** This table format makes the "strategic advantage" concrete and scannable.

#### D. Exit Intercept Copy Refinement

**Current:** "Email My Savings Report"

**Suggested A/B test variant:** "Send My Protection Summary"

**Why:** "Protection" aligns with the vault/security metaphor better than "Savings."

### Technical Landmines I've Identified

| Landmine | Risk Level | Mitigation |
| --- | --- | --- |
| **Supabase RLS blocking anon inserts** | HIGH | Test RPC immediately after creation. If blocked, check `anon` role grants. |
| **Large ****`raw_result`**** payloads** | MEDIUM | Trim to essential fields only. No base64, no file data. Max 10KB. |
| **localStorage quota exceeded** | LOW | Store only IDs and form values, not scan results. |
| **Race condition: UI advances before DB write** | MEDIUM | Use optimistic UI with background retry. Never block UX. |
| **GTM container not loading** | LOW | Defensive wrapper on all events. Log to console as fallback. |
| **Session resume with stale data** | MEDIUM | Validate `lead_id` exists in DB before resuming. If not found, start fresh. |

### Patterns I'd Recommend Changing

**None.** Your spec is tight. The state machine is correct. The event structure is CAPI-ready. The RLS strategy is secure.

The only pattern I'd add is **progressive disclosure of phone**—which you already suggested.

---

## 3. GAMEPLAN

### Component Hierarchy

```
VaultLeadGateModal/
├── VaultLeadGateModal.tsx          # Root container, state machine, exit handling
├── useVaultStateMachine.ts         # useReducer-based state management
├── useAttribution.ts               # UTM/fbclid/gclid capture on mount
├── useSessionPersistence.ts        # localStorage read/write, resume logic
├── steps/
│   ├── LeadCaptureStep.tsx         # Step 1: Name, Email, ZIP, (Phone optional)
│   ├── PivotQuestionStep.tsx       # Step 2: "Do you have an estimate?" + Phone
│   ├── ScannerUploadStep.tsx       # Branch A: File upload UI
│   ├── AnalysisTheaterStep.tsx     # Branch A: Locked copy animation
│   ├── ResultDisplayStep.tsx       # Branch A: Score + warnings display
│   ├── VaultConfirmationStep.tsx   # Branch B: "Strategic Headstart" framing
│   ├── ProjectDetailsStep.tsx      # Both branches: Window count, timeline, budget
│   ├── FinalEscalationStep.tsx     # Both branches: Callback scheduling
│   └── SuccessStep.tsx             # Final: Magic link sent + Truth-Sheet preview
├── ExitInterceptOverlay.tsx        # "Email My Savings Report" fallback
└── HoneypotField.tsx               # Hidden spam trap
```

### File Organization

```
client/src/
├── components/
│   ├── vault-gate/
│   │   ├── VaultLeadGateModal.tsx
│   │   ├── ExitInterceptOverlay.tsx
│   │   ├── HoneypotField.tsx
│   │   └── steps/
│   │       ├── LeadCaptureStep.tsx
│   │       ├── PivotQuestionStep.tsx
│   │       ├── ScannerUploadStep.tsx
│   │       ├── AnalysisTheaterStep.tsx
│   │       ├── ResultDisplayStep.tsx
│   │       ├── VaultConfirmationStep.tsx
│   │       ├── ProjectDetailsStep.tsx
│   │       ├── FinalEscalationStep.tsx
│   │       └── SuccessStep.tsx
│   └── scanner/
│       └── QuoteScanner.tsx        # MODIFIED: Accept leadId, eventId props
├── hooks/
│   ├── useVaultStateMachine.ts     # NEW
│   ├── useAttribution.ts           # NEW
│   ├── useSessionPersistence.ts    # NEW
│   └── useQuoteScanner.ts          # MODIFIED: Accept leadId, eventId
├── lib/
│   ├── supabase.ts                 # MODIFIED: Add RPC helper
│   ├── tracking.ts                 # NEW: dataLayer wrapper with console logging
│   └── eventId.ts                  # NEW: Deterministic event_id generation
└── types/
    └── vault.ts                    # NEW: Type definitions
```

### Build Order

| Phase | Task | Dependency |
| --- | --- | --- |
| **0** | Verify GTM + create tracking wrapper | None |
| **1** | Create `scans` table + `rpc_create_scan` RPC | Supabase access |
| **2** | Extend `leads` table with attribution columns | Supabase access |
| **3** | Build `useVaultStateMachine` hook | None |
| **4** | Build `useAttribution` hook | None |
| **5** | Build `useSessionPersistence` hook | Phase 3 |
| **6** | Build `LeadCaptureStep` with honeypot | Phase 3, 4 |
| **7** | Build `PivotQuestionStep` | Phase 6 |
| **8** | Modify `useQuoteScanner` to accept leadId/eventId | Phase 1 |
| **9** | Build `ScannerUploadStep` | Phase 8 |
| **10** | Build `AnalysisTheaterStep` | Phase 9 |
| **11** | Build `ResultDisplayStep` | Phase 10 |
| **12** | Build `VaultConfirmationStep` (Branch B) | Phase 7 |
| **13** | Build `ProjectDetailsStep` | Phase 11, 12 |
| **14** | Build `FinalEscalationStep` | Phase 13 |
| **15** | Build `SuccessStep` | Phase 14 |
| **16** | Build `ExitInterceptOverlay` | Phase 6 |
| **17** | Build `VaultLeadGateModal` container | All above |
| **18** | Wire modal trigger to existing CTAs | Phase 17 |
| **19** | End-to-end testing | All above |

### Analytics Events + Fire Locations

| Event | Fires In | Payload |
| --- | --- | --- |
| `lead_capture_completed` | `LeadCaptureStep.tsx` on successful DB upsert | `{ event_id, lead_id, email_hash, has_phone, has_zip }` |
| `lead_capture_delayed` | `LeadCaptureStep.tsx` if DB write > 2s | `{ event_id, delay_ms }` |
| `pivot_yes` | `PivotQuestionStep.tsx` on "Yes" click | `{ event_id, lead_id }` |
| `pivot_no` | `PivotQuestionStep.tsx` on "No" click | `{ event_id, lead_id }` |
| `scan_started` | `ScannerUploadStep.tsx` on file drop | `{ event_id, lead_id, file_type, file_size }` |
| `scan_completed` | `ResultDisplayStep.tsx` on result render | `{ event_id, lead_id, score, warning_count }` |
| `scan_persist_failed` | `useQuoteScanner.ts` if RPC fails | `{ event_id, lead_id, error_code }` |
| `project_details_completed` | `ProjectDetailsStep.tsx` on submit | `{ event_id, lead_id, window_count, timeline }` |
| `final_escalation_selected` | `FinalEscalationStep.tsx` on selection | `{ event_id, lead_id, escalation_type }` |
| `exit_intercept_shown` | `ExitInterceptOverlay.tsx` on render | `{ event_id, lead_id, exit_step }` |
| `exit_intercept_converted` | `ExitInterceptOverlay.tsx` on CTA click | `{ event_id, lead_id }` |

### Technical Compromises

| Area | Compromise | Reason |
| --- | --- | --- |
| **State Management** | `useReducer` instead of Zustand/Redux | Sufficient for 10-state machine, no external dependency |
| **Form Validation** | Native HTML5 + minimal JS | Only 4-5 fields, react-hook-form overkill |
| **Phone Formatting** | Client-side only `(XXX) XXX-XXXX` | No libphonenumber, keeps bundle small |
| **Animation** | Framer Motion (already installed) | No additional dependencies |
| **GTM Verification** | Console logging, not GTM Preview | Avoids browser extension dependency |

### Success Metric Confirmation

**I confirm I understand:**

> The primary success metric is a **captured lead (Name, Email)** persisted to Supabase on Slide 1, followed by project context. The document upload/scan is **bonus data**, not the conversion.

The entire system is designed around this hierarchy:

1. **Lead capture** (required)

1. **Project context** (valuable)

1. **Scan results** (bonus)

---

## 4. ACCEPTANCE TEST CHECKLIST

### Happy Path: Branch A (Has Estimate)

- [ ] User lands on page, modal opens

- [ ] Step 1: Fill name, email, ZIP → Submit

- [ ] `lead_capture_completed` fires with `event_id`

- [ ] Lead persisted to `leads` table with attribution

- [ ] Step 2: "Do you have an estimate?" → Click "Yes"

- [ ] `pivot_yes` fires

- [ ] Step 3: Upload quote image

- [ ] `scan_started` fires

- [ ] Step 4: Analysis theater shows locked copy

- [ ] Step 5: Results display with score

- [ ] `scan_completed` fires

- [ ] Scan persisted to `scans` table via RPC

- [ ] Step 6: Project details form

- [ ] `project_details_completed` fires

- [ ] Step 7: Escalation options

- [ ] `final_escalation_selected` fires

- [ ] Step 8: Success slide with magic link message

### Happy Path: Branch B (No Estimate)

- [ ] Steps 1-2 same as above

- [ ] Step 2: Click "No, I don't have one yet"

- [ ] `pivot_no` fires

- [ ] Step 3: "Strategic Headstart" confirmation

- [ ] Step 4: Project details form (same as Branch A Step 6)

- [ ] Steps 5-6: Escalation + Success (same as Branch A)

### Error & Edge Cases

- [ ] DB write fails → Retry once, show error, preserve form values

- [ ] Scan fails → Show error, allow retry, don't block flow

- [ ] RPC fails → Fire `scan_persist_failed`, retry once, don't rollback UI

- [ ] Honeypot filled → Reject silently, log event

- [ ] Form submitted < 3 seconds → Reject, show "Please review your information"

### Exit Handling

- [ ] Esc key after Step 1 → Exit intercept overlay

- [ ] Backdrop click after Step 1 → Exit intercept overlay

- [ ] Browser back after Step 1 → Exit intercept overlay

- [ ] "Email My Savings Report" clicked → Capture, close modal

- [ ] "Continue" clicked → Return to current step

### Session Continuity

- [ ] Refresh page mid-flow → Resume at correct step

- [ ] Return after 1 day → Resume at `pivot_question`

- [ ] Return after 8 days → Start fresh

- [ ] "Start Over" clicked → Clear session, keep attribution

### Mobile & Accessibility

- [ ] Modal scrollable on mobile

- [ ] All inputs have labels

- [ ] Focus trapped in modal

- [ ] Keyboard navigation works

---

## 5. QUESTIONS BEFORE PROCEEDING

1. **Existing ****`leads`**** table schema**: Can you confirm the current columns? I need to know if `event_id`, `utm_source`, `fbclid`, `gclid`, `fbp`, `fbc`, `zip` already exist.

1. **GTM Container ID**: Do you have a GTM container ID to install, or should I just prepare the `dataLayer` infrastructure without the GTM snippet?

1. **Phone field placement**: Confirm you want phone **optional on Step 1** OR **moved to Step 2 with value-framed copy**?

1. **Magic link trigger**: Should the success slide actually trigger a magic link email via edge function, or just display the message? (The edge function may not exist yet.)

---

## AWAITING YOUR "PROCEED"

I will not write any code until you confirm:

- [ ] Questions above are answered

- [ ] Gameplan is approved

- [ ] Any modifications to the plan

**Ready when you are.**


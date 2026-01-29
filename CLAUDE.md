# CLAUDE.md — WindowMan Vault AI Quote Scanner

> Codex for AI assistants working in this repository.
> Last updated: 2026-01-29

---

## Quick Reference

| Item | Value |
|---|---|
| **Package manager** | pnpm (lockfile: `pnpm-lock.yaml`) |
| **Language** | TypeScript (strict mode) |
| **Frontend** | React 19 + Vite 7 + Tailwind CSS 4 |
| **Backend** | Express 4 + tRPC 11 |
| **Database** | MySQL via Drizzle ORM 0.44 |
| **AI** | Google Gemini (client-side, `@google/generative-ai`) |
| **Routing** | Wouter 3.3 (patched — see `patches/`) |
| **UI library** | Radix UI + shadcn/ui (New York style) |
| **Module system** | ESM (`"type": "module"` in package.json) |
| **Node target** | ESNext |
| **Formatting** | Prettier — double quotes, trailing commas, 80 cols, 2-space indent |

---

## Commands

```bash
pnpm dev          # Start dev server (tsx watch on server, Vite on client)
pnpm build        # Production build (Vite -> dist/public, esbuild -> dist/index.js)
pnpm start        # Serve production build
pnpm check        # TypeScript type-check (tsc --noEmit)
pnpm format       # Prettier format all files
pnpm test         # Run Vitest (server tests only)
pnpm db:push      # Generate and push Drizzle migrations to MySQL
```

- Dev server runs on `http://localhost:3000` — tRPC at `/api/trpc`, client via Vite.
- Tests live in `server/**/*.test.ts` and run with Vitest in Node environment.
- There is **no lint script** (no ESLint configured). Prettier is the sole formatter.

---

## Repository Layout

```
windowman-vault/
├── client/                    # React frontend (Vite root)
│   ├── index.html             # HTML shell (GTM container GTM-T39N8QHT baked in)
│   ├── public/                # Static assets (images, debug collector)
│   └── src/
│       ├── main.tsx           # React entry point
│       ├── App.tsx            # Router (Wouter) — single-page app
│       ├── pages/             # Route-level components (Home, NotFound, ComponentShowcase)
│       ├── components/
│       │   ├── ui/            # shadcn/ui primitives (50+ files — DO NOT hand-edit)
│       │   ├── layout/        # Navbar
│       │   ├── sections/      # Landing page sections (Hero, HowItWorks, etc.)
│       │   ├── scanner/       # QuoteScanner CTA on landing page
│       │   └── vault-gate/    # ★ CORE FEATURE — multi-step lead gate modal
│       │       ├── VaultLeadGateModal.tsx   # Container / orchestrator
│       │       ├── ExitInterceptOverlay.tsx # Exit-intent overlay
│       │       └── steps/                   # One component per step (9 files)
│       ├── hooks/             # Custom React hooks
│       ├── lib/               # Utility modules (tRPC client, tracking, scanner engine)
│       ├── types/             # TypeScript type definitions
│       └── contexts/          # React contexts (ThemeContext)
├── server/                    # Express + tRPC backend
│   ├── index.ts               # Production static server
│   ├── _core/                 # Framework plumbing (tRPC init, auth, env, cookies, Vite)
│   ├── routers.ts             # ★ All tRPC routers (leads, scans, upload, auth, system)
│   ├── db.ts                  # Database query functions (Drizzle)
│   └── storage.ts             # File storage proxy (Forge API / S3)
├── shared/                    # Code shared between client and server
│   ├── const.ts               # COOKIE_NAME, timeouts, error messages
│   ├── types.ts               # Re-exports Drizzle-inferred types (User, Lead, Scan)
│   └── _core/errors.ts        # Error utilities
├── drizzle/                   # Database schema and migrations
│   ├── schema.ts              # ★ Source of truth: users, leads, scans tables
│   ├── relations.ts           # (empty — relations not used)
│   └── meta/                  # Migration journal + snapshots
├── migrations/                # Raw SQL migrations
├── docs/                      # Reference docs (Gemini models, Supabase schemas)
├── patches/                   # pnpm patches (wouter SPA routing fix)
└── [config files]             # vite.config.ts, tsconfig.json, drizzle.config.ts, etc.
```

### Path Aliases (in tsconfig.json + vite.config.ts)

| Alias | Resolves to |
|---|---|
| `@/*` | `client/src/*` |
| `@shared/*` | `shared/*` |
| `@assets/*` | `attached_assets/*` |

---

## Architecture Overview

### Data Flow

```
Browser (React SPA)
  │
  ├─ tRPC client (lib/trpc.ts) ──────► Express + tRPC (server/routers.ts)
  │                                         │
  │                                         ├─ Drizzle ORM (server/db.ts)
  │                                         │      └─► MySQL (leads, scans, users)
  │                                         │
  │                                         └─ Storage proxy (server/storage.ts)
  │                                                └─► S3/Forge API
  │
  ├─ Scanner Engine (lib/scannerEngine.ts) ──► Google Gemini API (client-side)
  │
  └─ GTM dataLayer (lib/tracking.ts) ──────► Google Tag Manager
```

The AI analysis runs **client-side** — the browser calls the Gemini API directly using `VITE_GEMINI_API_KEY`. The server handles lead/scan persistence and file storage only.

### Key Architectural Decisions

1. **Client-side AI** — The scanner engine (`lib/scannerEngine.ts`) calls Gemini directly from the browser. No server-side AI proxy exists.
2. **tRPC for all DB writes** — Every database mutation goes through `server/routers.ts`. The frontend never connects to MySQL directly.
3. **Supabase client still imported** — `lib/supabase.ts` exists for legacy/storage calls. The `VaultLeadGateModal` imports `updateLead` from it. This is a known dual-path that should eventually be consolidated to tRPC.
4. **Deterministic scoring** — `scoreFromSignals()` is a pure function. Gemini extracts boolean signals; scoring is deterministic math with fixed weights (Safety 30%, Scope 25%, Price 20%, Fine Print 15%, Warranty 10%).
5. **Session persistence** — `useSessionPersistence` stores state in `localStorage` with 7-day expiry. Users can resume the modal flow.

---

## The Multi-Step Form (Vault Lead Gate)

This is the core product feature. It is a **10-state finite state machine** implemented as a React `useReducer` in `hooks/useVaultStateMachine.ts`.

### State Machine Diagram

```
                    ┌────────────────┐
                    │  lead_capture   │  Step 1: Name, Email, ZIP
                    │   (entry gate)  │  (no close button, honeypot, 3s min)
                    └───────┬────────┘
                            │
                    ┌───────▼────────┐
                    │ pivot_question  │  Step 2: "Do you have an estimate?" + Phone
                    └──┬──────────┬──┘
                       │          │
              YES ─────┘          └───── NO
                       │          │
              ┌────────▼───┐  ┌───▼──────────────┐
              │scanner_     │  │vault_             │
              │upload       │  │confirmation       │  Step 3B: "Strategic Headstart"
              │(Step 3A)    │  │(Step 3B)          │
              └──────┬──────┘  └────────┬──────────┘
                     │                  │
              ┌──────▼──────┐           │
              │analysis_    │           │
              │theater      │           │
              │(Step 4A)    │           │
              └──────┬──────┘           │
                     │                  │
              ┌──────▼──────┐           │
              │result_      │           │
              │display      │           │
              │(Step 5A)    │           │
              └──────┬──────┘           │
                     │                  │
                     └────────┬─────────┘
                              │
                     ┌────────▼────────┐
                     │ project_details  │  Step 6: Window count, timeline, budget
                     └────────┬────────┘
                              │
                     ┌────────▼────────┐
                     │final_escalation  │  Step 7: Callback preference
                     └────────┬────────┘
                              │
                     ┌────────▼────────┐
                     │    success       │  Step 8: Confirmation + magic link
                     └─────────────────┘

        ┌──────────────────┐
        │ exit_intercept   │  Overlay triggered by close/escape after Step 1
        │ (overlay state)  │  "Email My Savings Report" fallback
        └──────────────────┘
```

### Key Files

| File | Purpose |
|---|---|
| `types/vault.ts` | All TypeScript types for the state machine, form data, scan results |
| `hooks/useVaultStateMachine.ts` | `useReducer`-based FSM with validated transitions |
| `hooks/useSessionPersistence.ts` | localStorage session save/resume (7-day expiry) |
| `hooks/useAttribution.ts` | Captures UTM params, fbclid, gclid, msclkid from URL |
| `hooks/useQuoteScanner.ts` | Orchestrates upload → storage → Gemini analysis |
| `components/vault-gate/VaultLeadGateModal.tsx` | Container that wires state machine to step components |
| `components/vault-gate/steps/*.tsx` | Individual step UIs (9 files) |
| `components/vault-gate/ExitInterceptOverlay.tsx` | Exit-intent save overlay |
| `lib/scannerEngine.ts` | Gemini prompt (EXTRACTION_RUBRIC), signal types, `scoreFromSignals()` |
| `lib/tracking.ts` | GTM dataLayer push + SHA-256 hashing for enhanced conversions |

### State Machine Rules

- **Transitions are validated** — `VALID_TRANSITIONS` map enforces allowed moves.
- `exit_intercept` can be entered from any post-Step-1 state and returns to `exitFromState`.
- `success` is a terminal state with no outgoing transitions.
- The close button is **hidden on Step 1** (`lead_capture`) — users cannot exit without submitting.
- Each step component receives `eventId` and `leadId` as props.
- Form data accumulates in `formValues` on the reducer state.

### Adding a New Step

1. Create `components/vault-gate/steps/NewStep.tsx` following the existing pattern.
2. Add the state name to `VaultState` union in `types/vault.ts`.
3. Add valid transitions in `VALID_TRANSITIONS` in `useVaultStateMachine.ts`.
4. Add the step's handler and render case in `VaultLeadGateModal.tsx`.
5. Update the progress bar steps array in the modal's JSX.
6. Fire a GTM event via `pushDL()` or a named helper from `lib/tracking.ts`.

---

## Scanner Engine (AI Analysis)

Located in `client/src/lib/scannerEngine.ts`.

### Two-Phase Architecture

1. **Gemini extracts boolean signals** — The `EXTRACTION_RUBRIC` prompt asks the AI to extract ~30 boolean/numeric fields (compliance keywords, laminated glass mentions, permit mentions, etc.) as structured JSON.
2. **`scoreFromSignals()` scores deterministically** — Pure function, no randomness. Weighted: Safety 30%, Scope 25%, Price 20%, Fine Print 15%, Warranty 10%.

### Model Configuration

```typescript
const GEMINI_MODEL = 'gemini-3-flash-preview';
```

Single model, no fallback chain. The model ID is defined at the bottom of `scannerEngine.ts`. If the model is retired or unavailable, update this constant.

### Entry Points

| Function | Input | Use case |
|---|---|---|
| `analyzeQuote()` | `File` object | Direct file analysis (base64 conversion internal) |
| `analyzeQuoteFromUrl()` | Image URL + MIME | Storage-first approach (used by `AnalysisTheaterStep`) |
| `analyzeQuoteFromBase64()` | Base64 string + MIME | Direct base64 analysis |
| `scoreFromSignals()` | `ExtractionSignals` | Pure scoring (for testing or re-scoring) |
| `getMockAnalysis()` | none | Returns fake data for UI testing |

### Environment Variable

The Gemini API key is `VITE_GEMINI_API_KEY` (exposed to client via Vite).

---

## Backend / API

### tRPC Router Structure (`server/routers.ts`)

```
appRouter
├── system    → systemRouter (health, config)
├── auth
│   ├── me       → query: current user
│   └── logout   → mutation: clear session cookie
├── leads
│   ├── upsert      → mutation: create/update lead by email
│   ├── getById     → query
│   ├── getByEmail  → query
│   ├── update      → mutation
│   └── list        → query (all leads)
├── scans
│   ├── create         → mutation: new scan record
│   ├── getById        → query
│   ├── getByLeadId    → query
│   ├── update         → mutation: add results to scan
│   └── getLatestForLead → query
└── upload
    └── file    → mutation: base64 → S3 storage, returns URL
```

All routes use `publicProcedure` — no auth required for lead capture flows.

### Database (Drizzle ORM)

**Schema source of truth:** `drizzle/schema.ts`

Three tables:
- **users** — OAuth users (id, openId, name, email, role, timestamps)
- **leads** — Captured leads (contact info, project details, UTM tracking, ad platform IDs)
- **scans** — Quote analysis results (5-pillar scores, warnings, raw AI signals, file metadata)

Types are exported from schema via `$inferSelect` / `$inferInsert` and re-exported from `shared/types.ts`.

**Query layer:** `server/db.ts` — thin wrappers around Drizzle queries. Lazy DB initialization (`getDb()`) allows the app to start without a database connection.

### Storage

`server/storage.ts` proxies file uploads to a Forge API / S3 backend using `FORGE_API_URL` and `FORGE_API_KEY` env vars.

---

## Analytics / Tracking

### GTM Events (11 total)

All events include `event_id` (deterministic, generated at Step 1) and go through `pushDL()` in `lib/tracking.ts`.

| Event | When |
|---|---|
| `lead_capture_completed` | Step 1 submitted (includes SHA-256 hashed email) |
| `lead_capture_delayed` | Step 1 takes >2s |
| `pivot_yes` | User selects "has estimate" |
| `pivot_no` | User selects "no estimate" |
| `scan_started` | File upload begins |
| `scan_completed` | AI results returned |
| `scan_persist_failed` | DB save error |
| `project_details_completed` | Step 6 submitted |
| `final_escalation_selected` | Callback preference chosen |
| `exit_intercept_shown` | Exit overlay displayed |
| `exit_intercept_converted` | Exit overlay CTA clicked |

### Enhanced Conversions

Email and phone are SHA-256 hashed before pushing to GTM (`sha256Hash()` in `lib/tracking.ts`). PII is never sent in cleartext.

---

## Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `VITE_GEMINI_API_KEY` | Client (Vite) | Google Gemini API key |
| `DATABASE_URL` | Server | MySQL connection string |
| `FORGE_API_URL` | Server | Storage API endpoint |
| `FORGE_API_KEY` | Server | Storage API auth token |
| `APP_ID` | Server | App identifier |
| `COOKIE_SECRET` | Server | Session cookie signing |
| `OAUTH_SERVER_URL` | Server | OAuth provider URL |
| `OWNER_OPEN_ID` | Server | Admin user's OAuth ID |

---

## Conventions and Patterns

### TypeScript

- **Strict mode** enabled. Zero TypeScript errors is a gate for every commit.
- Types inferred from Drizzle schema (`$inferSelect`, `$inferInsert`) are the canonical source for data shapes.
- Vault-specific types live in `client/src/types/vault.ts`.
- Use Zod for runtime validation at tRPC input boundaries.

### React

- **Hooks over classes** — all components are functional.
- **useReducer for complex state** — the vault state machine is a reducer, not useState chains.
- **useCallback for stability** — all handler functions in the modal are wrapped in `useCallback`.
- **Framer Motion for transitions** — `AnimatePresence` + `motion.div` for step changes.
- **shadcn/ui for primitives** — files in `components/ui/` are generated by shadcn CLI. Edit them only for global theme changes.

### Styling

- **Tailwind CSS 4** — utility-first, configured in `client/src/index.css`.
- **Design theme:** "Digital Fortress Vault" — dark navy/slate background, cyan accents, glassmorphism.
- Key CSS patterns: `bg-gradient-to-b from-slate-800 to-slate-900`, `border-white/10`, `backdrop-blur-sm`.
- **Fonts:** Space Grotesk (headings), Inter (body), JetBrains Mono (code) — loaded via Google Fonts in `index.html`.

### File Naming

- React components: PascalCase (`VaultLeadGateModal.tsx`)
- Hooks: camelCase with `use` prefix (`useVaultStateMachine.ts`)
- Libraries/utilities: camelCase (`scannerEngine.ts`, `tracking.ts`)
- Types: camelCase (`vault.ts`)

### Code Organization

- Each vault step is a standalone component in `components/vault-gate/steps/`.
- Hooks encapsulate behavior: state machine, session, attribution, scanner.
- `lib/` modules are side-effect-free where possible (exception: `tracking.ts` writes to `window.dataLayer`).
- Database queries are in `server/db.ts`, not inline in routers.

### Formatting (Prettier)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

Double quotes everywhere. Run `pnpm format` before committing.

---

## Common Tasks

### Changing the Gemini model

Edit the `GEMINI_MODEL` constant at the bottom of `client/src/lib/scannerEngine.ts`. Ensure the model ID matches the Google AI Studio format (e.g., `gemini-3-flash-preview`).

### Adding a new database column

1. Edit `drizzle/schema.ts` — add the column to the relevant table.
2. Run `pnpm db:push` to generate and apply the migration.
3. Update `server/db.ts` if new query patterns are needed.
4. Update `server/routers.ts` Zod schemas to accept the new field.
5. Update `shared/types.ts` if the column needs frontend access (usually automatic via `$inferSelect`).

### Adding a new tRPC endpoint

1. Add the procedure in `server/routers.ts` under the appropriate sub-router.
2. Define input with Zod (`z.object({...})`).
3. Implement the handler using functions from `server/db.ts`.
4. The client gets automatic type inference via `trpc` hooks from `lib/trpc.ts`.

### Adding a new GTM event

1. Add a typed helper function in `client/src/lib/tracking.ts` (follow existing pattern).
2. Call it from the relevant step component or modal handler.
3. Always include `event_id` and `lead_id` in the payload.
4. Hash PII (email, phone) with `sha256Hash()` before pushing.

---

## Known Technical Debt

1. **Dual Supabase/tRPC path** — `VaultLeadGateModal.tsx` imports `updateLead` from `lib/supabase.ts` for some updates while most writes go through tRPC. This should be consolidated to tRPC-only.
2. **All routes are `publicProcedure`** — The leads/scans/upload endpoints have no authentication. `protectedProcedure` and `adminProcedure` exist in `_core/trpc.ts` but are unused.
3. **Empty relations file** — `drizzle/relations.ts` is empty. Drizzle relations could be defined for type-safe joins.
4. **Exit intercept magic link** — `handleExitInterceptSendLink` has a TODO for triggering an email via edge function; currently just redirects to success.
5. **Client-exposed API key** — `VITE_GEMINI_API_KEY` is visible in the browser. Rate limiting and key restrictions in Google Cloud Console are required.

---

## Do Not

- **Do not hand-edit `components/ui/` files** unless making a global theme change. These are shadcn-generated.
- **Do not remove `patches/wouter@3.7.1.patch`** — it fixes SPA hash routing behavior.
- **Do not add new Supabase direct calls** — use tRPC for all new database operations.
- **Do not send PII (email, phone) to GTM unhashed** — always use `sha256Hash()`.
- **Do not change the scoring weights** in `scoreFromSignals()` without understanding the 5-pillar system (Safety 30%, Scope 25%, Price 20%, Fine Print 15%, Warranty 10%).
- **Do not introduce server-side AI calls** — the current architecture runs Gemini client-side intentionally.

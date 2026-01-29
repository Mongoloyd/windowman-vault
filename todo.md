
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
- [ ] Test end-to-end flow with tRPC

## Bug Fixes
- [x] Fix leadId mismatch - local session IDs vs database IDs

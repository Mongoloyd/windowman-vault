/**
 * Server-side Supabase Client
 * 
 * Uses service role key for full database access.
 * This is separate from the client-side Supabase client.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================
// CONFIGURATION
// ============================================

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// ============================================
// CLIENT INITIALIZATION
// ============================================

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error('[Supabase Server] Missing environment variables!');
      console.error('[Supabase Server] SUPABASE_URL:', SUPABASE_URL ? 'SET' : 'MISSING');
      console.error('[Supabase Server] SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY ? 'SET' : 'MISSING');
      throw new Error('Supabase configuration missing');
    }
    
    _supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    console.log('[Supabase Server] Connected to:', SUPABASE_URL?.replace(/https?:\/\//, '').split('.')[0] || 'UNKNOWN');
  }
  
  return _supabase;
}

// Export a getter for the supabase instance
export const supabase = {
  get client() {
    return getSupabase();
  },
  
  from(table: string) {
    return getSupabase().from(table);
  },
  
  storage: {
    from(bucket: string) {
      return getSupabase().storage.from(bucket);
    },
  },
};

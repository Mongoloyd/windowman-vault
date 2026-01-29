/**
 * Supabase Configuration for WindowMan Vault
 * 
 * IMPORTANT: This file uses ONLY environment variables.
 * No hardcoded fallbacks to old projects.
 */

import { createClient } from '@supabase/supabase-js';

// ============================================
// ENVIRONMENT VARIABLES (NO HARDCODED FALLBACKS)
// ============================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables on load
if (!SUPABASE_URL) {
  console.error('[Supabase] CRITICAL: VITE_SUPABASE_URL is not set!');
}
if (!SUPABASE_ANON_KEY) {
  console.error('[Supabase] CRITICAL: VITE_SUPABASE_ANON_KEY is not set!');
}

// Export for debugging
export { SUPABASE_URL, SUPABASE_ANON_KEY };

// Create Supabase client
export const supabase = createClient(
  SUPABASE_URL || '',
  SUPABASE_ANON_KEY || ''
);

// ============================================
// TIMEOUTS (Extended for Gemini 3 Pro Deep Audit)
// ============================================

export const AI_TIMEOUTS = {
  FAST: 15000,    // 15s - Chat, roleplay, evidence analysis
  HEAVY: 60000,   // 60s - Document scanning with Gemini 3 Pro (was 30s)
  UPLOAD: 90000,  // 90s - Large file uploads
} as const;

// ============================================
// ERROR TYPES
// ============================================

export class TimeoutError extends Error {
  constructor(message: string = 'Request timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class RateLimitError extends Error {
  isAnonymous: boolean;
  constructor(message: string = 'Rate limit exceeded', isAnonymous: boolean = true) {
    super(message);
    this.name = 'RateLimitError';
    this.isAnonymous = isAnonymous;
  }
}

export class ServiceError extends Error {
  status: number;
  constructor(message: string = 'Service error', status: number = 500) {
    super(message);
    this.name = 'ServiceError';
    this.status = status;
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network error. Please check your connection.') {
    super(message);
    this.name = 'NetworkError';
  }
}

// ============================================
// LEAD DATA TYPES
// ============================================

export interface LeadData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  zip?: string;
  event_id: string;
  source_tool?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  fbclid?: string;
  gclid?: string;
  fbp?: string;
  fbc?: string;
}

// ============================================
// LEAD FUNCTIONS
// ============================================

/**
 * Upsert a lead to the leads table
 * Uses email as the unique key for idempotency
 */
export async function upsertLead(data: LeadData): Promise<{ lead_id: string | null; error: Error | null }> {
  try {
    console.log('[Supabase] Upserting lead:', { email: data.email, event_id: data.event_id });
    
    const { data: result, error } = await supabase
      .from('leads')
      .upsert(
        {
          ...data,
          source_tool: data.source_tool || 'ai_scanner',
          updated_at: new Date().toISOString(),
        },
        { 
          onConflict: 'email',
          ignoreDuplicates: false 
        }
      )
      .select('id')
      .single();

    if (error) {
      console.error('[Supabase] Lead upsert error:', JSON.stringify(error, null, 2));
      return { lead_id: null, error: new ServiceError(error.message) };
    }

    console.log('[Supabase] Lead upserted successfully:', result?.id);
    return { lead_id: result?.id || null, error: null };
  } catch (err) {
    console.error('[Supabase] Lead upsert exception:', JSON.stringify(err, null, 2));
    return { lead_id: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Update lead with additional project details
 */
export async function updateLeadDetails(
  leadId: string,
  details: {
    window_count?: number;
    timeline?: string;
    budget_range?: string;
    callback_preference?: string;
    callback_time?: string;
    phone?: string;
  }
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('leads')
      .update({
        ...details,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    if (error) {
      console.error('[Supabase] Lead update error:', JSON.stringify(error, null, 2));
      return { error: new ServiceError(error.message) };
    }

    return { error: null };
  } catch (err) {
    console.error('[Supabase] Lead update exception:', JSON.stringify(err, null, 2));
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Update lead with additional data
 */
export async function updateLead(
  leadId: string,
  updates: Record<string, unknown>
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('leads')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    if (error) {
      // Full error logging to diagnose RLS issues
      console.error('[Supabase] Lead update error:', JSON.stringify(error, null, 2));
      console.error('[Supabase] Lead update context:', { leadId, updates });
      return { error: new ServiceError(error.message) };
    }

    return { error: null };
  } catch (err) {
    // Full error logging for catch block
    console.error('[Supabase] Lead update exception:', JSON.stringify(err, null, 2));
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Validate lead exists (for session resume)
 */
export async function validateLeadExists(leadId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('id')
      .eq('id', leadId)
      .single();

    return !error && !!data;
  } catch {
    return false;
  }
}

// ============================================
// SCAN DATA TYPES
// ============================================

export interface ScanData {
  lead_id: string;
  event_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_bucket?: string;
  file_path?: string;
  file_mime?: string;
  file_size?: number;
  file_sha256?: string;
  file_pages?: number;
  original_filename?: string;
  storage_mode: 'base64' | 'storage';
  overall_score?: number;
  safety_score?: number;
  scope_score?: number;
  price_score?: number;
  fine_print_score?: number;
  warranty_score?: number;
  warnings?: string[];
  missing_items?: string[];
  findings_json?: Record<string, unknown>;
  model_version?: string;
  processing_ms?: number;
  error_message?: string;
}

export interface QuoteScanResult {
  overallScore: number;
  safetyScore: number;
  scopeScore: number;
  priceScore: number;
  finePrintScore: number;
  warrantyScore: number;
  warnings: string[];
  missingItems: string[];
  summary?: string;
  pricePerOpening?: string;
  estimatedSavings?: {
    low: number;
    high: number;
  };
  rawResult?: Record<string, unknown>;
}

// ============================================
// SCAN FUNCTIONS
// ============================================

/**
 * Create a scan record
 */
export async function createScan(data: ScanData): Promise<{ scan_id: string | null; error: Error | null }> {
  try {
    console.log('[Supabase] Creating scan record:', { lead_id: data.lead_id, status: data.status });
    
    const { data: insertResult, error: insertError } = await supabase
      .from('scans')
      .insert({
        ...data,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[Supabase] Create scan error:', JSON.stringify(insertError, null, 2));
      return { scan_id: null, error: new ServiceError(insertError.message) };
    }

    console.log('[Supabase] Scan created:', insertResult?.id);
    return { scan_id: insertResult?.id || null, error: null };
  } catch (err) {
    console.error('[Supabase] Create scan exception:', JSON.stringify(err, null, 2));
    return { scan_id: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Update scan with results
 */
export async function updateScan(
  scanId: string,
  results: Partial<ScanData>
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('scans')
      .update({
        ...results,
        updated_at: new Date().toISOString(),
      })
      .eq('id', scanId);

    if (error) {
      console.error('[Supabase] Scan update error:', JSON.stringify(error, null, 2));
      return { error: new ServiceError(error.message) };
    }

    return { error: null };
  } catch (err) {
    console.error('[Supabase] Scan update exception:', JSON.stringify(err, null, 2));
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}

// ============================================
// STORAGE FUNCTIONS
// ============================================

/**
 * Upload quote image to Supabase Storage (estimates bucket)
 * Returns the public URL for the uploaded file
 */
export async function uploadQuoteToStorage(
  file: File,
  leadId: string
): Promise<{ url: string | null; path: string | null; error: Error | null }> {
  try {
    const timestamp = Date.now();
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${leadId}/${timestamp}.${ext}`;
    
    console.log('[Supabase] Uploading quote to storage:', { path, size: file.size, type: file.type });
    
    const { data, error } = await supabase.storage
      .from('estimates')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('[Supabase] Storage upload error:', JSON.stringify(error, null, 2));
      return { url: null, path: null, error: new ServiceError(error.message) };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('estimates')
      .getPublicUrl(data.path);

    console.log('[Supabase] Quote uploaded successfully:', urlData.publicUrl);
    
    return { url: urlData.publicUrl, path: data.path, error: null };
  } catch (err) {
    console.error('[Supabase] Storage upload exception:', JSON.stringify(err, null, 2));
    return { url: null, path: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

// ============================================
// QUOTE ANALYSIS (Client-Side Gemini)
// ============================================

/**
 * Analyze a quote image using client-side Gemini AI
 * NO Edge Functions - runs directly in browser
 */
export async function analyzeQuote(
  imageBase64: string,
  mimeType: string,
  leadId?: string,
  eventId?: string
): Promise<{ data: QuoteScanResult | null; error: Error | null }> {
  try {
    console.log('[analyzeQuote] Starting client-side analysis with Gemini...');
    
    // Import the scanner engine dynamically to avoid circular deps
    const { analyzeQuoteFromBase64 } = await import('./scannerEngine');
    
    const result = await analyzeQuoteFromBase64(imageBase64, mimeType);
    
    // Map AnalysisData to QuoteScanResult format
    const scanResult: QuoteScanResult = {
      overallScore: result.overallScore,
      safetyScore: result.safetyScore,
      scopeScore: result.scopeScore,
      priceScore: result.priceScore,
      finePrintScore: result.finePrintScore,
      warrantyScore: result.warrantyScore,
      warnings: result.warnings,
      missingItems: result.missingItems,
      summary: result.summary,
      pricePerOpening: result.pricePerOpening,
      rawResult: result.rawSignals as unknown as Record<string, unknown>,
    };
    
    // Optionally save to database if leadId provided
    if (leadId) {
      try {
        const { error: insertError } = await supabase.from('scans').insert({
          lead_id: leadId,
          overall_score: result.overallScore,
          safety_score: result.safetyScore,
          scope_score: result.scopeScore,
          price_score: result.priceScore,
          fine_print_score: result.finePrintScore,
          warranty_score: result.warrantyScore,
          price_per_opening: result.pricePerOpening,
          warnings: result.warnings,
          missing_items: result.missingItems,
          summary: result.summary,
          raw_signals: result.rawSignals,
        });
        
        if (insertError) {
          console.warn('[analyzeQuote] Failed to save scan to database:', JSON.stringify(insertError, null, 2));
        } else {
          console.log('[analyzeQuote] Scan saved to database');
        }
      } catch (dbError) {
        console.warn('[analyzeQuote] Database save failed:', JSON.stringify(dbError, null, 2));
        // Don't fail the whole operation if DB save fails
      }
    }
    
    return { data: scanResult, error: null };
  } catch (err) {
    console.error('[analyzeQuote] Client-side analysis error:', JSON.stringify(err, null, 2));
    return { 
      data: null, 
      error: err instanceof Error ? err : new Error(String(err)) 
    };
  }
}

/**
 * Analyze quote using storage-first approach
 * 1. Upload to Supabase Storage
 * 2. Pass URL to Gemini (avoids base64 network crashes)
 * 3. Save results to scans table
 */
export async function analyzeQuoteWithStorage(
  file: File,
  leadId: string,
  eventId?: string
): Promise<{ data: QuoteScanResult | null; quoteUrl: string | null; error: Error | null }> {
  try {
    console.log('[analyzeQuoteWithStorage] Starting storage-first analysis...');
    
    // Step 1: Upload to storage
    const { url: quoteUrl, path: quotePath, error: uploadError } = await uploadQuoteToStorage(file, leadId);
    
    if (uploadError || !quoteUrl) {
      console.error('[analyzeQuoteWithStorage] Upload failed:', uploadError);
      // Fallback to base64 if storage fails
      console.log('[analyzeQuoteWithStorage] Falling back to base64 analysis...');
      const base64Result = await analyzeQuote(await fileToBase64(file), file.type, leadId, eventId);
      return { ...base64Result, quoteUrl: null };
    }

    // Step 2: Analyze with Gemini using URL
    const { analyzeQuoteFromUrl } = await import('./scannerEngine');
    const result = await analyzeQuoteFromUrl(quoteUrl, file.type);
    
    // Map AnalysisData to QuoteScanResult format
    const scanResult: QuoteScanResult = {
      overallScore: result.overallScore,
      safetyScore: result.safetyScore,
      scopeScore: result.scopeScore,
      priceScore: result.priceScore,
      finePrintScore: result.finePrintScore,
      warrantyScore: result.warrantyScore,
      warnings: result.warnings,
      missingItems: result.missingItems,
      summary: result.summary,
      pricePerOpening: result.pricePerOpening,
      rawResult: result.rawSignals as unknown as Record<string, unknown>,
    };
    
    // Step 3: Save to scans table with quote_url
    try {
      const { error: insertError } = await supabase.from('scans').insert({
        lead_id: leadId,
        quote_url: quoteUrl,
        overall_score: result.overallScore,
        safety_score: result.safetyScore,
        scope_score: result.scopeScore,
        price_score: result.priceScore,
        fine_print_score: result.finePrintScore,
        warranty_score: result.warrantyScore,
        price_per_opening: result.pricePerOpening,
        warnings: result.warnings,
        missing_items: result.missingItems,
        summary: result.summary,
        raw_signals: result.rawSignals,
      });
      
      if (insertError) {
        console.error('[analyzeQuoteWithStorage] Failed to save scan:', JSON.stringify(insertError, null, 2));
      } else {
        console.log('[analyzeQuoteWithStorage] Scan saved to database');
      }
    } catch (dbError) {
      console.warn('[analyzeQuoteWithStorage] Database save failed:', JSON.stringify(dbError, null, 2));
    }
    
    return { data: scanResult, quoteUrl, error: null };
  } catch (err) {
    console.error('[analyzeQuoteWithStorage] Analysis error:', JSON.stringify(err, null, 2));
    return { 
      data: null, 
      quoteUrl: null,
      error: err instanceof Error ? err : new Error(String(err)) 
    };
  }
}

// ============================================
// AUTH FUNCTIONS
// ============================================

/**
 * Trigger magic link for Vault access
 */
export async function sendMagicLink(
  email: string,
  leadId: string,
  eventId: string
): Promise<{ error: Error | null }> {
  try {
    const redirectUrl = `${window.location.origin}/vault?event_id=${encodeURIComponent(eventId)}&lead_id=${encodeURIComponent(leadId)}`;
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      console.error('[Supabase] Magic link error:', JSON.stringify(error, null, 2));
      return { error: new ServiceError(error.message) };
    }

    return { error: null };
  } catch (err) {
    console.error('[Supabase] Magic link exception:', JSON.stringify(err, null, 2));
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Helper: Convert file to base64
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

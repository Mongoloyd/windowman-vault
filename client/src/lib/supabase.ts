/**
 * Supabase Configuration for WindowMan Vault
 * Connects to the existing Lovable-hosted Supabase instance
 */

import { createClient } from '@supabase/supabase-js';

// Use environment variables with fallback to hardcoded values for backwards compatibility
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://uzulqexlgavggcyizabf.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6dWxxZXhsZ2F2Z2djeWl6YWJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwODQwNjgsImV4cCI6MjA4MjY2MDA2OH0.QvwUD5ScBk2DrD8yKiS3NBSeOuGAikQ3XT5TKn6Hf5U';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// AI Request timeouts
export const AI_TIMEOUTS = {
  FAST: 15000,    // 15s - Chat, roleplay, evidence analysis
  HEAVY: 30000,   // 30s - Document scanning, quote generation
  UPLOAD: 60000,  // 60s - Large file uploads
} as const;

// Error types
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

/**
 * Send a request to a Supabase Edge Function
 */
export async function sendEdgeFunctionRequest<T = unknown>(
  functionName: string,
  body: unknown,
  timeoutMs: number = AI_TIMEOUTS.HEAVY
): Promise<{ data: T | null; error: Error | null }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/${functionName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    // Handle HTTP errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 429) {
        throw new RateLimitError(
          errorData.error || 'Rate limit exceeded',
          errorData.isAnonymous ?? true
        );
      }
      
      if (response.status === 503) {
        throw new ServiceError('Service temporarily unavailable', 503);
      }
      
      throw new ServiceError(
        errorData.error || `Request failed with status ${response.status}`,
        response.status
      );
    }

    const data = await response.json();
    
    // Check for error in response body
    if (data.error) {
      if (data.error.includes('Rate limit') || data.error.includes('429')) {
        throw new RateLimitError(data.error, data.isAnonymous ?? true);
      }
      throw new ServiceError(data.error);
    }

    return { data: data as T, error: null };

  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      return { data: null, error: new TimeoutError('Request timed out. Please try again.') };
    }

    if (error instanceof RateLimitError || error instanceof ServiceError) {
      return { data: null, error };
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { data: null, error: new NetworkError() };
    }

    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Lead data structure for upsert
 */
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

/**
 * Upsert a lead to the leads table
 * Uses email as the unique key for idempotency
 */
export async function upsertLead(data: LeadData): Promise<{ lead_id: string | null; error: Error | null }> {
  try {
    // Use RPC if available, otherwise direct upsert
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
      console.error('[Supabase] Lead upsert error:', error);
      return { lead_id: null, error: new ServiceError(error.message) };
    }

    return { lead_id: result?.id || null, error: null };
  } catch (err) {
    console.error('[Supabase] Lead upsert exception:', err);
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
      console.error('[Supabase] Lead update error:', error);
      return { error: new ServiceError(error.message) };
    }

    return { error: null };
  } catch (err) {
    console.error('[Supabase] Lead update exception:', err);
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Scan result data structure
 */
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

/**
 * Create a scan record via RPC (secure)
 * Falls back to direct insert if RPC not available
 */
export async function createScan(data: ScanData): Promise<{ scan_id: string | null; error: Error | null }> {
  try {
    // Try RPC first (more secure)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('rpc_create_scan', {
      p_lead_id: data.lead_id,
      p_event_id: data.event_id,
      p_status: data.status,
      p_file_bucket: data.file_bucket,
      p_file_path: data.file_path,
      p_file_mime: data.file_mime,
      p_file_size: data.file_size,
      p_file_sha256: data.file_sha256,
      p_file_pages: data.file_pages,
      p_original_filename: data.original_filename,
      p_storage_mode: data.storage_mode,
      p_overall_score: data.overall_score,
      p_safety_score: data.safety_score,
      p_scope_score: data.scope_score,
      p_price_score: data.price_score,
      p_fine_print_score: data.fine_print_score,
      p_warranty_score: data.warranty_score,
      p_warnings: data.warnings,
      p_missing_items: data.missing_items,
      p_findings_json: data.findings_json,
      p_model_version: data.model_version,
      p_processing_ms: data.processing_ms,
      p_error_message: data.error_message,
    });

    if (!rpcError && rpcResult) {
      return { scan_id: rpcResult, error: null };
    }

    // Fallback to direct insert if RPC doesn't exist
    if (rpcError?.code === 'PGRST202' || rpcError?.message?.includes('function')) {
      console.warn('[Supabase] RPC not available, using direct insert');
      const { data: insertResult, error: insertError } = await supabase
        .from('scans')
        .insert({
          ...data,
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (insertError) {
        return { scan_id: null, error: new ServiceError(insertError.message) };
      }

      return { scan_id: insertResult?.id || null, error: null };
    }

    return { scan_id: null, error: new ServiceError(rpcError?.message || 'Failed to create scan') };
  } catch (err) {
    console.error('[Supabase] Create scan exception:', err);
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
      console.error('[Supabase] Scan update error:', error);
      return { error: new ServiceError(error.message) };
    }

    return { error: null };
  } catch (err) {
    console.error('[Supabase] Scan update exception:', err);
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Get signed upload URL for large files
 */
export async function getSignedUploadUrl(
  leadId: string,
  scanId: string,
  filename: string,
  mimeType: string
): Promise<{ url: string | null; path: string | null; error: Error | null }> {
  try {
    // Try edge function first
    const { data, error } = await sendEdgeFunctionRequest<{ url: string; path: string }>(
      'create-upload-url',
      {
        lead_id: leadId,
        scan_id: scanId,
        filename,
        mime_type: mimeType,
      },
      AI_TIMEOUTS.FAST
    );

    if (error) {
      // Fallback: generate path and use direct storage upload
      const path = `quotes/${leadId}/${scanId}/${filename}`;
      const { data: signedData, error: signedError } = await supabase.storage
        .from('quotes')
        .createSignedUploadUrl(path);

      if (signedError) {
        return { url: null, path: null, error: new ServiceError(signedError.message) };
      }

      return { url: signedData.signedUrl, path, error: null };
    }

    return { url: data?.url || null, path: data?.path || null, error: null };
  } catch (err) {
    console.error('[Supabase] Get signed URL exception:', err);
    return { url: null, path: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Upload file to storage using signed URL
 */
export async function uploadFileToStorage(
  signedUrl: string,
  file: File
): Promise<{ error: Error | null }> {
  try {
    const response = await fetch(signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }

    return { error: null };
  } catch (err) {
    console.error('[Supabase] File upload exception:', err);
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

/**
 * Trigger magic link for Vault access
 */
export async function sendMagicLink(
  email: string,
  leadId: string,
  eventId: string
): Promise<{ error: Error | null }> {
  try {
    const redirectUrl = `https://itswindowman.com/vault?event_id=${encodeURIComponent(eventId)}&lead_id=${encodeURIComponent(leadId)}`;
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      console.error('[Supabase] Magic link error:', error);
      return { error: new ServiceError(error.message) };
    }

    return { error: null };
  } catch (err) {
    console.error('[Supabase] Magic link exception:', err);
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}


/**
 * Analyze a quote image using client-side Gemini AI
 * (Ported from Edge Function to run directly in browser)
 */
export async function analyzeQuote(
  imageBase64: string,
  mimeType: string,
  leadId?: string,
  eventId?: string
): Promise<{ data: QuoteScanResult | null; error: Error | null }> {
  try {
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
        await supabase.from('scans').insert({
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
      } catch (dbError) {
        console.warn('[analyzeQuote] Failed to save scan to database:', dbError);
        // Don't fail the whole operation if DB save fails
      }
    }
    
    return { data: scanResult, error: null };
  } catch (err) {
    console.error('[analyzeQuote] Client-side analysis error:', err);
    return { 
      data: null, 
      error: err instanceof Error ? err : new Error(String(err)) 
    };
  }
}

/**
 * Quote scan result from edge function
 */
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

/**
 * Update lead with additional data (alias for updateLeadDetails)
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

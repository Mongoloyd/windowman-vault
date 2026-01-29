/**
 * Supabase Client for WindowMan Vault
 * 
 * ARCHITECTURE: Direct Supabase SDK for full data ownership
 * - Uses ONLY VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from environment
 * - NO hardcoded URLs or fallbacks
 * - All leads/scans/wm_leads writes go directly to user's Supabase project
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================
// SUPABASE CLIENT (Environment Variables ONLY)
// ============================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] CRITICAL: Missing environment variables!');
  console.error('[Supabase] VITE_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
  console.error('[Supabase] VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING');
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Log the connection for debugging (remove in production)
console.log('[Supabase] Connected to:', supabaseUrl?.replace(/https?:\/\//, '').split('.')[0] || 'UNKNOWN');

// ============================================
// TIMEOUTS (Extended for Gemini 3 Flash Audit)
// ============================================

export const AI_TIMEOUTS = {
  FAST: 15000,    // 15s - Chat, roleplay, evidence analysis
  HEAVY: 45000,   // 45s - Document scanning with Gemini 3 Flash
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
// SCAN DATA TYPES
// ============================================

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
// UTM & ATTRIBUTION CAPTURE
// ============================================

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  msclkid?: string;
  fbclid?: string;
  ttclid?: string;
  li_fat_id?: string;
  referrer?: string;
  landing_page?: string;
}

/**
 * Extract UTM parameters and ad platform click IDs from URL
 */
export function captureUTMParams(): UTMParams {
  const params = new URLSearchParams(window.location.search);
  
  return {
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
    utm_term: params.get('utm_term') || undefined,
    utm_content: params.get('utm_content') || undefined,
    gclid: params.get('gclid') || undefined,
    msclkid: params.get('msclkid') || undefined,
    fbclid: params.get('fbclid') || undefined,
    ttclid: params.get('ttclid') || undefined,
    li_fat_id: params.get('li_fat_id') || undefined,
    referrer: document.referrer || undefined,
    landing_page: window.location.pathname,
  };
}

// ============================================
// LEAD OPERATIONS (Direct Supabase)
// ============================================

export interface LeadData {
  // Core contact info (matches user's actual Supabase schema)
  first_name?: string;
  last_name?: string;
  name?: string;
  email: string;
  phone?: string;
  zip?: string;  // Note: column is 'zip' not 'zip_code'
  city?: string;
  state?: string;
  
  // Session tracking
  event_id?: string;
  original_session_id?: string;
  client_id?: string;
  client_user_agent?: string;
  
  // UTM & Attribution (all 60+ columns from user's schema)
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  msclkid?: string;
  fbclid?: string;
  fbc?: string;
  fbp?: string;
  facebook_ad_id?: string;
  facebook_page_name?: string;
  
  // Source tracking
  landing_page?: string;
  source_page?: string;
  source_tool?: string;
  source_form?: string;
  original_source_tool?: string;
  
  // Last non-direct attribution
  last_non_direct_utm_source?: string;
  last_non_direct_utm_medium?: string;
  last_non_direct_gclid?: string;
  last_non_direct_fbclid?: string;
  last_non_direct_channel?: string;
  last_non_direct_landing_page?: string;
  
  // Touch attribution
  first_touch?: string;
  last_touch?: string;
  
  // Lead details
  window_count?: number;
  insurance_carrier?: string;
  urgency_level?: string;
  emotional_state?: string;
  specific_detail?: string;
  timeline?: string;
  notes?: string;
  
  // CRM scoring
  lead_status?: string;
  lead_quality?: string;
  engagement_score?: number;
  lead_score_total?: number;
  estimated_deal_value?: number;
  
  // Status
  status?: string;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
  captured_at?: string;
}

/**
 * Create a new lead in Supabase
 */
export async function createLead(data: LeadData): Promise<{ data: { id: string } | null; error: Error | null }> {
  try {
    // Build lead data matching user's actual Supabase schema
    // Only include non-undefined values to avoid schema cache errors
    const now = new Date().toISOString();
    
    const leadData: Record<string, unknown> = {
      // Core contact
      email: data.email,
      created_at: now,
      updated_at: now,
      captured_at: now,
    };
    
    // Add optional fields only if they have values
    if (data.first_name) leadData.first_name = data.first_name;
    if (data.last_name) leadData.last_name = data.last_name;
    if (data.name) leadData.name = data.name;
    if (data.phone) leadData.phone = data.phone;
    if (data.zip) leadData.zip = data.zip;
    if (data.city) leadData.city = data.city;
    if (data.state) leadData.state = data.state;
    
    // Session tracking
    if (data.event_id) leadData.event_id = data.event_id;
    if (data.original_session_id) leadData.original_session_id = data.original_session_id;
    if (data.client_id) leadData.client_id = data.client_id;
    if (data.client_user_agent) leadData.client_user_agent = data.client_user_agent;
    
    // UTM & Attribution
    if (data.utm_source) leadData.utm_source = data.utm_source;
    if (data.utm_medium) leadData.utm_medium = data.utm_medium;
    if (data.utm_campaign) leadData.utm_campaign = data.utm_campaign;
    if (data.utm_term) leadData.utm_term = data.utm_term;
    if (data.utm_content) leadData.utm_content = data.utm_content;
    if (data.gclid) leadData.gclid = data.gclid;
    if (data.msclkid) leadData.msclkid = data.msclkid;
    if (data.fbclid) leadData.fbclid = data.fbclid;
    if (data.fbc) leadData.fbc = data.fbc;
    if (data.fbp) leadData.fbp = data.fbp;
    if (data.facebook_ad_id) leadData.facebook_ad_id = data.facebook_ad_id;
    
    // Source tracking
    if (data.landing_page) leadData.landing_page = data.landing_page;
    if (data.source_page) leadData.source_page = data.source_page;
    if (data.source_tool) leadData.source_tool = data.source_tool;
    if (data.source_form) leadData.source_form = data.source_form;
    
    // Lead details
    if (data.status) leadData.status = data.status;
    if (data.lead_status) leadData.lead_status = data.lead_status;
    if (data.lead_quality) leadData.lead_quality = data.lead_quality;
    
    console.log('[createLead] Inserting to Supabase leads table:', {
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      zip: data.zip,
    });
    
    const { data: result, error } = await supabase
      .from('leads')
      .insert(leadData)
      .select('id')
      .single();
    
    if (error) {
      console.error('[createLead] Supabase error:', error);
      return { data: null, error: new Error(error.message) };
    }
    
    console.log('[createLead] Lead created with ID:', result.id);
    return { data: result, error: null };
  } catch (err) {
    console.error('[createLead] Exception:', err);
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Update an existing lead in Supabase
 */
export async function updateLead(
  id: string,
  data: Partial<LeadData>
): Promise<{ data: { id: string } | null; error: Error | null }> {
  try {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
    };
    
    console.log('[updateLead] Updating lead:', id, updateData);
    
    const { data: result, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .select('id')
      .single();
    
    if (error) {
      console.error('[updateLead] Supabase error:', error);
      return { data: null, error: new Error(error.message) };
    }
    
    return { data: result, error: null };
  } catch (err) {
    console.error('[updateLead] Exception:', err);
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

// ============================================
// SCAN OPERATIONS (Direct Supabase)
// ============================================

/**
 * ScanData interface - matches user's actual Supabase scans table:
 * id, lead_id, quote_url, overall_score, audit_details (jsonb), raw_response, created_at, updated_at
 */
export interface ScanData {
  lead_id: string;
  quote_url: string;  // URL to the uploaded quote image
  overall_score: number;
  
  // All detailed scores and analysis go into audit_details jsonb
  audit_details: {
    safety_score: number;
    scope_score: number;
    price_score: number;
    fine_print_score: number;
    warranty_score: number;
    warnings: string[];
    missing_items: string[];
    summary?: string;
    price_per_opening?: string;
    estimated_savings?: {
      low: number;
      high: number;
    };
  };
  
  // Raw AI response as text
  raw_response?: string;
}

/**
 * Create a scan record in Supabase
 * Schema: id, lead_id, quote_url, overall_score, audit_details (jsonb), raw_response, created_at, updated_at
 */
export async function createScan(data: ScanData): Promise<{ data: { id: string } | null; error: Error | null }> {
  try {
    const now = new Date().toISOString();
    
    const scanData = {
      lead_id: data.lead_id,
      quote_url: data.quote_url,
      overall_score: data.overall_score,
      audit_details: data.audit_details,  // jsonb column accepts object directly
      raw_response: data.raw_response || null,
      created_at: now,
      updated_at: now,
    };
    
    console.log('[createScan] Inserting to Supabase scans table:', {
      lead_id: data.lead_id,
      quote_url: data.quote_url,
      overall_score: data.overall_score,
    });
    
    const { data: result, error } = await supabase
      .from('scans')
      .insert(scanData)
      .select('id')
      .single();
    
    if (error) {
      console.error('[createScan] Supabase error:', JSON.stringify(error, null, 2));
      return { data: null, error: new Error(error.message) };
    }
    
    console.log('[createScan] Scan created with ID:', result.id);
    return { data: result, error: null };
  } catch (err) {
    console.error('[createScan] Exception:', err);
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

// ============================================
// WM_LEADS CRM SYNC (Dual-Write)
// ============================================

/**
 * WMLeadData interface - matches user's actual Supabase wm_leads table:
 * id, lead_id, created_at, updated_at, first_name, last_name, email, phone, city, state, zip,
 * original_client_id, original_session_id, verified_social_url, status, lead_quality,
 * engagement_score, assigned_to, notes, disqualification_reason, qualified_cv_fired,
 * estimated_deal_value, actual_deal_value, captured_at, qualified_at, disqualified_at,
 * last_contacted_at, closed_at, original_source_tool, utm_source, utm_medium, utm_campaign,
 * utm_content, utm_term, landing_page, gclid, fbclid, facebook_ad_id, facebook_page_name,
 * last_non_direct_utm_source, last_non_direct_utm_medium, last_non_direct_gclid,
 * last_non_direct_fbclid, last_non_direct_channel, last_non_direct_landing_page
 */
export interface WMLeadData {
  lead_id: string;
  
  // Contact info
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  zip?: string;  // Note: column is 'zip' not 'zip_code'
  
  // Session tracking
  original_client_id?: string;
  original_session_id?: string;
  
  // CRM scoring
  status?: string;
  lead_quality?: string; // 'hot', 'warm', 'cold'
  engagement_score?: number;
  estimated_deal_value?: number;
  actual_deal_value?: number;
  assigned_to?: string;
  notes?: string;
  disqualification_reason?: string;
  qualified_cv_fired?: string;
  
  // Attribution
  original_source_tool?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  landing_page?: string;
  gclid?: string;
  fbclid?: string;
  facebook_ad_id?: string;
  facebook_page_name?: string;
  
  // Last non-direct attribution
  last_non_direct_utm_source?: string;
  last_non_direct_utm_medium?: string;
  last_non_direct_gclid?: string;
  last_non_direct_fbclid?: string;
  last_non_direct_channel?: string;
  last_non_direct_landing_page?: string;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
  captured_at?: string;
  qualified_at?: string;
  disqualified_at?: string;
  last_contacted_at?: string;
  closed_at?: string;
}

/**
 * Create or update wm_leads record for CRM sync
 * Only includes fields that exist in user's actual wm_leads table
 */
export async function upsertWMLead(data: WMLeadData): Promise<{ data: { id: string } | null; error: Error | null }> {
  try {
    const now = new Date().toISOString();
    
    // Build data object with only fields that exist in the schema
    const wmLeadData: Record<string, unknown> = {
      lead_id: data.lead_id,
      updated_at: now,
    };
    
    // Add optional fields only if they have values
    if (data.first_name) wmLeadData.first_name = data.first_name;
    if (data.last_name) wmLeadData.last_name = data.last_name;
    if (data.email) wmLeadData.email = data.email;
    if (data.phone) wmLeadData.phone = data.phone;
    if (data.city) wmLeadData.city = data.city;
    if (data.state) wmLeadData.state = data.state;
    if (data.zip) wmLeadData.zip = data.zip;
    if (data.original_client_id) wmLeadData.original_client_id = data.original_client_id;
    if (data.original_session_id) wmLeadData.original_session_id = data.original_session_id;
    if (data.status) wmLeadData.status = data.status;
    if (data.lead_quality) wmLeadData.lead_quality = data.lead_quality;
    if (data.engagement_score !== undefined) wmLeadData.engagement_score = data.engagement_score;
    if (data.estimated_deal_value !== undefined) wmLeadData.estimated_deal_value = data.estimated_deal_value;
    if (data.original_source_tool) wmLeadData.original_source_tool = data.original_source_tool;
    if (data.utm_source) wmLeadData.utm_source = data.utm_source;
    if (data.utm_medium) wmLeadData.utm_medium = data.utm_medium;
    if (data.utm_campaign) wmLeadData.utm_campaign = data.utm_campaign;
    if (data.utm_content) wmLeadData.utm_content = data.utm_content;
    if (data.utm_term) wmLeadData.utm_term = data.utm_term;
    if (data.landing_page) wmLeadData.landing_page = data.landing_page;
    if (data.gclid) wmLeadData.gclid = data.gclid;
    if (data.fbclid) wmLeadData.fbclid = data.fbclid;
    
    console.log('[upsertWMLead] Upserting wm_lead for lead_id:', data.lead_id);
    
    // Check if record exists
    const { data: existing } = await supabase
      .from('wm_leads')
      .select('id')
      .eq('lead_id', data.lead_id)
      .single();
    
    if (existing) {
      // Update existing
      const { data: result, error } = await supabase
        .from('wm_leads')
        .update(wmLeadData)
        .eq('lead_id', data.lead_id)
        .select('id')
        .single();
      
      if (error) {
        console.error('[upsertWMLead] Update error:', JSON.stringify(error, null, 2));
        return { data: null, error: new Error(error.message) };
      }
      
      console.log('[upsertWMLead] WM Lead updated with ID:', result.id);
      return { data: result, error: null };
    } else {
      // Insert new
      wmLeadData.created_at = now;
      wmLeadData.captured_at = now;
      
      const { data: result, error } = await supabase
        .from('wm_leads')
        .insert(wmLeadData)
        .select('id')
        .single();
      
      if (error) {
        console.error('[upsertWMLead] Insert error:', JSON.stringify(error, null, 2));
        return { data: null, error: new Error(error.message) };
      }
      
      console.log('[upsertWMLead] WM Lead created with ID:', result.id);
      return { data: result, error: null };
    }
  } catch (err) {
    console.error('[upsertWMLead] Exception:', err);
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

// ============================================
// STORAGE OPERATIONS (Supabase Storage)
// ============================================

/**
 * Upload a file to Supabase Storage (estimates bucket)
 */
export async function uploadToStorage(
  file: File,
  leadId: string
): Promise<{ url: string; path: string } | null> {
  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${leadId}/${Date.now()}.${fileExt}`;
    
    console.log('[uploadToStorage] Uploading to estimates bucket:', fileName);
    
    const { data, error } = await supabase.storage
      .from('estimates')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });
    
    if (error) {
      console.error('[uploadToStorage] Upload error:', error);
      return null;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('estimates')
      .getPublicUrl(data.path);
    
    console.log('[uploadToStorage] File uploaded, URL:', urlData.publicUrl);
    
    return {
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (err) {
    console.error('[uploadToStorage] Exception:', err);
    return null;
  }
}

// ============================================
// QUOTE ANALYSIS (Client-Side Gemini)
// ============================================

/**
 * Analyze a quote image using client-side Gemini AI (STORAGE-FIRST)
 * 
 * This function accepts a public URL to the uploaded quote image.
 * NO Base64 encoding - avoids network crashes on large files.
 */
export async function analyzeQuote(
  imageUrl: string,
  mimeType: string,
  leadId?: string,
  eventId?: string
): Promise<{ data: QuoteScanResult | null; error: Error | null }> {
  try {
    console.log('[analyzeQuote] Starting storage-first analysis with Gemini 3 Flash...');
    
    // Import the scanner engine dynamically to avoid circular deps
    const { analyzeQuoteFromUrl } = await import('./scannerEngine');
    
    const result = await analyzeQuoteFromUrl(imageUrl, mimeType);
    
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
    
    return { data: scanResult, error: null };
  } catch (err) {
    console.error('[analyzeQuote] Storage-first analysis error:', JSON.stringify(err, null, 2));
    return { 
      data: null, 
      error: err instanceof Error ? err : new Error(String(err)) 
    };
  }
}

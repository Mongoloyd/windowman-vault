/**
 * Supabase/Scanner Utilities for WindowMan Vault
 * 
 * ARCHITECTURE: This file now only contains:
 * - Error types
 * - Timeouts
 * - Quote analysis functions (using client-side Gemini)
 * 
 * All lead/scan CRUD operations have been migrated to tRPC (server/routers.ts)
 */

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
// QUOTE ANALYSIS (Client-Side Gemini)
// ============================================

/**
 * Analyze a quote image using client-side Gemini AI
 * NO Edge Functions - runs directly in browser
 * 
 * Note: Database persistence is now handled via tRPC in the calling component
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
    
    return { data: scanResult, error: null };
  } catch (err) {
    console.error('[analyzeQuote] Client-side analysis error:', JSON.stringify(err, null, 2));
    return { 
      data: null, 
      error: err instanceof Error ? err : new Error(String(err)) 
    };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Helper: Convert file to base64
 */
export async function fileToBase64(file: File): Promise<string> {
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

/**
 * Tracking Library - GTM DataLayer Wrapper
 * 
 * All tracking events go through pushDL() which:
 * 1. Guards against missing dataLayer
 * 2. Logs to console in development mode
 * 3. Includes event_id in every event for CAPI dedupe
 */

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

// Initialize dataLayer if not present (GTM should do this, but defensive)
if (typeof window !== 'undefined') {
  window.dataLayer = window.dataLayer || [];
}

const isDev = import.meta.env.DEV;

/**
 * Push event to GTM dataLayer with defensive guards and dev logging
 */
export function pushDL(payload: Record<string, unknown>): void {
  // Add timestamp
  const enrichedPayload = {
    ...payload,
    timestamp: new Date().toISOString(),
  };

  // Dev mode: always log to console
  if (isDev) {
    console.log(
      '%c[GTM Event]',
      'background: #4285f4; color: white; padding: 2px 6px; border-radius: 3px;',
      enrichedPayload
    );
  }

  // Guard against missing dataLayer
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push(enrichedPayload);
  } else if (isDev) {
    console.warn('[GTM] dataLayer not available - event not pushed:', enrichedPayload);
  }
}

/**
 * SHA-256 hash for enhanced conversions (email, phone)
 */
export async function sha256Hash(value: string): Promise<string> {
  const normalized = value.toLowerCase().trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Standard event payloads for the Vault Lead Gate flow
 */
export interface VaultEventPayload {
  event: string;
  event_id: string;
  lead_id?: string;
  source_tool?: string;
  [key: string]: unknown;
}

/**
 * Fire lead_capture_completed event
 */
export async function fireLeadCaptureCompleted(params: {
  event_id: string;
  lead_id: string;
  email: string;
  phone?: string;
  has_zip: boolean;
}): Promise<void> {
  const email_sha256 = await sha256Hash(params.email);
  const phone_sha256 = params.phone ? await sha256Hash(params.phone) : undefined;

  pushDL({
    event: 'lead_capture_completed',
    event_id: params.event_id,
    lead_id: params.lead_id,
    source_tool: 'ai_scanner',
    email_sha256,
    phone_sha256,
    has_zip: params.has_zip,
    has_phone: !!params.phone,
  });
}

/**
 * Fire lead_capture_delayed event
 */
export function fireLeadCaptureDelayed(params: {
  event_id: string;
  delay_ms: number;
}): void {
  pushDL({
    event: 'lead_capture_delayed',
    event_id: params.event_id,
    delay_ms: params.delay_ms,
    source_tool: 'ai_scanner',
  });
}

/**
 * Fire pivot_yes event
 */
export function firePivotYes(params: {
  event_id: string;
  lead_id: string;
  has_phone: boolean;
}): void {
  pushDL({
    event: 'pivot_yes',
    event_id: params.event_id,
    lead_id: params.lead_id,
    source_tool: 'ai_scanner',
    has_phone: params.has_phone,
  });
}

/**
 * Fire pivot_no event
 */
export function firePivotNo(params: {
  event_id: string;
  lead_id: string;
  has_phone: boolean;
}): void {
  pushDL({
    event: 'pivot_no',
    event_id: params.event_id,
    lead_id: params.lead_id,
    source_tool: 'ai_scanner',
    has_phone: params.has_phone,
  });
}

/**
 * Fire scan_started event
 */
export function fireScanStarted(params: {
  event_id: string;
  lead_id: string;
  file_type: string;
  file_size: number;
  storage_mode: 'base64' | 'storage';
}): void {
  pushDL({
    event: 'scan_started',
    event_id: params.event_id,
    lead_id: params.lead_id,
    source_tool: 'ai_scanner',
    file_type: params.file_type,
    file_size: params.file_size,
    storage_mode: params.storage_mode,
  });
}

/**
 * Fire scan_completed event
 */
export function fireScanCompleted(params: {
  event_id: string;
  lead_id: string;
  score: number;
  warning_count: number;
}): void {
  pushDL({
    event: 'scan_completed',
    event_id: params.event_id,
    lead_id: params.lead_id,
    source_tool: 'ai_scanner',
    score: params.score,
    warning_count: params.warning_count,
  });
}

/**
 * Fire scan_persist_failed event
 */
export function fireScanPersistFailed(params: {
  event_id: string;
  lead_id: string;
  error_code: string;
}): void {
  pushDL({
    event: 'scan_persist_failed',
    event_id: params.event_id,
    lead_id: params.lead_id,
    source_tool: 'ai_scanner',
    error_code: params.error_code,
  });
}

/**
 * Fire project_details_completed event
 */
export function fireProjectDetailsCompleted(params: {
  event_id: string;
  lead_id: string;
  window_count?: number;
  timeline?: string;
}): void {
  pushDL({
    event: 'project_details_completed',
    event_id: params.event_id,
    lead_id: params.lead_id,
    source_tool: 'ai_scanner',
    window_count: params.window_count,
    timeline: params.timeline,
  });
}

/**
 * Fire final_escalation_selected event
 */
export function fireFinalEscalationSelected(params: {
  event_id: string;
  lead_id: string;
  escalation_type: string;
}): void {
  pushDL({
    event: 'final_escalation_selected',
    event_id: params.event_id,
    lead_id: params.lead_id,
    source_tool: 'ai_scanner',
    escalation_type: params.escalation_type,
  });
}

/**
 * Fire exit_intercept_shown event
 */
export function fireExitInterceptShown(params: {
  event_id: string;
  lead_id: string;
  exit_step: string;
}): void {
  pushDL({
    event: 'exit_intercept_shown',
    event_id: params.event_id,
    lead_id: params.lead_id,
    source_tool: 'ai_scanner',
    exit_step: params.exit_step,
  });
}

/**
 * Fire exit_intercept_converted event
 */
export function fireExitInterceptConverted(params: {
  event_id: string;
  lead_id: string;
}): void {
  pushDL({
    event: 'exit_intercept_converted',
    event_id: params.event_id,
    lead_id: params.lead_id,
    source_tool: 'ai_scanner',
  });
}

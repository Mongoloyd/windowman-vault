/**
 * Event ID Generation
 * 
 * Generates deterministic event IDs for GTM/CAPI deduplication.
 * The event_id is created once at Step 1 and persisted throughout the flow.
 */

/**
 * Generate a unique event ID
 * Format: wm_{timestamp}_{random}
 * 
 * This is NOT deterministic based on user data - it's unique per session.
 * The "deterministic" aspect is that once generated, it's used consistently
 * across all events in the same session.
 */
export function generateEventId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `wm_${timestamp}_${random}`;
}

/**
 * Generate an idempotency key for lead deduplication
 * Based on email + session to prevent duplicate submissions
 */
export async function generateIdempotencyKey(email: string, sessionId: string): Promise<string> {
  const input = `${email.toLowerCase().trim()}:${sessionId}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
}

/**
 * Get or create session ID
 * Persists in sessionStorage for the browser session
 */
export function getSessionId(): string {
  const key = 'wm_session_id';
  let sessionId = sessionStorage.getItem(key);
  
  if (!sessionId) {
    sessionId = `sess_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
    sessionStorage.setItem(key, sessionId);
  }
  
  return sessionId;
}

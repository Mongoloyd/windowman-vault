/**
 * Supabase Configuration for WindowMan Truth Engine
 * Connects to the existing Lovable-hosted Supabase instance
 */

export const SUPABASE_URL = 'https://uzulqexlgavggcyizabf.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6dWxxZXhsZ2F2Z2djeWl6YWJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwODQwNjgsImV4cCI6MjA4MjY2MDA2OH0.QvwUD5ScBk2DrD8yKiS3NBSeOuGAikQ3XT5TKn6Hf5U';

// AI Request timeouts
export const AI_TIMEOUTS = {
  FAST: 15000,    // 15s - Chat, roleplay, evidence analysis
  HEAVY: 25000,   // 25s - Document scanning, quote generation
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

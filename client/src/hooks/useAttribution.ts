/**
 * useAttribution Hook
 * 
 * Captures attribution data from URL parameters on page load.
 * Includes UTM parameters, Facebook click ID, Google click ID, and Facebook browser/click cookies.
 */

import { useEffect, useState } from 'react';
import type { AttributionData } from '@/types/vault';

const STORAGE_KEY = 'wm_attribution';

/**
 * Get cookie value by name
 */
function getCookie(name: string): string | undefined {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift();
  }
  return undefined;
}

/**
 * Extract attribution data from URL and cookies
 */
function extractAttribution(): AttributionData {
  const params = new URLSearchParams(window.location.search);
  
  return {
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
    utm_term: params.get('utm_term') || undefined,
    utm_content: params.get('utm_content') || undefined,
    fbclid: params.get('fbclid') || undefined,
    gclid: params.get('gclid') || undefined,
    // Facebook browser ID and click ID from cookies
    fbp: getCookie('_fbp') || undefined,
    fbc: getCookie('_fbc') || undefined,
  };
}

/**
 * Check if attribution data has any values
 */
function hasAttribution(data: AttributionData): boolean {
  return Object.values(data).some(v => v !== undefined);
}

/**
 * Hook to capture and persist attribution data
 * 
 * - Captures on first page load
 * - Persists to sessionStorage (not localStorage, to respect session boundaries)
 * - Does NOT re-capture on subsequent loads (first touch attribution)
 */
export function useAttribution(): AttributionData {
  const [attribution, setAttribution] = useState<AttributionData>({});

  useEffect(() => {
    // Check if we already have attribution stored
    const stored = sessionStorage.getItem(STORAGE_KEY);
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AttributionData;
        setAttribution(parsed);
        return;
      } catch {
        // Invalid stored data, re-capture
      }
    }

    // Capture fresh attribution
    const fresh = extractAttribution();
    
    if (hasAttribution(fresh)) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      setAttribution(fresh);
      
      // Log in dev mode
      if (import.meta.env.DEV) {
        console.log(
          '%c[Attribution]',
          'background: #34a853; color: white; padding: 2px 6px; border-radius: 3px;',
          fresh
        );
      }
    }
  }, []);

  return attribution;
}

/**
 * Get stored attribution without hook (for use in callbacks)
 */
export function getStoredAttribution(): AttributionData {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as AttributionData;
    } catch {
      return {};
    }
  }
  return {};
}

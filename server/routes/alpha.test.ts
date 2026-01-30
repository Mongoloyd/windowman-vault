/**
 * Unit tests for Path Alpha Router
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateLeadValue } from '../services/leadValueService';

// Mock Supabase
vi.mock('../services/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: null, error: null })),
            })),
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

describe('Lead Value Calculation', () => {
  describe('calculateLeadValue', () => {
    it('should return $500 for whale lead (entire home + ASAP + homeowner)', () => {
      const result = calculateLeadValue({
        isHomeowner: true,
        windowCount: 'entire_home',
        timelineUrgency: 'asap',
        pathType: 'alpha',
        smsVerified: false,
      });
      
      expect(result.value).toBe(500);
      expect(result.tier).toBe('whale');
    });

    it('should return $0 for non-homeowner (disqualified)', () => {
      const result = calculateLeadValue({
        isHomeowner: false,
        windowCount: 'entire_home',
        timelineUrgency: 'asap',
        pathType: 'alpha',
        smsVerified: false,
      });
      
      expect(result.value).toBe(0);
      expect(result.tier).toBe('disqualified');
    });

    it('should return $10 for unknown homeowner status', () => {
      const result = calculateLeadValue({
        isHomeowner: null,
        windowCount: 'entire_home',
        timelineUrgency: 'asap',
        pathType: 'alpha',
        smsVerified: false,
      });
      
      expect(result.value).toBe(10);
      expect(result.tier).toBe('cold');
    });

    it('should add 20% bonus for SMS verified leads', () => {
      const result = calculateLeadValue({
        isHomeowner: true,
        windowCount: 'entire_home',
        timelineUrgency: 'asap',
        pathType: 'alpha',
        smsVerified: true,
      });
      
      // $500 base + 20% bonus = $600
      expect(result.value).toBe(600);
      expect(result.tier).toBe('whale');
    });

    it('should return $200 for hot lead (11-15 windows + ASAP)', () => {
      const result = calculateLeadValue({
        isHomeowner: true,
        windowCount: '11-15',
        timelineUrgency: 'asap',
        pathType: 'alpha',
        smsVerified: false,
      });
      
      expect(result.value).toBe(200);
      expect(result.tier).toBe('hot');
    });

    it('should return $150 for hot lead (6-10 windows + ASAP)', () => {
      const result = calculateLeadValue({
        isHomeowner: true,
        windowCount: '6-10',
        timelineUrgency: 'asap',
        pathType: 'alpha',
        smsVerified: false,
      });
      
      expect(result.value).toBe(150);
      expect(result.tier).toBe('hot');
    });

    it('should return $100 for warm lead (6-10 windows + 1-3 months)', () => {
      const result = calculateLeadValue({
        isHomeowner: true,
        windowCount: '6-10',
        timelineUrgency: '1_3_months',
        pathType: 'alpha',
        smsVerified: false,
      });
      
      expect(result.value).toBe(100);
      expect(result.tier).toBe('warm');
    });

    it('should return $50 for warm lead (any size + 3-6 months)', () => {
      const result = calculateLeadValue({
        isHomeowner: true,
        windowCount: '1-5',
        timelineUrgency: '3_6_months',
        pathType: 'alpha',
        smsVerified: false,
      });
      
      expect(result.value).toBe(50);
      expect(result.tier).toBe('warm');
    });

    it('should return $25 for cold lead (1-5 windows)', () => {
      const result = calculateLeadValue({
        isHomeowner: true,
        windowCount: '1-5',
        timelineUrgency: 'asap',
        pathType: 'alpha',
        smsVerified: false,
      });
      
      expect(result.value).toBe(25);
      expect(result.tier).toBe('cold');
    });

    it('should return $15 for cold lead (researching)', () => {
      const result = calculateLeadValue({
        isHomeowner: true,
        windowCount: '6-10',
        timelineUrgency: 'researching',
        pathType: 'beta',
        smsVerified: false,
      });
      
      expect(result.value).toBe(15);
      expect(result.tier).toBe('cold');
    });

    it('should return $300 for whale lead (entire home + 1-3 months)', () => {
      const result = calculateLeadValue({
        isHomeowner: true,
        windowCount: 'entire_home',
        timelineUrgency: '1_3_months',
        pathType: 'alpha',
        smsVerified: false,
      });
      
      expect(result.value).toBe(300);
      expect(result.tier).toBe('whale');
    });
  });
});

describe('Phone Number Formatting', () => {
  // Test phone number formatting logic
  const formatPhoneNumber = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    return digits.startsWith('+') ? phone : `+${digits}`;
  };

  it('should format 10-digit US number correctly', () => {
    expect(formatPhoneNumber('3051234567')).toBe('+13051234567');
  });

  it('should format 10-digit with dashes correctly', () => {
    expect(formatPhoneNumber('305-123-4567')).toBe('+13051234567');
  });

  it('should format 11-digit with country code correctly', () => {
    expect(formatPhoneNumber('13051234567')).toBe('+13051234567');
  });

  it('should preserve already formatted number', () => {
    expect(formatPhoneNumber('+13051234567')).toBe('+13051234567');
  });
});

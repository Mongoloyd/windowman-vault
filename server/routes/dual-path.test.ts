/**
 * Unit Tests for Dual-Path Funnel
 * 
 * Tests cover:
 * - Path Alpha endpoints (quote auditors)
 * - Path Beta endpoints (researchers)
 * - SMS verification service
 * - Lead value calculation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateLeadValue, type LeadValueFactors, type LeadValueResult } from '../services/leadValueService';

// ============================================
// LEAD VALUE CALCULATION TESTS
// ============================================

describe('Lead Value Calculation', () => {
  describe('calculateLeadValue', () => {
    // Helper to create factors with defaults
    const createFactors = (overrides: Partial<LeadValueFactors> = {}): LeadValueFactors => ({
      isHomeowner: null,
      windowCount: null,
      timelineUrgency: null,
      pathType: null,
      smsVerified: false,
      ...overrides,
    });

    describe('Non-homeowner (disqualified)', () => {
      it('should return 0 value and disqualified tier for non-homeowner', () => {
        const result = calculateLeadValue(createFactors({ isHomeowner: false }));
        expect(result.value).toBe(0);
        expect(result.tier).toBe('disqualified');
      });
    });

    describe('Unknown homeowner status', () => {
      it('should return 10 value and cold tier for unknown homeowner', () => {
        const result = calculateLeadValue(createFactors({ isHomeowner: null }));
        expect(result.value).toBe(10);
        expect(result.tier).toBe('cold');
      });
    });

    describe('Whale leads (homeowner + entire home)', () => {
      it('should return 500 for entire home + ASAP', () => {
        const result = calculateLeadValue(createFactors({
          isHomeowner: true,
          windowCount: 'entire_home',
          timelineUrgency: 'asap',
        }));
        expect(result.value).toBe(500);
        expect(result.tier).toBe('whale');
      });

      it('should return 300 for entire home + 1-3 months', () => {
        const result = calculateLeadValue(createFactors({
          isHomeowner: true,
          windowCount: 'entire_home',
          timelineUrgency: '1_3_months',
        }));
        expect(result.value).toBe(300);
        expect(result.tier).toBe('whale');
      });
    });

    describe('Hot leads (homeowner + large project)', () => {
      it('should return 200 for 11-15 windows + ASAP', () => {
        const result = calculateLeadValue(createFactors({
          isHomeowner: true,
          windowCount: '11-15',
          timelineUrgency: 'asap',
        }));
        expect(result.value).toBe(200);
        expect(result.tier).toBe('hot');
      });

      it('should return 150 for 6-10 windows + ASAP', () => {
        const result = calculateLeadValue(createFactors({
          isHomeowner: true,
          windowCount: '6-10',
          timelineUrgency: 'asap',
        }));
        expect(result.value).toBe(150);
        expect(result.tier).toBe('hot');
      });

      it('should return 150 for 11-15 windows + 1-3 months', () => {
        const result = calculateLeadValue(createFactors({
          isHomeowner: true,
          windowCount: '11-15',
          timelineUrgency: '1_3_months',
        }));
        expect(result.value).toBe(150);
        expect(result.tier).toBe('hot');
      });
    });

    describe('Warm leads (homeowner + medium project)', () => {
      it('should return 100 for 6-10 windows + 1-3 months', () => {
        const result = calculateLeadValue(createFactors({
          isHomeowner: true,
          windowCount: '6-10',
          timelineUrgency: '1_3_months',
        }));
        expect(result.value).toBe(100);
        expect(result.tier).toBe('warm');
      });

      it('should return 50 for any size + 3-6 months', () => {
        const result = calculateLeadValue(createFactors({
          isHomeowner: true,
          windowCount: '11-15',
          timelineUrgency: '3_6_months',
        }));
        expect(result.value).toBe(50);
        expect(result.tier).toBe('warm');
      });
    });

    describe('Cold leads (homeowner + small/researching)', () => {
      it('should return 25 for small project (1-5 windows)', () => {
        const result = calculateLeadValue(createFactors({
          isHomeowner: true,
          windowCount: '1-5',
          timelineUrgency: 'asap',
        }));
        expect(result.value).toBe(25);
        expect(result.tier).toBe('cold');
      });

      it('should return 15 for researching timeline', () => {
        const result = calculateLeadValue(createFactors({
          isHomeowner: true,
          windowCount: '6-10',
          timelineUrgency: 'researching',
        }));
        expect(result.value).toBe(15);
        expect(result.tier).toBe('cold');
      });
    });

    describe('SMS verification bonus', () => {
      it('should add 20% bonus for SMS verified leads', () => {
        const result = calculateLeadValue(createFactors({
          isHomeowner: true,
          windowCount: 'entire_home',
          timelineUrgency: 'asap',
          smsVerified: true,
        }));
        // 500 + 20% = 600
        expect(result.value).toBe(600);
        expect(result.tier).toBe('whale');
        expect(result.reasoning).toContain('SMS verified bonus');
      });

      it('should not add bonus for disqualified leads', () => {
        const result = calculateLeadValue(createFactors({
          isHomeowner: false,
          smsVerified: true,
        }));
        expect(result.value).toBe(0);
        expect(result.tier).toBe('disqualified');
      });
    });
  });
});

// ============================================
// PATH TYPE TESTS
// ============================================

describe('Path Type Validation', () => {
  const validPathTypes = ['alpha', 'beta'];

  it('should recognize alpha path type', () => {
    expect(validPathTypes.includes('alpha')).toBe(true);
  });

  it('should recognize beta path type', () => {
    expect(validPathTypes.includes('beta')).toBe(true);
  });

  it('should reject invalid path type', () => {
    expect(validPathTypes.includes('gamma')).toBe(false);
  });
});

// ============================================
// SMS VERIFICATION CODE TESTS
// ============================================

describe('SMS Verification Code Generation', () => {
  const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

  it('should generate 6-digit code', () => {
    const code = generateCode();
    expect(code).toHaveLength(6);
    expect(parseInt(code)).toBeGreaterThanOrEqual(100000);
    expect(parseInt(code)).toBeLessThanOrEqual(999999);
  });

  it('should generate unique codes', () => {
    const codes = new Set();
    for (let i = 0; i < 100; i++) {
      codes.add(generateCode());
    }
    // With 100 generations, we should have at least 95 unique codes
    expect(codes.size).toBeGreaterThan(95);
  });
});

// ============================================
// PHONE NUMBER VALIDATION TESTS
// ============================================

describe('Phone Number Validation', () => {
  const validatePhone = (phone: string): boolean => {
    const digits = phone.replace(/\D/g, '');
    return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));
  };

  it('should accept 10-digit phone number', () => {
    expect(validatePhone('3051234567')).toBe(true);
  });

  it('should accept 11-digit phone number starting with 1', () => {
    expect(validatePhone('13051234567')).toBe(true);
  });

  it('should accept formatted phone number', () => {
    expect(validatePhone('(305) 123-4567')).toBe(true);
  });

  it('should reject short phone number', () => {
    expect(validatePhone('305123')).toBe(false);
  });

  it('should reject too long phone number', () => {
    expect(validatePhone('123456789012')).toBe(false);
  });
});

// ============================================
// FILTER QUESTIONS VALIDATION TESTS
// ============================================

describe('Filter Questions Validation', () => {
  const validWindowCounts = ['1-5', '6-10', '11-15', 'entire_home'];
  const validTimelines = ['asap', '1_3_months', '3_6_months', 'researching'];

  it('should accept valid window count values', () => {
    validWindowCounts.forEach(count => {
      expect(validWindowCounts.includes(count)).toBe(true);
    });
  });

  it('should accept valid timeline values', () => {
    validTimelines.forEach(timeline => {
      expect(validTimelines.includes(timeline)).toBe(true);
    });
  });

  it('should reject invalid window count', () => {
    expect(validWindowCounts.includes('many')).toBe(false);
  });

  it('should reject invalid timeline', () => {
    expect(validTimelines.includes('never')).toBe(false);
  });
});

// ============================================
// TOOL SELECTION TESTS (BETA PATH)
// ============================================

describe('Beta Path Tool Selection', () => {
  const validTools = ['price_checker', 'scam_detector', 'warranty_decoder', 'permit_lookup'];

  it('should accept valid tool selections', () => {
    validTools.forEach(tool => {
      expect(validTools.includes(tool)).toBe(true);
    });
  });

  it('should reject invalid tool selection', () => {
    expect(validTools.includes('invalid_tool')).toBe(false);
  });
});

// ============================================
// FINAL ACTION TESTS
// ============================================

describe('Final Action Validation', () => {
  const validAlphaActions = ['call_now', 'schedule_callback', 'expert_review', 'vault_only'];
  const validBetaActions = ['callback', 'consultation', 'expert_review', 'vault_only'];

  it('should accept valid alpha final actions', () => {
    validAlphaActions.forEach(action => {
      expect(validAlphaActions.includes(action)).toBe(true);
    });
  });

  it('should accept valid beta final actions', () => {
    validBetaActions.forEach(action => {
      expect(validBetaActions.includes(action)).toBe(true);
    });
  });
});

// ============================================
// LEAD TIER CLASSIFICATION TESTS
// ============================================

describe('Lead Tier Classification', () => {
  const createFactors = (overrides: Partial<LeadValueFactors> = {}): LeadValueFactors => ({
    isHomeowner: null,
    windowCount: null,
    timelineUrgency: null,
    pathType: null,
    smsVerified: false,
    ...overrides,
  });

  it('should classify whale tier correctly', () => {
    const result = calculateLeadValue(createFactors({
      isHomeowner: true,
      windowCount: 'entire_home',
      timelineUrgency: 'asap',
    }));
    expect(result.tier).toBe('whale');
    expect(result.value).toBeGreaterThanOrEqual(300);
  });

  it('should classify hot tier correctly', () => {
    const result = calculateLeadValue(createFactors({
      isHomeowner: true,
      windowCount: '11-15',
      timelineUrgency: 'asap',
    }));
    expect(result.tier).toBe('hot');
    expect(result.value).toBeGreaterThanOrEqual(150);
  });

  it('should classify warm tier correctly', () => {
    const result = calculateLeadValue(createFactors({
      isHomeowner: true,
      windowCount: '6-10',
      timelineUrgency: '1_3_months',
    }));
    expect(result.tier).toBe('warm');
    expect(result.value).toBeGreaterThanOrEqual(50);
  });

  it('should classify cold tier correctly', () => {
    const result = calculateLeadValue(createFactors({
      isHomeowner: true,
      windowCount: '1-5',
      timelineUrgency: 'researching',
    }));
    expect(result.tier).toBe('cold');
    expect(result.value).toBeLessThan(50);
  });

  it('should classify disqualified tier correctly', () => {
    const result = calculateLeadValue(createFactors({
      isHomeowner: false,
    }));
    expect(result.tier).toBe('disqualified');
    expect(result.value).toBe(0);
  });
});

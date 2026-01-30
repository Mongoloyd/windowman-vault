/**
 * Lead Value Calculation Service
 * 
 * Calculates the monetary value of a lead for Meta Pixel optimization.
 * Uses the "Golden Signals" (homeowner status, window count, timeline urgency)
 * to weight leads for Facebook's conversion optimization algorithm.
 */

import { supabase } from './supabaseClient';

// ============================================
// VALUE WEIGHTS (Based on your spec)
// ============================================

/**
 * Lead Value Matrix:
 * 
 * | Homeowner | Window Count | Timeline | Value |
 * |-----------|--------------|----------|-------|
 * | Yes       | Entire Home  | ASAP     | $500  |
 * | Yes       | 11-15        | ASAP     | $200  |
 * | Yes       | 6-10         | ASAP     | $150  |
 * | Yes       | 6-10         | 1-3 mo   | $100  |
 * | Yes       | 11-15        | 1-3 mo   | $150  |
 * | Yes       | Entire Home  | 1-3 mo   | $300  |
 * | Yes       | Any          | 3-6 mo   | $50   |
 * | Yes       | 1-5          | Any      | $25   |
 * | No        | Any          | Any      | $0    |
 * | Unknown   | Any          | Any      | $10   |
 */

export interface LeadValueFactors {
  isHomeowner: boolean | null;
  windowCount: string | null;  // '1-5', '6-10', '11-15', 'entire_home'
  timelineUrgency: string | null;  // 'asap', '1_3_months', '3_6_months', 'researching'
  pathType: string | null;  // 'alpha', 'beta'
  smsVerified: boolean;
}

export interface LeadValueResult {
  value: number;
  tier: 'whale' | 'hot' | 'warm' | 'cold' | 'disqualified';
  reasoning: string;
}

// ============================================
// CORE CALCULATION
// ============================================

/**
 * Calculate the monetary value of a lead based on golden signals
 */
export function calculateLeadValue(factors: LeadValueFactors): LeadValueResult {
  const { isHomeowner, windowCount, timelineUrgency, smsVerified } = factors;
  
  // Disqualified: Not a homeowner
  if (isHomeowner === false) {
    return {
      value: 0,
      tier: 'disqualified',
      reasoning: 'Not a homeowner - cannot make purchasing decision',
    };
  }
  
  // Unknown homeowner status - minimal value
  if (isHomeowner === null) {
    return {
      value: 10,
      tier: 'cold',
      reasoning: 'Homeowner status unknown - needs qualification',
    };
  }
  
  // Homeowner = true from here
  
  // Timeline-based base values
  const isASAP = timelineUrgency === 'asap';
  const is1to3Months = timelineUrgency === '1_3_months';
  const is3to6Months = timelineUrgency === '3_6_months';
  const isResearching = timelineUrgency === 'researching' || !timelineUrgency;
  
  // Window count multipliers
  const isEntireHome = windowCount === 'entire_home';
  const is11to15 = windowCount === '11-15';
  const is6to10 = windowCount === '6-10';
  const is1to5 = windowCount === '1-5' || !windowCount;
  
  let value = 0;
  let tier: LeadValueResult['tier'] = 'cold';
  let reasoning = '';
  
  // WHALE: Entire home + ASAP
  if (isEntireHome && isASAP) {
    value = 500;
    tier = 'whale';
    reasoning = 'Whale lead: Entire home project with immediate timeline';
  }
  // WHALE: Entire home + 1-3 months
  else if (isEntireHome && is1to3Months) {
    value = 300;
    tier = 'whale';
    reasoning = 'Whale lead: Entire home project with near-term timeline';
  }
  // HOT: 11-15 windows + ASAP
  else if (is11to15 && isASAP) {
    value = 200;
    tier = 'hot';
    reasoning = 'Hot lead: Large project (11-15 windows) with immediate timeline';
  }
  // HOT: 6-10 windows + ASAP
  else if (is6to10 && isASAP) {
    value = 150;
    tier = 'hot';
    reasoning = 'Hot lead: Medium project (6-10 windows) with immediate timeline';
  }
  // HOT: 11-15 windows + 1-3 months
  else if (is11to15 && is1to3Months) {
    value = 150;
    tier = 'hot';
    reasoning = 'Hot lead: Large project (11-15 windows) with near-term timeline';
  }
  // WARM: 6-10 windows + 1-3 months
  else if (is6to10 && is1to3Months) {
    value = 100;
    tier = 'warm';
    reasoning = 'Warm lead: Medium project (6-10 windows) with near-term timeline';
  }
  // WARM: Any size + 3-6 months
  else if (is3to6Months) {
    value = 50;
    tier = 'warm';
    reasoning = 'Warm lead: Homeowner with mid-term timeline (3-6 months)';
  }
  // COLD: Small project (1-5 windows)
  else if (is1to5) {
    value = 25;
    tier = 'cold';
    reasoning = 'Cold lead: Small project (1-5 windows)';
  }
  // COLD: Researching / no timeline
  else if (isResearching) {
    value = 15;
    tier = 'cold';
    reasoning = 'Cold lead: Still researching, no defined timeline';
  }
  // Default
  else {
    value = 10;
    tier = 'cold';
    reasoning = 'Cold lead: Insufficient qualification data';
  }
  
  // SMS verification bonus (+20% value)
  if (smsVerified && value > 0) {
    const bonus = Math.round(value * 0.2);
    value += bonus;
    reasoning += ` (+${bonus} SMS verified bonus)`;
  }
  
  return { value, tier, reasoning };
}

// ============================================
// DATABASE OPERATIONS
// ============================================

/**
 * Update lead value score in database
 */
export async function updateLeadValueScore(
  leadId: string,
  factors: LeadValueFactors
): Promise<LeadValueResult> {
  const result = calculateLeadValue(factors);
  
  try {
    await supabase.from('leads').update({
      lead_value_score: result.value,
      updated_at: new Date().toISOString(),
    }).eq('id', leadId);
    
    console.log(`[LeadValue] Updated lead ${leadId}: $${result.value} (${result.tier})`);
  } catch (err) {
    console.error('[LeadValue] Failed to update lead value:', err);
  }
  
  return result;
}

/**
 * Get lead value factors from database
 */
export async function getLeadValueFactors(leadId: string): Promise<LeadValueFactors | null> {
  try {
    const { data, error } = await supabase.from('leads')
      .select('is_homeowner, window_count, timeline_urgency, path_type, sms_verified')
      .eq('id', leadId)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return {
      isHomeowner: data.is_homeowner,
      windowCount: data.window_count,
      timelineUrgency: data.timeline_urgency,
      pathType: data.path_type,
      smsVerified: data.sms_verified || false,
    };
  } catch {
    return null;
  }
}

/**
 * Calculate and update lead value in one call
 */
export async function recalculateLeadValue(leadId: string): Promise<LeadValueResult | null> {
  const factors = await getLeadValueFactors(leadId);
  if (!factors) {
    return null;
  }
  
  return await updateLeadValueScore(leadId, factors);
}

/**
 * SMS Service for WindowMan Vault
 * 
 * Handles SMS verification code sending and validation.
 * Uses Twilio for SMS delivery (or mock mode for development).
 */

import { supabase } from './supabaseClient';

// ============================================
// CONFIGURATION
// ============================================

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Code expiration in minutes
const CODE_EXPIRATION_MINUTES = 10;

// Maximum verification attempts before code is invalidated
const MAX_VERIFICATION_ATTEMPTS = 3;

// Rate limiting: max codes per phone per hour
const MAX_CODES_PER_HOUR = 5;

// ============================================
// TYPES
// ============================================

export interface SendCodeResult {
  success: boolean;
  message: string;
  expiresAt?: Date;
  error?: string;
}

export interface VerifyCodeResult {
  success: boolean;
  message: string;
  error?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate a random 6-digit verification code
 */
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Format phone number to E.164 format
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If it's 10 digits, assume US and add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // If it already has country code (11 digits starting with 1)
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // Otherwise, assume it's already formatted correctly
  return digits.startsWith('+') ? phone : `+${digits}`;
}

/**
 * Check if Twilio is configured
 */
function isTwilioConfigured(): boolean {
  return !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER);
}

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Send SMS verification code to phone number
 */
export async function sendVerificationCode(
  leadId: string,
  phone: string
): Promise<SendCodeResult> {
  try {
    const formattedPhone = formatPhoneNumber(phone);
    const code = generateCode();
    const expiresAt = new Date(Date.now() + CODE_EXPIRATION_MINUTES * 60 * 1000);
    
    console.log('[SMS] Sending verification code to:', formattedPhone);
    
    // Check rate limiting
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from('verification_codes')
      .select('*', { count: 'exact', head: true })
      .eq('phone', formattedPhone)
      .gte('created_at', oneHourAgo);
    
    if (countError) {
      console.error('[SMS] Rate limit check error:', countError);
    } else if (count && count >= MAX_CODES_PER_HOUR) {
      return {
        success: false,
        message: 'Too many verification attempts. Please try again later.',
        error: 'RATE_LIMITED',
      };
    }
    
    // Store the code in database
    const { error: insertError } = await supabase
      .from('verification_codes')
      .insert({
        lead_id: leadId,
        phone: formattedPhone,
        code: code,
        expires_at: expiresAt.toISOString(),
        attempts: 0,
      });
    
    if (insertError) {
      console.error('[SMS] Failed to store verification code:', insertError);
      return {
        success: false,
        message: 'Failed to generate verification code.',
        error: insertError.message,
      };
    }
    
    // Send SMS via Twilio (or mock in development)
    if (isTwilioConfigured()) {
      try {
        // Dynamic import to avoid issues if twilio isn't installed
        const twilio = await import('twilio');
        const client = twilio.default(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
        
        await client.messages.create({
          body: `Your WindowMan Vault verification code is: ${code}. Expires in ${CODE_EXPIRATION_MINUTES} minutes.`,
          from: TWILIO_PHONE_NUMBER,
          to: formattedPhone,
        });
        
        console.log('[SMS] Verification code sent via Twilio');
      } catch (twilioError) {
        console.error('[SMS] Twilio error:', twilioError);
        return {
          success: false,
          message: 'Failed to send SMS. Please try again.',
          error: 'TWILIO_ERROR',
        };
      }
    } else {
      // Mock mode - log the code for development
      console.log('[SMS] MOCK MODE - Verification code:', code);
      console.log('[SMS] MOCK MODE - Would send to:', formattedPhone);
    }
    
    // Update lead with phone_submitted_at timestamp
    await supabase
      .from('leads')
      .update({ 
        phone: formattedPhone,
        phone_submitted_at: new Date().toISOString(),
      })
      .eq('id', leadId);
    
    return {
      success: true,
      message: isTwilioConfigured() 
        ? 'Verification code sent!' 
        : 'Verification code generated (mock mode).',
      expiresAt,
    };
  } catch (err) {
    console.error('[SMS] sendVerificationCode error:', err);
    return {
      success: false,
      message: 'An unexpected error occurred.',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Verify SMS code
 */
export async function verifyCode(
  leadId: string,
  phone: string,
  code: string
): Promise<VerifyCodeResult> {
  try {
    const formattedPhone = formatPhoneNumber(phone);
    const now = new Date().toISOString();
    
    console.log('[SMS] Verifying code for:', formattedPhone);
    
    // Find the most recent unexpired, unverified code for this phone
    const { data: codeRecord, error: fetchError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('lead_id', leadId)
      .eq('phone', formattedPhone)
      .is('verified_at', null)
      .gt('expires_at', now)
      .lt('attempts', MAX_VERIFICATION_ATTEMPTS)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (fetchError || !codeRecord) {
      console.log('[SMS] No valid code found for verification');
      return {
        success: false,
        message: 'Invalid or expired code. Please request a new one.',
        error: 'CODE_NOT_FOUND',
      };
    }
    
    // Increment attempts
    await supabase
      .from('verification_codes')
      .update({ attempts: codeRecord.attempts + 1 })
      .eq('id', codeRecord.id);
    
    // Check if code matches
    if (codeRecord.code !== code) {
      const remainingAttempts = MAX_VERIFICATION_ATTEMPTS - (codeRecord.attempts + 1);
      return {
        success: false,
        message: remainingAttempts > 0 
          ? `Incorrect code. ${remainingAttempts} attempts remaining.`
          : 'Too many incorrect attempts. Please request a new code.',
        error: 'INVALID_CODE',
      };
    }
    
    // Mark code as verified
    await supabase
      .from('verification_codes')
      .update({ verified_at: now })
      .eq('id', codeRecord.id);
    
    // Update lead as SMS verified
    await supabase
      .from('leads')
      .update({ 
        sms_verified: true,
        sms_verified_at: now,
      })
      .eq('id', leadId);
    
    console.log('[SMS] Code verified successfully for lead:', leadId);
    
    return {
      success: true,
      message: 'Phone number verified successfully!',
    };
  } catch (err) {
    console.error('[SMS] verifyCode error:', err);
    return {
      success: false,
      message: 'An unexpected error occurred.',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Resend verification code (invalidates previous codes)
 */
export async function resendVerificationCode(
  leadId: string,
  phone: string
): Promise<SendCodeResult> {
  try {
    const formattedPhone = formatPhoneNumber(phone);
    
    // Invalidate all previous codes for this lead/phone by setting them as expired
    await supabase
      .from('verification_codes')
      .update({ expires_at: new Date().toISOString() })
      .eq('lead_id', leadId)
      .eq('phone', formattedPhone)
      .is('verified_at', null);
    
    // Send new code
    return await sendVerificationCode(leadId, phone);
  } catch (err) {
    console.error('[SMS] resendVerificationCode error:', err);
    return {
      success: false,
      message: 'Failed to resend code.',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Check if a lead has verified their phone
 */
export async function isPhoneVerified(leadId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('sms_verified')
      .eq('id', leadId)
      .single();
    
    if (error || !data) {
      return false;
    }
    
    return data.sms_verified === true;
  } catch {
    return false;
  }
}

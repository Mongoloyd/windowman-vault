/**
 * Path Alpha Router - Quote Auditors Flow
 * 
 * Endpoints for users who have a quote and want it analyzed.
 * Flow: Upload → Analysis → Blurred Report → Phone/SMS → Unblur → Expert Chat → Close
 */

import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import { supabase } from '../services/supabaseClient';
import { sendVerificationCode, verifyCode, resendVerificationCode } from '../services/smsService';
import { recalculateLeadValue, updateLeadValueScore } from '../services/leadValueService';
import { storagePut } from '../storage';
import { nanoid } from 'nanoid';

// ============================================
// PATH ALPHA ROUTER
// ============================================

export const alphaRouter = router({
  /**
   * Upload quote file to storage
   * Returns the public URL for Gemini analysis
   */
  upload: publicProcedure
    .input(z.object({
      leadId: z.string().uuid(),
      fileData: z.string(), // Base64 encoded
      mimeType: z.string(),
      fileName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { leadId, fileData, mimeType, fileName } = input;
      
      console.log('[Alpha] Uploading quote for lead:', leadId);
      
      // Convert base64 to buffer
      const buffer = Buffer.from(fileData, 'base64');
      
      // Generate unique filename
      const ext = mimeType.split('/')[1] || 'bin';
      const uniqueName = `${leadId}/${nanoid()}.${ext}`;
      const key = `estimates/${uniqueName}`;
      
      // Upload to storage
      const { url } = await storagePut(key, buffer, mimeType);
      
      // Update lead with path type
      await supabase.from('leads').update({
        path_type: 'alpha',
        updated_at: new Date().toISOString(),
      }).eq('id', leadId);
      
      console.log('[Alpha] Quote uploaded:', url);
      
      return { 
        success: true, 
        url, 
        key,
        message: 'Quote uploaded successfully',
      };
    }),

  /**
   * Submit phone number for SMS verification
   */
  phone: publicProcedure
    .input(z.object({
      leadId: z.string().uuid(),
      phone: z.string().min(10),
    }))
    .mutation(async ({ input }) => {
      const { leadId, phone } = input;
      
      console.log('[Alpha] Submitting phone for lead:', leadId);
      
      const result = await sendVerificationCode(leadId, phone);
      
      return {
        success: result.success,
        message: result.message,
        expiresAt: result.expiresAt?.toISOString(),
      };
    }),

  /**
   * Verify SMS PIN code
   */
  verify: publicProcedure
    .input(z.object({
      leadId: z.string().uuid(),
      phone: z.string().min(10),
      code: z.string().length(6),
    }))
    .mutation(async ({ input }) => {
      const { leadId, phone, code } = input;
      
      console.log('[Alpha] Verifying SMS code for lead:', leadId);
      
      const result = await verifyCode(leadId, phone, code);
      
      if (result.success) {
        // Recalculate lead value with SMS verified bonus
        await recalculateLeadValue(leadId);
      }
      
      return {
        success: result.success,
        message: result.message,
      };
    }),

  /**
   * Resend SMS verification code
   */
  resendCode: publicProcedure
    .input(z.object({
      leadId: z.string().uuid(),
      phone: z.string().min(10),
    }))
    .mutation(async ({ input }) => {
      const { leadId, phone } = input;
      
      console.log('[Alpha] Resending SMS code for lead:', leadId);
      
      const result = await resendVerificationCode(leadId, phone);
      
      return {
        success: result.success,
        message: result.message,
        expiresAt: result.expiresAt?.toISOString(),
      };
    }),

  /**
   * Get analysis status (for polling during Analysis Theater)
   */
  status: publicProcedure
    .input(z.object({
      leadId: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      const { leadId } = input;
      
      // Check if scan exists for this lead
      const { data: scan, error } = await supabase.from('scans')
        .select('id, overall_score, audit_details, created_at')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error || !scan) {
        return {
          status: 'pending',
          hasResults: false,
        };
      }
      
      return {
        status: 'completed',
        hasResults: true,
        overallScore: scan.overall_score,
        scanId: scan.id,
      };
    }),

  /**
   * Unlock blurred report (after SMS verification)
   */
  unlock: publicProcedure
    .input(z.object({
      leadId: z.string().uuid(),
    }))
    .mutation(async ({ input }) => {
      const { leadId } = input;
      
      console.log('[Alpha] Unlocking report for lead:', leadId);
      
      // Verify SMS was completed
      const { data: lead, error } = await supabase.from('leads')
        .select('sms_verified')
        .eq('id', leadId)
        .single();
      
      if (error || !lead) {
        return {
          success: false,
          message: 'Lead not found',
        };
      }
      
      if (!lead.sms_verified) {
        return {
          success: false,
          message: 'Phone verification required to unlock report',
        };
      }
      
      // Get the full scan results
      const { data: scan } = await supabase.from('scans')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      return {
        success: true,
        message: 'Report unlocked',
        scan,
      };
    }),

  /**
   * Submit timeline selection
   */
  timeline: publicProcedure
    .input(z.object({
      leadId: z.string().uuid(),
      timeline: z.enum(['asap', '1_3_months', '3_6_months', 'researching']),
    }))
    .mutation(async ({ input }) => {
      const { leadId, timeline } = input;
      
      console.log('[Alpha] Timeline selected for lead:', leadId, timeline);
      
      // Update lead with timeline
      await supabase.from('leads').update({
        timeline_urgency: timeline,
        updated_at: new Date().toISOString(),
      }).eq('id', leadId);
      
      // Recalculate lead value with new timeline
      const valueResult = await recalculateLeadValue(leadId);
      
      return {
        success: true,
        message: 'Timeline saved',
        leadValue: valueResult?.value || 0,
        leadTier: valueResult?.tier || 'cold',
      };
    }),

  /**
   * Submit filter questions (homeowner, window count)
   */
  filterQuestions: publicProcedure
    .input(z.object({
      leadId: z.string().uuid(),
      isHomeowner: z.boolean(),
      windowCount: z.enum(['1-5', '6-10', '11-15', 'entire_home']).optional(),
    }))
    .mutation(async ({ input }) => {
      const { leadId, isHomeowner, windowCount } = input;
      
      console.log('[Alpha] Filter questions for lead:', leadId, { isHomeowner, windowCount });
      
      // Update lead with filter answers
      const updateData: Record<string, unknown> = {
        is_homeowner: isHomeowner,
        updated_at: new Date().toISOString(),
      };
      
      if (windowCount) {
        updateData.window_count = windowCount;
      }
      
      await supabase.from('leads').update(updateData).eq('id', leadId);
      
      // Recalculate lead value
      const valueResult = await recalculateLeadValue(leadId);
      
      return {
        success: true,
        message: 'Answers saved',
        leadValue: valueResult?.value || 0,
        leadTier: valueResult?.tier || 'cold',
        isDisqualified: valueResult?.tier === 'disqualified',
      };
    }),

  /**
   * Handle final CTA selection
   */
  finalAction: publicProcedure
    .input(z.object({
      leadId: z.string().uuid(),
      action: z.enum([
        'call_now',           // Click-to-call
        'schedule_callback',  // Request callback
        'expert_review',      // Request expert review
        'enter_vault',        // Save to vault for later
      ]),
      callbackTime: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { leadId, action, callbackTime, notes } = input;
      
      console.log('[Alpha] Final action for lead:', leadId, action);
      
      // Update lead with action
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      
      // Map action to lead status
      switch (action) {
        case 'call_now':
          updateData.lead_status = 'hot_call';
          updateData.status = 'contacted';
          break;
        case 'schedule_callback':
          updateData.lead_status = 'callback_requested';
          updateData.status = 'qualified';
          if (callbackTime) {
            updateData.notes = `Callback requested: ${callbackTime}`;
          }
          break;
        case 'expert_review':
          updateData.lead_status = 'expert_review';
          updateData.status = 'qualified';
          break;
        case 'enter_vault':
          updateData.lead_status = 'vault_saved';
          updateData.status = 'new';
          break;
      }
      
      if (notes) {
        updateData.notes = notes;
      }
      
      await supabase.from('leads').update(updateData).eq('id', leadId);
      
      // Get final lead value for Meta pixel
      const valueResult = await recalculateLeadValue(leadId);
      
      return {
        success: true,
        message: 'Action recorded',
        action,
        leadValue: valueResult?.value || 0,
        leadTier: valueResult?.tier || 'cold',
      };
    }),

  /**
   * Save OCR-extracted city from quote
   */
  saveOcrCity: publicProcedure
    .input(z.object({
      leadId: z.string().uuid(),
      city: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { leadId, city } = input;
      
      console.log('[Alpha] Saving OCR city for lead:', leadId, city);
      
      await supabase.from('leads').update({
        ocr_city: city,
        updated_at: new Date().toISOString(),
      }).eq('id', leadId);
      
      return {
        success: true,
        message: 'City saved',
      };
    }),
});

export type AlphaRouter = typeof alphaRouter;

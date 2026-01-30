/**
 * Path Beta Router - Researchers Flow
 * 
 * Endpoints for users who are still researching (no quote yet).
 * Flow: Educational Arsenal → Filter Questions → AI Chat → Phone/SMS → Vault Confirmation
 */

import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import { supabase } from '../services/supabaseClient';
import { sendVerificationCode, verifyCode, resendVerificationCode } from '../services/smsService';
import { recalculateLeadValue } from '../services/leadValueService';

// ============================================
// PATH BETA ROUTER
// ============================================

export const betaRouter = router({
  /**
   * Track educational tool selection
   * Records which tool the user clicked on in the Arsenal step
   */
  selectTool: publicProcedure
    .input(z.object({
      leadId: z.string().uuid(),
      tool: z.enum([
        'quote_scanner',      // "Upload a Quote" - redirects to Alpha
        'savings_calculator', // "Calculate Savings"
        'protection_vault',   // "Access Vault"
        'knowledge_library',  // "Learn More"
      ]),
    }))
    .mutation(async ({ input }) => {
      const { leadId, tool } = input;
      
      console.log('[Beta] Tool selected for lead:', leadId, tool);
      
      // Update lead with tool selection and path type
      await supabase.from('leads').update({
        path_type: 'beta',
        source_tool: tool,
        updated_at: new Date().toISOString(),
      }).eq('id', leadId);
      
      // If they selected quote_scanner, they should be redirected to Alpha
      const redirectToAlpha = tool === 'quote_scanner';
      
      return {
        success: true,
        message: 'Tool selection recorded',
        tool,
        redirectToAlpha,
      };
    }),

  /**
   * Submit filter questions (window count, homeowner status, timeline)
   * These are the "Golden Signals" for lead qualification
   */
  filter: publicProcedure
    .input(z.object({
      leadId: z.string().uuid(),
      windowCount: z.enum(['1-5', '6-10', '11-15', 'entire_home']).optional(),
      isHomeowner: z.boolean().optional(),
      timeline: z.enum(['asap', '1_3_months', '3_6_months', 'researching']).optional(),
    }))
    .mutation(async ({ input }) => {
      const { leadId, windowCount, isHomeowner, timeline } = input;
      
      console.log('[Beta] Filter questions for lead:', leadId, { windowCount, isHomeowner, timeline });
      
      // Build update object with only provided fields
      const updateData: Record<string, unknown> = {
        path_type: 'beta',
        updated_at: new Date().toISOString(),
      };
      
      if (windowCount !== undefined) {
        updateData.window_count = windowCount;
      }
      if (isHomeowner !== undefined) {
        updateData.is_homeowner = isHomeowner;
      }
      if (timeline !== undefined) {
        updateData.timeline_urgency = timeline;
      }
      
      await supabase.from('leads').update(updateData).eq('id', leadId);
      
      // Recalculate lead value with new data
      const valueResult = await recalculateLeadValue(leadId);
      
      return {
        success: true,
        message: 'Filter answers saved',
        leadValue: valueResult?.value || 0,
        leadTier: valueResult?.tier || 'cold',
        isDisqualified: valueResult?.tier === 'disqualified',
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
      
      console.log('[Beta] Submitting phone for lead:', leadId);
      
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
      
      console.log('[Beta] Verifying SMS code for lead:', leadId);
      
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
      
      console.log('[Beta] Resending SMS code for lead:', leadId);
      
      const result = await resendVerificationCode(leadId, phone);
      
      return {
        success: result.success,
        message: result.message,
        expiresAt: result.expiresAt?.toISOString(),
      };
    }),

  /**
   * Handle final CTA selection
   */
  finalAction: publicProcedure
    .input(z.object({
      leadId: z.string().uuid(),
      action: z.enum([
        'schedule_consultation', // "Schedule Free Consultation"
        'request_callback',      // "Request Callback"
        'expert_review',         // "Get Expert Review"
        'enter_vault',           // "Confirm Vault Access"
      ]),
      callbackTime: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { leadId, action, callbackTime, notes } = input;
      
      console.log('[Beta] Final action for lead:', leadId, action);
      
      // Update lead with action
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      
      // Map action to lead status
      switch (action) {
        case 'schedule_consultation':
          updateData.lead_status = 'consultation_requested';
          updateData.status = 'qualified';
          break;
        case 'request_callback':
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
          updateData.lead_status = 'vault_confirmed';
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
   * Get lead status and qualification data
   */
  getStatus: publicProcedure
    .input(z.object({
      leadId: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      const { leadId } = input;
      
      const { data: lead, error } = await supabase.from('leads')
        .select('id, first_name, email, phone, is_homeowner, window_count, timeline_urgency, sms_verified, lead_value_score, path_type')
        .eq('id', leadId)
        .single();
      
      if (error || !lead) {
        return {
          success: false,
          message: 'Lead not found',
        };
      }
      
      return {
        success: true,
        lead: {
          id: lead.id,
          firstName: lead.first_name,
          email: lead.email,
          phone: lead.phone,
          isHomeowner: lead.is_homeowner,
          windowCount: lead.window_count,
          timelineUrgency: lead.timeline_urgency,
          smsVerified: lead.sms_verified,
          leadValueScore: lead.lead_value_score,
          pathType: lead.path_type,
        },
      };
    }),

  /**
   * Track AI chat interaction
   */
  trackChatInteraction: publicProcedure
    .input(z.object({
      leadId: z.string().uuid(),
      messageCount: z.number(),
      topic: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { leadId, messageCount, topic } = input;
      
      console.log('[Beta] Chat interaction for lead:', leadId, { messageCount, topic });
      
      // Update engagement score based on chat interaction
      const { data: lead } = await supabase.from('leads')
        .select('engagement_score')
        .eq('id', leadId)
        .single();
      
      const currentScore = lead?.engagement_score || 0;
      const newScore = Math.min(100, currentScore + messageCount * 5);
      
      await supabase.from('leads').update({
        engagement_score: newScore,
        updated_at: new Date().toISOString(),
      }).eq('id', leadId);
      
      return {
        success: true,
        message: 'Chat interaction tracked',
        engagementScore: newScore,
      };
    }),
});

export type BetaRouter = typeof betaRouter;

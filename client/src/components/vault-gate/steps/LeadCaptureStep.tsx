/**
 * Step 1: Lead Capture
 * 
 * DESIGN PHILOSOPHY: Digital Fortress Vault
 * - Dark glassmorphism with cyan accents
 * - High-tech security aesthetic
 * - Minimal friction, maximum trust signals
 * 
 * REQUIREMENTS:
 * - First Name, Last Name, Email (required)
 * - ZIP Code (optional, for lead scoring)
 * - Honeypot field (hidden, for bot detection)
 * - Phone moved to Step 2 (reduce friction)
 * - Form values preserved on error
 * - Minimum 3s fill time check (anti-bot)
 * 
 * ARCHITECTURE: Uses direct Supabase SDK for database persistence
 * - Captures all UTM parameters and ad platform click IDs
 * - Writes to user's Supabase project (not Manus MySQL)
 */

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ScanLine, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createLead, captureUTMParams } from '@/lib/supabase';
import type { LeadFormData } from '@/types/vault';
import { pushDL } from '@/lib/tracking';
import { getStoredAttribution } from '@/hooks/useAttribution';

// localStorage key for lead data (backup/session resume)
const VAULT_LEAD_KEY = 'vault_lead_data';

interface LeadCaptureStepProps {
  eventId: string;
  initialValues?: Partial<LeadFormData>;
  onSuccess: (leadId: string, formData: LeadFormData) => void;
}

/**
 * Save lead to localStorage for session persistence
 */
function saveLeadToLocalStorage(
  leadId: string,
  formData: LeadFormData,
  eventId: string,
  attribution: ReturnType<typeof getStoredAttribution>
): void {
  const leadData = {
    id: leadId,
    first_name: formData.firstName.trim(),
    last_name: formData.lastName.trim(),
    email: formData.email.trim().toLowerCase(),
    zip: formData.zip?.trim() || null,
    event_id: eventId,
    source_tool: 'ai_scanner',
    created_at: new Date().toISOString(),
    ...attribution,
  };
  
  localStorage.setItem(VAULT_LEAD_KEY, JSON.stringify(leadData));
  console.log('[LeadCapture] Lead saved to localStorage:', leadId);
}

export function LeadCaptureStep({ eventId, initialValues, onSuccess }: LeadCaptureStepProps) {
  const [formData, setFormData] = useState<LeadFormData>({
    firstName: initialValues?.firstName || '',
    lastName: initialValues?.lastName || '',
    email: initialValues?.email || '',
    zip: initialValues?.zip || '',
    honeypot: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitAttempts, setSubmitAttempts] = useState(0);
  const formStartTime = useRef(Date.now());

  // Track form start
  useEffect(() => {
    formStartTime.current = Date.now();
    pushDL({ event: 'vault_modal_opened', event_id: eventId, step: 'lead_capture' });
  }, [eventId]);

  const handleChange = (field: keyof LeadFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    setError(null);
  };

  const validateForm = (): string | null => {
    // Honeypot check
    if (formData.honeypot) {
      console.warn('[LeadCapture] Honeypot triggered');
      return 'Unable to process your request. Please try again.';
    }

    // Time check (minimum 3 seconds to fill form)
    const fillTime = Date.now() - formStartTime.current;
    if (fillTime < 3000) {
      console.warn('[LeadCapture] Form filled too quickly:', fillTime);
      return 'Please take a moment to review your information.';
    }

    // Required fields
    if (!formData.firstName.trim()) return 'First name is required';
    if (!formData.lastName.trim()) return 'Last name is required';
    if (!formData.email.trim()) return 'Email is required';

    // Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return 'Please enter a valid email address';

    // ZIP format (optional, but validate if provided)
    if (formData.zip && !/^\d{5}(-\d{4})?$/.test(formData.zip)) {
      return 'Please enter a valid ZIP code';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Rate limiting
    if (submitAttempts >= 3) {
      setError('Too many attempts. Please wait a moment and try again.');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSubmitAttempts(prev => prev + 1);

    try {
      // Get attribution data from both sources
      const storedAttribution = getStoredAttribution();
      const urlParams = captureUTMParams();

      // Merge attribution (URL params take precedence)
      const attribution = {
        utm_source: urlParams.utm_source || storedAttribution.utm_source,
        utm_medium: urlParams.utm_medium || storedAttribution.utm_medium,
        utm_campaign: urlParams.utm_campaign || storedAttribution.utm_campaign,
        utm_term: urlParams.utm_term || storedAttribution.utm_term,
        utm_content: urlParams.utm_content || storedAttribution.utm_content,
        gclid: urlParams.gclid || storedAttribution.gclid,
        msclkid: urlParams.msclkid,
        fbclid: urlParams.fbclid || storedAttribution.fbclid,
        ttclid: urlParams.ttclid,
        li_fat_id: urlParams.li_fat_id,
        referrer: urlParams.referrer,
        landing_page: urlParams.landing_page,
      };

      // Create lead via direct Supabase SDK
      // Using exact column names from user's Supabase schema
      const { data: result, error: supabaseError } = await createLead({
        // Core contact - using separate first_name/last_name AND combined name
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        email: formData.email.trim().toLowerCase(),
        zip: formData.zip?.trim() || undefined,  // Note: column is 'zip' not 'zip_code'
        
        // Session tracking
        event_id: eventId,
        client_user_agent: navigator.userAgent,
        
        // UTM & Attribution
        utm_source: attribution.utm_source,
        utm_medium: attribution.utm_medium,
        utm_campaign: attribution.utm_campaign,
        utm_term: attribution.utm_term,
        utm_content: attribution.utm_content,
        gclid: attribution.gclid,
        msclkid: attribution.msclkid,
        fbclid: attribution.fbclid,
        landing_page: attribution.landing_page,
        
        // Source tracking
        source_tool: 'windowman-vault',
        source_form: 'lead-capture-modal',
        source_page: window.location.pathname,
        
        // Initial status
        status: 'new',
        lead_status: 'new',
      });

      if (supabaseError || !result?.id) {
        throw supabaseError || new Error('Failed to create lead - no ID returned');
      }

      const leadId = result.id;

      // Save to localStorage for session persistence
      saveLeadToLocalStorage(leadId, formData, eventId, storedAttribution);

      // Fire analytics event - GA4 conversion tracking
      pushDL({
        event: 'lead_capture_success',
        event_id: eventId,
        lead_id: leadId,
        has_zip: !!formData.zip,
        email: formData.email.trim().toLowerCase(),
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
      });

      // Success - pass database ID to parent
      onSuccess(leadId, formData);

    } catch (err) {
      console.error('[LeadCapture] Submit error:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Unable to save your information. Please try again.'
      );
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 md:p-8"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
          <ScanLine className="w-4 h-4 text-cyan-400" />
          <span className="text-sm text-cyan-400 font-medium">Powered by Gemini 3 Flash</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Unmask the Truth <span className="text-cyan-400">Hiding in Your Quote</span>
        </h2>
        <p className="text-gray-400 max-w-md mx-auto" style={{color: '#dbdbdb'}}>
          Stop Wondering. Upload Your Quote/Estimate and Let our AI Flag Hidden Risks, Missing Scope, Fair Pricing & More. Feel Confident In Your Project
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
        {/* Honeypot - hidden from humans */}
        <div className="absolute -left-[9999px]" aria-hidden="true">
          <Input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={formData.honeypot}
            onChange={handleChange('honeypot')}
          />
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-gray-300">First Name</Label>
            <Input
              id="firstName"
              type="text"
              placeholder="John"
              value={formData.firstName}
              onChange={handleChange('firstName')}
              className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-gray-300">Last Name</Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Smith"
              value={formData.lastName}
              onChange={handleChange('lastName')}
              className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-300">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={handleChange('email')}
            className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="zip" className="text-gray-300">
            ZIP Code
          </Label>
          <Input
            id="zip"
            type="text"
            placeholder="33101"
            value={formData.zip}
            onChange={handleChange('zip')}
            className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
          />
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white font-semibold py-6 text-lg shadow-lg shadow-cyan-500/25 transition-all duration-300"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Securing Your Access...
            </>
          ) : (
            <>
              Get My Free Quote Analysis
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </form>
    </motion.div>
  );
}

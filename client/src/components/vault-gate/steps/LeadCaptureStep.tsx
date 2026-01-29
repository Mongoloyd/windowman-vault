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
 * PHASE 3A: localStorage persistence (bypass Supabase RLS)
 */

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Zap, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { LeadFormData } from '@/types/vault';
import { pushDL } from '@/lib/tracking';
import { getStoredAttribution } from '@/hooks/useAttribution';

// localStorage key for lead data
const VAULT_LEAD_KEY = 'vault_lead_data';

interface LeadCaptureStepProps {
  eventId: string;
  initialValues?: Partial<LeadFormData>;
  onSuccess: (leadId: string, formData: LeadFormData) => void;
}

/**
 * Save lead to localStorage (Phase 3A: bypass Supabase)
 */
function saveLeadToLocalStorage(
  formData: LeadFormData,
  eventId: string,
  attribution: ReturnType<typeof getStoredAttribution>
): string {
  // Generate a local lead ID
  const leadId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
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
  
  return leadId;
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
      // Get attribution data
      const attribution = getStoredAttribution();

      // PHASE 3A: Save to localStorage instead of Supabase
      const leadId = saveLeadToLocalStorage(formData, eventId, attribution);

      // Fire analytics event
      pushDL({
        event: 'lead_capture_completed',
        event_id: eventId,
        lead_id: leadId,
        has_zip: !!formData.zip,
      });

      // Simulate brief network delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));

      // Success - pass to parent
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
          <Shield className="w-4 h-4 text-cyan-400" />
          <span className="text-sm text-cyan-400 font-medium">Secure Access</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Unlock Your <span className="text-cyan-400">Protection Report</span>
        </h2>
        <p className="text-gray-400 max-w-md mx-auto" style={{color: '#dbdbdb'}}>
          Stop Wondering. Upload Your Estimate and Let AI Flag Hidden Risks and Overpricing Instantly.
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-gray-300">First Name</Label>
            <Input
              id="firstName"
              type="text"
              placeholder="John"
              value={formData.firstName}
              onChange={handleChange('firstName')}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
              required
              disabled={isSubmitting}
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
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-300">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={handleChange('email')}
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="zip" className="text-gray-300">
            ZIP Code <span className="text-gray-500">(optional)</span>
          </Label>
          <Input
            id="zip"
            type="text"
            placeholder="33101"
            value={formData.zip}
            onChange={handleChange('zip')}
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
            maxLength={10}
            disabled={isSubmitting}
          />
        </div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Submit button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-semibold text-lg shadow-lg shadow-cyan-500/25 transition-all duration-300"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Securing Access...
            </>
          ) : (
            <>
              Get My Free Analysis
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>

        {/* Trust signals */}
        <div className="flex items-center justify-center gap-6 pt-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>256-bit SSL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            <span>Never Shared</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            <span>Instant Results</span>
          </div>
        </div>
      </form>
    </motion.div>
  );
}

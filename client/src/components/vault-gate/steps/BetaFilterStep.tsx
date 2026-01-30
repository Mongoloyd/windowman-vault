/**
 * Beta Step 4: Signal Filter (THE GOLDEN SIGNALS)
 * 
 * DESIGN PHILOSOPHY: Self-Qualification, Not Interrogation
 * - 3 simple questions that feel like personalization
 * - Each question has visual cards, not dropdowns
 * - Answers determine lead value for Meta pixel
 * 
 * QUESTIONS:
 * 1. Window Count: 1-5, 6-10, 11-15, Entire Home
 * 2. Homeowner Status: Yes/No
 * 3. Timeline: ASAP, 1-3 months, 3-6 months, Researching
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Building2, 
  Clock, 
  Zap,
  Calendar,
  BookOpen,
  CheckCircle,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pushDL } from '@/lib/tracking';
import { trpc } from '@/lib/trpc';

interface BetaFilterStepProps {
  eventId: string;
  leadId: string;
  firstName: string;
  onContinue: (leadValue: number, leadTier: string) => void;
}

type WindowCount = '1-5' | '6-10' | '11-15' | 'entire_home' | null;
type HomeownerStatus = boolean | null;
type Timeline = 'asap' | '1_3_months' | '3_6_months' | 'researching' | null;

const WINDOW_OPTIONS = [
  { id: '1-5' as const, label: '1-5 Windows', icon: '🪟' },
  { id: '6-10' as const, label: '6-10 Windows', icon: '🏠' },
  { id: '11-15' as const, label: '11-15 Windows', icon: '🏡' },
  { id: 'entire_home' as const, label: 'Entire Home', icon: '🏰', highlight: true },
];

const TIMELINE_OPTIONS = [
  { id: 'asap' as const, label: 'ASAP', subtitle: 'Ready now', icon: Zap, color: 'cyan' },
  { id: '1_3_months' as const, label: '1-3 Months', subtitle: 'Near future', icon: Calendar, color: 'emerald' },
  { id: '3_6_months' as const, label: '3-6 Months', subtitle: 'Planning ahead', icon: Clock, color: 'yellow' },
  { id: 'researching' as const, label: 'Just Researching', subtitle: 'Gathering info', icon: BookOpen, color: 'gray' },
];

export function BetaFilterStep({ 
  eventId, 
  leadId, 
  firstName,
  onContinue 
}: BetaFilterStepProps) {
  const [step, setStep] = useState<'windows' | 'homeowner' | 'timeline'>('windows');
  const [windowCount, setWindowCount] = useState<WindowCount>(null);
  const [isHomeowner, setIsHomeowner] = useState<HomeownerStatus>(null);
  const [timeline, setTimeline] = useState<Timeline>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filterMutation = trpc.beta.filter.useMutation();

  const handleWindowSelect = async (count: WindowCount) => {
    if (!count) return;
    setWindowCount(count);
    
    pushDL({
      event: 'beta_filter_windows',
      event_id: eventId,
      lead_id: leadId,
      window_count: count,
    });

    // Submit to backend
    try {
      await filterMutation.mutateAsync({
        leadId,
        windowCount: count,
      });
    } catch (error) {
      console.error('[BetaFilter] Window count error:', error);
    }

    // Move to next question
    setTimeout(() => setStep('homeowner'), 300);
  };

  const handleHomeownerSelect = async (status: boolean) => {
    setIsHomeowner(status);
    
    pushDL({
      event: 'beta_filter_homeowner',
      event_id: eventId,
      lead_id: leadId,
      is_homeowner: status,
    });

    // Submit to backend
    try {
      await filterMutation.mutateAsync({
        leadId,
        isHomeowner: status,
      });
    } catch (error) {
      console.error('[BetaFilter] Homeowner error:', error);
    }

    // Move to next question
    setTimeout(() => setStep('timeline'), 300);
  };

  const handleTimelineSelect = async (t: Timeline) => {
    if (!t) return;
    setTimeline(t);
    setIsSubmitting(true);
    
    pushDL({
      event: 'beta_filter_timeline',
      event_id: eventId,
      lead_id: leadId,
      timeline: t,
    });

    // Submit to backend and get final lead value
    try {
      const result = await filterMutation.mutateAsync({
        leadId,
        timeline: t,
      });

      pushDL({
        event: 'beta_filter_complete',
        event_id: eventId,
        lead_id: leadId,
        window_count: windowCount,
        is_homeowner: isHomeowner,
        timeline: t,
        lead_value: result.leadValue,
        lead_tier: result.leadTier,
      });

      // Continue to next step with lead value
      setTimeout(() => {
        onContinue(result.leadValue, result.leadTier);
      }, 500);
    } catch (error) {
      console.error('[BetaFilter] Timeline error:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 md:p-8 lg:p-10"
    >
      {/* Progress Dots */}
      <div className="flex justify-center gap-2 mb-8">
        {['windows', 'homeowner', 'timeline'].map((s, i) => (
          <div
            key={s}
            className={`w-2 h-2 rounded-full transition-all ${
              step === s ? 'w-6 bg-cyan-400' :
              ['windows', 'homeowner', 'timeline'].indexOf(step) > i ? 'bg-cyan-400' : 'bg-white/20'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Question 1: Window Count */}
        {step === 'windows' && (
          <motion.div
            key="windows"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                How Many Windows, {firstName}?
              </h2>
              <p className="text-gray-400">
                This helps us personalize your experience
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              {WINDOW_OPTIONS.map((option) => (
                <motion.button
                  key={option.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleWindowSelect(option.id)}
                  className={`p-5 rounded-xl border-2 text-center transition-all ${
                    windowCount === option.id
                      ? 'border-cyan-400 bg-cyan-500/10'
                      : option.highlight
                      ? 'border-emerald-500/50 bg-emerald-500/10 hover:border-emerald-400'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <span className="text-3xl mb-2 block">{option.icon}</span>
                  <span className="text-white font-medium">{option.label}</span>
                  {option.highlight && (
                    <span className="block text-xs text-emerald-400 mt-1">Best Value</span>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Question 2: Homeowner Status */}
        {step === 'homeowner' && (
          <motion.div
            key="homeowner"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Are You the Homeowner?
              </h2>
              <p className="text-gray-400">
                This helps us provide the right resources
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleHomeownerSelect(true)}
                className={`flex-1 p-6 rounded-xl border-2 text-center transition-all ${
                  isHomeowner === true
                    ? 'border-cyan-400 bg-cyan-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <Home className="w-10 h-10 mx-auto mb-3 text-cyan-400" />
                <span className="text-white font-medium text-lg">Yes, I Own</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleHomeownerSelect(false)}
                className={`flex-1 p-6 rounded-xl border-2 text-center transition-all ${
                  isHomeowner === false
                    ? 'border-cyan-400 bg-cyan-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <Building2 className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                <span className="text-white font-medium text-lg">No, I Rent</span>
              </motion.button>
            </div>

            {/* Back Button */}
            <div className="text-center mt-6">
              <button
                onClick={() => setStep('windows')}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                ← Back
              </button>
            </div>
          </motion.div>
        )}

        {/* Question 3: Timeline */}
        {step === 'timeline' && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                What's Your Timeline?
              </h2>
              <p className="text-gray-400">
                When are you looking to get started?
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto">
              {TIMELINE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = timeline === option.id;
                
                return (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleTimelineSelect(option.id)}
                    disabled={isSubmitting}
                    className={`relative p-5 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? `border-${option.color}-400 bg-${option.color}-500/10`
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    {isSelected && isSubmitting && (
                      <div className="absolute top-3 right-3">
                        <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                      </div>
                    )}
                    {isSelected && !isSubmitting && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle className="w-5 h-5 text-cyan-400" />
                      </div>
                    )}
                    
                    <Icon className={`w-6 h-6 text-${option.color}-400 mb-2`} />
                    <h3 className="text-white font-semibold">{option.label}</h3>
                    <p className="text-sm text-gray-400">{option.subtitle}</p>
                  </motion.button>
                );
              })}
            </div>

            {/* Back Button */}
            <div className="text-center mt-6">
              <button
                onClick={() => setStep('homeowner')}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                ← Back
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

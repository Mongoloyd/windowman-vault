/**
 * Alpha Step 6: Next Steps (THE CLOSE)
 * 
 * DESIGN PHILOSOPHY: Consultative Close
 * - Timeline selection (ASAP / 1-3 months / 3-6 months / Researching)
 * - Based on timeline, show appropriate CTA:
 *   - ASAP → Hard close (Call Now / Schedule Callback)
 *   - 1-3 months → Soft close (Expert Review / Vault Save)
 *   - 3-6 months / Researching → Vault save
 * 
 * VISUAL REQUIREMENTS:
 * - Timeline cards with visual hierarchy
 * - Dynamic CTA based on selection
 * - Smooth transitions between states
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Zap, 
  Calendar,
  BookOpen,
  Phone,
  MessageSquare,
  FileText,
  Archive,
  ArrowRight,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pushDL } from '@/lib/tracking';
import { trpc } from '@/lib/trpc';

interface AlphaNextStepsStepProps {
  eventId: string;
  leadId: string;
  firstName: string;
  leadValue: number;
  leadTier: string;
  onComplete: (action: string) => void;
}

type Timeline = 'asap' | '1_3_months' | '3_6_months' | 'researching' | null;
type FinalAction = 'call_now' | 'schedule_callback' | 'expert_review' | 'enter_vault' | null;

const TIMELINE_OPTIONS = [
  {
    id: 'asap' as const,
    icon: Zap,
    title: 'ASAP',
    subtitle: 'Ready to move forward now',
    color: 'cyan',
    tier: 'hot',
  },
  {
    id: '1_3_months' as const,
    icon: Calendar,
    title: '1-3 Months',
    subtitle: 'Planning for the near future',
    color: 'emerald',
    tier: 'warm',
  },
  {
    id: '3_6_months' as const,
    icon: Clock,
    title: '3-6 Months',
    subtitle: 'Longer-term planning',
    color: 'yellow',
    tier: 'nurture',
  },
  {
    id: 'researching' as const,
    icon: BookOpen,
    title: 'Just Researching',
    subtitle: 'Gathering information',
    color: 'gray',
    tier: 'cold',
  },
];

export function AlphaNextStepsStep({ 
  eventId, 
  leadId, 
  firstName,
  leadValue,
  onComplete 
}: AlphaNextStepsStepProps) {
  const [selectedTimeline, setSelectedTimeline] = useState<Timeline>(null);
  const [selectedAction, setSelectedAction] = useState<FinalAction>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'timeline' | 'action'>('timeline');

  const timelineMutation = trpc.alpha.timeline.useMutation();
  const finalActionMutation = trpc.alpha.finalAction.useMutation();

  const handleTimelineSelect = async (timeline: Timeline) => {
    if (!timeline || isSubmitting) return;
    
    setSelectedTimeline(timeline);
    setIsSubmitting(true);

    try {
      const result = await timelineMutation.mutateAsync({
        leadId,
        timeline,
      });

      pushDL({
        event: 'alpha_timeline_selected',
        event_id: eventId,
        lead_id: leadId,
        timeline,
        lead_value: result.leadValue,
        lead_tier: result.leadTier,
      });

      // Move to action selection
      setTimeout(() => {
        setStep('action');
        setIsSubmitting(false);
      }, 500);
    } catch (error) {
      console.error('[NextSteps] Timeline error:', error);
      setIsSubmitting(false);
    }
  };

  const handleFinalAction = async (action: FinalAction) => {
    if (!action || isSubmitting) return;
    
    setSelectedAction(action);
    setIsSubmitting(true);

    try {
      const result = await finalActionMutation.mutateAsync({
        leadId,
        action,
      });

      pushDL({
        event: 'alpha_final_action',
        event_id: eventId,
        lead_id: leadId,
        action,
        lead_value: result.leadValue,
        lead_tier: result.leadTier,
      });

      // Fire Meta conversion with value
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'Lead', {
          value: result.leadValue,
          currency: 'USD',
          content_name: action,
        });
      }

      setTimeout(() => {
        onComplete(action);
      }, 500);
    } catch (error) {
      console.error('[NextSteps] Final action error:', error);
      setIsSubmitting(false);
    }
  };

  // Determine which CTAs to show based on timeline
  const getActionOptions = () => {
    switch (selectedTimeline) {
      case 'asap':
        return [
          {
            id: 'call_now' as const,
            icon: Phone,
            title: 'Call Me Now',
            subtitle: 'Speak with an expert immediately',
            color: 'cyan',
            primary: true,
          },
          {
            id: 'schedule_callback' as const,
            icon: Calendar,
            title: 'Schedule a Callback',
            subtitle: 'Pick a time that works for you',
            color: 'emerald',
            primary: false,
          },
        ];
      case '1_3_months':
        return [
          {
            id: 'expert_review' as const,
            icon: FileText,
            title: 'Request Expert Review',
            subtitle: 'Get a detailed analysis emailed to you',
            color: 'emerald',
            primary: true,
          },
          {
            id: 'schedule_callback' as const,
            icon: MessageSquare,
            title: 'Schedule a Consultation',
            subtitle: 'Talk through your options',
            color: 'cyan',
            primary: false,
          },
          {
            id: 'enter_vault' as const,
            icon: Archive,
            title: 'Save to My Vault',
            subtitle: 'Access anytime from your dashboard',
            color: 'gray',
            primary: false,
          },
        ];
      default:
        return [
          {
            id: 'enter_vault' as const,
            icon: Archive,
            title: 'Save to My Vault',
            subtitle: 'Access your report anytime',
            color: 'emerald',
            primary: true,
          },
          {
            id: 'expert_review' as const,
            icon: FileText,
            title: 'Get Expert Review',
            subtitle: 'Receive a detailed analysis',
            color: 'cyan',
            primary: false,
          },
        ];
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-8 lg:p-10"
    >
      <AnimatePresence mode="wait">
        {/* Timeline Selection */}
        {step === 'timeline' && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                What's Your Timeline, {firstName}?
              </h2>
              <p className="text-gray-400 max-w-lg mx-auto">
                This helps us provide the right level of support for your project.
              </p>
            </div>

            {/* Timeline Cards */}
            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {TIMELINE_OPTIONS.map((option, index) => {
                const Icon = option.icon;
                const isSelected = selectedTimeline === option.id;
                
                return (
                  <motion.button
                    key={option.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleTimelineSelect(option.id)}
                    disabled={isSubmitting}
                    className={`relative p-5 rounded-xl border-2 text-left transition-all duration-300 ${
                      isSelected
                        ? `border-${option.color}-400 bg-${option.color}-500/10 shadow-[0_0_20px_rgba(34,211,238,0.2)]`
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
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
                    
                    <div className={`p-2 rounded-lg bg-${option.color}-500/20 w-fit mb-3`}>
                      <Icon className={`w-5 h-5 text-${option.color}-400`} />
                    </div>
                    <h3 className="text-white font-semibold mb-1">{option.title}</h3>
                    <p className="text-sm text-gray-400">{option.subtitle}</p>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Action Selection */}
        {step === 'action' && (
          <motion.div
            key="action"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-300">
                  Timeline: {TIMELINE_OPTIONS.find(t => t.id === selectedTimeline)?.title}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                How Would You Like to Proceed?
              </h2>
              <p className="text-gray-400 max-w-lg mx-auto">
                Choose the option that works best for you.
              </p>
            </div>

            {/* Action Cards */}
            <div className="flex flex-col gap-4 max-w-md mx-auto">
              {getActionOptions().map((option, index) => {
                const Icon = option.icon;
                const isSelected = selectedAction === option.id;
                
                return (
                  <motion.button
                    key={option.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleFinalAction(option.id)}
                    disabled={isSubmitting}
                    className={`relative p-5 rounded-xl border-2 text-left transition-all duration-300 ${
                      isSelected
                        ? `border-${option.color}-400 bg-${option.color}-500/10`
                        : option.primary
                        ? `border-${option.color}-500/50 bg-${option.color}-500/10 hover:border-${option.color}-400`
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    {isSelected && isSubmitting && (
                      <div className="absolute top-4 right-4">
                        <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl bg-${option.color}-500/20`}>
                        <Icon className={`w-6 h-6 text-${option.color}-400`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold mb-0.5">{option.title}</h3>
                        <p className="text-sm text-gray-400">{option.subtitle}</p>
                      </div>
                      <ArrowRight className={`w-5 h-5 text-${option.color}-400`} />
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Back Button */}
            <div className="text-center mt-6">
              <button
                onClick={() => {
                  setStep('timeline');
                  setSelectedTimeline(null);
                }}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                ← Change Timeline
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

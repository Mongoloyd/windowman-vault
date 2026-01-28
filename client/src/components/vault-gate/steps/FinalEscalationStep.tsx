/**
 * Step 8: Final Escalation (shared by both branches)
 * 
 * DESIGN PHILOSOPHY: Digital Fortress Vault
 * - Offer high-value escalation options
 * - Callback scheduling, expert consultation
 * - Clear value proposition for each option
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, MessageSquare, Calendar, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pushDL } from '@/lib/tracking';

interface FinalEscalationStepProps {
  eventId: string;
  leadId: string;
  firstName: string;
  onSelect: (escalationType: string) => void;
  onSkip: () => void;
}

const ESCALATION_OPTIONS = [
  {
    id: 'callback',
    icon: Phone,
    title: 'Request a Callback',
    description: 'Speak with a window expert about your project',
    cta: 'Schedule Call',
    color: 'cyan',
  },
  {
    id: 'consultation',
    icon: Calendar,
    title: 'Free Consultation',
    description: 'Get a personalized assessment of your needs',
    cta: 'Book Now',
    color: 'emerald',
  },
  {
    id: 'quote-review',
    icon: MessageSquare,
    title: 'Expert Quote Review',
    description: 'Have a specialist review your estimate in detail',
    cta: 'Get Review',
    color: 'yellow',
  },
];

export function FinalEscalationStep({ eventId, leadId, firstName, onSelect, onSkip }: FinalEscalationStepProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleSelect = (optionId: string) => {
    setSelectedOption(optionId);
    
    pushDL({
      event: 'final_escalation_selected',
      event_id: eventId,
      lead_id: leadId,
      escalation_type: optionId,
    });

    // Small delay for visual feedback
    setTimeout(() => {
      onSelect(optionId);
    }, 300);
  };

  const handleSkip = () => {
    pushDL({
      event: 'final_escalation_skipped',
      event_id: eventId,
      lead_id: leadId,
    });
    onSkip();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-8"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          One More Thing, <span className="text-cyan-400">{firstName}</span>
        </h2>
        <p className="text-gray-400 max-w-md mx-auto">
          Would you like personalized help with your window project? Our experts have helped homeowners save over $2.3 million.
        </p>
      </div>

      {/* Options */}
      <div className="max-w-lg mx-auto space-y-4 mb-8">
        {ESCALATION_OPTIONS.map((option, index) => {
          const isSelected = selectedOption === option.id;
          const colorMap: Record<string, { bg: string; border: string; text: string; icon: string }> = {
            cyan: {
              bg: 'bg-cyan-500/10',
              border: 'border-cyan-500',
              text: 'text-cyan-400',
              icon: 'bg-cyan-500/20',
            },
            emerald: {
              bg: 'bg-emerald-500/10',
              border: 'border-emerald-500',
              text: 'text-emerald-400',
              icon: 'bg-emerald-500/20',
            },
            yellow: {
              bg: 'bg-yellow-500/10',
              border: 'border-yellow-500',
              text: 'text-yellow-400',
              icon: 'bg-yellow-500/20',
            },
          };
          const colorClasses = colorMap[option.color] || colorMap.cyan;

          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
              onClick={() => handleSelect(option.id)}
              disabled={selectedOption !== null}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                isSelected
                  ? `${colorClasses.border} ${colorClasses.bg}`
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${colorClasses.icon}`}>
                  <option.icon className={`w-6 h-6 ${colorClasses.text}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">{option.title}</h3>
                  <p className="text-gray-400 text-sm">{option.description}</p>
                </div>
                {isSelected ? (
                  <CheckCircle className={`w-6 h-6 ${colorClasses.text}`} />
                ) : (
                  <div className={`flex items-center gap-1 text-sm ${colorClasses.text}`}>
                    <span>{option.cta}</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Skip option */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center"
      >
        <button
          onClick={handleSkip}
          disabled={selectedOption !== null}
          className="text-sm text-gray-500 hover:text-gray-400 transition-colors"
        >
          No thanks, just take me to my Vault
        </button>
      </motion.div>
    </motion.div>
  );
}

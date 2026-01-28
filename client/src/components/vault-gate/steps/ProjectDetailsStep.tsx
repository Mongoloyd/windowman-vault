/**
 * Step 7: Project Details (shared by both branches)
 * 
 * DESIGN PHILOSOPHY: Digital Fortress Vault
 * - Quick project context capture
 * - Low friction, optional fields
 * - Helps personalize the Vault experience
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Home, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { pushDL } from '@/lib/tracking';

interface ProjectDetailsStepProps {
  eventId: string;
  leadId: string;
  onContinue: (details: ProjectDetails) => void;
  onSkip: () => void;
}

export interface ProjectDetails {
  windowCount?: number;
  timeline?: string;
  notes?: string;
}

const TIMELINE_OPTIONS = [
  { value: 'asap', label: 'As soon as possible' },
  { value: '1-3months', label: '1-3 months' },
  { value: '3-6months', label: '3-6 months' },
  { value: '6months+', label: '6+ months' },
  { value: 'just-researching', label: 'Just researching' },
];

export function ProjectDetailsStep({ eventId, leadId, onContinue, onSkip }: ProjectDetailsStepProps) {
  const [windowCount, setWindowCount] = useState('');
  const [timeline, setTimeline] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const details: ProjectDetails = {
      windowCount: windowCount ? parseInt(windowCount, 10) : undefined,
      timeline: timeline || undefined,
      notes: notes || undefined,
    };

    pushDL({
      event: 'project_details_completed',
      event_id: eventId,
      lead_id: leadId,
      window_count: details.windowCount,
      timeline: details.timeline,
      has_notes: !!details.notes,
    });

    // Small delay for UX
    setTimeout(() => {
      onContinue(details);
    }, 300);
  };

  const handleSkip = () => {
    pushDL({
      event: 'project_details_skipped',
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
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-500/20 mb-4">
          <Home className="w-8 h-8 text-cyan-400" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Tell Us About Your Project
        </h2>
        <p className="text-gray-400 max-w-md mx-auto">
          This helps us personalize your Vault experience and provide better recommendations.
        </p>
      </div>

      {/* Form */}
      <div className="max-w-md mx-auto space-y-6">
        {/* Window Count */}
        <div className="space-y-2">
          <Label htmlFor="windowCount" className="text-gray-300">
            How many windows/doors? <span className="text-gray-500">(optional)</span>
          </Label>
          <Input
            id="windowCount"
            type="number"
            placeholder="e.g., 12"
            value={windowCount}
            onChange={(e) => setWindowCount(e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
            min="1"
            max="100"
          />
        </div>

        {/* Timeline */}
        <div className="space-y-2">
          <Label className="text-gray-300">
            When are you looking to start? <span className="text-gray-500">(optional)</span>
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {TIMELINE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTimeline(option.value)}
                className={`p-3 rounded-lg border text-sm text-left transition-all ${
                  timeline === option.value
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                    : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20'
                }`}
              >
                <Calendar className="w-4 h-4 mb-1 opacity-50" />
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-gray-300">
            Anything else we should know? <span className="text-gray-500">(optional)</span>
          </Label>
          <textarea
            id="notes"
            placeholder="e.g., Hurricane damage, insurance claim, specific concerns..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-cyan-500/20 focus:outline-none resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-12 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-semibold text-lg shadow-lg shadow-cyan-500/25"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
          <button
            type="button"
            onClick={handleSkip}
            className="text-sm text-gray-500 hover:text-gray-400 transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </motion.div>
  );
}

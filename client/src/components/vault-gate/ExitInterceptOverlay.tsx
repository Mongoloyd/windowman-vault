/**
 * Exit Intercept Overlay
 * 
 * DESIGN PHILOSOPHY: Digital Fortress Vault
 * - Appears when user tries to exit after Step 1
 * - Two CTAs: Continue or Send Vault Link
 * - Never lose a captured lead
 */

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ArrowRight, Mail, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pushDL } from '@/lib/tracking';

interface ExitInterceptOverlayProps {
  isOpen: boolean;
  eventId: string;
  leadId: string;
  email: string;
  currentStep: string;
  onContinue: () => void;
  onSendLink: () => void;
}

export function ExitInterceptOverlay({
  isOpen,
  eventId,
  leadId,
  email,
  currentStep,
  onContinue,
  onSendLink,
}: ExitInterceptOverlayProps) {
  if (!isOpen) return null;

  const handleContinue = () => {
    pushDL({
      event: 'exit_intercept_continued',
      event_id: eventId,
      lead_id: leadId,
      exit_step: currentStep,
    });
    onContinue();
  };

  const handleSendLink = () => {
    pushDL({
      event: 'exit_intercept_converted',
      event_id: eventId,
      lead_id: leadId,
      exit_step: currentStep,
    });
    onSendLink();
  };

  // Mask email for display
  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

        {/* Content */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-md p-6 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-white/10 shadow-2xl"
        >
          {/* Warning Icon */}
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-yellow-500/20">
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-white mb-2">
              Wait! Your Protection Isn't Complete
            </h3>
            <p className="text-gray-400 text-sm">
              You're just a few steps away from full access to the Vault. Don't lose your progress!
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {/* Continue Option */}
            <Button
              onClick={handleContinue}
              className="w-full h-12 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-semibold shadow-lg shadow-cyan-500/25"
            >
              Continue Where I Left Off
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            {/* Send Link Option */}
            <Button
              onClick={handleSendLink}
              variant="outline"
              className="w-full h-12 border-white/20 text-gray-300 hover:bg-white/5"
            >
              <Mail className="w-5 h-5 mr-2" />
              Send Me the Vault Link
            </Button>

            <p className="text-center text-xs text-gray-500">
              We'll send access to {maskedEmail}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

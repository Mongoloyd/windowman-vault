/**
 * Step 9: Success (final step)
 * 
 * DESIGN PHILOSOPHY: Digital Fortress Vault
 * - Celebration moment
 * - Magic link sent notification
 * - Partial win: Show Truth Sheet preview while they wait
 * - Strong CTA to check email / open Vault
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Mail, Shield, ExternalLink, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pushDL } from '@/lib/tracking';
import type { ScanResult } from '@/types/vault';

interface SuccessStepProps {
  eventId: string;
  leadId: string;
  firstName: string;
  email: string;
  scanResults?: ScanResult;
  onOpenVault: () => void;
}

export function SuccessStep({ eventId, leadId, firstName, email, scanResults, onOpenVault }: SuccessStepProps) {
  const [isSendingLink, setIsSendingLink] = useState(true);
  const [linkSent, setLinkSent] = useState(false);

  // Simulate magic link sending (in production, this would be an actual API call)
  useEffect(() => {
    pushDL({
      event: 'vault_success_reached',
      event_id: eventId,
      lead_id: leadId,
      has_scan_results: !!scanResults,
    });

    // Simulate sending magic link
    const timer = setTimeout(() => {
      setIsSendingLink(false);
      setLinkSent(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [eventId, leadId, scanResults]);

  // Mask email for display
  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-8"
    >
      {/* Success Animation */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
          className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500/20 mb-6"
        >
          <CheckCircle className="w-12 h-12 text-emerald-400" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl md:text-3xl font-bold text-white mb-2"
        >
          You're Protected, <span className="text-cyan-400">{firstName}</span>!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-gray-400 max-w-md mx-auto"
        >
          Your Vault is ready. We've sent a secure access link to your email.
        </motion.p>
      </div>

      {/* Email Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="max-w-md mx-auto mb-8"
      >
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${linkSent ? 'bg-emerald-500/20' : 'bg-cyan-500/20'}`}>
              {isSendingLink ? (
                <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
              ) : (
                <Mail className={`w-5 h-5 ${linkSent ? 'text-emerald-400' : 'text-cyan-400'}`} />
              )}
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">
                {isSendingLink ? 'Sending secure link...' : 'Magic link sent!'}
              </p>
              <p className="text-gray-500 text-sm">{maskedEmail}</p>
            </div>
            {linkSent && <CheckCircle className="w-5 h-5 text-emerald-400" />}
          </div>
        </div>
      </motion.div>

      {/* Partial Win: Truth Sheet Preview */}
      {scanResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="max-w-md mx-auto mb-8"
        >
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-cyan-400" />
              <span className="text-white font-medium">Your Truth Sheet Preview</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <span className={`block text-2xl font-bold ${
                  scanResults.overallScore >= 80 ? 'text-emerald-400' :
                  scanResults.overallScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {scanResults.overallScore}
                </span>
                <span className="text-xs text-gray-400">Score</span>
              </div>
              <div>
                <span className="block text-2xl font-bold text-yellow-400">
                  {scanResults.warnings.length}
                </span>
                <span className="text-xs text-gray-400">Warnings</span>
              </div>
              <div>
                <span className="block text-2xl font-bold text-cyan-400">
                  {scanResults.estimatedSavings 
                    ? `$${(scanResults.estimatedSavings.low / 1000).toFixed(0)}k+`
                    : 'TBD'}
                </span>
                <span className="text-xs text-gray-400">Savings</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Full analysis available in your Vault
            </p>
          </div>
        </motion.div>
      )}

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="max-w-md mx-auto space-y-4"
      >
        <Button
          onClick={onOpenVault}
          className="w-full h-12 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-semibold text-lg shadow-lg shadow-cyan-500/25"
        >
          Open My Vault
          <ExternalLink className="w-5 h-5 ml-2" />
        </Button>

        <p className="text-center text-xs text-gray-500">
          Or check your email for the secure access link
        </p>
      </motion.div>

      {/* Trust Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-500"
      >
        <Shield className="w-4 h-4" />
        <span>Your data is protected with bank-level encryption</span>
      </motion.div>
    </motion.div>
  );
}

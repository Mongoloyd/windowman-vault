/**
 * Step 6: Vault Confirmation (NO branch)
 * 
 * DESIGN PHILOSOPHY: Digital Fortress Vault
 * - Reassure user they're getting value without an estimate
 * - Highlight what they'll get access to
 * - Clear CTA to continue to project details
 */

import { motion } from 'framer-motion';
import { Shield, FileText, Calculator, Users, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VaultConfirmationStepProps {
  eventId: string;
  leadId: string;
  firstName: string;
  onContinue: () => void;
}

const VAULT_BENEFITS = [
  {
    icon: FileText,
    title: 'AI Quote Scanner',
    description: 'Upload any estimate anytime for instant analysis',
  },
  {
    icon: Calculator,
    title: 'Price Calculator',
    description: 'Get fair market prices for your specific project',
  },
  {
    icon: Shield,
    title: 'Spec Checklist',
    description: 'Know exactly what to look for in any quote',
  },
  {
    icon: Users,
    title: 'Vetted Contractors',
    description: 'Access our network of pre-screened professionals',
  },
];

export function VaultConfirmationStep({ eventId, leadId, firstName, onContinue }: VaultConfirmationStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-8"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20 mb-4"
        >
          <Shield className="w-10 h-10 text-emerald-400" />
        </motion.div>
        
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Smart Move, <span className="text-cyan-400">{firstName}</span>!
        </h2>
        <p className="text-gray-400 max-w-md mx-auto">
          You're getting ahead of the game. When you receive an estimate, you'll be ready to spot overcharges and red flags instantly.
        </p>
      </div>

      {/* Benefits Grid */}
      <div className="max-w-lg mx-auto mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Your Vault Access Includes:</h3>
        <div className="grid grid-cols-2 gap-4">
          {VAULT_BENEFITS.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="p-4 rounded-xl bg-white/5 border border-white/10"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/20">
                  <benefit.icon className="w-4 h-4 text-cyan-400" />
                </div>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <h4 className="text-white font-medium text-sm mb-1">{benefit.title}</h4>
              <p className="text-gray-500 text-xs">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="max-w-lg mx-auto mb-8 p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20"
      >
        <div className="flex items-center justify-around text-center">
          <div>
            <span className="block text-2xl font-bold text-cyan-400">$11,760</span>
            <span className="text-xs text-gray-400">Avg. Savings</span>
          </div>
          <div className="w-px h-12 bg-white/10" />
          <div>
            <span className="block text-2xl font-bold text-emerald-400">10,000+</span>
            <span className="text-xs text-gray-400">Quotes Analyzed</span>
          </div>
          <div className="w-px h-12 bg-white/10" />
          <div>
            <span className="block text-2xl font-bold text-yellow-400">28%</span>
            <span className="text-xs text-gray-400">Avg. Overcharge</span>
          </div>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="max-w-lg mx-auto"
      >
        <Button
          onClick={onContinue}
          className="w-full h-12 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-semibold text-lg shadow-lg shadow-cyan-500/25"
        >
          Set Up My Protection
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        <p className="text-center text-xs text-gray-500 mt-3">
          Just a few quick questions to personalize your experience
        </p>
      </motion.div>
    </motion.div>
  );
}

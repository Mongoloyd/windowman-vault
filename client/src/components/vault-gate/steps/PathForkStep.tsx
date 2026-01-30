/**
 * Step 2: Path Fork (THE FORK)
 * 
 * DESIGN PHILOSOPHY: Choice, Not Form
 * - Two large visual decision cards (no phone field!)
 * - Makes this feel like a choice, not a form
 * - Users self-select intent without pressure
 * - No friction at the decision point
 * 
 * VISUAL REQUIREMENTS:
 * - Big visual cards with imagery overlays
 * - Card A (Alpha): "Yes, audit my quote" - document/scanner imagery
 * - Card B (Beta): "No, I'm just researching" - tools/library imagery
 * - NO PHONE FIELD - phone is earned later
 * 
 * PATHS:
 * - Alpha → scanner_upload (high intent)
 * - Beta → explore_tools (researcher)
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileSearch, BookOpen, ArrowRight, CheckCircle, Sparkles, Shield } from 'lucide-react';
import { pushDL } from '@/lib/tracking';
import { trpc } from '@/lib/trpc';

interface PathForkStepProps {
  eventId: string;
  leadId: string;
  firstName: string;
  onAlpha: () => void;  // High intent - has quote
  onBeta: () => void;   // Researcher - no quote yet
}

export function PathForkStep({ eventId, leadId, firstName, onAlpha, onBeta }: PathForkStepProps) {
  const [selectedPath, setSelectedPath] = useState<'alpha' | 'beta' | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleAlphaSelect = async () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setSelectedPath('alpha');
    
    // Track the fork decision
    pushDL({
      event: 'path_fork_alpha',
      event_id: eventId,
      lead_id: leadId,
      path_type: 'alpha',
      intent: 'has_quote',
    });

    // Small delay for visual feedback
    setTimeout(() => onAlpha(), 400);
  };

  const handleBetaSelect = async () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setSelectedPath('beta');
    
    // Track the fork decision
    pushDL({
      event: 'path_fork_beta',
      event_id: eventId,
      lead_id: leadId,
      path_type: 'beta',
      intent: 'researching',
    });

    // Small delay for visual feedback
    setTimeout(() => onBeta(), 400);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 md:p-8 lg:p-10"
    >
      {/* Header - Personalized Welcome */}
      <div className="text-center mb-10">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3">
            Welcome, <span className="text-cyan-400">{firstName}</span>!
          </h2>
          <p className="text-gray-300 text-lg max-w-xl mx-auto">
            How can we help you today?
          </p>
        </motion.div>
      </div>

      {/* Decision Cards - Big Visual Choices */}
      <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
        
        {/* ALPHA CARD - "Yes, Audit My Quote" */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAlphaSelect}
          disabled={isTransitioning}
          className={`relative group overflow-hidden rounded-2xl border-2 transition-all duration-500 text-left h-[280px] md:h-[320px] ${
            selectedPath === 'alpha'
              ? 'border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.3)]'
              : selectedPath === 'beta'
              ? 'border-white/5 opacity-40'
              : 'border-white/10 hover:border-cyan-500/50'
          }`}
        >
          {/* Solid Background - No Image */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
          
          {/* Content */}
          <div className="relative h-full flex flex-col justify-end p-6">
            {/* Selection Indicator */}
            {selectedPath === 'alpha' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-4 right-4"
              >
                <div className="p-2 rounded-full bg-cyan-500/20 backdrop-blur-sm">
                  <CheckCircle className="w-6 h-6 text-cyan-400" />
                </div>
              </motion.div>
            )}
            
            {/* Icon Badge */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-cyan-500/20 backdrop-blur-sm border border-cyan-500/30">
                <FileSearch className="w-7 h-7 text-cyan-400" />
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-medium text-cyan-300">AI-Powered</span>
              </div>
            </div>
            
            {/* Title & Description */}
            <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
              I Have a Quote to Scan
            </h3>
            <p className="text-cyan-300 text-sm font-medium mb-3">
              Get instant analysis in 60 seconds
            </p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">•</span>
                <span>Find hidden fees</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">•</span>
                <span>Verify Florida code compliance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">•</span>
                <span>Compare against 10,000+ real quotes</span>
              </li>
            </ul>
            
            {/* CTA */}
            <div className="flex items-center gap-2 text-cyan-400 font-semibold group-hover:gap-3 transition-all">
              <span>Scan My Quote</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </motion.button>

        {/* BETA CARD - "No, I'm Just Researching" */}
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleBetaSelect}
          disabled={isTransitioning}
          className={`relative group overflow-hidden rounded-2xl border-2 transition-all duration-500 text-left h-[280px] md:h-[320px] ${
            selectedPath === 'beta'
              ? 'border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.3)]'
              : selectedPath === 'alpha'
              ? 'border-white/5 opacity-40'
              : 'border-white/10 hover:border-emerald-500/50'
          }`}
        >
          {/* Solid Background - No Image */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
          
          {/* Content */}
          <div className="relative h-full flex flex-col justify-end p-6">
            {/* Selection Indicator */}
            {selectedPath === 'beta' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-4 right-4"
              >
                <div className="p-2 rounded-full bg-emerald-500/20 backdrop-blur-sm">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
              </motion.div>
            )}
            
            {/* Icon Badge */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30">
                <BookOpen className="w-7 h-7 text-emerald-400" />
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-300">Free Tools</span>
              </div>
            </div>
            
            {/* Title & Description */}
            <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
              I'm Still Researching
            </h3>
            <p className="text-emerald-300 text-sm font-medium mb-3">
              Get insider tools before you talk to contractors
            </p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">•</span>
                <span>Fair price calculator</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">•</span>
                <span>Red-flag checklist</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">•</span>
                <span>Claim survival kit</span>
              </li>
            </ul>
            
            {/* CTA */}
            <div className="flex items-center gap-2 text-emerald-400 font-semibold group-hover:gap-3 transition-all">
              <span>Explore Tools</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </motion.button>
      </div>

      {/* Subtle Trust Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center mt-8"
      >
        <p className="text-gray-500 text-sm">
          🔒 Your information is secure and never shared with contractors
        </p>
      </motion.div>
    </motion.div>
  );
}

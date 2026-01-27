/**
 * DESIGN: Digital Fortress Vault - Final CTA Section
 * Compelling call-to-action with urgency and trust elements
 */

import { motion } from 'framer-motion';
import { Shield, Zap, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VaultCTAProps {
  onScanClick?: () => void;
}

export function VaultCTA({ onScanClick }: VaultCTAProps) {
  const scrollToScanner = () => {
    const scanner = document.getElementById('scanner');
    if (scanner) {
      scanner.scrollIntoView({ behavior: 'smooth' });
    }
    onScanClick?.();
  };

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950" />
      
      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium mb-8">
            <Zap className="w-4 h-4" />
            <span>Free Quote Analysis • No Strings Attached</span>
          </div>

          {/* Headline */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 font-display">
            Don't Sign Until You
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
              Know the Truth
            </span>
          </h2>

          {/* Subheadline */}
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Our AI has helped Florida homeowners save over <span className="text-emerald-400 font-bold">$2.3 Million</span> by 
            exposing hidden markups and unfair pricing. Your quote could be next.
          </p>

          {/* CTA Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={scrollToScanner}
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-bold text-lg px-10 py-7 rounded-xl shadow-lg shadow-cyan-500/25"
            >
              Scan My Quote Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-slate-400">
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              100% Free
            </span>
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              Bank-Level Security
            </span>
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              Results in 30 Seconds
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default VaultCTA;

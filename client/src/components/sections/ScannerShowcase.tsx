/**
 * DESIGN: Digital Fortress Vault - Scanner Showcase
 * - Demonstrates the AI scanning capability with LIVE scanner
 * - High-tech HUD aesthetic with data visualization
 */

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Scan, CheckCircle, AlertTriangle, FileSearch, Shield, Zap } from "lucide-react";
import { QuoteScanner } from "@/components/scanner/QuoteScanner";

interface ScannerShowcaseProps {
  onGetScan?: () => void;
}

export function ScannerShowcase({ onGetScan }: ScannerShowcaseProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="scanner" ref={ref} className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-[oklch(0.12_0.025_250)] to-background" />
      <div className="absolute inset-0 circuit-bg opacity-20" />

      <div className="container relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            <span>World's First AI Quote Scanner</span>
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
            Upload Your Quote.{" "}
            <span className="text-gradient-cyan">Get the Truth.</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto" style={{color: '#fafafa', width: '660px'}}>
            Stop Wondering. Upload a Photo of Your Quote/Estimate and Let our AI Flag Hidden Risks, Missing Scope, and Overpricing — Instantly. Feel Confident In Your Project.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left - LIVE Scanner */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <QuoteScanner onGetScan={onGetScan} />
          </motion.div>

          {/* Right - Features & Sample Result */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8"
          >
            {/* Scanner Image */}
            <div className="relative rounded-2xl overflow-hidden glow-border">
              <img
                src="/images/quote-scanner.webp"
                alt="AI Quote Scanner analyzing contractor quote"
                className="w-full rounded-2xl"
              />
              
              {/* Scan overlay effect */}
              <div className="absolute inset-0 scan-line pointer-events-none" />
              
              {/* Floating indicators */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.8 }}
                className="absolute top-4 left-4 glass-card rounded-lg px-3 py-2 flex items-center gap-2"
              >
                <FileSearch className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono text-cyan-400">Analyzing...</span>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 1 }}
                className="absolute bottom-4 right-4 glass-card rounded-lg px-3 py-2 flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono text-amber-400">Overcharge: 28%</span>
              </motion.div>
            </div>

            {/* Feature list */}
            <div className="space-y-4">
              {[
                { text: "Instant price verification against market data", icon: CheckCircle },
                { text: "Specification completeness check", icon: CheckCircle },
                { text: "Contractor reputation analysis", icon: CheckCircle },
                { text: "Hidden fee detection", icon: Shield },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center gap-3 glass-card rounded-lg px-4 py-3"
                >
                  <item.icon className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span className="text-foreground">{item.text}</span>
                </motion.div>
              ))}
            </div>

            {/* Sample Result Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 1.2 }}
              className="glass-card rounded-xl p-6 glow-border"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Sample Analysis Result</span>
                <span className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-semibold">Issues Found</span>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Original Price</p>
                  <p className="text-lg font-mono line-through text-muted-foreground">$42,000</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Fair Price</p>
                  <p className="text-lg font-mono text-emerald-400">$30,240</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">You Save</p>
                <p className="text-2xl font-bold text-gradient-gold">$11,760</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

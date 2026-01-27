/**
 * DESIGN: Digital Fortress Vault - How It Works
 * - Step-by-step process visualization
 * - Clean, scannable layout
 * - Emphasizes simplicity and speed
 */

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Upload, Scan, FileCheck, Shield, ArrowRight } from "lucide-react";

export function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const steps = [
    {
      number: "01",
      icon: Upload,
      title: "Upload Your Quote",
      description:
        "Take a photo or upload a PDF of your contractor's quote. Our system accepts any format.",
      color: "oklch(0.75 0.15 195)",
    },
    {
      number: "02",
      icon: Scan,
      title: "AI Analysis",
      description:
        "Our AI scans every line item against our database of 10,000+ real installations in under 60 seconds.",
      color: "oklch(0.70 0.17 160)",
    },
    {
      number: "03",
      icon: FileCheck,
      title: "Get Your Report",
      description:
        "Receive a detailed breakdown of fair pricing, missing specs, and potential red flags.",
      color: "oklch(0.80 0.16 85)",
    },
    {
      number: "04",
      icon: Shield,
      title: "Negotiate with Power",
      description:
        "Use your report to negotiate a fair deal or connect with our vetted contractor network.",
      color: "oklch(0.75 0.15 195)",
    },
  ];

  return (
    <section id="how-it-works" ref={ref} className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-[oklch(0.12_0.025_250)] to-background" />

      <div className="container relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-[oklch(0.75_0.15_195)] font-mono text-sm uppercase tracking-wider">
            Simple Process
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-4 mb-6">
            How It <span className="text-gradient-cyan">Works</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Get your quote analyzed in four simple steps. No signup required, no sales
            calls, just instant protection.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
              className="relative"
            >
              {/* Connector Line (hidden on mobile and last item) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-[oklch(0.40_0.05_195_/_50%)] to-transparent" />
              )}

              <div className="glass-card rounded-xl p-6 h-full relative group hover:bg-[oklch(0.18_0.03_250_/_60%)] transition-colors">
                {/* Step Number */}
                <span
                  className="absolute -top-3 -right-3 font-display text-5xl font-bold opacity-10"
                  style={{ color: step.color }}
                >
                  {step.number}
                </span>

                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors"
                  style={{
                    backgroundColor: `color-mix(in oklch, ${step.color} 20%, transparent)`,
                  }}
                >
                  <step.icon className="w-6 h-6" style={{ color: step.color }} />
                </div>

                {/* Content */}
                <h3 className="font-display text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Visual Demo */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16"
        >
          <div className="glass-card rounded-2xl p-8 glow-border">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Scanner Visual */}
              <div className="relative">
                <img
                  src="/images/byqaiscanner(2).webp"
                  alt="AI Quote Scanner Interface"
                  className="w-full rounded-xl"
                />
              </div>

              {/* Process Description */}
              <div>
                <h3 className="font-display text-2xl font-bold mb-4">
                  See It In Action
                </h3>
                <p className="text-muted-foreground mb-6">
                  Our AI reads your quote like an expert contractor would, but faster and
                  without the bias. Every line item is cross-referenced against real
                  market data.
                </p>

                <div className="space-y-4">
                  {[
                    { label: "Materials", value: "High-Performance Vinyl, Low-E Glass" },
                    { label: "Glass Types", value: "Double Pane, Argon Filled" },
                    { label: "Installation Scope", value: "Full Frame Replacement, Interior Trim" },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b border-border"
                    >
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-medium text-[oklch(0.70_0.17_160)]">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center gap-4">
                  <div className="flex items-center gap-2 text-[oklch(0.80_0.16_85)]">
                    <span className="status-dot warning" />
                    <span className="text-sm">Missing Spec: Frame Color</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

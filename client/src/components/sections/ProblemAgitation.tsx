/**
 * DESIGN: Digital Fortress Vault - Problem Agitation
 * - Highlights the pain points and risks homeowners face
 * - Uses the "missing documents" and "manipulation tactics" imagery
 * - Creates urgency and emotional connection
 */

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { AlertTriangle, XCircle, DollarSign, FileWarning } from "lucide-react";

export function ProblemAgitation() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const problems = [
    {
      icon: DollarSign,
      title: "Overpriced Quotes",
      description:
        "The average Florida homeowner pays 28% more than they should for impact windows. That's thousands of dollars lost.",
      stat: "28%",
      statLabel: "Average Overcharge",
    },
    {
      icon: FileWarning,
      title: "Missing Specifications",
      description:
        "Vague quotes hide inferior products. Without detailed specs, you can't compare or verify what you're actually getting.",
      stat: "67%",
      statLabel: "Quotes Missing Key Specs",
    },
    {
      icon: XCircle,
      title: "Contractor Games",
      description:
        "Pressure tactics, bait-and-switch pricing, and hidden fees are rampant in the window industry.",
      stat: "3 in 5",
      statLabel: "Homeowners Report Issues",
    },
  ];

  return (
    <section ref={ref} className="py-24 relative overflow-hidden">
      {/* Background with dossier image */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/80" />
        <img
          src="/images/hero-dossier-Copy.webp"
          alt=""
          className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-30"
        />
      </div>

      <div className="container relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-16"
        >
          <span className="text-[oklch(0.65_0.20_25)] font-mono text-sm uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            The Problem
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-4 mb-6">
            Florida Homeowners Are{" "}
            <span className="text-[oklch(0.65_0.20_25)]">Getting Ripped Off</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            The impact window industry is plagued by inflated prices, vague quotes, and
            high-pressure sales tactics. Without insider knowledge, you're negotiating
            blind.
          </p>
        </motion.div>

        {/* Problem Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
              className="glass-card rounded-xl p-6 border border-[oklch(0.65_0.20_25_/_30%)] hover:border-[oklch(0.65_0.20_25_/_50%)] transition-colors group"
            >
              <div className="w-12 h-12 rounded-lg bg-[oklch(0.65_0.20_25_/_20%)] flex items-center justify-center mb-4 group-hover:bg-[oklch(0.65_0.20_25_/_30%)] transition-colors">
                <problem.icon className="w-6 h-6 text-[oklch(0.65_0.20_25)]" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-3">{problem.title}</h3>
              <p className="text-muted-foreground text-sm mb-6">{problem.description}</p>
              <div className="pt-4 border-t border-border">
                <p className="text-3xl font-bold text-[oklch(0.65_0.20_25)]">
                  {problem.stat}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{problem.statLabel}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Visual Evidence Row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 grid md:grid-cols-2 gap-8"
        >
          {/* Missing Documents */}
          <div className="glass-card rounded-xl p-6 flex items-center gap-6">
            <img
              src="/images/missingdocuments.png"
              alt="Missing documentation delays claims"
              className="w-32 h-40 object-cover rounded-lg flex-shrink-0"
            />
            <div>
              <h4 className="font-display text-lg font-semibold mb-2">
                Documentation Disasters
              </h4>
              <p className="text-muted-foreground text-sm">
                Without proper documentation, your insurance claim can be delayed or
                denied. Many contractors skip this crucial step.
              </p>
            </div>
          </div>

          {/* Manipulation Tactics */}
          <div className="glass-card rounded-xl p-6 flex items-center gap-6">
            <img
              src="/images/manipulation-tactics.webp"
              alt="Contractor manipulation tactics"
              className="w-32 h-24 object-cover rounded-lg flex-shrink-0"
            />
            <div>
              <h4 className="font-display text-lg font-semibold mb-2">
                The Games They Play
              </h4>
              <p className="text-muted-foreground text-sm">
                From artificial urgency to hidden fees, contractors use psychological
                tactics to pressure you into bad deals.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

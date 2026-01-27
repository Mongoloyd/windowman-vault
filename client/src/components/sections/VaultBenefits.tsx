/**
 * DESIGN: Digital Fortress Vault - Vault Benefits
 * - Showcases the value proposition of the Vault
 * - Uses the vault imagery and survival kit visuals
 * - Emphasizes protection and exclusive access
 */

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Shield, FileCheck, BookOpen, Users, Lock, Zap } from "lucide-react";

export function VaultBenefits() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const benefits = [
    {
      icon: Shield,
      title: "AI Quote Protection",
      description:
        "Our AI scans your quote against 10,000+ real installations to detect overcharges and missing specs instantly.",
      color: "oklch(0.75 0.15 195)",
    },
    {
      icon: FileCheck,
      title: "Spec Checklist Guide",
      description:
        "A comprehensive checklist ensuring your quote includes every critical specification for hurricane protection.",
      color: "oklch(0.70 0.17 160)",
    },
    {
      icon: BookOpen,
      title: "Claim Survival Kit",
      description:
        "Step-by-step documentation guide to ensure your installation is properly recorded for insurance claims.",
      color: "oklch(0.80 0.16 85)",
    },
    {
      icon: Users,
      title: "Vetted Contractor Network",
      description:
        "Access to our network of pre-screened contractors who meet our quality and pricing standards.",
      color: "oklch(0.75 0.15 195)",
    },
    {
      icon: Lock,
      title: "Price Lock Guarantee",
      description:
        "Once you get a fair price through our system, we help ensure contractors honor that quote.",
      color: "oklch(0.70 0.17 160)",
    },
    {
      icon: Zap,
      title: "Instant Analysis",
      description:
        "Get your quote analyzed in under 60 seconds. No waiting, no appointments, no sales calls.",
      color: "oklch(0.80 0.16 85)",
    },
  ];

  return (
    <section id="benefits" ref={ref} className="py-24 relative overflow-hidden">
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
          <span className="text-[oklch(0.70_0.17_160)] font-mono text-sm uppercase tracking-wider flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            Vault Access
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-4 mb-6">
            Your{" "}
            <span className="text-gradient-emerald">Protection Arsenal</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Everything you need to negotiate with confidence and protect your investment.
            All free, all instant, all designed to save you thousands.
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Vault Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-1 flex items-center justify-center"
          >
            <div className="relative">
              <img
                src="/images/vault.png"
                alt="Document Vault - Your secure resource center"
                className="w-full max-w-sm rounded-2xl shadow-2xl shadow-[oklch(0.75_0.15_195_/_20%)]"
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-background/80 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-sm font-semibold text-foreground">Document Vault</p>
                <p className="text-xs text-muted-foreground">
                  Infrastructure & Authority
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Benefits Grid */}
          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className="glass-card rounded-xl p-6 hover:bg-[oklch(0.18_0.03_250_/_60%)] transition-colors group"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors"
                  style={{
                    backgroundColor: `color-mix(in oklch, ${benefit.color} 20%, transparent)`,
                  }}
                >
                  <benefit.icon
                    className="w-5 h-5 transition-colors"
                    style={{ color: benefit.color }}
                  />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground text-sm">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Survival Kit Feature */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 glass-card rounded-2xl p-8 glow-border"
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-[oklch(0.65_0.20_25)] font-mono text-sm uppercase tracking-wider">
                Bonus Resource
              </span>
              <h3 className="font-display text-2xl font-bold mt-2 mb-4">
                Hurricane Claim Survival Kit
              </h3>
              <p className="text-muted-foreground mb-6">
                Don't let a storm catch you unprepared. Our comprehensive documentation
                guide ensures your impact window installation is properly recorded for
                insurance purposes—before disaster strikes.
              </p>
              <ul className="space-y-3">
                {[
                  "Pre-installation photo checklist",
                  "Permit and certification tracker",
                  "Post-installation verification guide",
                  "Insurance claim documentation template",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-[oklch(0.70_0.17_160)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center">
              <img
                src="/images/survivalclaimkit.png"
                alt="Claim Survival Kit - Hurricane Impact Window Documentation Guide"
                className="w-full max-w-xs rounded-xl shadow-lg"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

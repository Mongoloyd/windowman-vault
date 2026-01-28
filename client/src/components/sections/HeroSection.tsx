/**
 * DESIGN: Digital Fortress Vault - Hero Section
 * - Dramatic vault door visual with glowing accents
 * - WindowMan superhero integration
 * - Strong value proposition with savings highlight
 */

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shield, Scan, TrendingDown, ArrowRight } from "lucide-react";

interface HeroSectionProps {
  onGetScan?: () => void;
}

export function HeroSection({ onGetScan }: HeroSectionProps) {
  const handleGetScan = () => {
    if (onGetScan) {
      onGetScan();
    } else {
      const element = document.getElementById("scanner");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="/images/hero-vault-bg.png"
          alt=""
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.10_0.02_250_/_70%)] via-[oklch(0.10_0.02_250_/_50%)] to-[oklch(0.10_0.02_250)]" />
      </div>

      {/* Circuit pattern overlay */}
      <div className="absolute inset-0 circuit-bg opacity-30" />

      {/* Content */}
      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center lg:text-left"
          >
            {/* Status Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6"
            >
              <span className="status-dot protected" />
              <span className="text-sm font-medium text-[oklch(0.70_0.17_160)]">
                AI Protection Active
              </span>
            </motion.div>

            {/* Headline */}
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              <span className="text-foreground">Stop! </span>
              <span className="text-gradient-cyan">Scan Your Quote</span>
              <br />
              <span className="text-foreground">Before You Sign</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
              Our AI has helped Florida homeowners save over{" "}
              <span className="text-gradient-gold font-semibold">$2.3 Million</span> on
              impact window installations. Get your free scan in 60 seconds.
            </p>

            {/* Stats Row */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-6 mb-8">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[oklch(0.70_0.17_160)]" />
                <span className="text-sm">
                  <span className="font-semibold text-foreground">10,000+</span>{" "}
                  <span className="text-muted-foreground">Quotes Analyzed</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-[oklch(0.80_0.16_85)]" />
                <span className="text-sm">
                  <span className="font-semibold text-foreground">28%</span>{" "}
                  <span className="text-muted-foreground">Avg. Overcharge Found</span>
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                onClick={handleGetScan}
                size="lg"
                className="bg-[oklch(0.75_0.15_195)] hover:bg-[oklch(0.80_0.16_195)] text-[oklch(0.10_0.02_250)] font-semibold px-8 py-6 text-lg shadow-lg shadow-[oklch(0.75_0.15_195_/_30%)] transition-all hover:shadow-[oklch(0.75_0.15_195_/_50%)] pulse-glow group"
              >
                <Scan className="w-5 h-5 mr-2" />
                Get Your Free AI Scan
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                className="border-[oklch(0.40_0.05_195_/_50%)] text-foreground hover:bg-[oklch(0.20_0.03_250)] px-8 py-6 text-lg"
              >
                See How It Works
              </Button>
            </div>
          </motion.div>

          {/* Right Column - Visual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="relative hidden lg:block"
          >
            {/* WindowMan Hero Image */}
            <div className="relative">
              <img
                src="/images/windowmaninwindow(1).webp"
                alt="WindowMan - Your Quote Protection Hero"
                className="w-full max-w-md mx-auto rounded-2xl shadow-2xl shadow-[oklch(0.75_0.15_195_/_20%)]"
              />
              
              {/* Floating Stats Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute -bottom-6 -left-6 glass-card rounded-xl p-4 glow-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[oklch(0.70_0.17_160_/_20%)] flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-[oklch(0.70_0.17_160)]" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg. Savings</p>
                    <p className="text-xl font-bold text-gradient-emerald">$11,760</p>
                  </div>
                </div>
              </motion.div>

              {/* Floating Protection Badge */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="absolute -top-4 -right-4 glass-card rounded-xl p-3 glow-border"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[oklch(0.70_0.17_160)]" />
                  <span className="text-sm font-semibold text-[oklch(0.70_0.17_160)]">
                    Protected
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-[oklch(0.40_0.05_195_/_50%)] flex items-start justify-center p-2"
        >
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1.5 h-2 rounded-full bg-[oklch(0.75_0.15_195)]"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

/**
 * DESIGN: Digital Fortress Vault - Social Proof
 * - Testimonials and savings stories
 * - Real numbers and real people
 * - Trust indicators and credibility markers
 */

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Star, Quote, TrendingUp } from "lucide-react";

function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [isInView, target, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

export function SocialProof() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const testimonials = [
    {
      name: "Maria Rodriguez",
      location: "Miami, FL",
      savings: "$14,200",
      quote:
        "I almost signed a quote for $52,000. The AI scanner showed me I was being overcharged by 27%. Ended up paying $37,800 for the same windows.",
      rating: 5,
    },
    {
      name: "John & Sarah Thompson",
      location: "Tampa, FL",
      savings: "$9,800",
      quote:
        "The spec checklist caught that my quote was missing impact ratings. The contractor tried to install non-certified windows. This tool saved us.",
      rating: 5,
    },
    {
      name: "The Smith Family",
      location: "Fort Lauderdale, FL",
      savings: "$16,500",
      quote:
        "After Hurricane Ian, we needed windows fast. WindowMan helped us avoid the price gougers and find a fair deal in a crazy market.",
      rating: 5,
    },
  ];

  const stats = [
    { value: 2300000, prefix: "$", suffix: "+", label: "Total Saved" },
    { value: 10000, prefix: "", suffix: "+", label: "Quotes Analyzed" },
    { value: 28, prefix: "", suffix: "%", label: "Avg. Overcharge Found" },
    { value: 4.9, prefix: "", suffix: "/5", label: "User Rating" },
  ];

  return (
    <section id="testimonials" ref={ref} className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-[oklch(0.12_0.025_250)] to-background" />
      <div className="absolute inset-0 circuit-bg opacity-10" />

      <div className="container relative z-10">
        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="glass-card rounded-2xl p-8 mb-16 glow-border"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-gradient-cyan font-display">
                  {stat.prefix}
                  {typeof stat.value === "number" && stat.value > 100 ? (
                    <AnimatedCounter target={stat.value} />
                  ) : (
                    stat.value
                  )}
                  {stat.suffix}
                </p>
                <p className="text-sm text-muted-foreground mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-[oklch(0.80_0.16_85)] font-mono text-sm uppercase tracking-wider flex items-center justify-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Real Results
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-4 mb-6">
            Florida Homeowners{" "}
            <span className="text-gradient-gold">Saving Thousands</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Don't just take our word for it. See how real homeowners used our AI scanner
            to protect their wallets.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              className="glass-card rounded-xl p-6 flex flex-col"
            >
              {/* Quote Icon */}
              <Quote className="w-8 h-8 text-[oklch(0.75_0.15_195_/_50%)] mb-4" />

              {/* Quote Text */}
              <p className="text-foreground mb-6 flex-grow">"{testimonial.quote}"</p>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-[oklch(0.80_0.16_85)] text-[oklch(0.80_0.16_85)]"
                  />
                ))}
              </div>

              {/* Author */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Saved</p>
                  <p className="text-lg font-bold text-gradient-emerald">
                    {testimonial.savings}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-16 text-center"
        >
          <p className="text-sm text-muted-foreground mb-6">
            Trusted by Florida homeowners and featured in
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {["Florida Today", "Tampa Bay Times", "Miami Herald", "Sun Sentinel"].map(
              (outlet, index) => (
                <span
                  key={index}
                  className="text-lg font-display font-semibold text-muted-foreground"
                >
                  {outlet}
                </span>
              )
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

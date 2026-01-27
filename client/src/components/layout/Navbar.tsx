/**
 * DESIGN: Digital Fortress Vault - Navbar
 * - Glassmorphic sticky header with subtle glow
 * - Mission control aesthetic
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shield, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[oklch(0.12_0.025_250_/_90%)] backdrop-blur-xl border-b border-[oklch(0.40_0.05_195_/_20%)]"
          : "bg-transparent"
      }`}
    >
      <div className="container">
        <nav className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Shield className="w-8 h-8 text-[oklch(0.75_0.15_195)] transition-all group-hover:text-[oklch(0.85_0.18_195)]" />
              <div className="absolute inset-0 bg-[oklch(0.75_0.15_195_/_30%)] blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">
              <span className="text-foreground">Window</span>
              <span className="text-gradient-cyan">Man</span>
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection("benefits")}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              Benefits
            </button>
            <button
              onClick={() => scrollToSection("testimonials")}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              Testimonials
            </button>
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Button
              onClick={() => scrollToSection("vault-cta")}
              className="bg-[oklch(0.75_0.15_195)] hover:bg-[oklch(0.80_0.16_195)] text-[oklch(0.10_0.02_250)] font-semibold px-6 shadow-lg shadow-[oklch(0.75_0.15_195_/_30%)] transition-all hover:shadow-[oklch(0.75_0.15_195_/_50%)]"
            >
              Get Free Scan
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-foreground"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[oklch(0.12_0.025_250_/_95%)] backdrop-blur-xl border-b border-[oklch(0.40_0.05_195_/_20%)]"
          >
            <div className="container py-4 flex flex-col gap-4">
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="text-left text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection("benefits")}
                className="text-left text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                Benefits
              </button>
              <button
                onClick={() => scrollToSection("testimonials")}
                className="text-left text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                Testimonials
              </button>
              <Button
                onClick={() => scrollToSection("vault-cta")}
                className="bg-[oklch(0.75_0.15_195)] hover:bg-[oklch(0.80_0.16_195)] text-[oklch(0.10_0.02_250)] font-semibold w-full"
              >
                Get Free Scan
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

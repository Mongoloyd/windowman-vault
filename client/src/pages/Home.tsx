/**
 * DESIGN: Digital Fortress Vault
 * - Dark navy backgrounds with luminous cyan/emerald accents
 * - Glassmorphism and depth effects for premium feel
 * - The "Vault" is the central metaphor—secure, exclusive, protected
 */

import { HeroSection } from "@/components/sections/HeroSection";
import { ScannerShowcase } from "@/components/sections/ScannerShowcase";
import { ProblemAgitation } from "@/components/sections/ProblemAgitation";
import { VaultBenefits } from "@/components/sections/VaultBenefits";
import { SocialProof } from "@/components/sections/SocialProof";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { VaultCTA } from "@/components/sections/VaultCTA";
import { Footer } from "@/components/sections/Footer";
import { Navbar } from "@/components/layout/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <main>
        <HeroSection />
        <ScannerShowcase />
        <ProblemAgitation />
        <VaultBenefits />
        <SocialProof />
        <HowItWorks />
        <VaultCTA />
      </main>
      <Footer />
    </div>
  );
}

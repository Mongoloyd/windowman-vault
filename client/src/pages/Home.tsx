/**
 * DESIGN: Digital Fortress Vault
 * - Dark navy backgrounds with luminous cyan/emerald accents
 * - Glassmorphism and depth effects for premium feel
 * - The "Vault" is the central metaphor—secure, exclusive, protected
 */

import { useState, useCallback } from "react";
import { HeroSection } from "@/components/sections/HeroSection";
import { SampleReportSection } from "@/components/sections/SampleReportSection";
import { ScannerShowcase } from "@/components/sections/ScannerShowcase";
import { ProblemAgitation } from "@/components/sections/ProblemAgitation";
import { VaultBenefits } from "@/components/sections/VaultBenefits";
import { SocialProof } from "@/components/sections/SocialProof";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { VaultCTA } from "@/components/sections/VaultCTA";
import { Footer } from "@/components/sections/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { VaultLeadGateModalV2 } from "@/components/vault-gate/VaultLeadGateModalV2";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar onGetScan={openModal} />
      <main>
        <HeroSection onGetScan={openModal} />
        <SampleReportSection onGetScan={openModal} />
        <ScannerShowcase onGetScan={openModal} />
        <ProblemAgitation />
        <VaultBenefits />
        <SocialProof />
        <HowItWorks />
        <VaultCTA onGetScan={openModal} />
      </main>
      <Footer />
      
      {/* Vault Lead Gate Modal */}
      <VaultLeadGateModalV2 isOpen={isModalOpen} onClose={closeModal} />
    </div>
  );
}

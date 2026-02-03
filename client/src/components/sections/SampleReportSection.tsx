import { motion } from "framer-motion";
import { SampleReportCard } from "./SampleReportCard";
import { Eye } from "lucide-react";

interface SampleReportSectionProps {
  onGetScan?: () => void;
}

export function SampleReportSection({ onGetScan }: SampleReportSectionProps) {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-slate-900/50 to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-20" style={{ background: "radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)" }} />

      <div className="container relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-6">
            <Eye className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-400">See What You'll Get</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">A Real Analysis Report</h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">This is exactly what your report will look like. No mockups, no gimmicks—<span className="text-cyan-400"> this is the product.</span></p>
        </motion.div>
        <SampleReportCard onGetScan={onGetScan} />
      </div>
    </section>
  );
}

export default SampleReportSection;

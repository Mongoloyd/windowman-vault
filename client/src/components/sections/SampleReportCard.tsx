import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { 
  Shield, 
  CheckCircle2, 
  DollarSign, 
  FileText, 
  Award,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SampleReportCardProps {
  onGetScan?: () => void;
}

const SAMPLE_SCORE = 62;
const SAMPLE_SAVINGS = { min: 2400, max: 4100 };

const CATEGORY_SCORES = [
  { id: "safety", label: "Safety & Code", score: 72, icon: Shield, color: "emerald", tooltip: "Florida Building Code compliance and hurricane impact ratings" },
  { id: "scope", label: "Scope Clarity", score: 58, icon: CheckCircle2, color: "amber", tooltip: "How clearly the work scope, timeline, and deliverables are defined" },
  { id: "price", label: "Price Fairness", score: 48, icon: DollarSign, color: "red", tooltip: "Comparison against 10,000+ verified Florida window quotes" },
  { id: "fineprint", label: "Fine Print", score: 65, icon: FileText, color: "amber", tooltip: "Hidden fees, exclusions, and contract terms analysis" },
  { id: "warranty", label: "Warranty", score: 70, icon: Award, color: "emerald", tooltip: "Manufacturer and installation warranty coverage verification" },
];

const WARNINGS = [
  "No hurricane debris impact rating specified",
  "Permit costs not included in quote",
  "Installation timeline vague (no completion date)",
  "No mention of disposal fees",
];

const MISSING_ITEMS = ["Energy efficiency rating", "Manufacturer warranty terms", "Post-installation inspection"];

function getScoreColor(score: number): string {
  if (score >= 70) return "emerald";
  if (score >= 50) return "amber";
  return "red";
}

function AnimatedCounter({ target, duration = 2000, inView }: { target: number; duration?: number; inView: boolean }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let startTime: number;
    let animationFrame: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * target));
      if (progress < 1) animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration, inView]);
  return <span>{count}</span>;
}

function ScoreRing({ score, size = 180, inView }: { score: number; size?: number; inView: boolean }) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const scoreColor = getScoreColor(score);
  const colorMap = {
    emerald: { stroke: "#10b981", glow: "rgba(16, 185, 129, 0.4)" },
    amber: { stroke: "#f59e0b", glow: "rgba(245, 158, 11, 0.4)" },
    red: { stroke: "#ef4444", glow: "rgba(239, 68, 68, 0.4)" },
  };
  const colors = colorMap[scoreColor as keyof typeof colorMap];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full blur-xl opacity-50" style={{ backgroundColor: colors.glow }} />
      <svg width={size} height={size} className="relative z-10 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={colors.stroke} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: inView ? circumference - (score / 100) * circumference : circumference }}
          transition={{ duration: 2, ease: "easeOut", delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 8px ${colors.glow})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        <span className="text-5xl font-bold text-white"><AnimatedCounter target={score} inView={inView} /></span>
        <span className="text-lg text-white/50">/100</span>
      </div>
    </div>
  );
}

function CategoryBar({ category, index, inView }: { category: typeof CATEGORY_SCORES[0]; index: number; inView: boolean }) {
  const Icon = category.icon;
  const colorMap = {
    emerald: { bg: "bg-emerald-500", text: "text-emerald-400", iconBg: "bg-emerald-500/20" },
    amber: { bg: "bg-amber-500", text: "text-amber-400", iconBg: "bg-amber-500/20" },
    red: { bg: "bg-red-500", text: "text-red-400", iconBg: "bg-red-500/20" },
  };
  const colors = colorMap[category.color as keyof typeof colorMap];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }} transition={{ duration: 0.5, delay: 0.8 + index * 0.15 }} className="flex items-center gap-3 cursor-help">
          <div className={`p-2 rounded-lg ${colors.iconBg}`}><Icon className={`w-4 h-4 ${colors.text}`} /></div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-white/70">{category.label}</span>
              <span className={`text-sm font-semibold ${colors.text}`}>{category.score}/100</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div className={`h-full ${colors.bg} rounded-full`} initial={{ width: 0 }} animate={inView ? { width: `${category.score}%` } : { width: 0 }} transition={{ duration: 1, delay: 1 + index * 0.15, ease: "easeOut" }} />
            </div>
          </div>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-xs"><p>{category.tooltip}</p></TooltipContent>
    </Tooltip>
  );
}

export function SampleReportCard({ onGetScan }: SampleReportCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }} transition={{ duration: 0.8 }} className="relative max-w-2xl mx-auto">
      <div className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95" />
        <div className="absolute inset-0 rounded-2xl border border-cyan-500/30" />
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />

        <div className="relative z-10 p-8">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }} transition={{ duration: 0.5, delay: 0.2 }} className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-400">Sample Analysis Report</span>
            </div>
          </motion.div>

          <div className="flex flex-col items-center mb-8">
            <ScoreRing score={SAMPLE_SCORE} inView={inView} />
            <motion.p initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 0.5, delay: 1.5 }} className="mt-4 text-amber-400 font-medium">Quote Rating: Fair</motion.p>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }} transition={{ duration: 0.5, delay: 1.8 }} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/15 border border-emerald-500/40">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span className="text-lg font-bold text-emerald-400">Potential Savings: ${SAMPLE_SAVINGS.min.toLocaleString()} – ${SAMPLE_SAVINGS.max.toLocaleString()}</span>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 0.5, delay: 0.6 }} className="mb-8">
            <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-4">Category Breakdown</h3>
            <div className="space-y-4">
              {CATEGORY_SCORES.map((category, index) => (<CategoryBar key={category.id} category={category} index={index} inView={inView} />))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }} transition={{ duration: 0.5, delay: 2 }} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-medium text-red-400">Warnings Detected ({WARNINGS.length})</h3>
            </div>
            <div className="space-y-2">
              {WARNINGS.map((warning, index) => (
                <motion.div key={index} initial={{ opacity: 0, x: -10 }} animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }} transition={{ duration: 0.3, delay: 2.1 + index * 0.1 }} className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-red-200">{warning}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }} transition={{ duration: 0.5, delay: 2.5 }} className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-medium text-amber-400">Missing from Quote ({MISSING_ITEMS.length})</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {MISSING_ITEMS.map((item, index) => (
                <motion.span key={index} initial={{ opacity: 0, scale: 0.9 }} animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }} transition={{ duration: 0.3, delay: 2.6 + index * 0.1 }} className="px-3 py-1.5 rounded-full text-sm bg-amber-500/15 border border-amber-500/40 text-amber-300">{item}</motion.span>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }} transition={{ duration: 0.5, delay: 2.9 }} className="text-center">
            <p className="text-white/60 text-sm mb-4">This is a sample. Upload yours to see YOUR score.</p>
            <Button onClick={onGetScan} size="lg" className="relative overflow-hidden bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-semibold px-8 py-6 text-lg rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 group">
              <span className="relative z-10 flex items-center gap-2">Get My Quote Analyzed Free<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-emerald-400 opacity-0 group-hover:opacity-20 transition-opacity" />
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default SampleReportCard;

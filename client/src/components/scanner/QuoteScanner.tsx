/**
 * DESIGN: Digital Fortress Vault - AI Quote Scanner
 * High-tech scanner interface with glassmorphism, glowing accents, and heroic styling
 * 
 * PHASE 3A: CTA Interception
 * - File picker is BLOCKED until lead capture is complete
 * - All clicks call onGetScan() to open the Vault Lead Gate modal
 * - The actual file upload happens inside the modal (ScannerUploadStep)
 */

import { motion } from 'framer-motion';
import { 
  Upload, Shield, Scan, Zap, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuoteScannerProps {
  onGetScan?: () => void;
  className?: string;
}

/**
 * QuoteScanner - Landing Page Display Component
 * 
 * PHASE 3A: This component NO LONGER handles file uploads directly.
 * All interactions trigger the Vault Lead Gate modal via onGetScan().
 * The actual scanner functionality lives in ScannerUploadStep inside the modal.
 */
export function QuoteScanner({ onGetScan, className }: QuoteScannerProps) {
  
  // All clicks open the modal - no direct file picker access
  const handleScanClick = () => {
    if (onGetScan) {
      onGetScan();
    } else {
      console.warn('[QuoteScanner] onGetScan handler not provided');
    }
  };

  return (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
      {/* Scanner Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        {/* Glowing border effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 rounded-2xl opacity-30 blur-sm animate-pulse" />
        
        <div className="relative bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Scan className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-display">AI Quote Scanner</h3>
              <p className="text-sm text-slate-400">Powered by Window Man Intelligence</p>
            </div>
          </div>

          {/* CTA Drop Zone - Opens Modal, NOT file picker */}
          <div
            onClick={handleScanClick}
            className={cn(
              "relative border-2 border-dashed rounded-xl text-center cursor-pointer transition-all duration-300",
              "flex flex-col items-center justify-center p-8 min-h-[240px]",
              "border-slate-600 hover:border-cyan-500/50 bg-slate-800/50 hover:bg-slate-800/80"
            )}
          >
            {/* Scan lines animation */}
            <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-cyan-500/5 animate-scan" />
            </div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center mb-4"
            >
              <Upload className="w-8 h-8 text-cyan-400" />
            </motion.div>

            <p className="text-lg font-semibold text-white mb-2">
              Drop Your Contractor Quote Here
            </p>
            <p className="text-sm text-slate-400 mb-4">
              or click to browse your files
            </p>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Shield className="w-3 h-3 text-cyan-400" />
              <span>PDF, JPG, PNG • Max 10MB • 256-bit Encrypted</span>
            </div>

            {/* NO FILE INPUT HERE - Gated by modal */}
          </div>

          {/* Instant Audit Results */}
          <div className="flex items-center justify-center mt-4 text-sm text-slate-600 font-medium">
            Instant Audit Results
          </div>

          {/* Primary CTA Button */}
          <Button
            onClick={handleScanClick}
            className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-bold py-6 text-lg shadow-lg shadow-cyan-500/25"
          >
            <Zap className="mr-2 h-5 w-5" />
            Get Your Free AI Scan
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

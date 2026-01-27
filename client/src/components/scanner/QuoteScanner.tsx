/**
 * DESIGN: Digital Fortress Vault - AI Quote Scanner
 * High-tech scanner interface with glassmorphism, glowing accents, and heroic styling
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileText, Image, X, CheckCircle, AlertCircle, 
  Loader2, Shield, Scan, AlertTriangle, ChevronDown,
  Lock, Zap, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useQuoteScanner, QuoteAnalysisResult } from '@/hooks/useQuoteScanner';

// Allowed file types
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface QuoteScannerProps {
  onAnalysisComplete?: (result: QuoteAnalysisResult) => void;
  className?: string;
}

export function QuoteScanner({ onAnalysisComplete, className }: QuoteScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const { isAnalyzing, analysisResult, error, analyzeQuote, resetScanner } = useQuoteScanner();

  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    if (!file) {
      return { valid: false, error: 'No file selected' };
    }
    if (file.size === 0) {
      return { valid: false, error: 'File appears to be empty' };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'File is too large. Maximum size is 10MB.' };
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: 'Only PDF, JPEG, and PNG files are accepted.' };
    }
    return { valid: true };
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setValidationError(null);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      const validation = validateFile(file);
      if (validation.valid) {
        setSelectedFile(file);
      } else {
        setValidationError(validation.error || 'Invalid file');
      }
    }
  }, [validateFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateFile(file);
      if (validation.valid) {
        setSelectedFile(file);
      } else {
        setValidationError(validation.error || 'Invalid file');
      }
    }
    e.target.value = '';
  }, [validateFile]);

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    
    // Simulate upload progress
    setUploadProgress(0);
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 200);
    
    await analyzeQuote(selectedFile);
    
    clearInterval(progressInterval);
    setUploadProgress(100);
    
    if (analysisResult && onAnalysisComplete) {
      onAnalysisComplete(analysisResult);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setValidationError(null);
    resetScanner();
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-6 h-6 text-cyan-400" />;
    }
    return <FileText className="w-6 h-6 text-cyan-400" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Show results if analysis is complete
  if (analysisResult) {
    return (
      <ScannerResults 
        result={analysisResult} 
        onReset={handleReset}
        className={className}
      />
    );
  }

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

          {/* Drop Zone */}
          {!selectedFile && !isAnalyzing && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative border-2 border-dashed rounded-xl text-center cursor-pointer transition-all duration-300",
                "flex flex-col items-center justify-center p-8 min-h-[240px]",
                isDragging 
                  ? "border-cyan-400 bg-cyan-500/10 scale-[1.02]" 
                  : "border-slate-600 hover:border-cyan-500/50 bg-slate-800/50 hover:bg-slate-800/80"
              )}
            >
              {/* Scan lines animation */}
              <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-cyan-500/5 animate-scan" />
              </div>

              <motion.div
                animate={{ scale: isDragging ? 1.1 : 1 }}
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

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
                aria-label="Upload contractor quote"
              />
            </div>
          )}

          {/* Validation Error */}
          {validationError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="text-sm text-red-300">{validationError}</span>
            </motion.div>
          )}

          {/* Selected File Preview */}
          {selectedFile && !isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="border border-slate-700 rounded-xl p-4 bg-slate-800/50"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
                  {getFileIcon(selectedFile)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{selectedFile.name}</p>
                  <p className="text-sm text-slate-400">{formatFileSize(selectedFile.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedFile(null)}
                  className="text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Analyze Button */}
              <Button
                onClick={handleAnalyze}
                className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold py-6 text-lg"
              >
                <Zap className="mr-2 h-5 w-5" />
                Analyze Quote Now
              </Button>
            </motion.div>
          )}

          {/* Analyzing State */}
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <div className="relative w-24 h-24 mx-auto mb-6">
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20" />
                {/* Spinning ring */}
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-400 animate-spin" />
                {/* Inner icon */}
                <div className="absolute inset-4 rounded-full bg-slate-800 flex items-center justify-center">
                  <Eye className="w-8 h-8 text-cyan-400 animate-pulse" />
                </div>
              </div>

              <h4 className="text-xl font-bold text-white mb-2">Scanning Your Quote...</h4>
              <p className="text-slate-400 mb-4">Our AI is analyzing every line item</p>

              <Progress value={uploadProgress} className="h-2 bg-slate-700" />
              
              <div className="mt-4 space-y-2 text-sm text-slate-500">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Extracting line items...</span>
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                  className="flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Cross-referencing 10,000+ installs...</span>
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.5 }}
                  className="flex items-center justify-center gap-2"
                >
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span>Detecting overcharges...</span>
                </motion.p>
              </div>
            </motion.div>
          )}

          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-300">Analysis Failed</p>
                  <p className="text-sm text-red-400/80 mt-1">{error}</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleReset}
                className="mt-4 w-full border-red-500/30 text-red-300 hover:bg-red-500/10"
              >
                Try Again
              </Button>
            </motion.div>
          )}

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-4 mt-6 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-cyan-400" />
              256-bit encryption
            </span>
            <span>•</span>
            <span>Never shared with contractors</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Results Component
interface ScannerResultsProps {
  result: QuoteAnalysisResult;
  onReset: () => void;
  className?: string;
}

function ScannerResults({ result, onReset, className }: ScannerResultsProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-emerald-500 to-emerald-400';
    if (score >= 60) return 'from-amber-500 to-amber-400';
    return 'from-red-500 to-red-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'EXCELLENT';
    if (score >= 60) return 'FAIR';
    if (score >= 40) return 'CONCERNING';
    return 'HIGH RISK';
  };

  const scoreCategories = [
    { label: 'Safety', score: result.safetyScore, icon: Shield },
    { label: 'Scope', score: result.scopeScore, icon: FileText },
    { label: 'Price', score: result.priceScore, icon: Zap },
    { label: 'Fine Print', score: result.finePrintScore, icon: Eye },
    { label: 'Warranty', score: result.warrantyScore, icon: CheckCircle },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("w-full max-w-3xl mx-auto", className)}
    >
      {/* Glowing border */}
      <div className={cn(
        "absolute -inset-0.5 rounded-2xl opacity-40 blur-sm",
        `bg-gradient-to-r ${getScoreGradient(result.overallScore)}`
      )} />

      <div className="relative bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl overflow-hidden">
        {/* Header with Overall Score */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 md:p-8 border-b border-slate-700">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Score Circle */}
            <div className="relative">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-slate-700"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${result.overallScore * 3.52} 352`}
                  strokeLinecap="round"
                  className={getScoreColor(result.overallScore)}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn("text-4xl font-bold", getScoreColor(result.overallScore))}>
                  {result.overallScore}
                </span>
                <span className="text-xs text-slate-400 uppercase tracking-wider">
                  {getScoreLabel(result.overallScore)}
                </span>
              </div>
            </div>

            {/* Summary */}
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-bold text-white mb-2">Quote Analysis Complete</h3>
              <p className="text-slate-300">{result.summary}</p>
              {result.pricePerOpening && (
                <p className="mt-2 text-cyan-400 font-mono">
                  Price per Opening: {result.pricePerOpening}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="p-6 md:p-8">
          <h4 className="text-lg font-semibold text-white mb-4">Score Breakdown</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {scoreCategories.map(({ label, score, icon: Icon }) => (
              <div
                key={label}
                className="bg-slate-800/50 rounded-lg p-4 text-center border border-slate-700"
              >
                <Icon className={cn("w-5 h-5 mx-auto mb-2", getScoreColor(score))} />
                <div className={cn("text-2xl font-bold", getScoreColor(score))}>{score}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Warnings */}
        {result.warnings.length > 0 && (
          <div className="px-6 md:px-8 pb-6">
            <h4 className="text-lg font-semibold text-amber-400 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Warnings Detected
            </h4>
            <ul className="space-y-2">
              {result.warnings.map((warning, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                  <span className="text-amber-400 mt-1">•</span>
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing Items */}
        {result.missingItems.length > 0 && (
          <div className="px-6 md:px-8 pb-6">
            <h4 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Missing Information
            </h4>
            <ul className="space-y-2">
              {result.missingItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                  <span className="text-red-400 mt-1">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 md:p-8 bg-slate-800/50 border-t border-slate-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={onReset}
              variant="outline"
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Scan Another Quote
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold"
            >
              Get Expert Review
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default QuoteScanner;

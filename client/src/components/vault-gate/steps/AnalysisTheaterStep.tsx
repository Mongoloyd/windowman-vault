/**
 * Step 4: Analysis Theater
 * 
 * DESIGN PHILOSOPHY: Digital Fortress Vault
 * - High-tech scanning animation
 * - 5-stage progress matching rubric dimensions
 * - Smooth easing, no 90% stall
 * 
 * STAGES (matching scoring rubric):
 * 1. Analyzing Safety & Code Match (0-20%)
 * 2. Checking Install & Scope Clarity (20-40%)
 * 3. Evaluating Price Fairness (40-60%)
 * 4. Reviewing Fine Print Transparency (60-80%)
 * 5. Verifying Warranty & Protection (80-100%)
 */

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle, Loader2 } from 'lucide-react';
import { THEATER_STAGES } from '@/types/vault';
import type { ScanResult } from '@/types/vault';

interface AnalysisTheaterStepProps {
  eventId: string;
  leadId: string;
  file: File;
  storageMode: 'base64' | 'storage';
  onComplete: (results: ScanResult) => void;
  onError: (error: string) => void;
  analyzeQuote: (
    fileName: string,
    mimeType: string,
    leadId?: string,
    eventId?: string
  ) => Promise<{ data: ScanResult | null; error: Error | null }>;
}

export function AnalysisTheaterStep({
  eventId,
  leadId,
  file,
  storageMode,
  onComplete,
  onError,
  analyzeQuote,
}: AnalysisTheaterStepProps) {
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const analysisStarted = useRef(false);
  const analysisResult = useRef<ScanResult | null>(null);

  // Start analysis on mount
  useEffect(() => {
    if (analysisStarted.current) return;
    analysisStarted.current = true;

    const runAnalysis = async () => {
      try {
        // Use storage-first approach: upload file to S3 via tRPC, then analyze from URL
        // The analyzeQuote function now expects a URL, not Base64
        const { data, error } = await analyzeQuote(file.name, file.type, leadId, eventId);
        
        if (error) {
          throw error;
        }
        
        if (data) {
          analysisResult.current = data;
        } else {
          throw new Error('No analysis result returned');
        }
      } catch (err) {
        console.error('[AnalysisTheater] Analysis error:', err);
        onError(err instanceof Error ? err.message : 'Analysis failed');
      }
    };

    runAnalysis();
  }, [file, analyzeQuote, onError]);

  // Progress animation
  useEffect(() => {
    const TOTAL_DURATION = 30000; // 30 seconds for deep audit with Gemini 2.5 Pro
    const STAGE_DURATION = TOTAL_DURATION / THEATER_STAGES.length;
    const TICK_INTERVAL = 50; // Update every 50ms
    const TICKS_PER_STAGE = STAGE_DURATION / TICK_INTERVAL;

    let currentTick = 0;
    let currentStageIndex = 0;

    const interval = setInterval(() => {
      currentTick++;
      
      // Calculate progress within current stage
      const ticksInCurrentStage = currentTick - (currentStageIndex * TICKS_PER_STAGE);
      const stageProgress = Math.min(ticksInCurrentStage / TICKS_PER_STAGE, 1);
      
      // Apply easing (ease-out-cubic)
      const easedProgress = 1 - Math.pow(1 - stageProgress, 3);
      
      // Calculate overall progress
      const stage = THEATER_STAGES[currentStageIndex];
      const overallProgress = stage.progressStart + (stage.progressEnd - stage.progressStart) * easedProgress;
      
      setProgress(Math.min(overallProgress, 100));
      setCurrentStage(currentStageIndex);

      // Check if we should move to next stage
      if (ticksInCurrentStage >= TICKS_PER_STAGE && currentStageIndex < THEATER_STAGES.length - 1) {
        currentStageIndex++;
      }

      // Check if analysis is complete AND we've reached 100%
      if (overallProgress >= 100 && analysisResult.current) {
        clearInterval(interval);
        setIsComplete(true);
        
        // Small delay before transitioning
        setTimeout(() => {
          if (analysisResult.current) {
            onComplete(analysisResult.current);
          }
        }, 500);
      }

      // If we've been running too long without results, keep at 95%
      if (currentTick > TICKS_PER_STAGE * THEATER_STAGES.length && !analysisResult.current) {
        setProgress(95);
      }
    }, TICK_INTERVAL);

    return () => clearInterval(interval);
  }, [onComplete]);

  const currentStageData = THEATER_STAGES[currentStage];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-8"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span className="text-sm text-cyan-400 font-medium">Deep Audit in Progress</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Running Deep Audit
        </h2>
        <p className="text-gray-400">
          Verifying fine print and Florida code compliance...
        </p>
      </div>

      {/* Progress Circle */}
      <div className="flex justify-center mb-8">
        <div className="relative w-48 h-48">
          {/* Background circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="96"
              cy="96"
              r="88"
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 88}`}
              strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
              className="transition-all duration-100"
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              key={Math.floor(progress)}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl font-bold text-white"
            >
              {Math.floor(progress)}%
            </motion.span>
            {isComplete ? (
              <CheckCircle className="w-6 h-6 text-emerald-400 mt-1" />
            ) : (
              <Loader2 className="w-6 h-6 text-cyan-400 mt-1 animate-spin" />
            )}
          </div>
        </div>
      </div>

      {/* Stage Indicators */}
      <div className="max-w-md mx-auto space-y-3">
        {THEATER_STAGES.map((stage, index) => {
          const isActive = index === currentStage;
          const isCompleted = progress >= stage.progressEnd;
          
          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                isActive
                  ? 'bg-cyan-500/10 border border-cyan-500/30'
                  : isCompleted
                  ? 'bg-emerald-500/5 border border-emerald-500/20'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isCompleted
                  ? 'bg-emerald-500/20'
                  : isActive
                  ? 'bg-cyan-500/20'
                  : 'bg-white/10'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : isActive ? (
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                ) : (
                  <span className="text-xs text-gray-500">{stage.id}</span>
                )}
              </div>
              <span className={`text-sm ${
                isActive ? 'text-cyan-400' : isCompleted ? 'text-emerald-400' : 'text-gray-500'
              }`}>
                {stage.label}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* File info */}
      <div className="mt-8 text-center text-xs text-gray-500">
        Analyzing: {file.name}
      </div>
    </motion.div>
  );
}

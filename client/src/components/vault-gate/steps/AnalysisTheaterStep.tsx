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
 * 
 * ARCHITECTURE: Storage-first approach
 * 1. Upload file to Supabase Storage (estimates bucket)
 * 2. Get public URL
 * 3. Pass URL to Gemini 3 Flash for analysis
 * 4. Save results to Supabase scans table
 * 5. Dual-write to wm_leads for CRM scoring
 */

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle, Loader2, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { THEATER_STAGES } from '@/types/vault';
import type { ScanResult } from '@/types/vault';
import { 
  uploadToStorage, 
  analyzeQuote, 
  createScan, 
  upsertWMLead,
  updateLead 
} from '@/lib/supabase';
import { pushDL } from '@/lib/tracking';

interface AnalysisTheaterStepProps {
  eventId: string;
  leadId: string;
  file: File;
  storageMode: 'base64' | 'storage';
  onComplete: (results: ScanResult) => void;
  onError: (error: string) => void;
}

export function AnalysisTheaterStep({
  eventId,
  leadId,
  file,
  storageMode,
  onComplete,
  onError,
}: AnalysisTheaterStepProps) {
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Uploading document...');
  const analysisStarted = useRef(false);
  const analysisResult = useRef<ScanResult | null>(null);

  // Start analysis on mount
  useEffect(() => {
    if (analysisStarted.current) return;
    analysisStarted.current = true;

    const runAnalysis = async () => {
      try {
        // STEP 1: Upload file to Supabase Storage
        setStatusMessage('Uploading document to secure vault...');
        console.log('[AnalysisTheater] Uploading file to Supabase Storage...');
        
        const uploadResult = await uploadToStorage(file, leadId);
        
        if (!uploadResult) {
          throw new Error('Failed to upload file to storage');
        }
        
        const { url: fileUrl, path: filePath } = uploadResult;
        console.log('[AnalysisTheater] File uploaded:', fileUrl);

        // STEP 2: Analyze with Gemini 3 Flash
        setStatusMessage('AI analyzing your quote...');
        console.log('[AnalysisTheater] Starting Gemini 3 Flash analysis...');
        
        const { data: scanResult, error: analysisError } = await analyzeQuote(
          fileUrl,
          file.type,
          leadId,
          eventId
        );
        
        if (analysisError) {
          throw analysisError;
        }
        
        if (!scanResult) {
          throw new Error('No analysis result returned');
        }

        console.log('[AnalysisTheater] Analysis complete:', scanResult.overallScore);

        // STEP 3: Save scan to Supabase scans table
        setStatusMessage('Saving audit results...');
        console.log('[AnalysisTheater] Saving scan to Supabase...');
        
        const { error: scanSaveError } = await createScan({
          lead_id: leadId,
          quote_url: fileUrl,
          overall_score: scanResult.overallScore,
          audit_details: {
            safety_score: scanResult.safetyScore,
            scope_score: scanResult.scopeScore,
            price_score: scanResult.priceScore,
            fine_print_score: scanResult.finePrintScore,
            warranty_score: scanResult.warrantyScore,
            warnings: scanResult.warnings,
            missing_items: scanResult.missingItems,
            summary: scanResult.summary,
            price_per_opening: scanResult.pricePerOpening,
            estimated_savings: scanResult.estimatedSavings,
          },
          raw_response: scanResult.rawResult ? JSON.stringify(scanResult.rawResult) : undefined,
        });
        
        if (scanSaveError) {
          console.error('[AnalysisTheater] Scan save error:', scanSaveError);
          // Don't throw - we still have the results
        }

        // STEP 4: Lead already created - scan data is in scans table
        console.log('[AnalysisTheater] Lead and scan data saved successfully');

        // STEP 5: Dual-write to wm_leads for CRM scoring
        setStatusMessage('Calculating lead score...');
        console.log('[AnalysisTheater] Upserting wm_leads for CRM...');
        
        // Calculate CRM scores from audit results
        const engagementScore = Math.round(scanResult.overallScore * 0.8 + 20); // 20-100 scale
        const leadQuality = scanResult.overallScore >= 70 ? 'hot' 
          : scanResult.overallScore >= 50 ? 'warm' 
          : 'cold';
        const estimatedDealValue = scanResult.pricePerOpening 
          ? parseInt(scanResult.pricePerOpening.replace(/[^0-9]/g, '')) * 10 // Rough estimate
          : 15000; // Default
        
        // Note: quote_score and has_red_flags are stored in scans.audit_details, not wm_leads
        // wm_leads only has CRM scoring fields
        await upsertWMLead({
          lead_id: leadId,
          engagement_score: engagementScore,
          lead_quality: leadQuality,
          estimated_deal_value: estimatedDealValue,
          status: 'new',
          original_source_tool: 'vault_scanner',
        });

        // Fire GA4 conversion event - quote_scan_complete
        // estimatedSavings is { low: number, high: number } - use the average
        const savingsOpportunity = scanResult.estimatedSavings 
          ? Math.round((scanResult.estimatedSavings.low + scanResult.estimatedSavings.high) / 2)
          : Math.round((100 - scanResult.overallScore) * 150); // Rough estimate based on score
        
        pushDL({
          event: 'quote_scan_complete',
          event_id: eventId,
          lead_id: leadId,
          overall_score: scanResult.overallScore,
          savings_opportunity: savingsOpportunity,
          warning_count: scanResult.warnings?.length || 0,
          missing_items_count: scanResult.missingItems?.length || 0,
        });

        // Store result for progress animation completion
        analysisResult.current = scanResult;
        
      } catch (err) {
        console.error('[AnalysisTheater] Analysis error:', err);
        onError(err instanceof Error ? err.message : 'Analysis failed');
      }
    };

    runAnalysis();
  }, [file, leadId, eventId, onError]);

  // Progress animation
  useEffect(() => {
    const TOTAL_DURATION = 30000; // 30 seconds for deep audit with Gemini 3 Flash
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
          {statusMessage}
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
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 flex-1 cursor-help">
                      <span className={`text-sm ${
                        isActive ? 'text-cyan-400' : isCompleted ? 'text-emerald-400' : 'text-gray-500'
                      }`}>
                        {stage.label}
                      </span>
                      <Info className={`w-3 h-3 ${
                        isActive ? 'text-cyan-400/60' : isCompleted ? 'text-emerald-400/60' : 'text-gray-500/60'
                      }`} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="text-sm">{stage.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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

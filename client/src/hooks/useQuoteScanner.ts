import { useState, useCallback } from 'react';
import { analyzeQuote, AI_TIMEOUTS } from '@/lib/supabase';
import { trpc } from '@/lib/trpc';

export interface QuoteAnalysisResult {
  overallScore: number;
  safetyScore: number;
  scopeScore: number;
  priceScore: number;
  finePrintScore: number;
  warrantyScore: number;
  pricePerOpening: string;
  warnings: string[];
  missingItems: string[];
  summary: string;
  rawResult?: Record<string, unknown>;
  analyzedAt?: string;
}

interface UseQuoteScannerReturn {
  // State
  isAnalyzing: boolean;
  analysisResult: QuoteAnalysisResult | null;
  error: string | null;
  
  // Actions
  analyzeQuoteFile: (file: File, leadId?: number) => Promise<void>;
  resetScanner: () => void;
}

/**
 * Convert file to base64 (only for upload to storage, not for AI analysis)
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function useQuoteScanner(): UseQuoteScannerReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<QuoteAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const uploadMutation = trpc.upload.file.useMutation();

  const analyzeQuoteFile = useCallback(async (file: File, leadId?: number) => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    
    try {
      console.log('[useQuoteScanner] Starting storage-first upload...');
      
      // Step 1: Convert file to base64 for upload
      const base64 = await fileToBase64(file);
      
      // Step 2: Upload to storage via tRPC
      const { url } = await uploadMutation.mutateAsync({
        fileData: base64,
        mimeType: file.type,
        leadId,
      });
      
      console.log('[useQuoteScanner] File uploaded to:', url);
      
      // Step 3: Analyze using the URL (no base64 bloat)
      const { data, error: analysisError } = await analyzeQuote(url, file.type);
      
      if (analysisError) {
        // Stop retry loop on 404 errors
        const errorStr = String(analysisError);
        if (errorStr.includes('404') || errorStr.includes('MODEL_NOT_FOUND')) {
          console.error('[useQuoteScanner] 404 Error - stopping retry loop:', analysisError);
          setError('Model not found. Please try again later.');
          setIsAnalyzing(false);
          return;
        }
        throw analysisError;
      }
      
      if (!data) {
        throw new Error('No analysis result returned');
      }
      
      // Add timestamp and save
      const resultWithTimestamp: QuoteAnalysisResult = {
        overallScore: data.overallScore,
        safetyScore: data.safetyScore,
        scopeScore: data.scopeScore,
        priceScore: data.priceScore,
        finePrintScore: data.finePrintScore,
        warrantyScore: data.warrantyScore,
        pricePerOpening: data.pricePerOpening || 'N/A',
        warnings: data.warnings,
        missingItems: data.missingItems,
        summary: data.summary || '',
        rawResult: data.rawResult,
        analyzedAt: new Date().toISOString(),
      };
      
      setAnalysisResult(resultWithTimestamp);
      console.log('[useQuoteScanner] Analysis complete:', resultWithTimestamp);
      
    } catch (err) {
      console.error('[useQuoteScanner] Quote analysis error:', err);
      const message = err instanceof Error ? err.message : 'Analysis failed. Please try again.';
      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [uploadMutation]);

  const resetScanner = useCallback(() => {
    setAnalysisResult(null);
    setError(null);
  }, []);

  return {
    isAnalyzing,
    analysisResult,
    error,
    analyzeQuoteFile,
    resetScanner,
  };
}

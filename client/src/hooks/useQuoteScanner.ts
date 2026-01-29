import { useState, useCallback } from 'react';
import { analyzeQuote, AI_TIMEOUTS } from '@/lib/supabase';

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
  analyzedAt?: string;
}

interface UseQuoteScannerReturn {
  // State
  isAnalyzing: boolean;
  analysisResult: QuoteAnalysisResult | null;
  error: string | null;
  
  // Actions
  analyzeQuoteFile: (file: File, openingCount?: number, areaName?: string) => Promise<void>;
  resetScanner: () => void;
}

// Compress image if too large (target ~4MB for safe base64 encoding)
async function compressImage(file: File, maxBytes = 4_000_000): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      const base64 = result.split(',')[1];
      
      // If already small enough, return as-is
      if (base64.length < maxBytes) {
        resolve({ base64, mimeType: file.type });
        return;
      }

      // If it's a PDF, we can't compress - just return it
      if (file.type === 'application/pdf') {
        if (base64.length > 6_000_000) {
          reject(new Error('PDF is too large. Please upload a smaller file (max 5MB).'));
          return;
        }
        resolve({ base64, mimeType: file.type });
        return;
      }

      // Compress image using canvas
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        // Scale down if very large
        const maxDim = 2000;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not create canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Try JPEG at 80% quality
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        const compressedBase64 = compressed.split(',')[1];
        
        resolve({ base64: compressedBase64, mimeType: 'image/jpeg' });
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function useQuoteScanner(): UseQuoteScannerReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<QuoteAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeQuoteFile = useCallback(async (file: File, openingCount?: number, areaName?: string) => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    
    try {
      console.log('[useQuoteScanner] Starting analysis with client-side Gemini...');
      
      // Compress/prepare image
      const { base64, mimeType } = await compressImage(file);
      
      // Use client-side Gemini analysis (no Edge Functions)
      const { data, error: analysisError } = await analyzeQuote(base64, mimeType);
      
      if (analysisError) throw analysisError;
      
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
  }, []);

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

/**
 * Alpha Step 3: Upload Quote
 * 
 * DESIGN PHILOSOPHY: Confidence-Building Upload
 * - Big drag-and-drop zone
 * - Strong background image (documents / home / inspection feel)
 * - NO PHONE - just "upload and let the system work"
 * - Cool, confidence-building visual experience
 * 
 * REQUIREMENTS:
 * - Drag and drop support
 * - File type validation (PDF, images)
 * - Upload progress indicator
 * - Storage-first upload to Supabase
 */

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Loader2,
  X,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pushDL } from '@/lib/tracking';
import { supabase, analyzeQuote } from '@/lib/supabase';

interface AlphaUploadStepProps {
  eventId: string;
  leadId: string;
  firstName: string;
  onComplete: (file: File, results: ScanResult) => void;
  onBack: () => void;
}

// Import ScanResult type
import type { ScanResult } from '@/types/vault';

type UploadState = 'idle' | 'dragging' | 'uploading' | 'success' | 'error';

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function AlphaUploadStep({ eventId, leadId, firstName, onComplete, onBack }: AlphaUploadStepProps) {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Please upload a PDF or image file (JPG, PNG, WebP)';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be under 10MB';
    }
    return null;
  };

  const uploadFile = async (file: File) => {
    setUploadState('uploading');
    setUploadProgress(0);
    setErrorMessage(null);

    try {
      // Generate unique file path
      const fileExt = file.name.split('.').pop() || 'pdf';
      const fileName = `${leadId}/${Date.now()}.${fileExt}`;
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('estimates')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      clearInterval(progressInterval);

      if (error) {
        throw new Error(error.message);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('estimates')
        .getPublicUrl(fileName);

      setUploadProgress(100);
      setUploadState('success');

      // Track upload success
      pushDL({
        event: 'alpha_quote_uploaded',
        event_id: eventId,
        lead_id: leadId,
        file_type: file.type,
        file_size: file.size,
      });

      // Run Gemini analysis on the uploaded file
      setUploadProgress(95);
      const { data: analysisResult, error: analysisError } = await analyzeQuote(urlData.publicUrl, file.type, leadId, eventId);
      
      if (analysisError || !analysisResult) {
        throw new Error(analysisError?.message || 'Analysis failed. Please try again.');
      }
      
      setUploadProgress(100);
      
      // Convert QuoteScanResult to ScanResult format
      const scanResult: ScanResult = {
        overallScore: analysisResult.overallScore,
        safetyScore: analysisResult.safetyScore,
        scopeScore: analysisResult.scopeScore,
        priceScore: analysisResult.priceScore,
        finePrintScore: analysisResult.finePrintScore,
        warrantyScore: analysisResult.warrantyScore,
        warnings: analysisResult.warnings || [],
        missingItems: analysisResult.missingItems || [],
        estimatedSavings: analysisResult.estimatedSavings,
        rawResult: analysisResult.rawResult,
      };
      
      // Small delay to show success state
      setTimeout(() => {
        onComplete(file, scanResult);
      }, 800);

    } catch (error) {
      console.error('[AlphaUpload] Upload error:', error);
      setUploadState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed. Please try again.');
      
      pushDL({
        event: 'alpha_upload_error',
        event_id: eventId,
        lead_id: leadId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setUploadState('idle');

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      setUploadState('error');
      return;
    }

    setSelectedFile(file);
    uploadFile(file);
  }, [leadId, eventId]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setUploadState('dragging');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setUploadState('idle');
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      setUploadState('error');
      return;
    }

    setSelectedFile(file);
    uploadFile(file);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRetry = () => {
    setUploadState('idle');
    setSelectedFile(null);
    setErrorMessage(null);
    setUploadProgress(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 md:p-8 lg:p-10 relative"
    >
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back</span>
      </motion.button>

      {/* Header */}
      <div className="text-center mb-8 relative">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-300">AI-Powered Analysis</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Upload Your Contractor Quote
          </h2>
          <p className="text-gray-400 max-w-md mx-auto">
            Drop your estimate below and our AI will analyze it for hidden fees, 
            missing items, and potential savings.
          </p>
        </motion.div>
      </div>

      {/* Upload Zone */}
      <div className="max-w-xl mx-auto relative">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"
          onChange={handleFileSelect}
          className="hidden"
        />

        <motion.div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={uploadState === 'idle' ? handleBrowseClick : undefined}
          className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden ${
            uploadState === 'dragging'
              ? 'border-cyan-400 bg-cyan-500/10 scale-[1.02]'
              : uploadState === 'uploading'
              ? 'border-cyan-500/50 bg-cyan-500/5'
              : uploadState === 'success'
              ? 'border-emerald-400 bg-emerald-500/10'
              : uploadState === 'error'
              ? 'border-red-400 bg-red-500/10'
              : 'border-white/20 bg-white/5 hover:border-cyan-500/50 hover:bg-cyan-500/5'
          }`}
        >
          {/* Upload Progress Bar */}
          {uploadState === 'uploading' && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: uploadProgress / 100 }}
              className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-500 origin-left"
            />
          )}

          <div className="p-10 md:p-14">
            <AnimatePresence mode="wait">
              {/* Idle State */}
              {uploadState === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 flex items-center justify-center border border-white/10">
                    <Upload className="w-10 h-10 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Drop your quote here
                  </h3>
                  <p className="text-gray-400 mb-4">
                    or <span className="text-cyan-400 underline">click to browse</span>
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      <span>PDF</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ImageIcon className="w-4 h-4" />
                      <span>JPG, PNG</span>
                    </div>
                    <span>Max 10MB</span>
                  </div>
                </motion.div>
              )}

              {/* Dragging State */}
              {uploadState === 'dragging' && (
                <motion.div
                  key="dragging"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-cyan-500/20 flex items-center justify-center border-2 border-cyan-400">
                    <Upload className="w-10 h-10 text-cyan-400 animate-bounce" />
                  </div>
                  <h3 className="text-xl font-semibold text-cyan-400">
                    Drop it here!
                  </h3>
                </motion.div>
              )}

              {/* Uploading State */}
              {uploadState === 'uploading' && (
                <motion.div
                  key="uploading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Uploading...
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {selectedFile?.name}
                  </p>
                  <p className="text-cyan-400 font-medium mt-2">
                    {uploadProgress}%
                  </p>
                </motion.div>
              )}

              {/* Success State */}
              {uploadState === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-emerald-400 mb-2">
                    Upload Complete!
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Starting AI analysis...
                  </p>
                </motion.div>
              )}

              {/* Error State */}
              {uploadState === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-500/20 flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-red-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-red-400 mb-2">
                    Upload Failed
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {errorMessage}
                  </p>
                  <Button
                    onClick={handleRetry}
                    variant="outline"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    Try Again
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-500"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>256-bit encryption</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>Never shared</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

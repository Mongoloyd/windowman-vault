/**
 * Step 3: Scanner Upload (YES branch)
 * 
 * DESIGN PHILOSOPHY: Digital Fortress Vault
 * - High-tech upload interface
 * - Dual-path upload: base64 for small files, Storage for large/PDF
 * - File validation and preview
 * 
 * REQUIREMENTS:
 * - Accept PDF, JPG, PNG, WEBP
 * - Max 25MB
 * - Show file preview/name after selection
 * - Dual-path: ≤6MB images → base64, >6MB or PDF → Storage
 */

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Image, X, AlertCircle, Loader2, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FileMetadata } from '@/types/vault';
import { hashFile } from '@/lib/hash';
import { pushDL } from '@/lib/tracking';

interface ScannerUploadStepProps {
  eventId: string;
  leadId: string;
  onUpload: (file: File, metadata: FileMetadata, storageMode: 'base64' | 'storage') => void;
  onBack: () => void;
}

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const BASE64_THRESHOLD = 6 * 1024 * 1024; // 6MB

function getFileIcon(type: string) {
  if (type === 'application/pdf') return FileText;
  return Image;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ScannerUploadStep({ eventId, leadId, onUpload, onBack }: ScannerUploadStepProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Please upload a PDF, JPG, PNG, or WEBP file';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}`;
    }
    return null;
  };

  const handleFile = useCallback(async (selectedFile: File) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    setFile(selectedFile);
    setError(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFile(droppedFile);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
  }, [handleFile]);

  const handleRemoveFile = () => {
    setFile(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleScan = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Calculate file hash
      const sha256 = await hashFile(file);

      // Determine storage mode
      const isPdf = file.type === 'application/pdf';
      const isLarge = file.size > BASE64_THRESHOLD;
      const storageMode: 'base64' | 'storage' = isPdf || isLarge ? 'storage' : 'base64';

      const metadata: FileMetadata = {
        name: file.name,
        size: file.size,
        type: file.type,
        sha256,
      };

      // Fire analytics
      pushDL({
        event: 'scan_started',
        event_id: eventId,
        lead_id: leadId,
        file_type: file.type,
        file_size: file.size,
        storage_mode: storageMode,
      });

      // Pass to parent
      onUpload(file, metadata, storageMode);

    } catch (err) {
      console.error('[ScannerUpload] Processing error:', err);
      setError('Failed to process file. Please try again.');
      setIsProcessing(false);
    }
  };

  const FileIcon = file ? getFileIcon(file.type) : Upload;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 md:p-8"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Upload Your <span className="text-cyan-400">Contractor Quote</span>
        </h2>
        <p className="text-gray-400 max-w-md mx-auto">
          Our AI will analyze your estimate against 10,000+ installations to find savings and red flags.
        </p>
      </div>

      {/* Upload Zone */}
      <div className="max-w-lg mx-auto">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !file && inputRef.current?.click()}
          className={`relative p-8 rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer ${
            isDragging
              ? 'border-cyan-500 bg-cyan-500/10'
              : file
              ? 'border-emerald-500/50 bg-emerald-500/5'
              : 'border-white/20 bg-white/5 hover:border-cyan-500/50 hover:bg-cyan-500/5'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            onChange={handleInputChange}
            className="hidden"
          />

          <AnimatePresence mode="wait">
            {file ? (
              <motion.div
                key="file"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-4"
              >
                <div className="p-3 rounded-lg bg-emerald-500/20">
                  <FileIcon className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{file.name}</p>
                  <p className="text-gray-400 text-sm">{formatFileSize(file.size)}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile();
                  }}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center"
              >
                <div className="inline-flex p-4 rounded-full bg-cyan-500/10 mb-4">
                  <Upload className="w-8 h-8 text-cyan-400" />
                </div>
                <p className="text-white font-medium mb-1">
                  Drop your quote here or click to browse
                </p>
                <p className="text-gray-500 text-sm">
                  PDF, JPG, PNG, or WEBP • Max 25MB
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isProcessing}
            className="flex-1 border-white/20 text-gray-300 hover:bg-white/5"
          >
            Back
          </Button>
          <Button
            onClick={handleScan}
            disabled={!file || isProcessing}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-semibold shadow-lg shadow-cyan-500/25"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Scan My Quote
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Trust signals */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
          <Shield className="w-3.5 h-3.5" />
          <span>Your document is encrypted and never shared with contractors</span>
        </div>
      </div>
    </motion.div>
  );
}

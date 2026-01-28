/**
 * VaultLeadGateModal - Main Container Component
 * 
 * DESIGN PHILOSOPHY: Digital Fortress Vault
 * - Full-screen modal with glassmorphism
 * - State machine driven navigation
 * - Exit intercept after Step 1
 * - Session persistence for resume
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useVaultStateMachine } from '@/hooks/useVaultStateMachine';
import { useSessionPersistence } from '@/hooks/useSessionPersistence';
import { useAttribution } from '@/hooks/useAttribution';
import { pushDL } from '@/lib/tracking';
import { analyzeQuote, updateLead } from '@/lib/supabase';
import type { VaultState, LeadFormData, ScanResult, FileMetadata } from '@/types/vault';
import type { ProjectDetails } from './steps/ProjectDetailsStep';

// Step Components
import { LeadCaptureStep } from './steps/LeadCaptureStep';
import { PivotQuestionStep } from './steps/PivotQuestionStep';
import { ScannerUploadStep } from './steps/ScannerUploadStep';
import { AnalysisTheaterStep } from './steps/AnalysisTheaterStep';
import { ResultDisplayStep } from './steps/ResultDisplayStep';
import { VaultConfirmationStep } from './steps/VaultConfirmationStep';
import { ProjectDetailsStep } from './steps/ProjectDetailsStep';
import { FinalEscalationStep } from './steps/FinalEscalationStep';
import { SuccessStep } from './steps/SuccessStep';
import { ExitInterceptOverlay } from './ExitInterceptOverlay';

interface VaultLeadGateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VAULT_URL = 'https://itswindowman.com/vault';

export function VaultLeadGateModal({ isOpen, onClose }: VaultLeadGateModalProps) {
  // State machine hook
  const stateMachine = useVaultStateMachine();
  const {
    currentState,
    leadId,
    eventId,
    branchChoice,
    formValues,
    scanResults,
    isExitInterceptActive,
    exitFromState,
    goToState,
    setLeadId,
    setBranch,
    setLeadForm,
    setPivotForm,
    setProjectDetails,
    setScanResults,
    setFileMetadata,
    showExitIntercept,
    resumeFromExit,
    goToSuccess,
  } = stateMachine;

  // Session persistence hook
  const sessionPersistence = useSessionPersistence();
  const {
    session,
    isLoading: sessionLoading,
    canResume,
    saveSession,
    updateLeadId,
    updateCurrentStep,
    updateBranchChoice,
    updateScanResults: updateSessionScanResults,
    startOver,
    resumeSession,
  } = sessionPersistence;

  // Attribution hook
  const attribution = useAttribution();
  
  // File state for scanner
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [storageMode, setStorageMode] = useState<'base64' | 'storage'>('base64');
  
  // Track if we've loaded session
  const sessionLoaded = useRef(false);

  // Determine if user can exit (only on Step 1)
  const canExit = currentState === 'lead_capture';

  // Load session on mount
  useEffect(() => {
    if (isOpen && !sessionLoading && session && !sessionLoaded.current) {
      if (session.leadId && canResume) {
        // Resume from saved session
        setLeadId(session.leadId);
        goToState(session.currentStep);
        if (session.branchChoice) {
          setBranch(session.branchChoice);
        }
        if (session.formValues.lead) {
          setLeadForm(session.formValues.lead);
        }
        if (session.scanResults) {
          setScanResults(session.scanResults);
        }
      }
      sessionLoaded.current = true;
    }
  }, [isOpen, sessionLoading, session, canResume, setLeadId, goToState, setBranch, setLeadForm, setScanResults]);

  // Save session on state changes
  useEffect(() => {
    if (leadId) {
      saveSession({
        leadId,
        eventId,
        currentStep: currentState,
        branchChoice,
        formValues,
        scanResults,
      });
    }
  }, [leadId, eventId, currentState, branchChoice, formValues, scanResults, saveSession]);

  // Handle exit attempt
  const handleExitAttempt = useCallback(() => {
    if (!canExit) {
      // Show exit intercept
      showExitIntercept(currentState);
      pushDL({
        event: 'exit_intercept_shown',
        event_id: eventId,
        lead_id: leadId || '',
        exit_step: currentState,
      });
    } else {
      onClose();
    }
  }, [canExit, showExitIntercept, currentState, eventId, leadId, onClose]);

  // Handle keyboard escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        handleExitAttempt();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleExitAttempt]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Step handlers
  const handleLeadCaptureSuccess = (newLeadId: string, formData: LeadFormData) => {
    setLeadId(newLeadId);
    setLeadForm(formData);
    updateLeadId(newLeadId);
    goToState('pivot_question');
  };

  const handlePivotYes = (phone?: string) => {
    setBranch('yes');
    updateBranchChoice('yes');
    if (phone) {
      setPivotForm({ hasEstimate: true, phone });
      // Update lead with phone
      if (leadId) {
        updateLead(leadId, { phone });
      }
    }
    goToState('scanner_upload');
  };

  const handlePivotNo = (phone?: string) => {
    setBranch('no');
    updateBranchChoice('no');
    if (phone) {
      setPivotForm({ hasEstimate: false, phone });
      // Update lead with phone
      if (leadId) {
        updateLead(leadId, { phone });
      }
    }
    goToState('vault_confirmation');
  };

  const handleFileUpload = (file: File, metadata: FileMetadata, mode: 'base64' | 'storage') => {
    setUploadedFile(file);
    setStorageMode(mode);
    setFileMetadata(metadata);
    goToState('analysis_theater');
  };

  const handleAnalysisComplete = (results: ScanResult) => {
    setScanResults(results);
    updateSessionScanResults(results);
    goToState('result_display');
    
    pushDL({
      event: 'scan_completed',
      event_id: eventId,
      lead_id: leadId || '',
      score: results.overallScore,
      warning_count: results.warnings.length,
    });
  };

  const handleAnalysisError = (error: string) => {
    console.error('[VaultModal] Analysis error:', error);
    // Go back to upload with error
    goToState('scanner_upload');
  };

  const handleResultContinue = () => {
    goToState('project_details');
  };

  const handleVaultConfirmationContinue = () => {
    goToState('project_details');
  };

  const handleProjectDetailsContinue = (details: ProjectDetails) => {
    setProjectDetails(details);
    // Update lead with project details
    if (leadId) {
      updateLead(leadId, {
        window_count: details.windowCount,
        timeline: details.timeline,
        notes: details.notes,
      });
    }
    goToState('final_escalation');
  };

  const handleProjectDetailsSkip = () => {
    goToState('final_escalation');
  };

  const handleEscalationSelect = (escalationType: string) => {
    // Update lead with escalation preference
    if (leadId) {
      updateLead(leadId, { escalation_type: escalationType });
    }
    goToSuccess();
  };

  const handleEscalationSkip = () => {
    goToSuccess();
  };

  const handleOpenVault = () => {
    // Redirect to external Vault with lead_id and event_id
    const url = new URL(VAULT_URL);
    url.searchParams.set('event_id', eventId);
    if (leadId) {
      url.searchParams.set('lead_id', leadId);
    }
    window.open(url.toString(), '_blank');
    
    // Clear session and close modal
    startOver();
    onClose();
  };

  const handleExitInterceptContinue = () => {
    resumeFromExit();
  };

  const handleExitInterceptSendLink = () => {
    // TODO: Trigger magic link email via edge function
    // For now, just go to success
    goToSuccess();
  };

  // Render current step
  const renderStep = () => {
    const firstName = formValues.lead?.firstName || 'Friend';
    const email = formValues.lead?.email || '';

    switch (currentState) {
      case 'lead_capture':
        return (
          <LeadCaptureStep
            eventId={eventId}
            initialValues={formValues.lead}
            onSuccess={handleLeadCaptureSuccess}
          />
        );

      case 'pivot_question':
        return (
          <PivotQuestionStep
            eventId={eventId}
            leadId={leadId || ''}
            firstName={firstName}
            onYes={handlePivotYes}
            onNo={handlePivotNo}
          />
        );

      case 'scanner_upload':
        return (
          <ScannerUploadStep
            eventId={eventId}
            leadId={leadId || ''}
            onUpload={handleFileUpload}
            onBack={() => goToState('pivot_question')}
          />
        );

      case 'analysis_theater':
        return uploadedFile ? (
          <AnalysisTheaterStep
            eventId={eventId}
            leadId={leadId || ''}
            file={uploadedFile}
            storageMode={storageMode}
            onComplete={handleAnalysisComplete}
            onError={handleAnalysisError}
            analyzeQuote={analyzeQuote}
          />
        ) : null;

      case 'result_display':
        return scanResults ? (
          <ResultDisplayStep
            eventId={eventId}
            leadId={leadId || ''}
            results={scanResults}
            onContinue={handleResultContinue}
          />
        ) : null;

      case 'vault_confirmation':
        return (
          <VaultConfirmationStep
            eventId={eventId}
            leadId={leadId || ''}
            firstName={firstName}
            onContinue={handleVaultConfirmationContinue}
          />
        );

      case 'project_details':
        return (
          <ProjectDetailsStep
            eventId={eventId}
            leadId={leadId || ''}
            onContinue={handleProjectDetailsContinue}
            onSkip={handleProjectDetailsSkip}
          />
        );

      case 'final_escalation':
        return (
          <FinalEscalationStep
            eventId={eventId}
            leadId={leadId || ''}
            firstName={firstName}
            onSelect={handleEscalationSelect}
            onSkip={handleEscalationSkip}
          />
        );

      case 'success':
        return (
          <SuccessStep
            eventId={eventId}
            leadId={leadId || ''}
            firstName={firstName}
            email={email}
            scanResults={scanResults}
            onOpenVault={handleOpenVault}
          />
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop - only clickable after Step 1 */}
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={currentState === 'lead_capture' ? undefined : handleExitAttempt}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-white/10 shadow-2xl"
        >
          {/* Close button - hidden on Step 1 */}
          {currentState !== 'lead_capture' && (
            <button
              onClick={handleExitAttempt}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors z-10"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentState}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {/* Progress Indicator */}
          {currentState !== 'lead_capture' && currentState !== 'success' && currentState !== 'exit_intercept' && (
            <div className="px-6 pb-4">
              <div className="flex gap-1">
                {(() => {
                  const steps = branchChoice === 'yes'
                    ? ['pivot_question', 'scanner_upload', 'analysis_theater', 'result_display', 'project_details', 'final_escalation']
                    : ['pivot_question', 'vault_confirmation', 'project_details', 'final_escalation'];
                  
                  const currentIndex = steps.indexOf(currentState);
                  
                  return steps.map((step, index) => (
                    <div
                      key={step}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        index <= currentIndex ? 'bg-cyan-500' : 'bg-white/10'
                      }`}
                    />
                  ));
                })()}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Exit Intercept Overlay */}
      <ExitInterceptOverlay
        isOpen={isExitInterceptActive}
        eventId={eventId}
        leadId={leadId || ''}
        email={formValues.lead?.email || ''}
        currentStep={exitFromState || currentState}
        onContinue={handleExitInterceptContinue}
        onSendLink={handleExitInterceptSendLink}
      />
    </>
  );
}

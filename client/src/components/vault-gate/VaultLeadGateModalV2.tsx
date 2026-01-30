/**
 * VaultLeadGateModalV2 - Dual-Path Funnel Architecture
 * 
 * DESIGN PHILOSOPHY: Choice, Not Form
 * - Step 1: Lead capture (name, email, zip) - NO PHONE
 * - Step 2: Path Fork - Two visual cards (Alpha vs Beta)
 * - Path Alpha: Quote auditors → Upload → Blurred Report → Phone/SMS → Unblur → Chat → Close
 * - Path Beta: Researchers → 4 Tools → Filter Questions → Phone/SMS → Vault Confirm
 * 
 * KEY PRINCIPLES:
 * - Phone is earned, not demanded (comes after value delivery)
 * - SMS PIN is required for BOTH paths as final gate
 * - Lead value calculated from (homeowner + windows + timeline)
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useVaultStateMachine } from '@/hooks/useVaultStateMachine';
import { useSessionPersistence } from '@/hooks/useSessionPersistence';
import { useAttribution } from '@/hooks/useAttribution';
import { pushDL } from '@/lib/tracking';
import { updateLead } from '@/lib/supabase';
import type { LeadFormData, ScanResult, FileMetadata } from '@/types/vault';

// Step 1: Lead Capture (existing)
import { LeadCaptureStep } from './steps/LeadCaptureStep';

// Step 2: Path Fork (new)
import { PathForkStep } from './steps/PathForkStep';

// Alpha Path Steps
import { AlphaUploadStep } from './steps/AlphaUploadStep';
import { AlphaRevealGateStep } from './steps/AlphaRevealGateStep';
import { AlphaChatStep } from './steps/AlphaChatStep';
import { AlphaNextStepsStep } from './steps/AlphaNextStepsStep';

// Beta Path Steps
import { BetaExploreToolsStep } from './steps/BetaExploreToolsStep';
import { BetaFilterStep } from './steps/BetaFilterStep';
import { BetaVaultConfirmStep } from './steps/BetaVaultConfirmStep';

// Shared
import { ExitInterceptOverlay } from './ExitInterceptOverlay';
import { SuccessStep } from './steps/SuccessStep';

interface VaultLeadGateModalV2Props {
  isOpen: boolean;
  onClose: () => void;
}

// Dual-path state types
type PathType = 'alpha' | 'beta' | null;
type ModalState = 
  // Shared
  | 'lead_capture'
  | 'path_fork'
  | 'success'
  // Alpha Path
  | 'alpha_upload'
  | 'alpha_reveal_gate'
  | 'alpha_chat'
  | 'alpha_next_steps'
  // Beta Path
  | 'beta_explore_tools'
  | 'beta_filter'
  | 'beta_vault_confirm';

const VAULT_URL = 'https://itswindowman.com/vault';

export function VaultLeadGateModalV2({ isOpen, onClose }: VaultLeadGateModalV2Props) {
  // Core state
  const [currentState, setCurrentState] = useState<ModalState>('lead_capture');
  const [pathType, setPathType] = useState<PathType>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [eventId] = useState(() => `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);
  
  // Form data
  const [formData, setFormData] = useState<LeadFormData | null>(null);
  const [scanResults, setScanResults] = useState<ScanResult | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  // Lead value tracking (for Meta pixel)
  const [leadValue, setLeadValue] = useState(0);
  const [leadTier, setLeadTier] = useState('cold');
  
  // Exit intercept
  const [isExitInterceptActive, setIsExitInterceptActive] = useState(false);
  const [exitFromState, setExitFromState] = useState<ModalState | null>(null);

  // Session persistence
  const sessionPersistence = useSessionPersistence();
  const { saveSession, startOver } = sessionPersistence;

  // Attribution
  const attribution = useAttribution();

  // Derived values
  const firstName = formData?.firstName || 'Friend';
  const email = formData?.email || '';
  const canExit = currentState === 'lead_capture';

  // Update lead in Supabase
  const updateLeadData = useCallback(async (updates: Record<string, any>) => {
    if (!leadId) return;
    console.log('[VaultModalV2] Updating lead:', leadId, updates);
    const { error } = await updateLead(leadId, updates);
    if (error) {
      console.error('[VaultModalV2] Lead update error:', error.message);
    }
  }, [leadId]);

  // Handle exit attempt
  const handleExitAttempt = useCallback(() => {
    if (!canExit) {
      setExitFromState(currentState);
      setIsExitInterceptActive(true);
      pushDL({
        event: 'exit_intercept_shown',
        event_id: eventId,
        lead_id: leadId || '',
        exit_step: currentState,
      });
    } else {
      onClose();
    }
  }, [canExit, currentState, eventId, leadId, onClose]);

  // Keyboard escape
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

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // ============================================
  // STEP HANDLERS
  // ============================================

  // Step 1: Lead Capture Success
  const handleLeadCaptureSuccess = (newLeadId: string, data: LeadFormData) => {
    setLeadId(newLeadId);
    setFormData(data);
    setCurrentState('path_fork');
    
    pushDL({
      event: 'lead_capture_success',
      event_id: eventId,
      lead_id: newLeadId,
    });
  };

  // Step 2: Path Fork Selection
  const handlePathSelect = async (path: 'alpha' | 'beta') => {
    setPathType(path);
    
    // Update lead with path type
    await updateLeadData({ path_type: path });
    
    pushDL({
      event: 'path_selected',
      event_id: eventId,
      lead_id: leadId || '',
      path_type: path,
    });

    if (path === 'alpha') {
      setCurrentState('alpha_upload');
    } else {
      setCurrentState('beta_explore_tools');
    }
  };

  // ============================================
  // ALPHA PATH HANDLERS
  // ============================================

  const handleAlphaUploadComplete = (file: File, results: ScanResult) => {
    setUploadedFile(file);
    setScanResults(results);
    setCurrentState('alpha_reveal_gate');
  };

  const handleAlphaReportUnlocked = (value: number, tier: string) => {
    setLeadValue(value);
    setLeadTier(tier);
    setCurrentState('alpha_chat');
  };

  const handleAlphaChatContinue = () => {
    setCurrentState('alpha_next_steps');
  };

  const handleAlphaComplete = () => {
    setCurrentState('success');
  };

  // ============================================
  // BETA PATH HANDLERS
  // ============================================

  const handleBetaToolsComplete = () => {
    setCurrentState('beta_filter');
  };

  const handleBetaFilterComplete = (value: number, tier: string) => {
    setLeadValue(value);
    setLeadTier(tier);
    setCurrentState('beta_vault_confirm');
  };

  const handleBetaVaultComplete = () => {
    setCurrentState('success');
  };

  // ============================================
  // SHARED HANDLERS
  // ============================================

  const handleOpenVault = () => {
    const url = new URL(VAULT_URL);
    url.searchParams.set('event_id', eventId);
    if (leadId) {
      url.searchParams.set('lead_id', leadId);
    }
    window.open(url.toString(), '_blank');
    startOver();
    onClose();
  };

  const handleExitInterceptContinue = () => {
    setIsExitInterceptActive(false);
    setExitFromState(null);
  };

  const handleExitInterceptSendLink = () => {
    setCurrentState('success');
    setIsExitInterceptActive(false);
  };

  // ============================================
  // RENDER STEP
  // ============================================

  const renderStep = () => {
    switch (currentState) {
      // Step 1: Lead Capture
      case 'lead_capture':
        return (
          <LeadCaptureStep
            eventId={eventId}
            initialValues={formData || undefined}
            onSuccess={handleLeadCaptureSuccess}
          />
        );

      // Step 2: Path Fork
      case 'path_fork':
        return (
          <PathForkStep
            eventId={eventId}
            leadId={leadId || ''}
            firstName={firstName}
            onAlpha={() => handlePathSelect('alpha')}
            onBeta={() => handlePathSelect('beta')}
          />
        );

      // ============================================
      // ALPHA PATH
      // ============================================

      case 'alpha_upload':
        return (
          <AlphaUploadStep
            eventId={eventId}
            leadId={leadId || ''}
            firstName={firstName}
            onComplete={handleAlphaUploadComplete}
            onBack={() => setCurrentState('path_fork')}
          />
        );

      case 'alpha_reveal_gate':
        return scanResults ? (
          <AlphaRevealGateStep
            eventId={eventId}
            leadId={leadId || ''}
            firstName={firstName}
            scanResults={scanResults}
            onUnlock={handleAlphaReportUnlocked}
          />
        ) : null;

      case 'alpha_chat':
        return scanResults ? (
          <AlphaChatStep
            eventId={eventId}
            leadId={leadId || ''}
            firstName={firstName}
            scanResult={scanResults}
            onContinue={handleAlphaChatContinue}
          />
        ) : null;

      case 'alpha_next_steps':
        return (
          <AlphaNextStepsStep
            eventId={eventId}
            leadId={leadId || ''}
            firstName={firstName}
            leadValue={leadValue}
            leadTier={leadTier}
            onComplete={handleAlphaComplete}
          />
        );

      // ============================================
      // BETA PATH
      // ============================================

      case 'beta_explore_tools':
        return (
          <BetaExploreToolsStep
            eventId={eventId}
            leadId={leadId || ''}
            firstName={firstName}
            onContinue={handleBetaToolsComplete}
          />
        );

      case 'beta_filter':
        return (
          <BetaFilterStep
            eventId={eventId}
            leadId={leadId || ''}
            firstName={firstName}
            onContinue={handleBetaFilterComplete}
          />
        );

      case 'beta_vault_confirm':
        return (
          <BetaVaultConfirmStep
            eventId={eventId}
            leadId={leadId || ''}
            firstName={firstName}
            leadValue={leadValue}
            leadTier={leadTier}
            onComplete={handleBetaVaultComplete}
          />
        );

      // ============================================
      // SUCCESS
      // ============================================

      case 'success':
        return (
          <SuccessStep
            eventId={eventId}
            leadId={leadId || ''}
            firstName={firstName}
            email={email}
            scanResults={scanResults || undefined}
            onOpenVault={handleOpenVault}
          />
        );

      default:
        return null;
    }
  };

  // ============================================
  // PROGRESS INDICATOR
  // ============================================

  const getProgressSteps = () => {
    if (pathType === 'alpha') {
      return ['path_fork', 'alpha_upload', 'alpha_reveal_gate', 'alpha_chat', 'alpha_next_steps'];
    } else if (pathType === 'beta') {
      return ['path_fork', 'beta_explore_tools', 'beta_filter', 'beta_vault_confirm'];
    }
    return [];
  };

  const progressSteps = getProgressSteps();
  const currentStepIndex = progressSteps.indexOf(currentState);

  if (!isOpen) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
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
          {progressSteps.length > 0 && currentState !== 'lead_capture' && currentState !== 'success' && (
            <div className="px-6 pb-4">
              <div className="flex gap-1">
                {progressSteps.map((step, index) => (
                  <div
                    key={step}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      index <= currentStepIndex ? 'bg-cyan-500' : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Exit Intercept Overlay */}
      <AnimatePresence>
        {isExitInterceptActive && (
          <ExitInterceptOverlay
            isOpen={isExitInterceptActive}
            eventId={eventId}
            leadId={leadId || ''}
            email={email}
            currentStep={exitFromState || currentState}
            onContinue={handleExitInterceptContinue}
            onSendLink={handleExitInterceptSendLink}
          />
        )}
      </AnimatePresence>
    </>
  );
}

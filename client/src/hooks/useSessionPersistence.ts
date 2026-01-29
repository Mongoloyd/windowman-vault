/**
 * useSessionPersistence Hook
 * 
 * Manages localStorage persistence for the Vault Lead Gate flow.
 * Handles session resume, validation, and cleanup.
 */

import { useCallback, useEffect, useState } from 'react';
import type { VaultSession, VaultState, BranchChoice, LeadFormData, PivotFormData, ProjectDetailsFormData, EscalationFormData, ScanResult, FileMetadata } from '@/types/vault';
import { trpc } from '@/lib/trpc';
import { generateEventId } from '@/lib/eventId';

const STORAGE_KEY = 'wm_vault_session';
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Create a fresh session
 */
function createFreshSession(): VaultSession {
  return {
    leadId: null,
    eventId: generateEventId(),
    currentStep: 'lead_capture',
    branchChoice: null,
    formValues: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Check if session is expired
 */
function isSessionExpired(session: VaultSession): boolean {
  const createdAt = new Date(session.createdAt).getTime();
  const now = Date.now();
  return now - createdAt > SESSION_MAX_AGE_MS;
}

/**
 * Hook for managing vault session persistence
 */
export function useSessionPersistence() {
  const [session, setSession] = useState<VaultSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canResume, setCanResume] = useState(false);

  // Load session on mount
  useEffect(() => {
    async function loadSession() {
      setIsLoading(true);
      
      const stored = localStorage.getItem(STORAGE_KEY);
      
      if (!stored) {
        // No stored session, create fresh
        const fresh = createFreshSession();
        setSession(fresh);
        setCanResume(false);
        setIsLoading(false);
        return;
      }

      try {
        const parsed = JSON.parse(stored) as VaultSession;
        
        // Check if expired
        if (isSessionExpired(parsed)) {
          console.log('[Session] Expired, starting fresh');
          const fresh = createFreshSession();
          localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
          setSession(fresh);
          setCanResume(false);
          setIsLoading(false);
          return;
        }

        // If we have a lead_id, validate it still exists
        if (parsed.leadId) {
          // Try to parse leadId as number for tRPC
          const numericId = parseInt(parsed.leadId, 10);
          let exists = false;
          
          if (!isNaN(numericId)) {
            try {
              // Use fetch directly since we can't use hooks in useEffect
              const response = await fetch(`/api/trpc/leads.getById?input=${encodeURIComponent(JSON.stringify({ id: numericId }))}`);
              const result = await response.json();
              exists = result?.result?.data !== null && result?.result?.data !== undefined;
            } catch (err) {
              console.warn('[Session] Could not validate lead:', err);
              exists = true; // Assume exists if we can't check
            }
          }
          
          if (!exists) {
            console.log('[Session] Lead not found in DB, starting fresh');
            const fresh = createFreshSession();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
            setSession(fresh);
            setCanResume(false);
            setIsLoading(false);
            return;
          }

          // Valid session with lead, can resume at pivot_question
          console.log('[Session] Valid session found, can resume');
          setSession(parsed);
          setCanResume(parsed.currentStep !== 'lead_capture' && parsed.currentStep !== 'success');
          setIsLoading(false);
          return;
        }

        // Session without lead_id - use it but can't resume past lead_capture
        setSession(parsed);
        setCanResume(false);
        setIsLoading(false);
        
      } catch (err) {
        console.error('[Session] Parse error:', err);
        const fresh = createFreshSession();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
        setSession(fresh);
        setCanResume(false);
        setIsLoading(false);
      }
    }

    loadSession();
  }, []);

  // Save session to localStorage
  const saveSession = useCallback((updates: Partial<VaultSession>) => {
    setSession(prev => {
      if (!prev) return prev;
      
      const updated: VaultSession = {
        ...prev,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      
      if (import.meta.env.DEV) {
        console.log(
          '%c[Session] Saved',
          'background: #9c27b0; color: white; padding: 2px 6px; border-radius: 3px;',
          updated
        );
      }
      
      return updated;
    });
  }, []);

  // Update specific fields
  const updateLeadId = useCallback((leadId: string) => {
    saveSession({ leadId });
  }, [saveSession]);

  const updateCurrentStep = useCallback((currentStep: VaultState) => {
    saveSession({ currentStep });
  }, [saveSession]);

  const updateBranchChoice = useCallback((branchChoice: BranchChoice) => {
    saveSession({ branchChoice });
  }, [saveSession]);

  const updateLeadForm = useCallback((lead: LeadFormData) => {
    setSession(prev => {
      if (!prev) return prev;
      const updated: VaultSession = {
        ...prev,
        formValues: { ...prev.formValues, lead },
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updatePivotForm = useCallback((pivot: PivotFormData) => {
    setSession(prev => {
      if (!prev) return prev;
      const updated: VaultSession = {
        ...prev,
        formValues: { ...prev.formValues, pivot },
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateProjectDetails = useCallback((projectDetails: ProjectDetailsFormData) => {
    setSession(prev => {
      if (!prev) return prev;
      const updated: VaultSession = {
        ...prev,
        formValues: { ...prev.formValues, projectDetails },
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateEscalation = useCallback((escalation: EscalationFormData) => {
    setSession(prev => {
      if (!prev) return prev;
      const updated: VaultSession = {
        ...prev,
        formValues: { ...prev.formValues, escalation },
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateScanResults = useCallback((scanResults: ScanResult) => {
    saveSession({ scanResults });
  }, [saveSession]);

  const updateFileMetadata = useCallback((fileMetadata: FileMetadata) => {
    saveSession({ fileMetadata });
  }, [saveSession]);

  // Start over (clear session but preserve attribution)
  const startOver = useCallback(() => {
    const fresh = createFreshSession();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    setSession(fresh);
    setCanResume(false);
    
    if (import.meta.env.DEV) {
      console.log(
        '%c[Session] Started over',
        'background: #f44336; color: white; padding: 2px 6px; border-radius: 3px;'
      );
    }
  }, []);

  // Resume from pivot_question
  const resumeSession = useCallback(() => {
    if (session && canResume) {
      // Resume at pivot_question (after lead capture)
      saveSession({ currentStep: 'pivot_question' });
    }
  }, [session, canResume, saveSession]);

  return {
    session,
    isLoading,
    canResume,
    saveSession,
    updateLeadId,
    updateCurrentStep,
    updateBranchChoice,
    updateLeadForm,
    updatePivotForm,
    updateProjectDetails,
    updateEscalation,
    updateScanResults,
    updateFileMetadata,
    startOver,
    resumeSession,
  };
}

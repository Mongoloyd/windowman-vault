/**
 * useVaultStateMachine Hook
 * 
 * Manages the 10-state finite state machine for the Vault Lead Gate flow.
 * Uses useReducer for predictable state transitions.
 */

import { useReducer, useCallback } from 'react';
import type { VaultState, VaultAction, VaultReducerState, BranchChoice, LeadFormData, PivotFormData, ProjectDetailsFormData, EscalationFormData, ScanResult, FileMetadata } from '@/types/vault';
import { generateEventId } from '@/lib/eventId';

/**
 * Initial state for the reducer
 */
function createInitialState(eventId?: string): VaultReducerState {
  return {
    currentState: 'lead_capture',
    previousState: null,
    leadId: null,
    eventId: eventId || generateEventId(),
    branchChoice: null,
    formValues: {},
    isExitInterceptActive: false,
    exitFromState: null,
  };
}

/**
 * Valid state transitions
 */
const VALID_TRANSITIONS: Record<VaultState, VaultState[]> = {
  lead_capture: ['pivot_question'],
  pivot_question: ['scanner_upload', 'vault_confirmation', 'exit_intercept'],
  scanner_upload: ['analysis_theater', 'exit_intercept'],
  analysis_theater: ['result_display'],
  result_display: ['project_details', 'exit_intercept'],
  vault_confirmation: ['project_details', 'exit_intercept'],
  project_details: ['final_escalation', 'exit_intercept'],
  final_escalation: ['success', 'exit_intercept'],
  success: [], // Terminal state
  exit_intercept: ['lead_capture', 'pivot_question', 'scanner_upload', 'result_display', 'vault_confirmation', 'project_details', 'final_escalation'], // Can return to any non-terminal state
};

/**
 * Reducer function for state machine
 */
function vaultReducer(state: VaultReducerState, action: VaultAction): VaultReducerState {
  switch (action.type) {
    case 'SET_STATE': {
      const targetState = action.payload;
      
      // Validate transition (unless going to/from exit_intercept)
      if (targetState !== 'exit_intercept' && state.currentState !== 'exit_intercept') {
        const validTargets = VALID_TRANSITIONS[state.currentState];
        if (!validTargets.includes(targetState)) {
          console.warn(`[StateMachine] Invalid transition: ${state.currentState} -> ${targetState}`);
          return state;
        }
      }
      
      return {
        ...state,
        previousState: state.currentState,
        currentState: targetState,
        isExitInterceptActive: targetState === 'exit_intercept',
      };
    }
    
    case 'SET_LEAD_ID':
      return { ...state, leadId: action.payload };
    
    case 'SET_EVENT_ID':
      return { ...state, eventId: action.payload };
    
    case 'SET_BRANCH':
      return { ...state, branchChoice: action.payload };
    
    case 'SET_LEAD_FORM':
      return {
        ...state,
        formValues: { ...state.formValues, lead: action.payload },
      };
    
    case 'SET_PIVOT_FORM':
      return {
        ...state,
        formValues: { ...state.formValues, pivot: action.payload },
      };
    
    case 'SET_PROJECT_DETAILS':
      return {
        ...state,
        formValues: { ...state.formValues, projectDetails: action.payload },
      };
    
    case 'SET_ESCALATION':
      return {
        ...state,
        formValues: { ...state.formValues, escalation: action.payload },
      };
    
    case 'SET_SCAN_RESULTS':
      return { ...state, scanResults: action.payload };
    
    case 'SET_FILE_METADATA':
      return { ...state, fileMetadata: action.payload };
    
    case 'SHOW_EXIT_INTERCEPT':
      return {
        ...state,
        previousState: state.currentState,
        currentState: 'exit_intercept',
        isExitInterceptActive: true,
        exitFromState: action.payload,
      };
    
    case 'RESUME_FROM_EXIT':
      if (state.exitFromState) {
        return {
          ...state,
          currentState: state.exitFromState,
          isExitInterceptActive: false,
          exitFromState: null,
        };
      }
      return state;
    
    case 'RESET':
      return createInitialState();
    
    default:
      return state;
  }
}

/**
 * Hook for the vault state machine
 */
export function useVaultStateMachine(initialEventId?: string) {
  const [state, dispatch] = useReducer(vaultReducer, createInitialState(initialEventId));

  // Navigation helpers
  const goToState = useCallback((targetState: VaultState) => {
    dispatch({ type: 'SET_STATE', payload: targetState });
  }, []);

  const setLeadId = useCallback((leadId: string) => {
    dispatch({ type: 'SET_LEAD_ID', payload: leadId });
  }, []);

  const setEventId = useCallback((eventId: string) => {
    dispatch({ type: 'SET_EVENT_ID', payload: eventId });
  }, []);

  const setBranch = useCallback((branch: BranchChoice) => {
    dispatch({ type: 'SET_BRANCH', payload: branch });
  }, []);

  const setLeadForm = useCallback((data: LeadFormData) => {
    dispatch({ type: 'SET_LEAD_FORM', payload: data });
  }, []);

  const setPivotForm = useCallback((data: PivotFormData) => {
    dispatch({ type: 'SET_PIVOT_FORM', payload: data });
  }, []);

  const setProjectDetails = useCallback((data: ProjectDetailsFormData) => {
    dispatch({ type: 'SET_PROJECT_DETAILS', payload: data });
  }, []);

  const setEscalation = useCallback((data: EscalationFormData) => {
    dispatch({ type: 'SET_ESCALATION', payload: data });
  }, []);

  const setScanResults = useCallback((results: ScanResult) => {
    dispatch({ type: 'SET_SCAN_RESULTS', payload: results });
  }, []);

  const setFileMetadata = useCallback((metadata: FileMetadata) => {
    dispatch({ type: 'SET_FILE_METADATA', payload: metadata });
  }, []);

  const showExitIntercept = useCallback((fromState: VaultState) => {
    dispatch({ type: 'SHOW_EXIT_INTERCEPT', payload: fromState });
  }, []);

  const resumeFromExit = useCallback(() => {
    dispatch({ type: 'RESUME_FROM_EXIT' });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // Branch-specific navigation
  const goToPivotQuestion = useCallback(() => {
    goToState('pivot_question');
  }, [goToState]);

  const goToScannerUpload = useCallback(() => {
    setBranch('yes');
    goToState('scanner_upload');
  }, [goToState, setBranch]);

  const goToVaultConfirmation = useCallback(() => {
    setBranch('no');
    goToState('vault_confirmation');
  }, [goToState, setBranch]);

  const goToAnalysisTheater = useCallback(() => {
    goToState('analysis_theater');
  }, [goToState]);

  const goToResultDisplay = useCallback(() => {
    goToState('result_display');
  }, [goToState]);

  const goToProjectDetails = useCallback(() => {
    goToState('project_details');
  }, [goToState]);

  const goToFinalEscalation = useCallback(() => {
    goToState('final_escalation');
  }, [goToState]);

  const goToSuccess = useCallback(() => {
    goToState('success');
  }, [goToState]);

  return {
    // State
    currentState: state.currentState,
    previousState: state.previousState,
    leadId: state.leadId,
    eventId: state.eventId,
    branchChoice: state.branchChoice,
    formValues: state.formValues,
    scanResults: state.scanResults,
    fileMetadata: state.fileMetadata,
    isExitInterceptActive: state.isExitInterceptActive,
    exitFromState: state.exitFromState,
    
    // Actions
    goToState,
    setLeadId,
    setEventId,
    setBranch,
    setLeadForm,
    setPivotForm,
    setProjectDetails,
    setEscalation,
    setScanResults,
    setFileMetadata,
    showExitIntercept,
    resumeFromExit,
    reset,
    
    // Navigation shortcuts
    goToPivotQuestion,
    goToScannerUpload,
    goToVaultConfirmation,
    goToAnalysisTheater,
    goToResultDisplay,
    goToProjectDetails,
    goToFinalEscalation,
    goToSuccess,
  };
}

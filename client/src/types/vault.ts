/**
 * Type Definitions for Vault Lead Gate System
 */

// State machine states
export type VaultState =
  | 'lead_capture'
  | 'pivot_question'
  | 'scanner_upload'
  | 'analysis_theater'
  | 'result_display'
  | 'vault_confirmation'
  | 'project_details'
  | 'final_escalation'
  | 'success'
  | 'exit_intercept';

// Branch choices
export type BranchChoice = 'yes' | 'no' | null;

// Form data for lead capture (Step 1)
export interface LeadFormData {
  firstName: string;
  lastName: string;
  email: string;
  zip?: string;
  honeypot?: string; // Hidden field for bot detection
}

// Form data for pivot question (Step 2)
export interface PivotFormData {
  hasEstimate: boolean;
  phone?: string;
}

// Form data for project details
export interface ProjectDetailsFormData {
  windowCount?: number;
  timeline?: string;
  budgetRange?: string;
}

// Form data for final escalation
export interface EscalationFormData {
  callbackPreference: 'asap' | 'scheduled' | 'email_only';
  callbackTime?: string;
}

// Scan result from AI analysis
export interface ScanResult {
  overallScore: number;
  safetyScore: number;
  scopeScore: number;
  priceScore: number;
  finePrintScore: number;
  warrantyScore: number;
  warnings: string[];
  missingItems: string[];
  estimatedSavings?: {
    low: number;
    high: number;
  };
  rawResult?: Record<string, unknown>;
}

// File metadata for uploads
export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  sha256?: string;
  pages?: number;
}

// Session data stored in localStorage
export interface VaultSession {
  leadId: string | null;
  eventId: string;
  currentStep: VaultState;
  branchChoice: BranchChoice;
  formValues: {
    lead?: LeadFormData;
    pivot?: PivotFormData;
    projectDetails?: ProjectDetailsFormData;
    escalation?: EscalationFormData;
  };
  scanResults?: ScanResult;
  fileMetadata?: FileMetadata;
  createdAt: string;
  updatedAt: string;
}

// Attribution data from URL params
export interface AttributionData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  fbclid?: string;
  gclid?: string;
  msclkid?: string;  // Microsoft Ads click ID
  fbp?: string;
  fbc?: string;
  referrer?: string;
  landing_page?: string;
}

// State machine action types
export type VaultAction =
  | { type: 'SET_STATE'; payload: VaultState }
  | { type: 'SET_LEAD_ID'; payload: string }
  | { type: 'SET_EVENT_ID'; payload: string }
  | { type: 'SET_BRANCH'; payload: BranchChoice }
  | { type: 'SET_LEAD_FORM'; payload: LeadFormData }
  | { type: 'SET_PIVOT_FORM'; payload: PivotFormData }
  | { type: 'SET_PROJECT_DETAILS'; payload: ProjectDetailsFormData }
  | { type: 'SET_ESCALATION'; payload: EscalationFormData }
  | { type: 'SET_SCAN_RESULTS'; payload: ScanResult }
  | { type: 'SET_FILE_METADATA'; payload: FileMetadata }
  | { type: 'SHOW_EXIT_INTERCEPT'; payload: VaultState }
  | { type: 'RESUME_FROM_EXIT' }
  | { type: 'RESET' };

// Full state for the reducer
export interface VaultReducerState {
  currentState: VaultState;
  previousState: VaultState | null;
  leadId: string | null;
  eventId: string;
  branchChoice: BranchChoice;
  formValues: {
    lead?: LeadFormData;
    pivot?: PivotFormData;
    projectDetails?: ProjectDetailsFormData;
    escalation?: EscalationFormData;
  };
  scanResults?: ScanResult;
  fileMetadata?: FileMetadata;
  isExitInterceptActive: boolean;
  exitFromState: VaultState | null;
}

// Analysis theater stage
export interface TheaterStage {
  id: number;
  label: string;
  tooltip: string;
  progressStart: number;
  progressEnd: number;
}

// Analysis theater stages (matching rubric dimensions)
export const THEATER_STAGES: TheaterStage[] = [
  { 
    id: 1, 
    label: 'Analyzing Safety & Code Match…', 
    tooltip: "Verifies your quote meets Florida's hurricane protection standards",
    progressStart: 0, 
    progressEnd: 20 
  },
  { 
    id: 2, 
    label: 'Checking Install & Scope Clarity…', 
    tooltip: "Checks if the quote clearly defines what's included (and what's not)",
    progressStart: 20, 
    progressEnd: 40 
  },
  { 
    id: 3, 
    label: 'Evaluating Price Fairness…', 
    tooltip: "Compares your price against 10,000+ real Florida installations",
    progressStart: 40, 
    progressEnd: 60 
  },
  { 
    id: 4, 
    label: 'Reviewing Fine Print Transparency…', 
    tooltip: "Scans for hidden fees, exclusions, and vague language",
    progressStart: 60, 
    progressEnd: 80 
  },
  { 
    id: 5, 
    label: 'Verifying Warranty & Protection…', 
    tooltip: "Ensures your coverage matches industry best practices",
    progressStart: 80, 
    progressEnd: 100 
  },
];

// Props for step components
export interface StepProps {
  onNext: () => void;
  onBack?: () => void;
  eventId: string;
  leadId: string | null;
}

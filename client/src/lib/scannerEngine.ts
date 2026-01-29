/**
 * SCANNER ENGINE - Client-Side AI Quote Analysis
 * 
 * This module contains the "brain" of the WindowMan Vault quote scanner.
 * Ported from the original Supabase Edge Function to run client-side with Gemini.
 * 
 * Components:
 * 1. EXTRACTION_RUBRIC - System prompt for AI signal extraction
 * 2. ExtractionSignals - TypeScript interface for extracted data
 * 3. scoreFromSignals() - Deterministic scoring function
 * 4. analyzeQuote() - Main entry point using Gemini 1.5 Flash
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// ============================================
// EXTRACTION RUBRIC (AI Extracts Signals Only)
// ============================================

const EXTRACTION_RUBRIC = `
You are **WINDOW QUOTE SIGNAL EXTRACTOR**, an evidence-based reader for Florida impact-window/door quotes.

Your ONLY job is to EXTRACT what you see in the document. You do NOT score or judge.

Return ONLY a JSON object with boolean flags and extracted values based on what you observe.

==================================================
PHASE 0 — DOCUMENT VALIDITY CHECK
==================================================

Determine if this is a real window/door quote/proposal/contract.

VALID if you see ANY TWO OR MORE:
- Terms: window, door, slider, glazing, impact, hurricane, laminated, vinyl, aluminum, frame
- Line items with qty/dimensions/opening descriptions
- A total price / estimate amount
- Contractor company info / license / address
- "proposal", "estimate", "contract", "quote", "scope of work"

Set isValidQuote = true/false based on this check.
If not valid, set validityReason explaining why (e.g., "This appears to be a receipt, not a quote").

==================================================
PHASE 1 — EXTRACT PRICE & OPENINGS
==================================================

A) TOTAL PRICE:
- Look for "Total", "Grand Total", "Contract Price", "Total Due", "$"
- Set totalPriceFound = true if you find a clear total
- Set totalPriceValue = the numeric value (no currency symbols)

B) OPENING COUNT:
- Count line items for windows/doors/openings
- Set openingCountEstimate = your best estimate (integer)
- If unclear, set to null

==================================================
PHASE 2 — SAFETY SIGNALS
==================================================

Set boolean flags based on what you SEE:

A) COMPLIANCE KEYWORDS (hasComplianceKeyword = true if ANY):
- NOA, Notice of Acceptance, Miami-Dade, Miami Dade, MDCA
- FL#, FL #, Florida Product Approval, Product Approval
- HVHZ, High Velocity Hurricane Zone, High Velocity
- TAS 201/202/203, ASTM E1886/E1996
- DP, Design Pressure, +/-, ±

B) COMPLIANCE IDENTIFIERS (hasComplianceIdentifier = true if ANY):
- A number after NOA/FL (ex: "NOA 20-1234", "FL 16824")
- DP value or +/- value (ex: "DP50", "+55/-65")

C) LAMINATED GLASS (hasLaminatedMention = true if ANY):
- laminated, laminated glass, impact laminated, hurricane laminated
- PVB, interlayer, SGP, SentryGlas, ionoplast

D) GLASS BUILD DETAIL (hasGlassBuildDetail = true if ANY):
- thickness (5/16, 7/16, 9/16)
- "laminated insulated", "IGU", "insulated laminated", "argon", "Low-E"
- "heat strengthened" (only if paired with laminated/impact context)

E) NEGATIVE TRIGGERS:
- hasTemperedOnlyRisk = true if "tempered" appears AND NO "laminated/impact" language
- hasNonImpactLanguage = true if "non-impact", "not impact", "annealed", or "glass-only replacement"

==================================================
PHASE 3 — SCOPE SIGNALS
==================================================

A) PERMITS (hasPermitMention = true if ANY):
- permit, permitting, pulled by contractor
- engineering, engineer letter, drawings
- notice of commencement, NOC, inspections

B) DEMO/INSTALL (hasDemoInstallDetail = true if ANY):
- remove existing, demo, dispose old windows
- install new, set, anchor, fasten, bucking
- shimming, waterproofing, flashing

C) SPECIFIC MATERIALS (hasSpecificMaterials = true if ANY):
- sealant, caulk, silicone, polyurethane, Sika, Dow 795
- flashing tape, peel & stick, sill pan
- tapcons, ultracons, stainless fasteners

D) WALL REPAIR (hasWallRepairMention = true if ANY):
- stucco, drywall, plaster, patch, texture
- paint, repaint, ready for paint, match existing

E) FINISH DETAIL (hasFinishDetail = true if ANY):
- trim, casing, wrap, interior trim, exterior trim

F) CLEANUP (hasCleanupMention = true if ANY):
- debris, haul away, dumpster, trash, cleanup
- floor protection, drop cloth, ram board, dust barrier

G) BRAND CLARITY (hasBrandClarity = true if ANY):
- Brand names (PGT, CGI, ES, WinDoor, Andersen, Marvin, Euro-Wall, etc.)
- Window types: SH/DH/casement/awning/fixed/slider/French door

H) RED FLAGS:
- hasSubjectToChange = true if "subject to remeasure", "subject to change", or "price may change"
- hasRepairsExcluded = true if "stucco by owner", "drywall not included", or repairs explicitly excluded

==================================================
PHASE 4 — FINE PRINT SIGNALS
==================================================

A) DEPOSIT:
- depositPercentage = numeric value if you can determine it (e.g., 50 for 50%), else null
- If you see a deposit amount but not percentage, try to calculate from total

B) PAYMENT TRAPS:
- hasFinalPaymentTrap = true if final payment due BEFORE inspection/permit close/completion
- hasSafePaymentTerms = true if final payment due AFTER inspection/permit close/walkthrough

C) CONTRACT TRAPS:
- hasContractTraps = true if ANY: cancellation fee, restocking, "non-refundable", arbitration, venue, attorney fees
- contractTrapsList = array of specific traps found (strings)

==================================================
PHASE 5 — WARRANTY SIGNALS
==================================================

- hasWarrantyMention = true if ANY: warranty, guaranteed, workmanship, labor, installation, manufacturer warranty
- hasLaborWarranty = true if labor/workmanship explicitly mentioned
- warrantyDurationYears = numeric value if stated (e.g., 2 for "2-year warranty"), else null
- hasLifetimeWarranty = true if "lifetime" appears in warranty context
- hasTransferableWarranty = true if "transferable" mentioned

==================================================
PHASE 6 — PREMIUM INDICATORS
==================================================

- hasPremiumIndicators = true if ANY: Euro-Wall, Marvin, large sliders, custom colors, SGP, very high DP (>50), coastal stainless package

==================================================
OUTPUT
==================================================

Return ONLY the JSON object with all the boolean flags and extracted values. Do NOT include scores or judgments.
`;

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface ExtractionSignals {
  isValidQuote: boolean;
  validityReason: string;
  totalPriceFound: boolean;
  totalPriceValue: number | null;
  openingCountEstimate: number | null;
  hasComplianceKeyword: boolean;
  hasComplianceIdentifier: boolean;
  hasLaminatedMention: boolean;
  hasGlassBuildDetail: boolean;
  hasTemperedOnlyRisk: boolean;
  hasNonImpactLanguage: boolean;
  hasPermitMention: boolean;
  hasDemoInstallDetail: boolean;
  hasSpecificMaterials: boolean;
  hasWallRepairMention: boolean;
  hasFinishDetail: boolean;
  hasCleanupMention: boolean;
  hasBrandClarity: boolean;
  hasSubjectToChange: boolean;
  hasRepairsExcluded: boolean;
  depositPercentage: number | null;
  hasFinalPaymentTrap: boolean;
  hasSafePaymentTerms: boolean;
  hasContractTraps: boolean;
  contractTrapsList: string[];
  hasWarrantyMention: boolean;
  hasLaborWarranty: boolean;
  warrantyDurationYears: number | null;
  hasLifetimeWarranty: boolean;
  hasTransferableWarranty: boolean;
  hasPremiumIndicators: boolean;
}

export interface AnalysisData {
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
  rawSignals?: ExtractionSignals;
}

// ============================================
// EXTRACTION SIGNALS JSON SCHEMA (for Gemini)
// ============================================

const extractionSignalsSchema = {
  type: "object" as const,
  properties: {
    isValidQuote: { type: "boolean" as const },
    validityReason: { type: "string" as const },
    totalPriceFound: { type: "boolean" as const },
    totalPriceValue: { type: "number" as const, nullable: true },
    openingCountEstimate: { type: "number" as const, nullable: true },
    hasComplianceKeyword: { type: "boolean" as const },
    hasComplianceIdentifier: { type: "boolean" as const },
    hasLaminatedMention: { type: "boolean" as const },
    hasGlassBuildDetail: { type: "boolean" as const },
    hasTemperedOnlyRisk: { type: "boolean" as const },
    hasNonImpactLanguage: { type: "boolean" as const },
    hasPermitMention: { type: "boolean" as const },
    hasDemoInstallDetail: { type: "boolean" as const },
    hasSpecificMaterials: { type: "boolean" as const },
    hasWallRepairMention: { type: "boolean" as const },
    hasFinishDetail: { type: "boolean" as const },
    hasCleanupMention: { type: "boolean" as const },
    hasBrandClarity: { type: "boolean" as const },
    hasSubjectToChange: { type: "boolean" as const },
    hasRepairsExcluded: { type: "boolean" as const },
    depositPercentage: { type: "number" as const, nullable: true },
    hasFinalPaymentTrap: { type: "boolean" as const },
    hasSafePaymentTerms: { type: "boolean" as const },
    hasContractTraps: { type: "boolean" as const },
    contractTrapsList: { 
      type: "array" as const, 
      items: { type: "string" as const } 
    },
    hasWarrantyMention: { type: "boolean" as const },
    hasLaborWarranty: { type: "boolean" as const },
    warrantyDurationYears: { type: "number" as const, nullable: true },
    hasLifetimeWarranty: { type: "boolean" as const },
    hasTransferableWarranty: { type: "boolean" as const },
    hasPremiumIndicators: { type: "boolean" as const },
  },
  required: [
    "isValidQuote",
    "validityReason",
    "totalPriceFound",
    "hasComplianceKeyword",
    "hasComplianceIdentifier",
    "hasLaminatedMention",
    "hasGlassBuildDetail",
    "hasTemperedOnlyRisk",
    "hasNonImpactLanguage",
    "hasPermitMention",
    "hasDemoInstallDetail",
    "hasSpecificMaterials",
    "hasWallRepairMention",
    "hasFinishDetail",
    "hasCleanupMention",
    "hasBrandClarity",
    "hasSubjectToChange",
    "hasRepairsExcluded",
    "hasFinalPaymentTrap",
    "hasSafePaymentTerms",
    "hasContractTraps",
    "contractTrapsList",
    "hasWarrantyMention",
    "hasLaborWarranty",
    "hasLifetimeWarranty",
    "hasTransferableWarranty",
    "hasPremiumIndicators",
  ],
};

// ============================================
// DETERMINISTIC SCORING FUNCTION
// (Exact port from Edge Function)
// ============================================

export function scoreFromSignals(signals: ExtractionSignals, openingCountHint: number | null): AnalysisData {
  const warnings: string[] = [];
  const missingItems: string[] = [];

  // PHASE 0: Document Validity Gate
  if (!signals.isValidQuote) {
    return {
      overallScore: 0,
      safetyScore: 0,
      scopeScore: 0,
      priceScore: 0,
      finePrintScore: 0,
      warrantyScore: 0,
      pricePerOpening: "N/A",
      warnings: ["Not a window/door quote. Upload a contractor proposal/estimate for windows/doors."],
      missingItems: [],
      summary: "No grading performed because this is not a window/door quote.",
      rawSignals: signals,
    };
  }

  // PHASE 1: Compute Price Per Opening
  let pricePerOpening = "N/A";
  let pricePerOpeningValue: number | null = null;
  
  const effectiveOpeningCount = signals.openingCountEstimate ?? openingCountHint;
  
  if (signals.totalPriceFound && signals.totalPriceValue && effectiveOpeningCount && effectiveOpeningCount > 0) {
    const rawPPO = signals.totalPriceValue / effectiveOpeningCount;
    pricePerOpeningValue = Math.round(rawPPO / 50) * 50;
    pricePerOpening = `$${pricePerOpeningValue.toLocaleString()}`;
  }

  // PHASE 2: Safety Score (0-100) [Weight 30%]
  let safetyScore = 0;

  if (signals.hasComplianceKeyword) {
    safetyScore += 25;
  }
  if (signals.hasComplianceIdentifier) {
    safetyScore += 25;
  }
  if (signals.hasLaminatedMention) {
    safetyScore += 25;
  }
  if (signals.hasGlassBuildDetail) {
    safetyScore += 10;
  }

  if (signals.hasTemperedOnlyRisk) {
    safetyScore = Math.min(safetyScore, 30);
    warnings.push("Tempered alone isn't impact glass—verify laminated impact rating.");
  }

  if (signals.hasNonImpactLanguage) {
    safetyScore = Math.min(safetyScore, 25);
    warnings.push("Non-impact or glass-only language found—high hurricane compliance risk.");
  }

  if (!signals.hasComplianceKeyword && !signals.hasComplianceIdentifier && !signals.hasLaminatedMention) {
    safetyScore = Math.min(safetyScore, 40);
    missingItems.push("No proof of impact compliance (NOA/FL#, DP, HVHZ, or laminated impact glass).");
  }

  safetyScore = Math.max(0, Math.min(100, safetyScore));

  // PHASE 3: Scope Score (0-100) [Weight 25%]
  let scopeScore = 0;

  if (signals.hasPermitMention) {
    scopeScore += 20;
  }
  if (signals.hasDemoInstallDetail) {
    scopeScore += 15;
  }
  if (signals.hasSpecificMaterials) {
    scopeScore += 10;
  }
  if (signals.hasWallRepairMention) {
    scopeScore += 15;
  }
  if (signals.hasFinishDetail) {
    scopeScore += 10;
  }
  if (signals.hasCleanupMention) {
    scopeScore += 15;
  }
  if (signals.hasBrandClarity) {
    scopeScore += 15;
  }

  if (signals.hasSubjectToChange) {
    scopeScore = Math.max(scopeScore - 30, 0);
    warnings.push("RED FLAG: 'Subject to remeasure/change' allows price hikes after signing.");
  }

  if (signals.hasRepairsExcluded || !signals.hasWallRepairMention) {
    missingItems.push("Wall repair scope unclear (stucco/drywall/paint after install).");
  }

  scopeScore = Math.max(0, Math.min(100, scopeScore));

  // PHASE 4: Fine Print Score (0-100) [Weight 15%]
  let finePrintScore = 60;

  if (signals.depositPercentage !== null) {
    if (signals.depositPercentage > 40) {
      finePrintScore = 0;
      warnings.push("High risk: deposit exceeds 40%.");
    } else if (signals.depositPercentage >= 10) {
      finePrintScore = Math.min(finePrintScore + 20, 80);
    } else {
      finePrintScore = Math.min(finePrintScore + 40, 100);
    }
  } else {
    missingItems.push("Payment schedule/deposit terms not clearly stated.");
  }

  if (signals.hasFinalPaymentTrap) {
    finePrintScore = Math.min(finePrintScore, 25);
    warnings.push("Risky: final payment due before inspection/permit close.");
  } else if (signals.hasSafePaymentTerms) {
    finePrintScore = Math.min(finePrintScore + 10, 100);
  }

  if (signals.hasContractTraps && signals.contractTrapsList.length > 0) {
    const deduction = Math.min(signals.contractTrapsList.length * 10, 30);
    finePrintScore = Math.max(finePrintScore - deduction, 0);
    if (signals.contractTrapsList.length > 0) {
      warnings.push(`Contract contains: ${signals.contractTrapsList.slice(0, 3).join(", ")}.`);
    }
  }

  finePrintScore = Math.max(0, Math.min(100, finePrintScore));

  // PHASE 5: Warranty Score (0-100) [Weight 10%]
  let warrantyScore = 0;

  if (signals.hasWarrantyMention) {
    warrantyScore += 30;
  }
  if (signals.hasLaborWarranty) {
    warrantyScore += 40;
  }
  if (signals.warrantyDurationYears !== null && signals.warrantyDurationYears > 1) {
    warrantyScore += 15;
  }
  if (signals.hasLifetimeWarranty) {
    warrantyScore += 15;
  }
  if (signals.hasTransferableWarranty) {
    warrantyScore += 10;
  }

  if (!signals.hasWarrantyMention) {
    missingItems.push("No warranty terms stated (labor/workmanship + manufacturer coverage).");
  }

  warrantyScore = Math.max(0, Math.min(100, warrantyScore));

  // PHASE 6: Price Score (0-100) [Weight 20%]
  let priceScore = 40;

  if (pricePerOpeningValue !== null) {
    if (pricePerOpeningValue < 1000) {
      priceScore = 40;
    } else if (pricePerOpeningValue < 1200) {
      priceScore = 65;
    } else if (pricePerOpeningValue <= 1800) {
      priceScore = 95;
    } else if (pricePerOpeningValue <= 2500) {
      priceScore = 75;
    } else {
      priceScore = 55;
      if (signals.hasPremiumIndicators) {
        priceScore = Math.min(priceScore + 10, 75);
      }
    }
  } else {
    missingItems.push("Could not compute price per opening (missing total price or opening count).");
  }

  priceScore = Math.max(0, Math.min(100, priceScore));

  // PHASE 7: Overall Score + Summary
  const overallScore = Math.round(
    safetyScore * 0.30 +
    scopeScore * 0.25 +
    priceScore * 0.20 +
    finePrintScore * 0.15 +
    warrantyScore * 0.10
  );

  let summary = "";
  const lowestScore = Math.min(safetyScore, scopeScore, priceScore, finePrintScore, warrantyScore);
  
  if (safetyScore === lowestScore && safetyScore < 50) {
    summary = "Quote lacks impact compliance proof—verify NOA/FL approval and laminated glass before signing.";
  } else if (finePrintScore === lowestScore && finePrintScore < 50) {
    summary = "Risky payment terms or contract traps detected—review deposit and final payment conditions.";
  } else if (scopeScore === lowestScore && scopeScore < 50) {
    summary = "Scope is vague—get written clarification on permits, installation details, and wall repairs.";
  } else if (warrantyScore === lowestScore && warrantyScore < 50) {
    summary = "Warranty terms unclear or missing—request written labor and manufacturer warranty details.";
  } else if (priceScore === lowestScore && priceScore < 60) {
    summary = "Price may be outside typical market range—compare with other quotes and verify scope.";
  } else if (overallScore >= 80) {
    summary = "Quote appears comprehensive with good compliance documentation and fair terms.";
  } else if (overallScore >= 60) {
    summary = "Quote is acceptable but has some gaps—review warnings and missing items before signing.";
  } else {
    summary = "Quote has significant concerns—address warnings and missing items before proceeding.";
  }

  return {
    overallScore,
    safetyScore,
    scopeScore,
    priceScore,
    finePrintScore,
    warrantyScore,
    pricePerOpening,
    warnings: warnings.slice(0, 6),
    missingItems: missingItems.slice(0, 6),
    summary,
    rawSignals: signals,
  };
}

// ============================================
// FILE TO BASE64 CONVERSION
// ============================================

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ============================================
// MAIN ANALYSIS FUNCTION
// ============================================

export async function analyzeQuote(
  file: File,
  openingCountHint?: number | null,
  areaName?: string | null
): Promise<AnalysisData> {
  // Get API key from environment
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY.');
  }

  // Initialize Gemini
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });

  // Convert file to base64
  const base64Data = await fileToBase64(file);
  
  // Build the user prompt
  let userPrompt = `Extract evidence signals from the following window/door quote image.

If the image is not a window/door quote, set isValidQuote to false and explain why in validityReason.

---
`;

  if (openingCountHint) {
    userPrompt += `\nHINT: The homeowner says there are approximately ${openingCountHint} openings.`;
  }

  if (areaName) {
    userPrompt += `\nHINT: The project is in ${areaName}, Florida.`;
  }

  userPrompt += `\n\nExtract all evidence signals from the quote according to the extraction rubric and return your findings as a JSON object.`;

  // Call Gemini with the image
  const result = await model.generateContent([
    { text: EXTRACTION_RUBRIC },
    { text: userPrompt },
    {
      inlineData: {
        mimeType: file.type,
        data: base64Data,
      },
    },
  ]);

  const response = result.response;
  const text = response.text();
  
  // Parse the JSON response
  let signals: ExtractionSignals;
  try {
    signals = JSON.parse(text);
  } catch {
    console.error('Failed to parse Gemini response:', text);
    throw new Error('Failed to parse AI response. Please try again.');
  }

  // Run deterministic scoring
  const analysisData = scoreFromSignals(signals, openingCountHint ?? null);
  
  return analysisData;
}

// ============================================
// MOCK ANALYSIS (for testing without API)
// ============================================

export function getMockAnalysis(): AnalysisData {
  return {
    overallScore: 72,
    safetyScore: 85,
    scopeScore: 65,
    priceScore: 75,
    finePrintScore: 60,
    warrantyScore: 70,
    pricePerOpening: "$1,450",
    warnings: [
      "Payment schedule/deposit terms not clearly stated.",
      "Wall repair scope unclear (stucco/drywall/paint after install).",
    ],
    missingItems: [
      "No warranty terms stated (labor/workmanship + manufacturer coverage).",
    ],
    summary: "Quote is acceptable but has some gaps—review warnings and missing items before signing.",
  };
}

// ============================================
// MODEL CONFIGURATION
// ============================================

// 3-tier fallback chain for maximum reliability:
// 1. Gemini 2.0 Pro - Best available reasoning (2026 stable)
// 2. Gemini 1.5 Pro - Proven reliability (fallback)
// 3. Gemini 1.5 Flash - Highest free tier limits
const MODEL_CHAIN = [
  'gemini-2.0-pro',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
] as const;

// Legacy exports for compatibility
const PRIMARY_MODEL = MODEL_CHAIN[0];
const FALLBACK_MODEL = MODEL_CHAIN[1];

// Error classification for debugging
function classifyGeminiError(error: unknown): string {
  const errorStr = String(error);
  const errorMessage = error instanceof Error ? error.message : errorStr;
  
  if (errorStr.includes('404') || errorMessage.includes('not found')) {
    return 'MODEL_NOT_FOUND: Model ID may be retired or unavailable in your region';
  }
  if (errorStr.includes('403') || errorMessage.includes('permission')) {
    return 'PERMISSION_DENIED: API key may lack access to this model tier';
  }
  if (errorStr.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate')) {
    return 'QUOTA_EXCEEDED: Rate limit or quota exceeded - consider upgrading API tier';
  }
  if (errorStr.includes('location') || errorMessage.includes('region') || errorMessage.includes('geo')) {
    return 'LOCATION_NOT_SUPPORTED: Model not available in your geographic region';
  }
  if (errorStr.includes('timeout') || errorMessage.includes('deadline')) {
    return 'TIMEOUT: Request took too long - model may be overloaded';
  }
  if (errorStr.includes('500') || errorStr.includes('503')) {
    return 'SERVER_ERROR: Gemini service temporarily unavailable';
  }
  
  return `UNKNOWN_ERROR: ${errorMessage}`;
}

// ============================================
// ANALYZE FROM URL (Storage-first approach)
// ============================================

export async function analyzeQuoteFromUrl(
  imageUrl: string,
  mimeType: string,
  openingCountHint?: number | null,
  areaName?: string | null
): Promise<AnalysisData> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const userPrompt = buildUserPrompt(openingCountHint, areaName);

  // Fetch image once and convert to base64
  const imageResponse = await fetch(imageUrl);
  const imageBlob = await imageResponse.blob();
  const base64Data = await blobToBase64(imageBlob);

  // Try each model in the chain until one succeeds
  let lastError: Error | null = null;
  
  for (const modelName of MODEL_CHAIN) {
    try {
      console.log(`[ScannerEngine] Attempting analysis with ${modelName}...`);
      
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });
      
      const result = await model.generateContent([
        { text: EXTRACTION_RUBRIC },
        { text: userPrompt },
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        },
      ]);

      console.log(`[ScannerEngine] ✅ Analysis completed with ${modelName}`);
      
      const response = result.response;
      const text = response.text();
      
      let signals: ExtractionSignals;
      try {
        signals = JSON.parse(text);
      } catch {
        console.error('[ScannerEngine] Failed to parse Gemini response:', text);
        throw new Error('Failed to parse AI response. Please try again.');
      }

      return scoreFromSignals(signals, openingCountHint ?? null);
      
    } catch (error) {
      const errorClassification = classifyGeminiError(error);
      console.error(`[ScannerEngine] ❌ ${modelName} FAILED`);
      console.error(`[ScannerEngine] Error Classification: ${errorClassification}`);
      console.error(`[ScannerEngine] Raw Error:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Continue to next model in chain
      continue;
    }
  }

  // All models failed
  throw lastError || new Error('All Gemini models failed. Please try again later.');
}

// ============================================
// ANALYZE FROM BASE64 (for supabase.ts integration)
// ============================================

export async function analyzeQuoteFromBase64(
  base64Data: string,
  mimeType: string,
  openingCountHint?: number | null,
  areaName?: string | null
): Promise<AnalysisData> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const userPrompt = buildUserPrompt(openingCountHint, areaName);

  // Try each model in the chain until one succeeds
  let lastError: Error | null = null;
  
  for (const modelName of MODEL_CHAIN) {
    try {
      console.log(`[ScannerEngine] Attempting analysis with ${modelName}...`);
      
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });
      
      const result = await model.generateContent([
        { text: EXTRACTION_RUBRIC },
        { text: userPrompt },
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        },
      ]);

      console.log(`[ScannerEngine] ✅ Analysis completed with ${modelName}`);
      
      const response = result.response;
      const text = response.text();
      
      let signals: ExtractionSignals;
      try {
        signals = JSON.parse(text);
      } catch {
        console.error('[ScannerEngine] Failed to parse Gemini response:', text);
        throw new Error('Failed to parse AI response. Please try again.');
      }

      return scoreFromSignals(signals, openingCountHint ?? null);
      
    } catch (error) {
      const errorClassification = classifyGeminiError(error);
      console.error(`[ScannerEngine] ❌ ${modelName} FAILED`);
      console.error(`[ScannerEngine] Error Classification: ${errorClassification}`);
      console.error(`[ScannerEngine] Raw Error:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Continue to next model in chain
      continue;
    }
  }

  // All models failed
  throw lastError || new Error('All Gemini models failed. Please try again later.');
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function buildUserPrompt(openingCountHint?: number | null, areaName?: string | null): string {
  let userPrompt = `Extract evidence signals from the following window/door quote image.

If the image is not a window/door quote, set isValidQuote to false and explain why in validityReason.

---
`;

  if (openingCountHint) {
    userPrompt += `\nHINT: The homeowner says there are approximately ${openingCountHint} openings.`;
  }

  if (areaName) {
    userPrompt += `\nHINT: The project is in ${areaName}, Florida.`;
  }

  userPrompt += `\n\nExtract all evidence signals from the quote according to the extraction rubric and return your findings as a JSON object.`;
  
  return userPrompt;
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

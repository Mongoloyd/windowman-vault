/**
 * Step 5: Result Display (YES branch)
 * 
 * DESIGN PHILOSOPHY: Digital Fortress Vault
 * - Dramatic reveal of scan results
 * - Score visualization with category breakdown
 * - Warnings and missing items highlighted
 * - Clear CTA to continue to project details
 */

import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, XCircle, ArrowRight, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ScanResult } from '@/types/vault';

interface ResultDisplayStepProps {
  eventId: string;
  leadId: string;
  results: ScanResult;
  onContinue: () => void;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-yellow-400';
  return 'text-red-400';
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500/20';
  if (score >= 60) return 'bg-yellow-500/20';
  return 'bg-red-500/20';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Good';
  if (score >= 60) return 'Fair';
  return 'Concern';
}

const SCORE_CATEGORIES = [
  { key: 'safetyScore', label: 'Safety & Code', icon: Shield },
  { key: 'scopeScore', label: 'Scope Clarity', icon: CheckCircle },
  { key: 'priceScore', label: 'Price Fairness', icon: DollarSign },
  { key: 'finePrintScore', label: 'Fine Print', icon: AlertTriangle },
  { key: 'warrantyScore', label: 'Warranty', icon: Shield },
] as const;

export function ResultDisplayStep({ eventId, leadId, results, onContinue }: ResultDisplayStepProps) {
  const overallScore = results.overallScore;
  const hasWarnings = results.warnings.length > 0;
  const hasMissingItems = results.missingItems.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-8"
    >
      {/* Header with Overall Score */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getScoreBgColor(overallScore)} mb-4`}
        >
          <div className="text-center">
            <span className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}
            </span>
            <span className="block text-xs text-gray-400 mt-1">/ 100</span>
          </div>
        </motion.div>
        
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Your Quote Score: <span className={getScoreColor(overallScore)}>{getScoreLabel(overallScore)}</span>
        </h2>
        
        {results.estimatedSavings && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20"
          >
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-400 font-semibold">
              Potential Savings: ${results.estimatedSavings.low.toLocaleString()} - ${results.estimatedSavings.high.toLocaleString()}
            </span>
          </motion.div>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="max-w-lg mx-auto mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Category Breakdown</h3>
        <div className="space-y-3">
          {SCORE_CATEGORIES.map(({ key, label, icon: Icon }, index) => {
            const score = results[key] as number;
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className={`p-2 rounded-lg ${getScoreBgColor(score)}`}>
                  <Icon className={`w-4 h-4 ${getScoreColor(score)}`} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-300">{label}</span>
                    <span className={`text-sm font-medium ${getScoreColor(score)}`}>{score}/100</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                      className={`h-full rounded-full ${
                        score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Warnings */}
      {hasWarnings && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="max-w-lg mx-auto mb-6"
        >
          <h3 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Warnings Detected ({results.warnings.length})
          </h3>
          <div className="space-y-2">
            {results.warnings.slice(0, 3).map((warning, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-300"
              >
                {warning}
              </div>
            ))}
            {results.warnings.length > 3 && (
              <p className="text-xs text-gray-500">
                +{results.warnings.length - 3} more warnings in full report
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Missing Items */}
      {hasMissingItems && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="max-w-lg mx-auto mb-8"
        >
          <h3 className="text-sm font-medium text-yellow-400 mb-3 flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Missing from Quote ({results.missingItems.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {results.missingItems.slice(0, 5).map((item, index) => (
              <span
                key={index}
                className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-300"
              >
                {item}
              </span>
            ))}
            {results.missingItems.length > 5 && (
              <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-gray-500">
                +{results.missingItems.length - 5} more
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="max-w-lg mx-auto"
      >
        <Button
          onClick={onContinue}
          className="w-full h-12 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-semibold text-lg shadow-lg shadow-cyan-500/25"
        >
          Continue to Full Report
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        <p className="text-center text-xs text-gray-500 mt-3">
          Your detailed Truth Sheet is waiting in the Vault
        </p>
      </motion.div>
    </motion.div>
  );
}

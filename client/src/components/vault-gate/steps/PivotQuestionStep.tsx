/**
 * Step 2: Pivot Question
 * 
 * DESIGN PHILOSOPHY: Digital Fortress Vault
 * - Binary choice: "Do you have an estimate ready?"
 * - Phone capture with value-framed copy
 * - Clear visual distinction between YES and NO paths
 * 
 * REQUIREMENTS:
 * - Phone field with auto-format (XXX) XXX-XXXX
 * - Value-framed copy: "Where should we text your secure Vault access code?"
 * - YES → scanner_upload
 * - NO → vault_confirmation
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Shield, Phone, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PivotFormData } from '@/types/vault';
import { pushDL } from '@/lib/tracking';

interface PivotQuestionStepProps {
  eventId: string;
  leadId: string;
  firstName: string;
  onYes: (phone?: string) => void;
  onNo: (phone?: string) => void;
}

/**
 * Format phone number as (XXX) XXX-XXXX
 */
function formatPhoneNumber(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Limit to 10 digits
  const limited = digits.slice(0, 10);
  
  // Format
  if (limited.length === 0) return '';
  if (limited.length <= 3) return `(${limited}`;
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
}

export function PivotQuestionStep({ eventId, leadId, firstName, onYes, onNo }: PivotQuestionStepProps) {
  const [phone, setPhone] = useState('');
  const [selectedChoice, setSelectedChoice] = useState<'yes' | 'no' | null>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhoneNumber(e.target.value));
  };

  const handleYes = () => {
    setSelectedChoice('yes');
    pushDL({
      event: 'pivot_yes',
      event_id: eventId,
      lead_id: leadId,
      has_phone: !!phone,
    });
    // Small delay for visual feedback
    setTimeout(() => onYes(phone || undefined), 300);
  };

  const handleNo = () => {
    setSelectedChoice('no');
    pushDL({
      event: 'pivot_no',
      event_id: eventId,
      lead_id: leadId,
      has_phone: !!phone,
    });
    // Small delay for visual feedback
    setTimeout(() => onNo(phone || undefined), 300);
  };

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
          Welcome, <span className="text-cyan-400">{firstName}</span>!
        </h2>
        <p className="text-gray-400 max-w-md mx-auto">
          Let's get you protected. Do you have a contractor estimate ready to scan?
        </p>
      </div>

      {/* Choice Cards */}
      <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
        {/* YES Card */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleYes}
          disabled={selectedChoice !== null}
          className={`relative p-6 rounded-xl border-2 transition-all duration-300 text-left ${
            selectedChoice === 'yes'
              ? 'border-cyan-500 bg-cyan-500/10'
              : 'border-white/10 bg-white/5 hover:border-cyan-500/50 hover:bg-cyan-500/5'
          }`}
        >
          {selectedChoice === 'yes' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-3 right-3"
            >
              <CheckCircle className="w-6 h-6 text-cyan-400" />
            </motion.div>
          )}
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-cyan-500/20">
              <FileText className="w-6 h-6 text-cyan-400" />
            </div>
            <span className="text-lg font-semibold text-white">Yes, I have one</span>
          </div>
          <p className="text-gray-400 text-sm">
            Upload your estimate and get an instant AI analysis with savings potential.
          </p>
          <div className="mt-4 flex items-center gap-2 text-cyan-400 text-sm font-medium">
            <span>Scan My Quote</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </motion.button>

        {/* NO Card */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNo}
          disabled={selectedChoice !== null}
          className={`relative p-6 rounded-xl border-2 transition-all duration-300 text-left ${
            selectedChoice === 'no'
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'border-white/10 bg-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/5'
          }`}
        >
          {selectedChoice === 'no' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-3 right-3"
            >
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </motion.div>
          )}
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <Shield className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-lg font-semibold text-white">Not yet</span>
          </div>
          <p className="text-gray-400 text-sm">
            No problem! Get access to the Vault and be ready when you receive one.
          </p>
          <div className="mt-4 flex items-center gap-2 text-emerald-400 text-sm font-medium">
            <span>Access the Vault</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </motion.button>
      </div>

      {/* Phone Field */}
      <div className="max-w-md mx-auto">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <Phone className="w-4 h-4 text-cyan-400" />
            <Label htmlFor="phone" className="text-gray-300 text-sm">
              Where should we text your secure Vault access code?
            </Label>
          </div>
          <Input
            id="phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={phone}
            onChange={handlePhoneChange}
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
            disabled={selectedChoice !== null}
          />
          <p className="text-xs text-gray-500 mt-2">
            Optional • We'll only text you important updates about your protection
          </p>
        </div>
      </div>
    </motion.div>
  );
}

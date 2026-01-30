/**
 * Alpha Step 4: Reveal Gate (THE MONEY SCREEN)
 * 
 * DESIGN PHILOSOPHY: Phone is Earned, Not Demanded
 * - Shows blurred report - user can clearly tell something real was generated
 * - Displays their first name and city (OCR extracted)
 * - Phone appears ONLY after value is proven
 * - Phone is framed as security, not contact
 * - "This contains sensitive data" → Enter phone → Get PIN → Unblur
 * 
 * VISUAL REQUIREMENTS:
 * - Blurred report preview (glassmorphism)
 * - Personalized: "We analyzed your quote for [City]"
 * - Phone field with security framing
 * - PIN verification modal
 * - Blur-to-unblur animation on success
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, 
  Unlock, 
  Phone, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { pushDL } from '@/lib/tracking';
import { trpc } from '@/lib/trpc';

interface AlphaRevealGateStepProps {
  eventId: string;
  leadId: string;
  firstName: string;
  ocrCity?: string;
  scanResults: {
    overallScore: number;
    warnings: string[];
    estimatedSavings?: { low: number; high: number };
  };
  onUnlock: (leadValue: number, leadTier: string) => void;
}

type GateState = 'phone_entry' | 'pin_entry' | 'verifying' | 'unlocked' | 'error';

/**
 * Format phone number as (XXX) XXX-XXXX
 */
function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  const limited = digits.slice(0, 10);
  if (limited.length === 0) return '';
  if (limited.length <= 3) return `(${limited}`;
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
}

export function AlphaRevealGateStep({ 
  eventId, 
  leadId, 
  firstName, 
  ocrCity,
  scanResults,
  onUnlock 
}: AlphaRevealGateStepProps) {
  const [gateState, setGateState] = useState<GateState>('phone_entry');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBlurred, setIsBlurred] = useState(true);
  const [resendCooldown, setResendCooldown] = useState(0);

  // tRPC mutations
  const submitPhoneMutation = trpc.alpha.phone.useMutation();
  const verifyPinMutation = trpc.alpha.verify.useMutation();
  const resendCodeMutation = trpc.alpha.resendCode.useMutation();

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhoneNumber(e.target.value));
    setErrorMessage(null);
  };

  const handlePhoneSubmit = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit phone number');
      return;
    }

    setGateState('verifying');
    setErrorMessage(null);

    try {
      await submitPhoneMutation.mutateAsync({
        leadId,
        phone: digits,
      });

      pushDL({
        event: 'alpha_phone_submitted',
        event_id: eventId,
        lead_id: leadId,
      });

      setGateState('pin_entry');
      setResendCooldown(60);
    } catch (error) {
      console.error('[RevealGate] Phone submit error:', error);
      setGateState('error');
      setErrorMessage('Failed to send verification code. Please try again.');
    }
  };

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setErrorMessage(null);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }

    // Auto-submit when all digits entered
    if (newPin.every(d => d) && newPin.join('').length === 6) {
      handlePinVerify(newPin.join(''));
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePinVerify = async (code?: string) => {
    const pinCode = code || pin.join('');
    if (pinCode.length !== 6) {
      setErrorMessage('Please enter the 6-digit code');
      return;
    }

    setGateState('verifying');
    setErrorMessage(null);

    try {
      const result = await verifyPinMutation.mutateAsync({
        leadId,
        phone: phone.replace(/\D/g, ''),
        code: pinCode,
      });

      if (result.success) {
        pushDL({
          event: 'alpha_pin_verified',
          event_id: eventId,
          lead_id: leadId,
        });

        setGateState('unlocked');
        
        // Animate unblur
        setTimeout(() => {
          setIsBlurred(false);
        }, 300);

        // Proceed after animation
        setTimeout(() => {
          // Calculate lead value based on verification completion
          const leadValue = 300; // Base value for completing SMS verification in Alpha path
          const leadTier = 'warm';
          onUnlock(leadValue, leadTier);
        }, 1500);
      } else {
        setGateState('pin_entry');
        setPin(['', '', '', '', '', '']);
        setErrorMessage('Invalid code. Please try again.');
        document.getElementById('pin-0')?.focus();
      }
    } catch (error) {
      console.error('[RevealGate] PIN verify error:', error);
      setGateState('pin_entry');
      setPin(['', '', '', '', '', '']);
      setErrorMessage('Verification failed. Please try again.');
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    try {
      await resendCodeMutation.mutateAsync({ leadId, phone: phone.replace(/\D/g, '') });
      setResendCooldown(60);
      setPin(['', '', '', '', '', '']);
      setErrorMessage(null);
      
      pushDL({
        event: 'alpha_code_resent',
        event_id: eventId,
        lead_id: leadId,
      });
    } catch (error) {
      setErrorMessage('Failed to resend code. Please try again.');
    }
  };

  const cityDisplay = ocrCity || 'your area';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-8 lg:p-10"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
            <CheckCircle className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-300">Analysis Complete</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {firstName}, We Analyzed Your Quote for{' '}
            <span className="text-cyan-400">{cityDisplay}</span>
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto">
            Your detailed report is ready. Verify your phone to unlock your personalized analysis.
          </p>
        </motion.div>
      </div>

      {/* Blurred Report Preview */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="max-w-2xl mx-auto mb-8"
      >
        <div 
          className={`relative rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-900/80 overflow-hidden transition-all duration-1000 ${
            isBlurred ? 'backdrop-blur-sm' : ''
          }`}
        >
          {/* Blur Overlay */}
          <AnimatePresence>
            {isBlurred && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 backdrop-blur-md bg-slate-900/40 z-10 flex items-center justify-center"
              >
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                    {gateState === 'unlocked' ? (
                      <Unlock className="w-8 h-8 text-cyan-400" />
                    ) : (
                      <Lock className="w-8 h-8 text-cyan-400" />
                    )}
                  </div>
                  <p className="text-white font-medium">
                    {gateState === 'unlocked' ? 'Unlocking...' : 'Report Locked'}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Report Content (visible but blurred) */}
          <div className="p-6">
            {/* Score Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div>
                <p className="text-sm text-gray-400 mb-1">Overall Protection Score</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-bold ${
                    scanResults.overallScore >= 70 ? 'text-emerald-400' :
                    scanResults.overallScore >= 40 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {scanResults.overallScore}
                  </span>
                  <span className="text-gray-500">/100</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400 mb-1">Potential Savings</p>
                <p className="text-2xl font-bold text-emerald-400">
                  ${(scanResults.estimatedSavings?.low || 0).toLocaleString()} - ${(scanResults.estimatedSavings?.high || 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Warnings Preview */}
            {scanResults.warnings.length > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-red-400 font-medium">
                    {scanResults.warnings.length} Warning{scanResults.warnings.length > 1 ? 's' : ''} Found
                  </p>
                  <p className="text-sm text-gray-400">
                    Issues that could cost you money or protection
                  </p>
                </div>
              </div>
            )}

            {/* Placeholder Lines */}
            <div className="mt-6 space-y-3">
              <div className="h-4 bg-white/5 rounded w-3/4" />
              <div className="h-4 bg-white/5 rounded w-1/2" />
              <div className="h-4 bg-white/5 rounded w-2/3" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Phone/PIN Entry Section */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="max-w-md mx-auto"
      >
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <AnimatePresence mode="wait">
            {/* Phone Entry State */}
            {gateState === 'phone_entry' && (
              <motion.div
                key="phone"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <Shield className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Secure Verification Required</h3>
                    <p className="text-sm text-gray-400">This report contains sensitive pricing data</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                      <Phone className="w-4 h-4" />
                      Enter your phone to receive a verification code
                    </label>
                    <Input
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={phone}
                      onChange={handlePhoneChange}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500/50"
                    />
                  </div>

                  {errorMessage && (
                    <p className="text-sm text-red-400">{errorMessage}</p>
                  )}

                  <Button
                    onClick={handlePhoneSubmit}
                    disabled={phone.replace(/\D/g, '').length !== 10}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
                  >
                    Send Verification Code
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    We'll text you a 6-digit code. Standard rates may apply.
                  </p>
                </div>
              </motion.div>
            )}

            {/* PIN Entry State */}
            {gateState === 'pin_entry' && (
              <motion.div
                key="pin"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="text-center mb-6">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-white font-medium mb-1">Enter Verification Code</h3>
                  <p className="text-sm text-gray-400">
                    We sent a 6-digit code to {phone}
                  </p>
                </div>

                {/* PIN Input */}
                <div className="flex justify-center gap-2 mb-4">
                  {pin.map((digit, index) => (
                    <input
                      key={index}
                      id={`pin-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handlePinChange(index, e.target.value)}
                      onKeyDown={(e) => handlePinKeyDown(index, e)}
                      className="w-12 h-14 text-center text-2xl font-bold bg-white/5 border border-white/20 rounded-lg text-white focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                    />
                  ))}
                </div>

                {errorMessage && (
                  <p className="text-sm text-red-400 text-center mb-4">{errorMessage}</p>
                )}

                <div className="flex items-center justify-center gap-4 text-sm">
                  <button
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0}
                    className={`flex items-center gap-1 ${
                      resendCooldown > 0 ? 'text-gray-500' : 'text-cyan-400 hover:text-cyan-300'
                    }`}
                  >
                    <RefreshCw className="w-4 h-4" />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                  <button
                    onClick={() => {
                      setGateState('phone_entry');
                      setPin(['', '', '', '', '', '']);
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    Change Number
                  </button>
                </div>
              </motion.div>
            )}

            {/* Verifying State */}
            {gateState === 'verifying' && (
              <motion.div
                key="verifying"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8"
              >
                <Loader2 className="w-12 h-12 mx-auto text-cyan-400 animate-spin mb-4" />
                <p className="text-white font-medium">Verifying...</p>
              </motion.div>
            )}

            {/* Unlocked State */}
            {gateState === 'unlocked' && (
              <motion.div
                key="unlocked"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center"
                >
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </motion.div>
                <h3 className="text-emerald-400 font-bold text-xl mb-2">Verified!</h3>
                <p className="text-gray-400">Unlocking your full report...</p>
              </motion.div>
            )}

            {/* Error State */}
            {gateState === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-6"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <p className="text-red-400 font-medium mb-2">Something went wrong</p>
                <p className="text-sm text-gray-400 mb-4">{errorMessage}</p>
                <Button
                  onClick={() => setGateState('phone_entry')}
                  variant="outline"
                  className="border-white/20"
                >
                  Try Again
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

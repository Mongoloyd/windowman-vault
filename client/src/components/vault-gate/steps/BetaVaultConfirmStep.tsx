/**
 * Beta Step 5: Vault Confirmation (THE FINAL GATE)
 * 
 * DESIGN PHILOSOPHY: Earned Access, Not Demanded
 * - Phone collection feels like security, not sales
 * - SMS PIN confirms account creation
 * - Value proposition is clear: "Secure your vault access"
 * 
 * FLOW:
 * 1. Phone input with clear value prop
 * 2. SMS PIN verification (6 digits)
 * 3. Success → Vault confirmed
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  Shield, 
  Lock,
  CheckCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { pushDL } from '@/lib/tracking';
import { trpc } from '@/lib/trpc';

interface BetaVaultConfirmStepProps {
  eventId: string;
  leadId: string;
  firstName: string;
  leadValue: number;
  leadTier: string;
  onComplete: () => void;
}

type GateState = 'phone' | 'pin' | 'success';

export function BetaVaultConfirmStep({ 
  eventId, 
  leadId, 
  firstName,
  leadValue,
  leadTier,
  onComplete 
}: BetaVaultConfirmStepProps) {
  const [gateState, setGateState] = useState<GateState>('phone');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  const phoneMutation = trpc.beta.phone.useMutation();
  const verifyMutation = trpc.beta.verify.useMutation();
  const resendMutation = trpc.beta.resendCode.useMutation();

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Format phone number as user types
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
    setErrorMessage(null);
  };

  const handlePhoneSubmit = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setErrorMessage('Please enter a valid 10-digit phone number');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await phoneMutation.mutateAsync({
        leadId,
        phone: digits,
      });

      if (result.success) {
        pushDL({
          event: 'beta_phone_submitted',
          event_id: eventId,
          lead_id: leadId,
        });
        setGateState('pin');
        setResendCooldown(60);
        // Focus first PIN input
        setTimeout(() => pinRefs.current[0]?.focus(), 100);
      } else {
        setErrorMessage(result.message || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('[BetaVault] Phone error:', error);
      setErrorMessage('Failed to send verification code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setErrorMessage(null);

    // Auto-advance to next input
    if (value && index < 5) {
      pinRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (value && index === 5 && newPin.every(d => d)) {
      handlePinSubmit(newPin.join(''));
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  };

  const handlePinSubmit = async (pinCode?: string) => {
    const code = pinCode || pin.join('');
    if (code.length !== 6) {
      setErrorMessage('Please enter all 6 digits');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await verifyMutation.mutateAsync({
        leadId,
        phone: phone.replace(/\D/g, ''),
        code,
      });

      if (result.success) {
        pushDL({
          event: 'beta_pin_verified',
          event_id: eventId,
          lead_id: leadId,
          lead_value: leadValue,
          lead_tier: leadTier,
        });

        // Fire Meta conversion
        if (typeof window !== 'undefined' && (window as any).fbq) {
          (window as any).fbq('track', 'Lead', {
            value: leadValue,
            currency: 'USD',
            content_name: 'beta_vault_confirmed',
          });
        }

        setGateState('success');
        setTimeout(onComplete, 2000);
      } else {
        setErrorMessage(result.message || 'Invalid code. Please try again.');
        setPin(['', '', '', '', '', '']);
        pinRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('[BetaVault] Verify error:', error);
      setErrorMessage('Verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    try {
      await resendMutation.mutateAsync({
        leadId,
        phone: phone.replace(/\D/g, ''),
      });
      setResendCooldown(60);
      setPin(['', '', '', '', '', '']);
      setErrorMessage(null);
    } catch (error) {
      console.error('[BetaVault] Resend error:', error);
      setErrorMessage('Failed to resend code. Please try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-8 lg:p-10"
    >
      <AnimatePresence mode="wait">
        {/* Phone Collection */}
        {gateState === 'phone' && (
          <motion.div
            key="phone"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md mx-auto"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Secure Your Vault, {firstName}
              </h2>
              <p className="text-gray-400">
                Enter your phone to create your secure vault account
              </p>
            </div>

            {/* Phone Input */}
            <div className="space-y-4">
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="(555) 123-4567"
                  className="pl-12 h-14 text-lg bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>

              {errorMessage && (
                <p className="text-red-400 text-sm text-center">{errorMessage}</p>
              )}

              <Button
                onClick={handlePhoneSubmit}
                disabled={isSubmitting || phone.replace(/\D/g, '').length < 10}
                className="w-full h-14 text-lg bg-emerald-500 hover:bg-emerald-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 mr-2" />
                    Create Vault Account
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                We'll send a 6-digit code to verify your phone
              </p>
            </div>
          </motion.div>
        )}

        {/* PIN Verification */}
        {gateState === 'pin' && (
          <motion.div
            key="pin"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md mx-auto"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-cyan-400" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Enter Your Code
              </h2>
              <p className="text-gray-400">
                We sent a 6-digit code to {phone}
              </p>
            </div>

            {/* PIN Input */}
            <div className="flex justify-center gap-2 mb-6">
              {pin.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { pinRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(i, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(i, e)}
                  className="w-12 h-14 text-center text-2xl font-bold rounded-lg bg-white/5 border-2 border-white/10 text-white focus:border-cyan-400 focus:outline-none transition-colors"
                />
              ))}
            </div>

            {errorMessage && (
              <p className="text-red-400 text-sm text-center mb-4">{errorMessage}</p>
            )}

            {/* Resend */}
            <div className="text-center">
              <button
                onClick={handleResendCode}
                disabled={resendCooldown > 0}
                className={`text-sm flex items-center gap-2 mx-auto ${
                  resendCooldown > 0 ? 'text-gray-500' : 'text-cyan-400 hover:text-cyan-300'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>

            {/* Back Button */}
            <div className="text-center mt-6">
              <button
                onClick={() => {
                  setGateState('phone');
                  setPin(['', '', '', '', '', '']);
                  setErrorMessage(null);
                }}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                ← Change Phone Number
              </button>
            </div>
          </motion.div>
        )}

        {/* Success */}
        {gateState === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </motion.div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Vault Created!
            </h2>
            <p className="text-gray-400 mb-6">
              Welcome to your secure WindowMan Vault, {firstName}
            </p>
            <div className="flex items-center justify-center gap-2 text-emerald-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Opening your vault...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

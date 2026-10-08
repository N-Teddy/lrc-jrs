import {
  useForgotPasswordMutation,
  useVerifyResetCodeMutation,
} from '@jrs/client-core';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { extractAuthErrorMessage } from '../utils/auth-error.utils';
import { maskIdentifier } from '../utils/identifier.utils';
import { useCountdownTimer } from './use-countdown-timer';

interface UseVerifyOtpOptions {
  identifier: string;
  channel?: 'auto' | 'whatsapp' | 'email';
  onCodeVerified: (resetToken: string) => void;
}

export function useVerifyOtp({
  identifier,
  channel = 'auto',
  onCodeVerified,
}: UseVerifyOtpOptions) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const {
    secondsRemaining,
    formattedTime,
    isExpired: isTimerExpired,
    resetTimer,
  } = useCountdownTimer({ initialSeconds: 10 * 60 });

  const verifyMutation = useVerifyResetCodeMutation();
  const resendMutation = useForgotPasswordMutation();

  // Focus the first input upon mounting
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleCellChange = (index: number, value: string) => {
    const cleanDigit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleanDigit;
    setDigits(newDigits);
    setErrorMessage(null);

    // Auto advance focus
    if (cleanDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    const numDigits = pasteData.replace(/\D/g, '').slice(0, 6);
    if (!numDigits) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = numDigits[i] || '';
    }
    setDigits(newDigits);
    setErrorMessage(null);

    const nextIndex = Math.min(numDigits.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullCode = digits.join('');

    if (fullCode.length < 6) {
      setErrorMessage('Please enter all 6 digits of your verification code.');
      return;
    }
    if (isTimerExpired) {
      setErrorMessage(
        'This verification code has expired. Please request a new code below.',
      );
      return;
    }
    if (isLockedOut) {
      return;
    }

    setErrorMessage(null);

    try {
      const response = await verifyMutation.mutateAsync({
        identifier: identifier.trim(),
        code: fullCode,
      });

      if (response.resetToken) {
        onCodeVerified(response.resetToken);
      }
    } catch (err: unknown) {
      const remaining = Math.max(0, attemptsRemaining - 1);
      setAttemptsRemaining(remaining);

      if (remaining <= 0) {
        setIsLockedOut(true);
        setErrorMessage(
          'Maximum verification attempts reached. For security, please request a fresh code.',
        );
      } else {
        const serverMsg = extractAuthErrorMessage(
          err,
          'Incorrect verification code. Please check and try again.',
        );
        setErrorMessage(
          `${serverMsg} (${remaining} attempt${remaining === 1 ? '' : 's'} remaining)`,
        );
      }
    }
  };

  const handleResendCode = async () => {
    setErrorMessage(null);
    setResendNotice(null);
    try {
      await resendMutation.mutateAsync({
        identifier: identifier.trim(),
        channel,
      });
      setDigits(['', '', '', '', '', '']);
      resetTimer(10 * 60);
      setAttemptsRemaining(5);
      setIsLockedOut(false);
      setResendNotice('A new 6-digit verification code has been dispatched.');
      inputRefs.current[0]?.focus();
    } catch (_err) {
      setErrorMessage('Failed to resend code. Please try again shortly.');
    }
  };

  const isFormComplete = digits.every((d) => d.length === 1);
  const maskedId = maskIdentifier(identifier);

  return {
    digits,
    inputRefs,
    attemptsRemaining,
    errorMessage,
    isLockedOut,
    resendNotice,
    secondsRemaining,
    formattedTime,
    isTimerExpired,
    isFormComplete,
    maskedId,
    isVerifyPending: verifyMutation.isPending,
    isResendPending: resendMutation.isPending,
    handleCellChange,
    handleKeyDown,
    handlePaste,
    handleSubmit,
    handleResendCode,
  };
}

import { useCompleteSetupMutation } from '@jrs/client-core';
import type React from 'react';
import { useState } from 'react';
import { extractAuthErrorMessage } from '../utils/auth-error.utils';
import { validatePasswordRules } from '../utils/password.utils';
import { useCountdownTimer } from './use-countdown-timer';

interface UseFirstTimeSetupOptions {
  setupToken: string;
  onSetupComplete: () => void;
}

export function useFirstTimeSetup({
  setupToken,
  onSetupComplete,
}: UseFirstTimeSetupOptions) {
  const completeSetupMutation = useCompleteSetupMutation();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    secondsRemaining,
    formattedTime,
    isExpired: isTimerExpired,
  } = useCountdownTimer({ initialSeconds: 15 * 60 });

  const rules = validatePasswordRules(newPassword);
  const allRulesPassed = rules.every((r) => r.met);
  const passwordsMatch =
    newPassword.length > 0 && newPassword === confirmPassword;

  const isSubmitDisabled =
    !allRulesPassed ||
    !passwordsMatch ||
    completeSetupMutation.isPending ||
    isTimerExpired;

  const toggleShowPassword = () => setShowPassword((prev) => !prev);
  const toggleShowConfirmPassword = () =>
    setShowConfirmPassword((prev) => !prev);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitDisabled) return;

    setErrorMessage(null);

    try {
      await completeSetupMutation.mutateAsync({
        newPassword,
        setupToken,
      });

      setIsSuccess(true);
      setTimeout(() => {
        onSetupComplete();
      }, 1500);
    } catch (err: unknown) {
      setErrorMessage(
        extractAuthErrorMessage(
          err,
          'Could not complete setup. Please check password criteria.',
        ),
      );
    }
  };

  return {
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    toggleShowPassword,
    showConfirmPassword,
    toggleShowConfirmPassword,
    isLoading: completeSetupMutation.isPending,
    errorMessage,
    isSuccess,
    secondsRemaining,
    formattedTime,
    isTimerExpired,
    rules,
    passwordsMatch,
    isSubmitDisabled,
    handleSubmit,
  };
}

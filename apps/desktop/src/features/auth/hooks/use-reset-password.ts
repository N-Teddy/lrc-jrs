import { useResetPasswordMutation } from '@jrs/client-core';
import type React from 'react';
import { useState } from 'react';
import { extractAuthErrorMessage } from '../utils/auth-error.utils';
import { validatePasswordRules } from '../utils/password.utils';
import { useCountdownTimer } from './use-countdown-timer';

interface UseResetPasswordOptions {
  resetToken: string;
}

export function useResetPassword({ resetToken }: UseResetPasswordOptions) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const resetMutation = useResetPasswordMutation();

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
    resetMutation.isPending ||
    isTimerExpired;

  const toggleShowPassword = () => setShowPassword((prev) => !prev);
  const toggleShowConfirmPassword = () =>
    setShowConfirmPassword((prev) => !prev);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitDisabled) return;

    setErrorMessage(null);

    try {
      await resetMutation.mutateAsync({
        resetToken,
        newPassword,
      });

      setIsSuccess(true);
    } catch (err: unknown) {
      setErrorMessage(
        extractAuthErrorMessage(
          err,
          'Failed to reset password. The reset session may have expired.',
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
    errorMessage,
    isSuccess,
    secondsRemaining,
    formattedTime,
    isTimerExpired,
    rules,
    passwordsMatch,
    isSubmitDisabled,
    isPending: resetMutation.isPending,
    handleSubmit,
  };
}

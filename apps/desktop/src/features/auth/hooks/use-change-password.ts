import { useChangePasswordMutation } from '@jrs/client-core';
import type React from 'react';
import { useState } from 'react';
import { extractAuthErrorMessage } from '../utils/auth-error.utils';
import {
  calculatePasswordStrength,
  validatePasswordRules,
} from '../utils/password.utils';

interface UseChangePasswordOptions {
  onClose: () => void;
  onSuccess?: () => void;
}

export function useChangePassword({
  onClose,
  onSuccess,
}: UseChangePasswordOptions) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const changePasswordMutation = useChangePasswordMutation();

  const rules = validatePasswordRules(newPassword);
  const allRulesPassed = rules.every((r) => r.met);
  const passwordsMatch =
    newPassword.length > 0 && newPassword === confirmPassword;
  const isReused =
    newPassword.length > 0 &&
    currentPassword.length > 0 &&
    newPassword === currentPassword;

  const strength = calculatePasswordStrength(rules, newPassword.length);

  const isSubmitDisabled =
    !currentPassword ||
    !allRulesPassed ||
    !passwordsMatch ||
    isReused ||
    changePasswordMutation.isPending;

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const toggleShowCurrentPassword = () =>
    setShowCurrentPassword((prev) => !prev);
  const toggleShowNewPassword = () => setShowNewPassword((prev) => !prev);
  const toggleShowConfirmPassword = () =>
    setShowConfirmPassword((prev) => !prev);

  const handleCurrentPasswordChange = (value: string) => {
    setCurrentPassword(value);
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitDisabled) return;

    setErrorMessage(null);

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });

      setShowSuccessToast(true);
      resetForm();
      setTimeout(() => {
        setShowSuccessToast(false);
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err: unknown) {
      setErrorMessage(
        extractAuthErrorMessage(
          err,
          'Could not change password. Please check your current password.',
        ),
      );
    }
  };

  return {
    currentPassword,
    handleCurrentPasswordChange,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showCurrentPassword,
    toggleShowCurrentPassword,
    showNewPassword,
    toggleShowNewPassword,
    showConfirmPassword,
    toggleShowConfirmPassword,
    errorMessage,
    showSuccessToast,
    rules,
    strength,
    passwordsMatch,
    isReused,
    isSubmitDisabled,
    isPending: changePasswordMutation.isPending,
    handleClose,
    handleSubmit,
  };
}

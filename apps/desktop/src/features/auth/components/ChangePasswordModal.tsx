import { useChangePasswordMutation } from '@jrs/client-core';
import {
  Check,
  CheckCircle,
  CircleNotch,
  Eye,
  EyeSlash,
  Key,
  Lock,
  LockKey,
  WarningCircle,
  X,
  XCircle,
} from '@phosphor-icons/react';
import type React from 'react';
import { useState } from 'react';
import {
  PasswordRequirements,
  validatePasswordRules,
} from './PasswordRequirements';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const changePasswordMutation = useChangePasswordMutation();

  if (!isOpen) return null;

  const rules = validatePasswordRules(newPassword);
  const allRulesPassed = rules.every((r) => r.met);
  const passwordsMatch =
    newPassword.length > 0 && newPassword === confirmPassword;
  const isReused =
    newPassword.length > 0 &&
    currentPassword.length > 0 &&
    newPassword === currentPassword;

  // Strength score
  const metCount = rules.filter((r) => r.met).length;
  let strengthPercent = 0;
  let strengthLabel = 'Unchecked';
  let strengthColor = 'bg-[#8a726a]';

  if (newPassword.length > 0) {
    if (metCount === 1) {
      strengthPercent = 33;
      strengthLabel = 'Weak';
      strengthColor = 'bg-[#ba1a1a]';
    } else if (metCount === 2) {
      strengthPercent = 66;
      strengthLabel = 'Fair';
      strengthColor = 'bg-[#b85028]';
    } else if (metCount === 3) {
      strengthPercent = 100;
      strengthLabel = 'Strong';
      strengthColor = 'bg-[#43664d]';
    }
  }

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
    } catch (err: any) {
      const serverMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to change password. Please verify your current password.';
      setErrorMessage(
        typeof serverMsg === 'string'
          ? serverMsg
          : 'Could not change password. Please check your current password.',
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-pw-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e1b19]/60 p-4 backdrop-blur-[2px] animate-fadeIn"
    >
      <div className="relative w-full max-w-xl rounded-2xl border border-[#e8e1dd] bg-white p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#faf2ee]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#faf2ee] text-[#b85028] flex items-center justify-center">
              <Key size={22} weight="fill" />
            </div>
            <div>
              <h2
                id="change-pw-title"
                className="text-xl font-bold text-[#1e1b19]"
              >
                Change Password
              </h2>
              <p className="text-xs text-[#57423b]">
                Update your password to preserve the safety of your account.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg text-[#8a726a] hover:text-[#1e1b19] hover:bg-[#faf2ee] transition"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Success Toast */}
        {showSuccessToast && (
          <div className="my-4 rounded-xl border border-[#43664d]/20 bg-[#c2e9ca] p-4 text-[#00210e] flex items-start gap-3">
            <CheckCircle
              size={22}
              weight="fill"
              className="text-[#43664d] shrink-0 mt-0.5"
            />
            <div>
              <p className="text-xs font-bold">
                Password Successfully Updated!
              </p>
              <p className="text-[11px] text-[#2c4e37] mt-0.5">
                Your new password is now active. Closing window...
              </p>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="my-4 rounded-xl border border-[#ba1a1a]/20 bg-[#ffdad6] p-3.5 text-xs text-[#93000a] flex items-start gap-2.5">
            <WarningCircle
              size={18}
              weight="fill"
              className="shrink-0 mt-0.5 text-[#ba1a1a]"
            />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Current Password */}
          <div>
            <label
              htmlFor="modal-current-password"
              className="block text-xs font-semibold uppercase tracking-wider text-[#1e1b19]"
            >
              Current Password
            </label>
            <div className="relative mt-1.5">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#8a726a]">
                <Lock size={18} weight="bold" />
              </div>
              <input
                id="modal-current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Enter current password"
                className="w-full rounded-xl border border-[#e8e1dd] bg-[#faf2ee] py-3 pl-11 pr-11 text-sm text-[#1e1b19] placeholder-[#8a726a] outline-none focus:bg-white focus:border-[#b85028] focus:ring-2 focus:ring-[#b85028]/20 transition"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#8a726a] hover:text-[#1e1b19]"
                tabIndex={-1}
              >
                {showCurrentPassword ? (
                  <EyeSlash size={18} weight="bold" />
                ) : (
                  <Eye size={18} weight="bold" />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label
              htmlFor="modal-new-password"
              className="block text-xs font-semibold uppercase tracking-wider text-[#1e1b19]"
            >
              New Password
            </label>
            <div className="relative mt-1.5">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#8a726a]">
                <LockKey size={18} weight="bold" />
              </div>
              <input
                id="modal-new-password"
                type={showNewPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full rounded-xl border border-[#e8e1dd] bg-[#faf2ee] py-3 pl-11 pr-11 text-sm text-[#1e1b19] placeholder-[#8a726a] outline-none focus:bg-white focus:border-[#b85028] focus:ring-2 focus:ring-[#b85028]/20 transition"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#8a726a] hover:text-[#1e1b19]"
                tabIndex={-1}
              >
                {showNewPassword ? (
                  <EyeSlash size={18} weight="bold" />
                ) : (
                  <Eye size={18} weight="bold" />
                )}
              </button>
            </div>

            {/* Reused Warning */}
            {isReused && (
              <p className="mt-1 text-xs text-[#9f2f23] font-medium">
                New password must be different from your current password.
              </p>
            )}

            {/* Strength Meter & Requirements */}
            <div className="mt-3 rounded-xl border border-[#e8e1dd] bg-[#faf2ee] p-3.5">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#57423b] mb-1.5">
                <span>Password Requirements</span>
                <span className="font-bold text-[#1e1b19]">
                  {strengthLabel}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[#e8e1dd] overflow-hidden mb-2.5">
                <div
                  className={`h-full ${strengthColor} transition-all duration-300`}
                  style={{ width: `${strengthPercent}%` }}
                />
              </div>
              <PasswordRequirements rules={rules} />
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label
              htmlFor="modal-confirm-password"
              className="block text-xs font-semibold uppercase tracking-wider text-[#1e1b19]"
            >
              Confirm New Password
            </label>
            <div className="relative mt-1.5">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#8a726a]">
                <LockKey size={18} weight="bold" />
              </div>
              <input
                id="modal-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full rounded-xl border border-[#e8e1dd] bg-[#faf2ee] py-3 pl-11 pr-11 text-sm text-[#1e1b19] placeholder-[#8a726a] outline-none focus:bg-white focus:border-[#b85028] focus:ring-2 focus:ring-[#b85028]/20 transition"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3.5">
                {confirmPassword.length > 0 &&
                  (passwordsMatch ? (
                    <CheckCircle
                      size={18}
                      weight="fill"
                      className="text-[#43664d]"
                    />
                  ) : (
                    <XCircle
                      size={18}
                      weight="fill"
                      className="text-[#ba1a1a]"
                    />
                  ))}
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="ml-1 text-[#8a726a] hover:text-[#1e1b19]"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeSlash size={18} weight="bold" />
                  ) : (
                    <Eye size={18} weight="bold" />
                  )}
                </button>
              </div>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="mt-1 text-xs text-[#ba1a1a]">
                Passwords do not match yet.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-3 border-t border-[#faf2ee]">
            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#e8e1dd] bg-[#faf2ee] text-xs font-semibold text-[#57423b] hover:bg-[#f4ece9] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#b85028] text-white text-xs font-bold shadow-sm hover:bg-[#983912] active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {changePasswordMutation.isPending ? (
                <>
                  <CircleNotch size={16} className="animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <Check size={16} weight="bold" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

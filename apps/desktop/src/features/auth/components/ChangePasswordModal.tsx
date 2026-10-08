import { useTranslation } from '@jrs/client-core';
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
import { useChangePassword } from '../hooks/use-change-password';
import { PasswordRequirements } from './PasswordRequirements';

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
  const { t } = useTranslation();
  const {
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
    isPending,
    handleClose,
    handleSubmit,
  } = useChangePassword({
    onClose,
    onSuccess,
  });

  if (!isOpen) return null;

  const strengthLabel = t(
    `auth:rules.strength.${strength.label.toLowerCase()}`,
    {
      defaultValue: strength.label,
    },
  );

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
                {t('auth:changePassword.title')}
              </h2>
              <p className="text-xs text-[#57423b]">
                {t('auth:changePassword.subtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg text-[#8a726a] hover:text-[#1e1b19] hover:bg-[#faf2ee] transition cursor-pointer"
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
                {t('auth:changePassword.successTitle')}
              </p>
              <p className="text-[11px] text-[#2c4e37] mt-0.5">
                {t('auth:changePassword.successDesc')}
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
              {t('auth:changePassword.currentPasswordLabel')}
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
                onChange={(e) => handleCurrentPasswordChange(e.target.value)}
                placeholder={t(
                  'auth:changePassword.currentPasswordPlaceholder',
                )}
                className="w-full rounded-xl border border-[#e8e1dd] bg-[#faf2ee] py-3 pl-11 pr-11 text-sm text-[#1e1b19] placeholder-[#8a726a] outline-none focus:bg-white focus:border-[#b85028] focus:ring-2 focus:ring-[#b85028]/20 transition"
              />
              <button
                type="button"
                onClick={toggleShowCurrentPassword}
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
              {t('auth:changePassword.newPasswordLabel')}
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
                placeholder={t('auth:changePassword.newPasswordPlaceholder')}
                className="w-full rounded-xl border border-[#e8e1dd] bg-[#faf2ee] py-3 pl-11 pr-11 text-sm text-[#1e1b19] placeholder-[#8a726a] outline-none focus:bg-white focus:border-[#b85028] focus:ring-2 focus:ring-[#b85028]/20 transition"
              />
              <button
                type="button"
                onClick={toggleShowNewPassword}
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
                {t('auth:changePassword.reusedWarning')}
              </p>
            )}

            {/* Strength Meter & Requirements */}
            <div className="mt-3 rounded-xl border border-[#e8e1dd] bg-[#faf2ee] p-3.5">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#57423b] mb-1.5">
                <span>{t('auth:rules.passwordRequirements')}</span>
                <span className="font-bold text-[#1e1b19]">
                  {strengthLabel}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[#e8e1dd] overflow-hidden mb-2.5">
                <div
                  className={`h-full ${strength.colorClass} transition-all duration-300`}
                  style={{ width: `${strength.percent}%` }}
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
              {t('auth:changePassword.confirmPasswordLabel')}
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
                placeholder={t(
                  'auth:changePassword.confirmPasswordPlaceholder',
                )}
                className="w-full rounded-xl border border-[#e8e1dd] bg-[#faf2ee] py-3 pl-11 pr-11 text-sm text-[#1e1b19] placeholder-[#8a726a] outline-none focus:bg-white focus:border-[#b85028] focus:ring-2 focus:ring-[#b85028]/20 transition"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3.5">
                {confirmPassword.length > 0 &&
                  (passwordsMatch ? (
                    <CheckCircle
                      size={18}
                      weight="fill"
                      className="text-[#486b52]"
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
                  onClick={toggleShowConfirmPassword}
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
                {t('auth:changePassword.passwordsDoNotMatch')}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-3 border-t border-[#faf2ee]">
            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#e8e1dd] bg-[#faf2ee] text-xs font-semibold text-[#57423b] hover:bg-[#f4ece9] transition cursor-pointer"
            >
              {t('common:cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#b85028] text-white text-xs font-bold shadow-sm hover:bg-[#983912] active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <>
                  <CircleNotch size={16} className="animate-spin" />
                  <span>{t('auth:changePassword.updating')}</span>
                </>
              ) : (
                <>
                  <Check size={16} weight="bold" />
                  <span>{t('auth:changePassword.updatePassword')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

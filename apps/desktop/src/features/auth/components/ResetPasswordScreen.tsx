import { Trans, useTranslation } from '@jrs/client-core';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  CircleNotch,
  Clock,
  Eye,
  EyeSlash,
  Key,
  LockKey,
  WarningCircle,
  XCircle,
} from '@phosphor-icons/react';
import type React from 'react';
import { LanguageToggle } from '../../../components/LanguageToggle';
import { useResetPassword } from '../hooks/use-reset-password';
import { PasswordRequirements } from './PasswordRequirements';

interface ResetPasswordScreenProps {
  resetToken: string;
  identifier: string;
  onBackToSignIn: () => void;
  onPasswordResetComplete: () => void;
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({
  resetToken,
  identifier,
  onBackToSignIn,
  onPasswordResetComplete,
}) => {
  const { t } = useTranslation();
  const {
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
    formattedTime,
    isTimerExpired,
    rules,
    passwordsMatch,
    isSubmitDisabled,
    isPending,
    handleSubmit,
  } = useResetPassword({ resetToken });

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#fff8f5] p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-xl mx-auto flex flex-col gap-6">
        <div className="rounded-2xl border border-[#e8e1dd] bg-white p-6 sm:p-10 shadow-sm flex flex-col gap-6">
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onBackToSignIn}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#57423b] transition hover:text-[#983912]"
            >
              <ArrowLeft size={16} weight="bold" />
              <span>{t('auth:resetPassword.backToSignIn')}</span>
            </button>
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <div
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  isTimerExpired
                    ? 'bg-[#ffdad6] text-[#93000a]'
                    : 'bg-[#faf2ee] text-[#57423b]'
                }`}
              >
                <Clock size={14} weight="bold" />
                <span>
                  {isTimerExpired
                    ? t('auth:resetPassword.tokenExpired')
                    : t('auth:resetPassword.timeRemaining', {
                        time: formattedTime,
                      })}
                </span>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-16 h-16 rounded-xl bg-[#faf2ee] text-[#b85028] flex items-center justify-center shadow-xs">
              <Key size={32} weight="fill" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1e1b19]">
              {t('auth:resetPassword.title')}
            </h1>
            <p className="text-sm text-[#57423b] max-w-md">
              <Trans
                i18nKey="auth:resetPassword.subtitle"
                values={{ identifier }}
                components={{ 1: <strong className="text-[#1e1b19]" /> }}
              />
            </p>
          </div>

          {/* Expired Token Notice */}
          {isTimerExpired && (
            <div className="rounded-xl border border-[#ba1a1a]/20 bg-[#ffdad6] p-4 text-center text-xs text-[#93000a]">
              <p className="font-bold">
                {t('auth:resetPassword.tokenExpiredTitle')}
              </p>
              <p className="mt-1 text-[#57423b]">
                {t('auth:resetPassword.tokenExpiredDesc')}
              </p>
              <button
                type="button"
                onClick={onBackToSignIn}
                className="mt-3 rounded-lg bg-[#b85028] px-4 py-2 font-bold text-white transition hover:bg-[#983912]"
              >
                {t('auth:resetPassword.restartFlow')}
              </button>
            </div>
          )}

          {/* Error Notice */}
          {errorMessage && (
            <div className="rounded-xl border border-[#ba1a1a]/20 bg-[#ffdad6] p-4 text-xs sm:text-sm text-[#93000a] flex items-start gap-2.5">
              <WarningCircle
                size={18}
                weight="fill"
                className="shrink-0 mt-0.5 text-[#ba1a1a]"
              />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Success State */}
          {isSuccess ? (
            <div className="rounded-xl border border-[#486b52]/20 bg-[#edf3ee] p-8 text-center flex flex-col items-center gap-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-xl bg-[#c2e9ca] text-[#43664d] flex items-center justify-center shadow-xs">
                <CheckCircle size={36} weight="fill" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold text-[#1e1b19]">
                  {t('auth:resetPassword.successTitle')}
                </h3>
                <p className="text-sm text-[#57423b] max-w-sm">
                  {t('auth:resetPassword.successDesc')}
                </p>
              </div>
              <button
                type="button"
                onClick={onPasswordResetComplete}
                className="w-full max-w-xs h-12 rounded-xl bg-[#b85028] text-white font-semibold text-sm shadow-sm hover:bg-[#983912] transition-all flex items-center justify-center gap-2 mt-2"
              >
                <span>{t('auth:resetPassword.signInHub')}</span>
                <ArrowRight size={18} weight="bold" />
              </button>
            </div>
          ) : (
            /* Reset Password Form */
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* New Password */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="reset-new-password"
                  className="text-xs font-semibold uppercase tracking-wider text-[#1e1b19]"
                >
                  {t('auth:resetPassword.newPasswordLabel')}{' '}
                  <span className="text-[#b85028]">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="pointer-events-none absolute left-3.5 text-[#8a726a]">
                    <LockKey size={18} weight="bold" />
                  </div>
                  <input
                    id="reset-new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={isTimerExpired || isPending}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('auth:resetPassword.newPasswordPlaceholder')}
                    className="w-full h-12 pl-11 pr-11 rounded-xl bg-[#faf2ee] text-sm text-[#1e1b19] placeholder-[#8a726a] border border-[#e8e1dd] outline-none focus:bg-white focus:ring-2 focus:ring-[#b85028]/20 focus:border-[#b85028] transition"
                  />
                  <button
                    type="button"
                    onClick={toggleShowPassword}
                    className="absolute right-3.5 text-[#8a726a] hover:text-[#1e1b19] transition"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeSlash size={18} weight="bold" />
                    ) : (
                      <Eye size={18} weight="bold" />
                    )}
                  </button>
                </div>
              </div>

              {/* Requirements Checklist */}
              <div className="rounded-xl border border-[#e8e1dd] bg-[#faf2ee] p-4">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#57423b] mb-2.5">
                  {t('auth:rules.securityRequirements')}
                </span>
                <PasswordRequirements rules={rules} />
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="reset-confirm-password"
                  className="text-xs font-semibold uppercase tracking-wider text-[#1e1b19]"
                >
                  {t('auth:resetPassword.confirmPasswordLabel')}{' '}
                  <span className="text-[#b85028]">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="pointer-events-none absolute left-3.5 text-[#8a726a]">
                    <LockKey size={18} weight="bold" />
                  </div>
                  <input
                    id="reset-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    disabled={isTimerExpired || isPending}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t(
                      'auth:resetPassword.confirmPasswordPlaceholder',
                    )}
                    className="w-full h-12 pl-11 pr-11 rounded-xl bg-[#faf2ee] text-sm text-[#1e1b19] placeholder-[#8a726a] border border-[#e8e1dd] outline-none focus:bg-white focus:ring-2 focus:ring-[#b85028]/20 focus:border-[#b85028] transition"
                  />
                  <div className="absolute right-3.5 flex items-center gap-1">
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
                      className="ml-1 text-[#8a726a] hover:text-[#1e1b19] transition"
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
                  <p className="text-xs text-[#ba1a1a]">
                    {t('auth:resetPassword.passwordsDoNotMatch')}
                  </p>
                )}
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="w-full h-12 rounded-xl bg-[#b85028] text-white text-sm font-semibold shadow-sm hover:bg-[#983912] active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
              >
                {isPending ? (
                  <>
                    <CircleNotch size={18} className="animate-spin" />
                    <span>{t('auth:resetPassword.updating')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('auth:resetPassword.saveAndReturn')}</span>
                    <ArrowRight size={18} weight="bold" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

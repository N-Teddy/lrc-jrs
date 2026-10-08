import { useResetPasswordMutation } from '@jrs/client-core';
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
import { useEffect, useState } from 'react';
import {
  PasswordRequirements,
  validatePasswordRules,
} from './PasswordRequirements';

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
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // 15-minute countdown timer
  const [secondsRemaining, setSecondsRemaining] = useState(15 * 60);
  const isTimerExpired = secondsRemaining <= 0;

  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsRemaining]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const resetMutation = useResetPasswordMutation();

  const rules = validatePasswordRules(newPassword);
  const allRulesPassed = rules.every((r) => r.met);
  const passwordsMatch =
    newPassword.length > 0 && newPassword === confirmPassword;
  const isSubmitDisabled =
    !allRulesPassed ||
    !passwordsMatch ||
    resetMutation.isPending ||
    isTimerExpired;

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
    } catch (err: any) {
      const serverMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to reset password. The reset session may have expired.';
      setErrorMessage(
        typeof serverMsg === 'string'
          ? serverMsg
          : 'Could not reset password. Please request a new verification code.',
      );
    }
  };

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
              <span>Back to Sign In</span>
            </button>
            <div
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                secondsRemaining < 120
                  ? 'bg-[#ffdad4] text-[#881f14]'
                  : 'bg-[#faf2ee] text-[#57423b]'
              }`}
            >
              <Clock size={14} weight="bold" />
              <span>
                {isTimerExpired
                  ? 'Token Expired'
                  : `${formatTimer(secondsRemaining)} remaining`}
              </span>
            </div>
          </div>

          {/* Header */}
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-16 h-16 rounded-2xl bg-[#faf2ee] text-[#b85028] flex items-center justify-center shadow-xs">
              <Key size={32} weight="fill" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1e1b19]">
              Set New Password
            </h1>
            <p className="text-sm text-[#57423b] max-w-md">
              Create a fresh, secure password for{' '}
              <strong className="text-[#1e1b19]">{identifier}</strong>. All
              previous active sessions will be safely terminated.
            </p>
          </div>

          {/* Expired Token Notice */}
          {isTimerExpired && (
            <div className="rounded-xl border border-[#ba1a1a]/20 bg-[#ffdad6] p-4 text-center text-xs text-[#93000a]">
              <p className="font-bold">Reset Session Timed Out</p>
              <p className="mt-1 text-[#57423b]">
                For your safety, password reset tokens expire after 15 minutes.
              </p>
              <button
                type="button"
                onClick={onBackToSignIn}
                className="mt-3 rounded-lg bg-[#b85028] px-4 py-2 font-bold text-white transition hover:bg-[#983912]"
              >
                Restart Verification Flow
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
            <div className="rounded-2xl border border-[#486b52]/20 bg-[#edf3ee] p-8 text-center flex flex-col items-center gap-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-2xl bg-[#c2e9ca] text-[#43664d] flex items-center justify-center shadow-xs">
                <CheckCircle size={36} weight="fill" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold text-[#1e1b19]">
                  Password Successfully Reset!
                </h3>
                <p className="text-sm text-[#57423b] max-w-sm">
                  Your credentials have been safely updated. You can now sign in
                  using your new password.
                </p>
              </div>
              <button
                type="button"
                onClick={onPasswordResetComplete}
                className="w-full max-w-xs h-12 rounded-xl bg-[#b85028] text-white font-semibold text-sm shadow-sm hover:bg-[#983912] transition-all flex items-center justify-center gap-2 mt-2"
              >
                <span>Sign In to Fellowship Hub</span>
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
                  New Password
                </label>
                <div className="relative flex items-center">
                  <div className="pointer-events-none absolute left-3.5 text-[#8a726a]">
                    <LockKey size={18} weight="bold" />
                  </div>
                  <input
                    id="reset-new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={isTimerExpired || resetMutation.isPending}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full h-12 pl-11 pr-11 rounded-xl bg-[#faf2ee] text-sm text-[#1e1b19] placeholder-[#8a726a] border border-[#e8e1dd] outline-none focus:bg-white focus:ring-2 focus:ring-[#b85028]/20 focus:border-[#b85028] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
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
                  Security Requirements
                </span>
                <PasswordRequirements rules={rules} />
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="reset-confirm-password"
                  className="text-xs font-semibold uppercase tracking-wider text-[#1e1b19]"
                >
                  Confirm New Password
                </label>
                <div className="relative flex items-center">
                  <div className="pointer-events-none absolute left-3.5 text-[#8a726a]">
                    <LockKey size={18} weight="bold" />
                  </div>
                  <input
                    id="reset-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    disabled={isTimerExpired || resetMutation.isPending}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="w-full h-12 pl-11 pr-11 rounded-xl bg-[#faf2ee] text-sm text-[#1e1b19] placeholder-[#8a726a] border border-[#e8e1dd] outline-none focus:bg-white focus:ring-2 focus:ring-[#b85028]/20 focus:border-[#b85028] transition"
                  />
                  <div className="absolute right-3.5 flex items-center gap-1">
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
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
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
                    Passwords do not match yet.
                  </p>
                )}
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="w-full h-12 rounded-xl bg-[#b85028] text-white text-sm font-semibold shadow-sm hover:bg-[#983912] active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
              >
                {resetMutation.isPending ? (
                  <>
                    <CircleNotch size={18} className="animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <span>Save Password & Return to Login</span>
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

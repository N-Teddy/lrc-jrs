import type { IAuthUser } from '@jrs/shared';
import {
  ArrowLeft,
  CheckCircle,
  CircleNotch,
  Clock,
  Eye,
  EyeSlash,
  LockKey,
  ShieldCheck,
  Warning,
  XCircle,
} from '@phosphor-icons/react';
import type React from 'react';
import { useFirstTimeSetup } from '../hooks/use-first-time-setup';
import { PasswordRequirements } from './PasswordRequirements';

interface FirstTimeSetupScreenProps {
  setupToken: string;
  user: IAuthUser;
  onCancel: () => void;
  onSetupComplete: () => void;
}

export const FirstTimeSetupScreen: React.FC<FirstTimeSetupScreenProps> = ({
  setupToken,
  user,
  onCancel,
  onSetupComplete,
}) => {
  const {
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    toggleShowPassword,
    showConfirmPassword,
    toggleShowConfirmPassword,
    isLoading,
    errorMessage,
    isSuccess,
    formattedTime,
    isTimerExpired,
    rules,
    passwordsMatch,
    isSubmitDisabled,
    handleSubmit,
  } = useFirstTimeSetup({
    setupToken,
    onSetupComplete,
  });

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#fdfbf9] p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-[580px] rounded-[28px] border border-[#ece5dd] bg-white p-8 sm:12 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        {/* Top Bar: Back Action & Session Timer Widget */}
        <div className="mb-7 flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5c554f] transition hover:text-[#23201e]"
          >
            <ArrowLeft size={16} />
            <span>Back to Sign In</span>
          </button>

          {/* Visual Countdown Badge */}
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
              isTimerExpired
                ? 'bg-[#fbf1ef] text-[#ba4334]'
                : 'bg-[#f3efea] text-[#5c554f]'
            }`}
          >
            <Clock size={15} weight="bold" />
            <span>
              {isTimerExpired
                ? 'Session Expired'
                : `${formattedTime} remaining`}
            </span>
          </div>
        </div>

        {/* Icon Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf3ee] text-[#486b52]">
            <ShieldCheck size={32} weight="fill" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#23201e]">
            Create Permanent Password
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#5c554f]">
            Welcome, <strong className="text-[#23201e]">{user.fullName}</strong>
            . Please set a new permanent password to activate your account.
          </p>
        </div>

        {/* Timer Expired Warning */}
        {isTimerExpired && (
          <div className="mb-6 rounded-xl border border-[#ba4334]/20 bg-[#fbf1ef] p-4 text-center text-sm text-[#ba4334]">
            <Warning
              size={24}
              weight="fill"
              className="mx-auto mb-1 text-[#ba4334]"
            />
            <p className="font-semibold">Setup Session Timed Out</p>
            <p className="mt-1 text-xs text-[#5c554f]">
              For security, temporary setup sessions are limited to 15 minutes.
              Please sign in again with your temporary password.
            </p>
            <button
              type="button"
              onClick={onCancel}
              className="mt-3 rounded-lg bg-[#ba4334] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#9f2f23]"
            >
              Sign In Again
            </button>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-5 rounded-xl border border-[#ba4334]/20 bg-[#fbf1ef] p-3.5 text-xs text-[#ba4334]">
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Success Confirmation */}
        {isSuccess ? (
          <div className="rounded-xl border border-[#486b52]/20 bg-[#edf3ee] p-6 text-center">
            <CheckCircle
              size={42}
              weight="fill"
              className="mx-auto mb-2 text-[#486b52]"
            />
            <h3 className="text-base font-bold text-[#23201e]">
              Permanent Password Saved!
            </h3>
            <p className="mt-1 text-xs text-[#5c554f]">
              Your account is now fully active. Redirecting to your dashboard...
            </p>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div>
              <label
                htmlFor="new-password"
                className="block text-xs font-semibold uppercase tracking-wider text-[#5c554f]"
              >
                New Permanent Password
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#8c847c]">
                  <LockKey size={18} weight="bold" />
                </div>
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isTimerExpired || isLoading}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full rounded-xl border border-[#e6dfd5] bg-white py-3 pl-11 pr-11 text-sm text-[#23201e] placeholder-[#8c847c] transition focus:border-[#b85028] focus:outline-none focus:ring-2 focus:ring-[#b85028]/20 disabled:cursor-not-allowed disabled:bg-[#f3efea]"
                />
                <button
                  type="button"
                  onClick={toggleShowPassword}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#8c847c] hover:text-[#23201e]"
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

            {/* Live Requirements Checklist */}
            <div className="rounded-xl border border-[#e6dfd5] bg-[#faf7f2] p-3.5">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#5c554f]">
                Security Requirements
              </span>
              <div className="mt-2">
                <PasswordRequirements rules={rules} />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirm-password"
                className="block text-xs font-semibold uppercase tracking-wider text-[#5c554f]"
              >
                Confirm New Password
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#8c847c]">
                  <LockKey size={18} weight="bold" />
                </div>
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  disabled={isTimerExpired || isLoading}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  className="w-full rounded-xl border border-[#e6dfd5] bg-white py-3 pl-11 pr-11 text-sm text-[#23201e] placeholder-[#8c847c] transition focus:border-[#b85028] focus:outline-none focus:ring-2 focus:ring-[#b85028]/20 disabled:cursor-not-allowed disabled:bg-[#f3efea]"
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
                        className="text-[#ba4334]"
                      />
                    ))}
                  <button
                    type="button"
                    onClick={toggleShowConfirmPassword}
                    className="ml-2 text-[#8c847c] hover:text-[#23201e]"
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
                <p className="mt-1 text-[11px] text-[#ba4334]">
                  Passwords do not match yet.
                </p>
              )}
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#b85028] px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a44520] active:bg-[#8e3b1b] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <CircleNotch size={18} className="animate-spin" />
                  <span>Saving permanent password...</span>
                </>
              ) : (
                <span>Activate Account & Continue</span>
              )}
            </button>

            <p className="text-center text-[11px] leading-relaxed text-[#8c847c]">
              Once activated, your temporary password will be permanently
              disabled.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

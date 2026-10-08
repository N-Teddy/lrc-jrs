import type { IAuthUser } from '@jrs/shared';
import {
  ArrowRight,
  At,
  Check,
  CircleNotch,
  EnvelopeSimple,
  Eye,
  EyeSlash,
  Info,
  Lock,
  Phone,
  WarningCircle,
} from '@phosphor-icons/react';
import type React from 'react';
import fellowshipHero from '../../../assets/fellowship-hero.jpg';
import { useLogin } from '../hooks/use-login';
import { AccountRevokedModal } from './AccountRevokedModal';

interface LoginScreenProps {
  onRequiresPasswordChange: (data: {
    setupToken: string;
    user: IAuthUser;
  }) => void;
  onForgotPasswordClick?: (identifier: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onRequiresPasswordChange,
  onForgotPasswordClick,
}) => {
  const {
    identifier,
    setIdentifier,
    password,
    setPassword,
    showPassword,
    toggleShowPassword,
    keepSignedIn,
    setKeepSignedIn,
    isLoading,
    errorMessage,
    isTempExpired,
    isRevokedModalOpen,
    closeRevokedModal,
    isEmailInput,
    isPhoneInput,
    handleSubmit,
  } = useLogin({
    onRequiresPasswordChange,
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#fdfbf9]">
      {/* Full 50% Left Side: Edge-to-Edge Clean Hero Image */}
      <div className="relative hidden h-full w-1/2 overflow-hidden lg:block">
        <img
          src={fellowshipHero}
          alt="Youth Fellowship community"
          className="h-full w-full object-cover object-center"
        />
      </div>

      {/* Full 50% Right Side: Form Container */}
      <div className="flex h-full w-full flex-col justify-center overflow-y-auto px-8 sm:px-14 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-[480px] py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-[#1e1b19] sm:text-4xl">
              Welcome back
            </h1>
            <p className="mt-2.5 text-sm sm:text-base leading-relaxed text-[#57423b]">
              Sign in to access your youth circles, events calendar, and
              mentorship notes.
            </p>
          </div>

          {/* First-time logging in info box */}
          <div className="mb-7 rounded-2xl border border-[#eddcd4] bg-[#faf2ee] p-5 text-xs sm:text-sm text-[#57423b]">
            <div className="flex items-start gap-3.5">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[#983912]">
                <Info size={20} weight="bold" />
              </div>
              <div>
                <p className="font-semibold text-[#1e1b19]">
                  First time logging in?
                </p>
                <p className="mt-1 leading-relaxed text-[#57423b]">
                  Enter the temporary password sent to your phone via WhatsApp
                  or your registered email address.
                </p>
              </div>
            </div>
          </div>

          {/* Error Notification */}
          {errorMessage && (
            <div className="mb-6 rounded-xl border border-[#ba1a1a]/20 bg-[#ffdad6] p-4 text-xs sm:text-sm text-[#93000a]">
              <div className="flex items-start gap-3">
                <WarningCircle
                  size={20}
                  weight="fill"
                  className="mt-0.5 shrink-0"
                />
                <div className="flex-1">
                  <p className="font-semibold">{errorMessage}</p>
                  {isTempExpired && (
                    <button
                      type="button"
                      onClick={() => onForgotPasswordClick?.(identifier)}
                      className="mt-1.5 inline-flex items-center text-xs font-bold underline hover:text-[#ba1a1a]"
                    >
                      Reset Password Now →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Identifier Input */}
            <div>
              <label
                htmlFor="identifier"
                className="block text-xs font-semibold uppercase tracking-wider text-[#1e1b19]"
              >
                Phone Number or Email
              </label>
              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#8a726a]">
                  {isPhoneInput ? (
                    <Phone size={20} weight="bold" />
                  ) : isEmailInput ? (
                    <EnvelopeSimple size={20} weight="bold" />
                  ) : (
                    <At size={20} weight="bold" />
                  )}
                </div>
                <input
                  id="identifier"
                  type="text"
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. 693087159 or name@example.com"
                  className="w-full rounded-xl border border-[#e8e1dd] bg-white py-3.5 pl-12 pr-4 text-sm sm:text-base text-[#1e1b19] placeholder-[#8a726a] transition focus:border-[#b85028] focus:outline-none focus:ring-2 focus:ring-[#b85028]/15"
                />
              </div>
              <p className="mt-1.5 text-xs text-[#8a726a]">
                Enter your registered fellowship telephone number or email
                address.
              </p>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#1e1b19]"
                >
                  Password or Code
                </label>
                <button
                  type="button"
                  onClick={() => onForgotPasswordClick?.(identifier)}
                  className="text-xs font-semibold text-[#b85028] transition hover:text-[#983912]"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#8a726a]">
                  <Lock size={20} weight="bold" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password or temporary code"
                  className="w-full rounded-xl border border-[#e8e1dd] bg-white py-3.5 pl-12 pr-12 text-sm sm:text-base text-[#1e1b19] placeholder-[#8a726a] transition focus:border-[#b85028] focus:outline-none focus:ring-2 focus:ring-[#b85028]/15"
                />
                <button
                  type="button"
                  onClick={toggleShowPassword}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#8a726a] hover:text-[#1e1b19]"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeSlash size={20} weight="bold" />
                  ) : (
                    <Eye size={20} weight="bold" />
                  )}
                </button>
              </div>
            </div>

            {/* Keep me signed in Checkbox */}
            <div className="pt-1">
              <label
                htmlFor="keepSignedIn"
                className="inline-flex cursor-pointer items-center gap-3"
              >
                <input
                  type="checkbox"
                  id="keepSignedIn"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
                    keepSignedIn
                      ? 'border-[#43664d] bg-[#43664d] text-white'
                      : 'border-[#ddc0b7] bg-white text-transparent'
                  }`}
                >
                  <Check size={14} weight="bold" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-[#1e1b19]">
                  Keep me signed in on this device
                </span>
              </label>
            </div>

            {/* Primary Action Button: "Sign In →" */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || !identifier.trim() || !password}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#b85028] px-5 py-4 text-sm sm:text-base font-semibold text-white shadow-sm transition hover:bg-[#983912] active:bg-[#812901] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <CircleNotch size={20} className="animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={20} weight="bold" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Account Revoked Modal (403 Handler) */}
      <AccountRevokedModal
        isOpen={isRevokedModalOpen}
        onAcknowledge={closeRevokedModal}
      />
    </div>
  );
};

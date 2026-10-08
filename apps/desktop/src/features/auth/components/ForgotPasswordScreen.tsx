import {
  ArrowLeft,
  ArrowRight,
  At,
  CircleNotch,
  EnvelopeSimple,
  Headset,
  LockKey,
  PaperPlaneTilt,
  Phone,
  WarningCircle,
} from '@phosphor-icons/react';
import type React from 'react';
import { useForgotPassword } from '../hooks/use-forgot-password';

interface ForgotPasswordScreenProps {
  initialIdentifier?: string;
  onBackToSignIn: () => void;
  onCodeSent: (
    identifier: string,
    channel: 'auto' | 'whatsapp' | 'email',
  ) => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  initialIdentifier = '',
  onBackToSignIn,
  onCodeSent,
}) => {
  const {
    identifier,
    isEmailInput,
    isPhoneInput,
    errorMessage,
    isPending,
    handleIdentifierChange,
    handleSubmit,
  } = useForgotPassword({
    initialIdentifier,
    onCodeSent,
  });

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#fff8f5] p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-xl mx-auto flex flex-col gap-6">
        {/* Main Card */}
        <div className="rounded-2xl border border-[#e8e1dd] bg-white p-6 sm:p-10 shadow-sm flex flex-col gap-7">
          {/* Top Navigation */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onBackToSignIn}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#57423b] transition hover:text-[#983912]"
            >
              <ArrowLeft size={18} weight="bold" />
              <span>Back to Sign In</span>
            </button>
          </div>

          {/* Icon Motif & Title */}
          <div className="flex flex-col items-center text-center gap-3 pt-1">
            <div className="w-16 h-16 rounded-2xl bg-[#ffdbcf] text-[#983912] flex items-center justify-center relative shadow-sm">
              <LockKey size={32} weight="fill" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#c2e9ca] text-[#43664d] flex items-center justify-center shadow-xs">
                <PaperPlaneTilt size={14} weight="fill" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5 max-w-md">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1e1b19]">
                Reset Your Password
              </h1>
              <p className="text-sm leading-relaxed text-[#57423b]">
                Enter your registered phone number or email address. We'll send
                you a 6-digit verification code to help you regain access.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="rounded-xl border border-[#ba1a1a]/20 bg-[#ffdad6] p-4 text-xs sm:text-sm text-[#93000a] flex items-start gap-2.5">
              <WarningCircle
                size={20}
                weight="fill"
                className="shrink-0 mt-0.5 text-[#ba1a1a]"
              />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Primary Reset Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Identifier Input */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="reset-identifier"
                  className="text-xs font-semibold uppercase tracking-wider text-[#1e1b19]"
                >
                  Phone Number or Email
                </label>
                <span className="text-xs text-[#8a726a]">Required</span>
              </div>
              <div className="relative flex items-center">
                <div className="pointer-events-none absolute left-3.5 text-[#8a726a]">
                  {isPhoneInput ? (
                    <Phone size={20} weight="bold" />
                  ) : isEmailInput ? (
                    <EnvelopeSimple size={20} weight="bold" />
                  ) : (
                    <At size={20} weight="bold" />
                  )}
                </div>
                <input
                  id="reset-identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => handleIdentifierChange(e.target.value)}
                  placeholder="e.g. 693087159 or name@example.com"
                  className="w-full h-12 pl-11 pr-4 bg-[#faf2ee] text-[#1e1b19] placeholder-[#8a726a] rounded-xl text-sm transition-all outline-none focus:bg-white focus:ring-2 focus:ring-[#b85028]/20 focus:border-[#b85028] border border-[#e8e1dd]"
                />
              </div>
              <p className="text-xs text-[#8a726a]">
                Accepts official fellowship contact lines or email address.
              </p>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={isPending || !identifier.trim()}
              className="w-full h-12 bg-[#b85028] text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition hover:bg-[#983912] active:scale-[0.99] shadow-sm disabled:cursor-not-allowed disabled:opacity-50 mt-2"
            >
              {isPending ? (
                <>
                  <CircleNotch size={20} className="animate-spin" />
                  <span>Sending Verification Code...</span>
                </>
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <ArrowRight size={18} weight="bold" />
                </>
              )}
            </button>
          </form>

          {/* Supportive Leadership Assistance */}
          <div className="flex flex-col sm:flex-row items-center justify-center text-center gap-2 pt-3 bg-[#faf2ee]/70 rounded-xl p-3.5 border border-[#e8e1dd]">
            <Headset size={20} weight="bold" className="text-[#8a726a]" />
            <span className="text-xs text-[#57423b]">Having trouble?</span>
            <span className="text-xs font-semibold text-[#983912]">
              Contact your community animator or leader
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

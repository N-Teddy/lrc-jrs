import { useTranslation } from '@jrs/client-core';
import {
  ArrowLeft,
  ArrowRight,
  ArrowsClockwise,
  ChatCircleText,
  CheckCircle,
  CircleNotch,
  EnvelopeSimple,
  Headset,
  Lock,
  PencilSimple,
  ShieldCheck,
  Timer,
  WarningCircle,
  WhatsappLogo,
} from '@phosphor-icons/react';
import type React from 'react';
import { LanguageToggle } from '../../../components/LanguageToggle';
import { useVerifyOtp } from '../hooks/use-verify-otp';

interface VerifyOtpScreenProps {
  identifier: string;
  channel?: 'auto' | 'whatsapp' | 'email';
  onBackToChangeContact: () => void;
  onCodeVerified: (resetToken: string) => void;
}

export const VerifyOtpScreen: React.FC<VerifyOtpScreenProps> = ({
  identifier,
  channel = 'auto',
  onBackToChangeContact,
  onCodeVerified,
}) => {
  const { t } = useTranslation();
  const {
    digits,
    inputRefs,
    attemptsRemaining,
    errorMessage,
    isLockedOut,
    resendNotice,
    formattedTime,
    secondsRemaining,
    isTimerExpired,
    isFormComplete,
    maskedId,
    isVerifyPending,
    isResendPending,
    handleCellChange,
    handleKeyDown,
    handlePaste,
    handleSubmit,
    handleResendCode,
  } = useVerifyOtp({
    identifier,
    channel,
    onCodeVerified,
  });

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#fff8f5] p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-xl mx-auto flex flex-col gap-6">
        {/* Main Card */}
        <div className="rounded-2xl border border-[#e8e1dd] bg-white p-6 sm:p-10 shadow-sm flex flex-col gap-6 transition-all">
          {/* Top Navigation Inside Card */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onBackToChangeContact}
              className="group flex items-center gap-1.5 text-sm font-semibold text-[#57423b] transition hover:text-[#983912]"
            >
              <ArrowLeft
                size={18}
                weight="bold"
                className="transition-transform group-hover:-translate-x-0.5"
              />
              <span>{t('auth:verifyOtp.changeContact')}</span>
            </button>
            <LanguageToggle />
          </div>

          {/* Icon Badge Illustration & Header */}
          <div className="flex flex-col items-center text-center gap-2 pt-1">
            <div className="relative w-16 h-16 rounded-xl bg-[#faf2ee] flex items-center justify-center text-[#983912] shadow-xs">
              <ChatCircleText size={32} weight="fill" />
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#b85028] flex items-center justify-center text-white">
                <Lock size={12} weight="bold" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1e1b19]">
              {t('auth:verifyOtp.title')}
            </h1>
            <p className="text-sm text-[#57423b] max-w-md">
              {t('auth:verifyOtp.subtitle')}
            </p>
          </div>

          {/* Masked Channel Destination Banner */}
          <div className="rounded-xl bg-[#faf2ee] p-3.5 flex items-center justify-between border border-[#e8e1dd]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#c2e9ca] text-[#43664d] flex items-center justify-center shrink-0">
                {identifier.includes('@') ? (
                  <EnvelopeSimple size={18} weight="bold" />
                ) : (
                  <WhatsappLogo size={18} weight="fill" />
                )}
              </div>
              <div className="flex flex-col min-w-0 text-left">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8a726a]">
                  {identifier.includes('@')
                    ? t('auth:verifyOtp.sentViaEmail')
                    : t('auth:verifyOtp.sentViaWhatsapp')}
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#1e1b19] truncate">
                  {maskedId}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onBackToChangeContact}
              title={t('auth:verifyOtp.changeContact')}
              className="p-1.5 rounded-lg text-[#8a726a] hover:text-[#983912] hover:bg-[#f4ece9] transition"
            >
              <PencilSimple size={18} weight="bold" />
            </button>
          </div>

          {/* Expiration Countdown Widget */}
          <div className="flex items-center justify-center">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                isTimerExpired
                  ? 'bg-[#ffdad6] text-[#93000a]'
                  : secondsRemaining < 120
                    ? 'bg-[#ffdad4] text-[#881f14]'
                    : 'bg-[#faf2ee] text-[#57423b]'
              }`}
            >
              <Timer
                size={16}
                weight="bold"
                className={isTimerExpired ? 'text-[#ba1a1a]' : 'text-[#b85028]'}
              />
              <span>
                {isTimerExpired ? (
                  t('auth:verifyOtp.codeExpired')
                ) : (
                  <>
                    {t('auth:verifyOtp.codeExpiresIn')}{' '}
                    <strong className="text-[#1e1b19]">{formattedTime}</strong>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="rounded-xl border border-[#ba1a1a]/20 bg-[#ffdad6] p-3.5 text-xs text-[#93000a] flex items-start gap-2.5">
              <WarningCircle
                size={18}
                weight="fill"
                className="shrink-0 mt-0.5 text-[#ba1a1a]"
              />
              <div className="flex-1 font-medium leading-relaxed">
                {errorMessage}
              </div>
            </div>
          )}

          {/* Resend Notice */}
          {resendNotice && (
            <div className="rounded-xl border border-[#43664d]/20 bg-[#c2e9ca] p-3 text-xs text-[#00210e] flex items-center gap-2 font-medium">
              <CheckCircle
                size={18}
                weight="fill"
                className="text-[#43664d] shrink-0"
              />
              <span>{resendNotice}</span>
            </div>
          )}

          {/* 6-Digit OTP Form */}
          <form onSubmit={handleSubmit} className="flex flex-col items-center">
            {/* Input Grid Container */}
            <div className="relative w-full mb-4">
              <div
                className="flex items-center justify-center gap-2 sm:gap-3 w-full"
                onPaste={handlePaste}
              >
                {digits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    disabled={isLockedOut || isTimerExpired || isVerifyPending}
                    onChange={(e) => handleCellChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold text-[#1e1b19] bg-[#faf2ee] rounded-xl transition outline-none focus:bg-white focus:ring-2 focus:ring-[#b85028] border border-[#e8e1dd] shadow-xs disabled:cursor-not-allowed disabled:bg-[#f3efea]"
                  />
                ))}
              </div>

              {/* Lockout Overlay */}
              {isLockedOut && (
                <div className="absolute inset-0 bg-[#e8e1dd]/80 rounded-xl flex items-center justify-center z-10 backdrop-blur-[1px]">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-[#93000a] rounded-full shadow-sm text-xs font-bold border border-[#ffdad6]">
                    <Lock size={14} weight="bold" />
                    <span>{t('auth:verifyOtp.inputLocked')}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Attempts Remaining Row */}
            <div className="w-full flex items-center justify-between text-xs text-[#8a726a] px-1 mb-5">
              <span className="flex items-center gap-1">
                <ShieldCheck size={14} weight="bold" />
                <span>{t('auth:verifyOtp.securityBadge')}</span>
              </span>
              <span
                className={`font-semibold ${
                  attemptsRemaining <= 2 ? 'text-[#ba1a1a]' : 'text-[#1e1b19]'
                }`}
              >
                {t('auth:verifyOtp.attemptsRemaining', {
                  count: attemptsRemaining,
                })}
              </span>
            </div>

            {/* Primary Submit Button or Request New Code button */}
            {isLockedOut || isTimerExpired ? (
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isResendPending}
                className="w-full py-3.5 px-6 rounded-xl bg-[#b85028] text-white text-sm font-bold shadow-sm hover:bg-[#983912] active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isResendPending ? (
                  <>
                    <CircleNotch size={18} className="animate-spin" />
                    <span>{t('auth:verifyOtp.requestingFreshCode')}</span>
                  </>
                ) : (
                  <>
                    <ArrowsClockwise size={18} weight="bold" />
                    <span>{t('auth:verifyOtp.requestFreshCode')}</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="submit"
                disabled={!isFormComplete || isVerifyPending}
                className="w-full py-3.5 px-6 rounded-xl bg-[#b85028] text-white text-sm font-bold shadow-sm hover:bg-[#983912] active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {isVerifyPending ? (
                  <>
                    <CircleNotch size={18} className="animate-spin" />
                    <span>{t('auth:verifyOtp.verifying')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('auth:verifyOtp.verifyAndProceed')}</span>
                    <ArrowRight size={18} weight="bold" />
                  </>
                )}
              </button>
            )}
          </form>

          {/* Resend Mechanism */}
          <div className="pt-2 flex flex-col items-center gap-2 text-center border-t border-[#faf2ee]">
            <p className="text-xs text-[#8a726a]">
              {t('auth:verifyOtp.didNotReceive')}
            </p>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isResendPending}
                className="font-bold text-[#b85028] hover:underline inline-flex items-center gap-1 disabled:opacity-50 cursor-pointer"
              >
                <ArrowsClockwise size={14} weight="bold" />
                <span>{t('auth:verifyOtp.resendCode')}</span>
              </button>
              <span className="text-[#8a726a]">•</span>
              <button
                type="button"
                onClick={handleResendCode}
                className="text-[#57423b] hover:text-[#1e1b19] hover:underline cursor-pointer"
              >
                {t('auth:verifyOtp.tryAlternate')}
              </button>
            </div>
          </div>
        </div>

        {/* Support Card */}
        <div className="w-full p-3.5 rounded-xl bg-[#faf2ee] border border-[#e8e1dd] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#983912] shadow-xs">
              <Headset size={18} weight="bold" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-[#1e1b19]">
                {t('auth:verifyOtp.needHelp')}
              </span>
              <span className="text-[11px] text-[#8a726a]">
                {t('auth:verifyOtp.contactDesk')}
              </span>
            </div>
          </div>
          <span className="text-xs font-bold text-[#b85028]">
            {t('auth:verifyOtp.getHelp')}
          </span>
        </div>
      </div>
    </div>
  );
};

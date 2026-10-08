import {
  useForgotPasswordMutation,
  useVerifyResetCodeMutation,
} from '@jrs/client-core';
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
import { useEffect, useRef, useState } from 'react';

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
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  const [secondsRemaining, setSecondsRemaining] = useState(10 * 60); // 10 minutes (600s)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const verifyMutation = useVerifyResetCodeMutation();
  const resendMutation = useForgotPasswordMutation();

  const isTimerExpired = secondsRemaining <= 0;

  // Countdown timer
  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsRemaining]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Mask identifier for safety
  const maskIdentifier = (val: string) => {
    if (val.includes('@')) {
      const [name, domain] = val.split('@');
      const maskedName =
        name.length > 2
          ? `${name[0]}${'•'.repeat(Math.min(name.length - 2, 5))}${name.slice(-1)}`
          : `${name[0]}•`;
      return `${maskedName}@${domain}`;
    }
    const clean = val.replace(/\s+/g, '');
    if (clean.length > 6) {
      return `${clean.slice(0, 4)} •• •• ${clean.slice(-2)}`;
    }
    return val;
  };

  const handleCellChange = (index: number, value: string) => {
    const cleanDigit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleanDigit;
    setDigits(newDigits);
    setErrorMessage(null);

    // Auto advance
    if (cleanDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    const numDigits = pasteData.replace(/\D/g, '').slice(0, 6);
    if (!numDigits) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = numDigits[i] || '';
    }
    setDigits(newDigits);
    setErrorMessage(null);

    const nextIndex = Math.min(numDigits.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullCode = digits.join('');
    if (fullCode.length < 6) {
      setErrorMessage('Please enter all 6 digits of your verification code.');
      return;
    }
    if (isTimerExpired) {
      setErrorMessage(
        'This verification code has expired. Please request a new code below.',
      );
      return;
    }
    if (isLockedOut) {
      return;
    }

    setErrorMessage(null);

    try {
      const response = await verifyMutation.mutateAsync({
        identifier: identifier.trim(),
        code: fullCode,
      });

      if (response.resetToken) {
        onCodeVerified(response.resetToken);
      }
    } catch (err: any) {
      const remaining = Math.max(0, attemptsRemaining - 1);
      setAttemptsRemaining(remaining);

      if (remaining <= 0) {
        setIsLockedOut(true);
        setErrorMessage(
          'Maximum verification attempts reached. For security, please request a fresh code.',
        );
      } else {
        const serverMsg =
          err?.response?.data?.message ||
          err?.message ||
          'Incorrect verification code. Please check and try again.';
        setErrorMessage(
          typeof serverMsg === 'string'
            ? `${serverMsg} (${remaining} attempt${remaining === 1 ? '' : 's'} remaining)`
            : `Code mismatch. (${remaining} attempts left)`,
        );
      }
    }
  };

  const handleResendCode = async () => {
    setErrorMessage(null);
    setResendNotice(null);
    try {
      await resendMutation.mutateAsync({
        identifier: identifier.trim(),
        channel,
      });
      setDigits(['', '', '', '', '', '']);
      setSecondsRemaining(10 * 60);
      setAttemptsRemaining(5);
      setIsLockedOut(false);
      setResendNotice('A new 6-digit verification code has been dispatched.');
      inputRefs.current[0]?.focus();
    } catch (_err) {
      setErrorMessage('Failed to resend code. Please try again shortly.');
    }
  };

  const isFormComplete = digits.every((d) => d.length === 1);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#fff8f5] p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-xl mx-auto flex flex-col gap-6">
        {/* Main Card */}
        <div className="rounded-2xl border border-[#e8e1dd] bg-white p-6 sm:p-10 shadow-sm flex flex-col gap-6 transition-all">
          {/* Top Navigation Inside Card: No border and no step indicator */}
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
              <span>Change contact</span>
            </button>
          </div>

          {/* Icon Badge Illustration & Header */}
          <div className="flex flex-col items-center text-center gap-2 pt-1">
            <div className="relative w-16 h-16 rounded-2xl bg-[#faf2ee] flex items-center justify-center text-[#983912] shadow-xs">
              <ChatCircleText size={32} weight="fill" />
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#b85028] flex items-center justify-center text-white">
                <Lock size={12} weight="bold" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1e1b19]">
              Verify Your Identity
            </h1>
            <p className="text-sm text-[#57423b] max-w-md">
              Enter the single-use six digit code sent to your registered
              channel.
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
                  Sent via {identifier.includes('@') ? 'Email' : 'WhatsApp'}
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#1e1b19] truncate">
                  {maskIdentifier(identifier)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onBackToChangeContact}
              title="Change contact identifier"
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
                  'Code expired'
                ) : (
                  <>
                    Code expires in{' '}
                    <strong className="text-[#1e1b19]">
                      {formatTimer(secondsRemaining)}
                    </strong>
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
                    disabled={
                      isLockedOut || isTimerExpired || verifyMutation.isPending
                    }
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
                    <span>Input locked</span>
                  </span>
                </div>
              )}
            </div>

            {/* Attempts Remaining Row */}
            <div className="w-full flex items-center justify-between text-xs text-[#8a726a] px-1 mb-5">
              <span className="flex items-center gap-1">
                <ShieldCheck size={14} weight="bold" />
                <span>LRC Fellowship Security</span>
              </span>
              <span
                className={`font-semibold ${
                  attemptsRemaining <= 2 ? 'text-[#ba1a1a]' : 'text-[#1e1b19]'
                }`}
              >
                Attempts remaining: {attemptsRemaining} of 5
              </span>
            </div>

            {/* Primary Submit Button or Request New Code button */}
            {isLockedOut || isTimerExpired ? (
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendMutation.isPending}
                className="w-full py-3.5 px-6 rounded-xl bg-[#b85028] text-white text-sm font-bold shadow-sm hover:bg-[#983912] active:scale-[0.99] transition flex items-center justify-center gap-2"
              >
                {resendMutation.isPending ? (
                  <>
                    <CircleNotch size={18} className="animate-spin" />
                    <span>Requesting fresh code...</span>
                  </>
                ) : (
                  <>
                    <ArrowsClockwise size={18} weight="bold" />
                    <span>Request Fresh Code</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="submit"
                disabled={!isFormComplete || verifyMutation.isPending}
                className="w-full py-3.5 px-6 rounded-xl bg-[#b85028] text-white text-sm font-bold shadow-sm hover:bg-[#983912] active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {verifyMutation.isPending ? (
                  <>
                    <CircleNotch size={18} className="animate-spin" />
                    <span>Verifying code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Code & Proceed</span>
                    <ArrowRight size={18} weight="bold" />
                  </>
                )}
              </button>
            )}
          </form>

          {/* Resend Mechanism */}
          <div className="pt-2 flex flex-col items-center gap-2 text-center border-t border-[#faf2ee]">
            <p className="text-xs text-[#8a726a]">Didn't receive the code?</p>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendMutation.isPending}
                className="font-bold text-[#b85028] hover:underline inline-flex items-center gap-1 disabled:opacity-50"
              >
                <ArrowsClockwise size={14} weight="bold" />
                <span>Resend Code</span>
              </button>
              <span className="text-[#8a726a]">•</span>
              <button
                type="button"
                onClick={handleResendCode}
                className="text-[#57423b] hover:text-[#1e1b19] hover:underline"
              >
                Try alternate channel
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
                Need help verifying?
              </span>
              <span className="text-[11px] text-[#8a726a]">
                Contact LRC Youth Desk
              </span>
            </div>
          </div>
          <span className="text-xs font-bold text-[#b85028]">Get Help</span>
        </div>
      </div>
    </div>
  );
};

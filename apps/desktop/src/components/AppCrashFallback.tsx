import { useTranslation } from '@jrs/client-core';
import {
  ArrowClockwise,
  CaretDown,
  CaretUp,
  Check,
  Copy,
  House,
  WarningOctagon,
} from '@phosphor-icons/react';
import type React from 'react';
import { useState } from 'react';
import appErrorSvg from '../assets/illustrations/app-error.svg';

export interface AppCrashFallbackProps {
  error: Error | null;
  errorInfo?: React.ErrorInfo | null;
  onReset?: () => void;
}

export const AppCrashFallback: React.FC<AppCrashFallbackProps> = ({
  error,
  errorInfo,
  onReset,
}) => {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleReturnHome = () => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.clear();
      }
    } catch {
      // Ignore storage errors in sandbox
    }

    if (onReset) {
      onReset();
    } else if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const diagnosticText = [
    `Timestamp: ${new Date().toISOString()}`,
    `Error: ${error?.name || 'Error'}: ${error?.message || 'Unknown runtime error'}`,
    error?.stack ? `\nStack:\n${error.stack}` : '',
    errorInfo?.componentStack
      ? `\nComponent Stack:\n${errorInfo.componentStack}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  const handleCopyDiagnostics = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(diagnosticText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Fallback copy
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#fff8f5] flex flex-col items-center justify-center p-6 sm:p-10 select-none animate-in fade-in duration-300">
      {/* Large Friendly Secular Crash Illustration */}
      <div className="relative flex items-center justify-center mb-2">
        <img
          src={appErrorSvg}
          alt={t('crash:badge', 'Application Error')}
          className="w-72 h-56 sm:w-96 sm:h-72 md:w-[460px] md:h-[320px] object-contain select-none pointer-events-none drop-shadow-sm transition-transform duration-300 hover:scale-[1.01]"
        />
      </div>

      {/* Error Badge */}
      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#fee2e2] text-[#991b1b] border border-[#fecaca] mb-3 shadow-2xs">
        <WarningOctagon size={14} weight="fill" />
        <span>{t('crash:badge', 'Application Error')}</span>
      </div>

      {/* Main Heading */}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1e1b19] tracking-tight mb-2 text-center">
        {t('crash:title', 'Something went wrong')}
      </h1>

      {/* Short 1-Sentence Reassurance */}
      <p className="text-xs sm:text-sm text-[#57423b] text-center max-w-md leading-relaxed mb-6 px-4">
        {t(
          'crash:description',
          'The application encountered an unexpected runtime error. Your recorded data remains safe.',
        )}
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
        <button
          type="button"
          onClick={handleReload}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#b85028] hover:bg-[#983912] text-white text-xs font-bold transition-all shadow-xs hover:shadow-sm cursor-pointer"
        >
          <ArrowClockwise size={16} weight="bold" />
          <span>{t('crash:reload', 'Reload Application')}</span>
        </button>

        <button
          type="button"
          onClick={handleReturnHome}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#faf2ee] text-[#1e1b19] border border-[#e8e1dd] text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer"
        >
          <House size={16} weight="bold" />
          <span>{t('crash:returnHome', 'Return to Sign-In')}</span>
        </button>
      </div>

      {/* Diagnostic Details Toggle */}
      <div className="w-full max-w-xl flex flex-col items-center">
        <button
          type="button"
          onClick={() => setShowDetails((prev) => !prev)}
          className="inline-flex items-center gap-1.5 text-xs text-[#8a726a] hover:text-[#1e1b19] font-medium transition-colors cursor-pointer mb-2"
        >
          <span>
            {showDetails
              ? t('crash:hideDetails', 'Hide Diagnostics')
              : t('crash:technicalDetails', 'Technical Diagnostics')}
          </span>
          {showDetails ? (
            <CaretUp size={13} weight="bold" />
          ) : (
            <CaretDown size={13} weight="bold" />
          )}
        </button>

        {showDetails && (
          <div className="w-full bg-[#2a211d] text-[#faf2ee] rounded-xl p-4 border border-[#433027] shadow-md animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#433027] text-[11px] text-[#ffdbcf]">
              <span className="font-mono font-bold">
                {error?.name || 'Error'}
              </span>
              <button
                type="button"
                onClick={handleCopyDiagnostics}
                className="inline-flex items-center gap-1 text-[11px] text-[#ffb59c] hover:text-white transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check
                      size={12}
                      weight="bold"
                      className="text-emerald-400"
                    />
                    <span className="text-emerald-400">
                      {t('crash:copied', 'Copied')}
                    </span>
                  </>
                ) : (
                  <>
                    <Copy size={12} weight="bold" />
                    <span>{t('crash:copyDetails', 'Copy Details')}</span>
                  </>
                )}
              </button>
            </div>
            <pre className="text-[11px] font-mono text-[#e8e1dd] overflow-x-auto max-h-48 whitespace-pre-wrap select-text leading-relaxed">
              {diagnosticText}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

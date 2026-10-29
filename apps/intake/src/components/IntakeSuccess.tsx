import { Check, CheckCircle, Copy, WhatsappLogo } from '@phosphor-icons/react';
import React, { useState } from 'react';
import { useTranslation } from '../i18n';

interface IntakeSuccessProps {
  referenceCode?: string;
  fullName: string;
  townName?: string;
  onReset?: () => void;
}

export const IntakeSuccess: React.FC<IntakeSuccessProps> = ({
  referenceCode,
  fullName,
  townName,
  onReset,
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const defaultTown = t('success.defaultTown');

  const copyReference = async () => {
    if (!referenceCode) return;
    try {
      await navigator.clipboard.writeText(referenceCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto py-5 sm:py-8">
      <div className="relative overflow-hidden rounded-[28px] border border-white bg-white px-5 py-7 text-center shadow-[0_20px_60px_rgba(67,48,39,0.12)] sm:px-8 sm:py-9">
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-emerald-50 to-transparent" />
        <div className="relative">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-600 border border-emerald-500 flex items-center justify-center text-white mb-5 shadow-[0_10px_25px_rgba(5,150,105,0.22)]">
            <CheckCircle weight="fill" className="w-9 h-9" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-3">
            <span>{t('success.badge')}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1e1b19] mb-2 tracking-tight text-balance">
            {t('success.welcome', { name: fullName })}
          </h2>

          <p className="text-sm text-[#57423b] max-w-sm mx-auto mb-6 leading-relaxed text-pretty">
            {t('success.description', { town: townName || defaultTown })}
          </p>

          {referenceCode && (
            <div className="mb-5 rounded-2xl border border-[#E8E0D7] bg-[#FAF7F2] p-3 text-left">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8C847C]">
                {t('success.referenceCode')}
              </div>
              <div className="mt-1 flex items-center justify-between gap-3">
                <code className="min-w-0 truncate text-sm font-extrabold tracking-wide text-[#23201E]">
                  {referenceCode}
                </code>
                <button
                  type="button"
                  onClick={copyReference}
                  className="h-10 shrink-0 rounded-xl border border-[#E2D8CF] bg-white px-3 text-xs font-bold text-[#5C554F] transition-colors hover:border-[#B85028] hover:text-[#B85028]"
                >
                  {copied ? (
                    <Check size={16} weight="bold" />
                  ) : (
                    <Copy size={16} weight="bold" />
                  )}
                  <span className="sr-only">
                    {copied ? t('success.copied') : t('success.copy')}
                  </span>
                </button>
              </div>
            </div>
          )}

          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5 text-left text-xs leading-relaxed text-emerald-950 flex items-start gap-2.5 mb-5">
            <WhatsappLogo
              weight="fill"
              className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5"
            />
            <span>{t('success.whatsappNotice')}</span>
          </div>

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="h-12 w-full rounded-xl border border-[#E6DFD5] bg-white text-sm font-bold text-[#5C554F] transition-colors hover:border-[#B85028] hover:text-[#B85028]"
            >
              {t('success.submitAnother')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

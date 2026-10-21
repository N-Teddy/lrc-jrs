import { Check, CheckCircle, Copy, WhatsappLogo } from '@phosphor-icons/react';
import React, { useState } from 'react';
import { useTranslation } from '../i18n';

interface IntakeSuccessProps {
  referenceCode: string;
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
  const { t, language } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(referenceCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const defaultTown =
    language === 'fr' ? 'votre zone locale' : 'your local area';

  return (
    <div className="w-full max-w-lg mx-auto py-8 px-4">
      <div className="bg-white rounded-xl border border-[#e8e1dd] p-6 sm:p-8 text-center shadow-xs relative overflow-hidden">
        {/* Success Icon */}
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4 shadow-xs">
          <CheckCircle weight="fill" className="w-9 h-9" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-50 text-emerald-800 text-xs font-semibold mb-2">
          <span>{t('success.badge')}</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1e1b19] mb-2 tracking-tight">
          {t('success.welcome', { name: fullName })}
        </h2>

        <p className="text-xs sm:text-sm text-[#57423b] max-w-sm mx-auto mb-6 leading-relaxed">
          {t('success.description', { town: townName || defaultTown })}
        </p>

        {/* Reference Code Card */}
        <div className="bg-[#faf2ee] border border-[#e8e1dd] rounded-lg p-4 mb-5 text-left">
          <div className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider mb-1">
            {t('success.referenceCode')}
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-lg sm:text-xl font-bold text-[#b85028] tracking-wider">
              {referenceCode}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-[#e8e1dd] hover:border-[#b85028] text-xs font-semibold text-[#1e1b19] transition-all cursor-pointer shadow-2xs"
            >
              {copied ? (
                <>
                  <Check
                    weight="bold"
                    className="w-3.5 h-3.5 text-emerald-600"
                  />
                  <span className="text-emerald-700">
                    {t('success.copied')}
                  </span>
                </>
              ) : (
                <>
                  <Copy weight="bold" className="w-3.5 h-3.5 text-[#57423b]" />
                  <span>{t('success.copy')}</span>
                </>
              )}
            </button>
          </div>
          <div className="text-[11px] text-[#8a726a] mt-1.5">
            {t('success.referenceHelper')}
          </div>
        </div>

        {/* Steps Card */}
        <div className="bg-white rounded-lg border border-[#e8e1dd] p-4 text-left mb-5 space-y-3.5">
          <div className="text-xs font-bold text-[#1e1b19] uppercase tracking-wider mb-2">
            {t('success.whatHappensNext')}
          </div>

          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              ✓
            </div>
            <div>
              <div className="text-xs font-semibold text-[#1e1b19]">
                {t('success.step1Title')}
              </div>
              <div className="text-[11px] text-[#57423b]">
                {t('success.step1Desc')}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              2
            </div>
            <div>
              <div className="text-xs font-semibold text-[#1e1b19]">
                {t('success.step2Title')}
              </div>
              <div className="text-[11px] text-[#57423b]">
                {t('success.step2Desc')}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-md bg-neutral-100 text-neutral-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              3
            </div>
            <div>
              <div className="text-xs font-semibold text-[#8a726a]">
                {t('success.step3Title')}
              </div>
              <div className="text-[11px] text-[#8a726a]">
                {t('success.step3Desc')}
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp Notice */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-left text-xs text-emerald-950 flex items-center gap-2.5 mb-5">
          <WhatsappLogo
            weight="fill"
            className="w-4 h-4 text-emerald-600 shrink-0"
          />
          <span>{t('success.whatsappNotice')}</span>
        </div>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-[#8a726a] hover:text-[#1e1b19] underline cursor-pointer"
          >
            {t('success.submitAnother')}
          </button>
        )}
      </div>
    </div>
  );
};

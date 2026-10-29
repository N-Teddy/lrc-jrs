import { useTranslation } from '@jrs/client-core';
import { RocketLaunch, Sparkle, X } from '@phosphor-icons/react';
import type React from 'react';

export interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
  description?: string;
}

export const ComingSoonModal: React.FC<ComingSoonModalProps> = ({
  isOpen,
  onClose,
  featureName,
  description,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl border border-[#e8e1dd] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Top Decorative Header */}
        <div className="relative px-6 pt-7 pb-5 bg-gradient-to-b from-[#faf2ee] via-[#fff5f2] to-white border-b border-[#f4ece9] flex flex-col items-center text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 hover:bg-white border border-[#e8e1dd] flex items-center justify-center text-[#8a726a] hover:text-[#1e1b19] transition-all cursor-pointer shadow-2xs"
            aria-label="Close"
          >
            <X size={15} weight="bold" />
          </button>

          {/* Glowing Icon Badge */}
          <div className="relative mb-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#b85028] to-[#963c19] text-white flex items-center justify-center shadow-lg shadow-[#b85028]/25 ring-4 ring-[#ffdbcf]/50">
              <RocketLaunch size={30} weight="fill" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow-xs">
              <Sparkle size={13} weight="fill" />
            </div>
          </div>

          {/* Status Pill */}
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#ffeedd] border border-[#ffdbcf] text-[11px] font-bold text-[#b85028] uppercase tracking-wider mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#b85028] animate-pulse" />
            {t('common:inDevelopment', 'In Development')}
          </span>

          <h3 className="text-lg font-bold text-[#1e1b19] tracking-tight">
            {t('common:comingSoonTitle', 'Coming Soon')}
          </h3>

          {featureName && (
            <p className="text-xs font-semibold text-[#b85028] mt-0.5">
              {featureName}
            </p>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 text-center space-y-4">
          <p className="text-xs text-[#57423b] leading-relaxed">
            {description ||
              t(
                'common:comingSoonDesc',
                'This feature is currently under active development and will be available in an upcoming production release. Stay tuned for updates!',
              )}
          </p>

          <div className="p-3.5 rounded-xl bg-[#faf2ee] border border-[#e8e1dd] text-[11px] text-[#8a726a] text-left flex items-start gap-2.5">
            <Sparkle
              size={16}
              weight="fill"
              className="text-[#b85028] shrink-0 mt-0.5"
            />
            <span>
              {t(
                'activities:reminders.comingSoonNote',
                'Automated milestone broadcasts, preparation checklists, and leadership directives per activity type are being polished for high reliability.',
              )}
            </span>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full h-10 rounded-xl bg-[#b85028] hover:bg-[#a44520] active:scale-[0.99] text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center"
            >
              {t('common:close', 'Got It')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

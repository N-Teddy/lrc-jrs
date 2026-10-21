import type { IRegistrationLinkPublicInfo } from '@jrs/shared';
import {
  ChatTeardropDots,
  HourglassMedium,
  MapPin,
} from '@phosphor-icons/react';
import React from 'react';
import { useTranslation } from '../i18n';

interface IntakeExpiredProps {
  info?: IRegistrationLinkPublicInfo | null;
  errorMessage?: string;
}

export const IntakeExpired: React.FC<IntakeExpiredProps> = ({
  info,
  errorMessage,
}) => {
  const { t, language } = useTranslation();

  return (
    <div className="w-full max-w-lg mx-auto py-10 px-4">
      <div className="bg-white rounded-xl border border-[#e8e1dd] p-6 sm:p-8 text-center shadow-xs">
        {/* Icon */}
        <div className="w-14 h-14 mx-auto rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-4">
          <HourglassMedium weight="duotone" className="w-7 h-7" />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-[#1e1b19] mb-2">
          {t('expired.title')}
        </h2>

        <p className="text-xs sm:text-sm text-[#57423b] mb-5 leading-relaxed">
          {errorMessage || t('expired.defaultMessage')}
        </p>

        {info && (
          <div className="bg-[#faf2ee] rounded-lg p-3.5 border border-[#e8e1dd] text-left text-xs mb-5 space-y-2">
            <div className="flex items-center justify-between text-[#8a726a]">
              <span>{t('expired.location')}</span>
              <span className="font-semibold text-[#1e1b19] flex items-center gap-1">
                <MapPin weight="fill" className="w-3.5 h-3.5 text-[#b85028]" />
                {info.town?.name || 'Local Town'}{' '}
                {info.town?.code ? `(${info.town.code})` : ''}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#8a726a]">
              <span>{t('expired.expiredAt')}</span>
              <span className="font-medium text-[#1e1b19]">
                {new Date(info.expiresAt).toLocaleDateString(
                  language === 'fr' ? 'fr-FR' : 'en-GB',
                  {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  },
                )}
              </span>
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5 text-left text-xs text-blue-900 mb-5 flex items-start gap-2.5">
          <ChatTeardropDots
            weight="duotone"
            className="w-4 h-4 text-blue-600 shrink-0 mt-0.5"
          />
          <div className="leading-relaxed">
            <span className="font-semibold text-blue-950">
              {t('expired.howToGetNewLink')}
            </span>
            <p className="mt-0.5 text-blue-800">
              {t('expired.howToGetNewLinkDesc')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="w-full h-10 px-4 rounded-md border border-[#e8e1dd] bg-[#faf2ee] hover:bg-[#f4ece9] text-[#1e1b19] text-xs font-semibold transition-colors cursor-pointer"
        >
          {t('expired.reloadPage')}
        </button>
      </div>
    </div>
  );
};

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
    <div className="w-full max-w-md mx-auto py-5 sm:py-8">
      <div className="relative overflow-hidden bg-white rounded-[28px] border border-white px-5 py-7 text-center shadow-[0_20px_60px_rgba(67,48,39,0.12)] sm:px-8 sm:py-9">
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-amber-50 to-transparent" />
        <div className="relative">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 mb-5 shadow-sm">
            <HourglassMedium weight="duotone" className="w-7 h-7" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1e1b19] mb-2 tracking-tight text-balance">
            {t('expired.title')}
          </h2>

          <p className="text-sm text-[#57423b] mb-6 leading-relaxed text-pretty">
            {errorMessage || t('expired.defaultMessage')}
          </p>

          {info && (
            <div className="bg-[#FAF7F2] rounded-2xl p-3.5 border border-[#E8E0D7] text-left text-xs mb-5 space-y-3">
              <div className="flex items-center justify-between text-[#8a726a]">
                <span>{t('expired.location')}</span>
                <span className="font-semibold text-[#1e1b19] flex items-center gap-1">
                  <MapPin
                    weight="fill"
                    className="w-3.5 h-3.5 text-[#b85028]"
                  />
                  {info.town?.name || t('expired.defaultTown')}{' '}
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
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3.5 text-left text-xs text-blue-900 mb-5 flex items-start gap-2.5">
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
            className="w-full h-12 px-4 rounded-xl border border-[#E6DFD5] bg-white hover:border-[#B85028] hover:text-[#B85028] text-[#23201E] text-sm font-bold transition-colors cursor-pointer"
          >
            {t('expired.reloadPage')}
          </button>
        </div>
      </div>
    </div>
  );
};

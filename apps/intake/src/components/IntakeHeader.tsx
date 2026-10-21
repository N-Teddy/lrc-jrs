import type { IRegistrationLinkPublicInfo } from '@jrs/shared';
import { Clock, MapPin } from '@phosphor-icons/react';
import React from 'react';
import { useTranslation } from '../i18n';

interface IntakeHeaderProps {
  info: IRegistrationLinkPublicInfo;
}

export const IntakeHeader: React.FC<IntakeHeaderProps> = ({ info }) => {
  const { t, language } = useTranslation();

  // Format expiration
  const expiryDate = new Date(info.expiresAt);
  const now = new Date();
  const diffHours = Math.max(
    0,
    Math.round((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60)),
  );
  const diffDays = Math.floor(diffHours / 24);

  let expiryLabel = '';
  if (diffDays > 1) {
    expiryLabel = t('header.validForDays', { count: diffDays });
  } else if (diffHours > 1) {
    expiryLabel = t('header.validForHours', { count: diffHours });
  } else {
    expiryLabel = t('header.expiresSoon');
  }

  const formattedDate = expiryDate.toLocaleDateString(
    language === 'fr' ? 'fr-FR' : 'en-GB',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  );

  return (
    <header className="relative w-full max-w-xl mx-auto pt-2 pb-2 px-4 text-center">
      {/* Main Title */}
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1e1b19] mb-2">
        {info.title || t('header.title')}
      </h1>

      <p className="text-sm sm:text-base text-[#57423b] max-w-md mx-auto mb-4 leading-relaxed">
        {t('header.subtitle')}
      </p>

      {/* Meta Pills: Town and Expiration */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#faf2ee] border border-[#e8e1dd] text-[#1e1b19] text-xs font-medium">
          <MapPin weight="bold" className="w-3.5 h-3.5 text-[#b85028]" />
          <span>
            {info.town?.name || t('header.location')}{' '}
            {info.town?.code ? `(${info.town.code})` : ''}
          </span>
        </div>

        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium"
          title={`Expires on ${formattedDate}`}
        >
          <Clock weight="bold" className="w-3.5 h-3.5 text-amber-700" />
          <span>{expiryLabel}</span>
        </div>
      </div>

      {/* Custom Welcome Message if any */}
      {info.customMessage && (
        <div className="bg-white border border-[#e8e1dd] rounded-lg p-3.5 mb-4 text-left text-xs sm:text-sm text-[#57423b] shadow-xs relative">
          <div className="text-[11px] font-bold text-[#b85028] uppercase tracking-wider mb-1 flex items-center gap-1">
            <span>{t('header.noteFromCoordinator')}</span>
          </div>
          <p className="italic text-[#1e1b19]">"{info.customMessage}"</p>
        </div>
      )}
    </header>
  );
};

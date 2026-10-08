import { useLanguage } from '@jrs/client-core';
import { Translate } from '@phosphor-icons/react';
import type React from 'react';
import { tauriStoreAdapter } from '../storage/tauri-store.adapter';

interface LanguageToggleProps {
  className?: string;
  showIcon?: boolean;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  className = '',
  showIcon = false,
}) => {
  const { currentLanguage, setLanguage } = useLanguage(tauriStoreAdapter);
  const isFrench = currentLanguage?.startsWith('fr');

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-lg border border-[#e8e1dd] bg-white p-0.5 shadow-2xs select-none ${className}`}
    >
      {showIcon && (
        <div className="pl-1.5 pr-0.5 text-[#8a726a]">
          <Translate size={14} weight="bold" />
        </div>
      )}
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${
          !isFrench
            ? 'bg-[#b85028] text-white shadow-xs'
            : 'text-[#8a726a] hover:text-[#1e1b19] hover:bg-[#faf2ee]'
        }`}
        title="Switch to English"
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage('fr')}
        className={`px-2 py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${
          isFrench
            ? 'bg-[#b85028] text-white shadow-xs'
            : 'text-[#8a726a] hover:text-[#1e1b19] hover:bg-[#faf2ee]'
        }`}
        title="Passer en Français"
        aria-label="Passer en Français"
      >
        FR
      </button>
    </div>
  );
};

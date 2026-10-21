import { Translate } from '@phosphor-icons/react';
import React, {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { type Language, translations } from './translations';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = 'jrs_intake_lang';

export const I18nProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [language, setLangState] = useState<Language>(() => {
    // 1. Saved preference
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(STORAGE_KEY) as Language | null;
      if (saved === 'fr' || saved === 'en') return saved;
    }
    // 2. Default to French for Cameroon, or English if browser preference is explicitly English
    if (
      typeof navigator !== 'undefined' &&
      navigator.language?.toLowerCase().startsWith('en')
    ) {
      return 'en';
    }
    return 'fr';
  });

  const setLanguage = (lang: Language) => {
    setLangState(lang);
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const t = (
    path: string,
    params?: Record<string, string | number>,
  ): string => {
    const keys = path.split('.');
    let current: any = translations[language];

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to English
        let fallback: any = translations.en;
        for (const fKey of keys) {
          if (fallback && typeof fallback === 'object' && fKey in fallback) {
            fallback = fallback[fKey];
          } else {
            return path;
          }
        }
        current = fallback;
        break;
      }
    }

    if (typeof current !== 'string') {
      return path;
    }

    if (!params) {
      return current;
    }

    // Handle pluralization helper if count exists
    let text = current;
    if (params.count !== undefined) {
      const isPlural = Number(params.count) !== 1;
      const pluralKey = `${keys[keys.length - 1]}_plural`;
      const parentObj = keys
        .slice(0, -1)
        .reduce((acc: any, k) => acc?.[k], translations[language]);
      if (isPlural && parentObj && typeof parentObj[pluralKey] === 'string') {
        text = parentObj[pluralKey];
      }
    }

    // Replace {{param}}
    return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => {
      return params[k] !== undefined ? String(params[k]) : `{{${k}}}`;
    });
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}

export const LanguageToggle: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  const { language, setLanguage } = useTranslation();
  const isFrench = language === 'fr';

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-lg border border-[#e8e1dd] bg-white p-0.5 shadow-2xs select-none ${className}`}
    >
      <div className="pl-1.5 pr-0.5 text-[#8a726a]">
        <Translate size={14} weight="bold" />
      </div>
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
    </div>
  );
};

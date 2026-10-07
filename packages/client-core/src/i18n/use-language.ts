import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export function useLanguage(storage?: {
  setItem: (k: string, v: string) => Promise<void> | void;
}) {
  const { i18n, t } = useTranslation();

  const setLanguage = useCallback(
    async (lang: 'fr' | 'en') => {
      await i18n.changeLanguage(lang);
      if (storage) {
        await storage.setItem('jrs_language', lang);
      }
    },
    [i18n, storage],
  );

  return {
    currentLanguage: i18n.language as 'fr' | 'en',
    setLanguage,
    t,
  };
}

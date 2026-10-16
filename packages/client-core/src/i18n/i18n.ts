import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import fr from './locales/fr.json';

export const defaultNS = 'common';
export const resources = {
  fr: {
    common: fr.common,
    auth: fr.auth,
    towns: fr.towns,
    roles: fr.roles,
    members: fr.members,
    activities: fr.activities,
    attendance: fr.attendance,
    navigation: fr.navigation,
    dashboard: fr.dashboard,
    access: fr.access,
    transfers: fr.transfers,
    drive: fr.drive,
  },
  en: {
    common: en.common,
    auth: en.auth,
    towns: en.towns,
    roles: en.roles,
    members: en.members,
    activities: en.activities,
    attendance: en.attendance,
    navigation: en.navigation,
    dashboard: en.dashboard,
    access: en.access,
    transfers: en.transfers,
    drive: en.drive,
  },
} as const;

export function initI18n(initialLanguage = 'fr'): typeof i18n {
  if (!i18n.isInitialized) {
    i18n.use(initReactI18next).init({
      resources,
      lng: initialLanguage,
      fallbackLng: 'en',
      defaultNS: 'common',
      ns: [
        'common',
        'auth',
        'towns',
        'roles',
        'members',
        'activities',
        'attendance',
        'navigation',
        'dashboard',
        'access',
        'transfers',
        'drive',
      ],
      interpolation: {
        escapeValue: false,
      },
    });
  }
  return i18n;
}

export { Trans, useTranslation } from 'react-i18next';
export { i18n };

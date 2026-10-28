import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import errorsEn from './locales/errors.en.json';
import errorsFr from './locales/errors.fr.json';
import fr from './locales/fr.json';
import notificationsEn from './locales/notifications.en.json';
import notificationsFr from './locales/notifications.fr.json';
import successEn from './locales/success.en.json';
import successFr from './locales/success.fr.json';

declare const process: { env?: { NODE_ENV?: string } } | undefined;
declare const __DEV__: boolean | undefined;

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
    errors: errorsFr,
    success: successFr,
    notifications: notificationsFr,
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
    errors: errorsEn,
    success: successEn,
    notifications: notificationsEn,
  },
} as const;

export function isDevEnvironment(): boolean {
  try {
    if (process?.env?.NODE_ENV) {
      return process.env.NODE_ENV === 'development';
    }
  } catch {}

  try {
    if (
      typeof window !== 'undefined' &&
      (window as unknown as { process?: { env?: { NODE_ENV?: string } } })
        .process?.env?.NODE_ENV
    ) {
      return (
        (window as unknown as { process?: { env?: { NODE_ENV?: string } } })
          .process?.env?.NODE_ENV === 'development'
      );
    }
  } catch {}

  try {
    if (
      typeof globalThis !== 'undefined' &&
      (globalThis as unknown as { process?: { env?: { NODE_ENV?: string } } })
        .process?.env?.NODE_ENV
    ) {
      return (
        (globalThis as unknown as { process?: { env?: { NODE_ENV?: string } } })
          .process?.env?.NODE_ENV === 'development'
      );
    }
  } catch {}

  try {
    if (
      typeof window !== 'undefined' &&
      typeof (window as unknown as { __DEV__?: boolean }).__DEV__ === 'boolean'
    ) {
      return Boolean((window as unknown as { __DEV__?: boolean }).__DEV__);
    }
  } catch {}

  try {
    if (
      typeof import.meta !== 'undefined' &&
      (import.meta as unknown as { env?: { DEV?: boolean; MODE?: string } }).env
    ) {
      const env = (
        import.meta as unknown as { env?: { DEV?: boolean; MODE?: string } }
      ).env;
      return Boolean(env?.DEV || env?.MODE === 'development');
    }
  } catch {}

  return false;
}

export interface InitI18nOptions {
  isDev?: boolean;
}

export function initI18n(
  initialLanguage = 'fr',
  options?: InitI18nOptions,
): typeof i18n {
  const _isDev = options?.isDev ?? isDevEnvironment();

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
        'errors',
        'success',
        'notifications',
      ],
      saveMissing: true,
      missingKeyHandler: (lngs, ns, key) => {
        const message = `[i18n ERROR] Missing translation key: "${ns}:${key}" for language(s): ${lngs.join(', ')}`;
        console.error(message);
      },
      parseMissingKeyHandler: (key) => {
        const message = `[i18n ERROR] Missing translation key: "${key}"`;
        console.error(message);
        return `[MISSING: ${key}]`;
      },
      interpolation: {
        escapeValue: false,
      },
    });
  } else {
    // In dev / HMR, sync any updated resource bundles into the active i18n instance
    for (const [lng, namespaces] of Object.entries(resources)) {
      for (const [ns, bundle] of Object.entries(namespaces)) {
        i18n.addResourceBundle(
          lng,
          ns,
          bundle as unknown as object,
          true,
          true,
        );
      }
    }
  }
  return i18n;
}

export { Trans, useTranslation } from 'react-i18next';
export { i18n };

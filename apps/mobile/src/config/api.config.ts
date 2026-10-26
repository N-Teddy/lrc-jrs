import { NativeModules, Platform } from 'react-native';

/**
 * Resolves the backend API base URL for the current runtime environment.
 *
 * Defaults to port 3500 (matching the NestJS backend).
 * On Android:
 * 1. If adb reverse is active, 'localhost' directly reaches the host development machine.
 * 2. If running on a physical device over Wi-Fi, Metro bundler's host IP
 *    (from NativeModules.SourceCode.scriptURL) automatically replaces localhost.
 * 3. If running on a standard Android emulator without adb reverse, fallback can map to 10.0.2.2.
 */
export function getApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3500/api';

  if (Platform.OS !== 'android') {
    return envUrl;
  }

  // If already pointing to a remote domain or non-local IP, use as is
  if (!envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  // Attempt to resolve the host from Metro bundler's scriptURL
  // e.g. "http://192.168.1.15:8081/..." or "http://10.0.2.2:8081/..."
  const scriptURL: string | undefined = NativeModules?.SourceCode?.scriptURL;
  if (scriptURL) {
    const match = scriptURL.match(/^https?:\/\/([^:/]+)/);
    const metroHost = match?.[1];
    if (metroHost && metroHost !== 'localhost' && metroHost !== '127.0.0.1') {
      return envUrl.replace(/localhost|127\.0\.0\.1/, metroHost);
    }
  }

  return envUrl;
}

/**
 * Resolves a media / avatar URL to ensure it is accessible on mobile/Android devices.
 */
export function resolveMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  const baseUrl = getApiBaseUrl().replace(/\/api\/?$/, '');

  if (url.startsWith('/')) {
    return `${baseUrl}${url}`;
  }

  if (
    Platform.OS === 'android' &&
    (url.includes('localhost') || url.includes('127.0.0.1'))
  ) {
    const match = baseUrl.match(/^https?:\/\/([^:/]+)/);
    const host = match?.[1];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return url.replace(/localhost|127\.0\.0\.1/, host);
    }
  }

  return url;
}

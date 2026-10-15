import { getApiBaseUrl } from '../../../config/api.config';

/**
 * Resolves an avatar URL so that relative /uploads paths and localhost URLs
 * correctly target the host server on Android devices/emulators.
 */
export function resolveAvatarUrl(rawUrl?: string | null): string | undefined {
  if (!rawUrl) return undefined;

  // If already an absolute cloud URL (e.g. Cloudinary or HTTPS)
  if (
    rawUrl.startsWith('https://') ||
    rawUrl.startsWith('http://res.cloudinary.com')
  ) {
    return rawUrl;
  }

  // Get base API URL (e.g. http://10.0.2.2:3500/api or http://localhost:3500/api)
  const apiBase = getApiBaseUrl();
  // Strip trailing /api or /
  const serverHost = apiBase.replace(/\/api\/?$/, '');

  if (rawUrl.startsWith('/')) {
    return `${serverHost}${rawUrl}`;
  }

  if (rawUrl.includes('localhost') || rawUrl.includes('127.0.0.1')) {
    // Replace localhost in rawUrl with the server host origin
    try {
      const parsedServer = new URL(serverHost);
      const parsedRaw = new URL(rawUrl);
      parsedRaw.protocol = parsedServer.protocol;
      parsedRaw.hostname = parsedServer.hostname;
      parsedRaw.port = parsedServer.port;
      return parsedRaw.toString();
    } catch {
      return rawUrl;
    }
  }

  return rawUrl;
}

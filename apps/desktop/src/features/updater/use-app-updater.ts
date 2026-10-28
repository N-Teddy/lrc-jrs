import type { Update } from '@tauri-apps/plugin-updater';
import { useCallback, useEffect, useState } from 'react';

export const CURRENT_APP_VERSION = '0.0.1';

export interface UpdaterStatus {
  isChecking: boolean;
  isDownloading: boolean;
  isInstalled: boolean;
  downloadProgress: number; // 0 - 100
  contentLength: number;
  downloadedBytes: number;
  availableUpdate: Update | null;
  error: string | null;
  lastCheckedAt: Date | null;
}

export function useAppUpdater() {
  const [realVersion, setRealVersion] = useState<string>(CURRENT_APP_VERSION);
  const [status, setStatus] = useState<UpdaterStatus>({
    isChecking: false,
    isDownloading: false,
    isInstalled: false,
    downloadProgress: 0,
    contentLength: 0,
    downloadedBytes: 0,
    availableUpdate: null,
    error: null,
    lastCheckedAt: null,
  });

  const [isOpen, setIsOpen] = useState(false);

  // Dynamically resolve real app version from Tauri runtime
  useEffect(() => {
    async function resolveRealVersion() {
      try {
        const isTauriEnv =
          typeof window !== 'undefined' &&
          ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
        if (isTauriEnv) {
          const { getVersion } = await import('@tauri-apps/api/app');
          const v = await getVersion();
          if (v) {
            setRealVersion(v);
          }
        }
      } catch (err) {
        console.warn('[Updater] Could not resolve runtime version:', err);
      }
    }
    resolveRealVersion();
  }, []);

  const checkForUpdates = useCallback(async (manual = false) => {
    // Only check if running inside Tauri environment
    const isTauriEnv =
      typeof window !== 'undefined' &&
      ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);

    if (!isTauriEnv) {
      if (manual) {
        setStatus((s) => ({
          ...s,
          isChecking: false,
          lastCheckedAt: new Date(),
          error: 'Updater is only active in the desktop application.',
        }));
      }
      return;
    }

    try {
      setStatus((s) => ({ ...s, isChecking: true, error: null }));
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();

      if (update) {
        setStatus((s) => ({
          ...s,
          isChecking: false,
          availableUpdate: update,
          lastCheckedAt: new Date(),
          error: null,
        }));
        // If manually checked or found update, show modal
        if (manual) {
          setIsOpen(true);
        }
      } else {
        setStatus((s) => ({
          ...s,
          isChecking: false,
          availableUpdate: null,
          lastCheckedAt: new Date(),
          error: null,
        }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[Updater] Check failed:', msg);
      setStatus((s) => ({
        ...s,
        isChecking: false,
        lastCheckedAt: new Date(),
        error: manual ? msg : null,
      }));
    }
  }, []);

  const startUpdate = useCallback(async () => {
    if (!status.availableUpdate) return;

    try {
      setStatus((s) => ({
        ...s,
        isDownloading: true,
        downloadProgress: 0,
        downloadedBytes: 0,
        contentLength: 0,
        error: null,
      }));

      let totalSize = 0;
      let downloaded = 0;

      await status.availableUpdate.downloadAndInstall((event) => {
        if (event.event === 'Started') {
          totalSize = event.data.contentLength ?? 0;
          setStatus((s) => ({
            ...s,
            contentLength: totalSize,
          }));
        } else if (event.event === 'Progress') {
          downloaded += event.data.chunkLength;
          const percent =
            totalSize > 0 ? Math.round((downloaded / totalSize) * 100) : 0;
          setStatus((s) => ({
            ...s,
            downloadedBytes: downloaded,
            downloadProgress: percent,
          }));
        } else if (event.event === 'Finished') {
          setStatus((s) => ({
            ...s,
            downloadProgress: 100,
          }));
        }
      });

      setStatus((s) => ({
        ...s,
        isDownloading: false,
        isInstalled: true,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Updater] Download & install failed:', msg);
      setStatus((s) => ({
        ...s,
        isDownloading: false,
        error: msg,
      }));
    }
  }, [status.availableUpdate]);

  const dismiss = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openWhatsNew = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Check once automatically on application launch
  useEffect(() => {
    // Delay 3 seconds after launch to let initial UI & authentication load smoothly
    const timer = setTimeout(() => {
      checkForUpdates(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [checkForUpdates]);

  return {
    ...status,
    currentVersion: realVersion,
    hasUpdate: Boolean(status.availableUpdate),
    isOpen,
    checkForUpdates,
    startUpdate,
    dismiss,
    openWhatsNew,
  };
}

import type { Update } from '@tauri-apps/plugin-updater';
import { useCallback, useEffect, useState } from 'react';

export interface UpdaterStatus {
  isChecking: boolean;
  isDownloading: boolean;
  isInstalled: boolean;
  downloadProgress: number; // 0 - 100
  contentLength: number;
  downloadedBytes: number;
  availableUpdate: Update | null;
  error: string | null;
}

export function useAppUpdater() {
  const [status, setStatus] = useState<UpdaterStatus>({
    isChecking: false,
    isDownloading: false,
    isInstalled: false,
    downloadProgress: 0,
    contentLength: 0,
    downloadedBytes: 0,
    availableUpdate: null,
    error: null,
  });

  const [isOpen, setIsOpen] = useState(false);

  const checkForUpdates = useCallback(async (manual = false) => {
    // Only check if running inside Tauri environment
    const isTauriEnv =
      typeof window !== 'undefined' &&
      ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);

    if (!isTauriEnv) {
      if (manual) {
        setStatus((s) => ({
          ...s,
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
          error: null,
        }));
        setIsOpen(true);
      } else {
        setStatus((s) => ({
          ...s,
          isChecking: false,
          availableUpdate: null,
          error: null,
        }));
        if (manual) {
          // If manually checked, could display a toast or notification
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[Updater] Check failed:', msg);
      setStatus((s) => ({
        ...s,
        isChecking: false,
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
    isOpen,
    checkForUpdates,
    startUpdate,
    dismiss,
  };
}

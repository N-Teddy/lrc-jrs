import { useCallback, useEffect, useState } from 'react';

export const ZOOM_STORAGE_KEY = 'jrs_desktop_zoom_level';
export const MIN_ZOOM = 0.5; // 50%
export const MAX_ZOOM = 1.5; // 150%
export const DEFAULT_ZOOM = 1.0; // 100%
export const ZOOM_STEP = 0.1; // 10% per step

/**
 * Checks whether the application is running inside a Tauri desktop webview.
 */
export function isTauri(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('__TAURI_INTERNALS__' in window || '__TAURI__' in window)
  );
}

/**
 * Reads the initial zoom level from localStorage or falls back to default.
 */
export function getInitialZoom(): number {
  if (typeof window === 'undefined') return DEFAULT_ZOOM;
  try {
    const saved = localStorage.getItem(ZOOM_STORAGE_KEY);
    if (saved) {
      const parsed = parseFloat(saved);
      if (!Number.isNaN(parsed) && parsed >= MIN_ZOOM && parsed <= MAX_ZOOM) {
        return Math.round(parsed * 100) / 100;
      }
    }
  } catch {}
  return DEFAULT_ZOOM;
}

/**
 * Applies the zoom level using Tauri's native webview zoom (like VS Code / Antigravity)
 * to avoid shrinking the root HTML element or distorting 100vw/100vh layout boundaries.
 * Falls back to compensated CSS zoom in non-Tauri browser environments.
 */
export async function applyZoom(level: number): Promise<void> {
  if (typeof window === 'undefined') return;
  const clamped =
    Math.round(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, level)) * 100) / 100;

  try {
    localStorage.setItem(ZOOM_STORAGE_KEY, String(clamped));
  } catch {}

  // 1. Native Tauri Webview Zoom (Windows WebView2 / macOS WKWebView / Linux WebKitGTK)
  if (isTauri()) {
    try {
      // Clear any CSS zoom on documentElement so it does not conflict or shrink the page into a corner
      if (document.documentElement.style.zoom) {
        document.documentElement.style.zoom = '';
      }
      document.documentElement.classList.remove('css-zoom-active');

      const { getCurrentWebviewWindow } = await import(
        '@tauri-apps/api/webviewWindow'
      );
      const appWindow = getCurrentWebviewWindow();
      await appWindow.setZoom(clamped);
      return;
    } catch (err) {
      console.warn(
        'Native Tauri webview zoom failed, using compensated CSS fallback:',
        err,
      );
    }
  }

  // 2. Non-Tauri Web Browser Fallback:
  // Apply CSS zoom with viewport compensation to keep 100vw/100vh spanning the entire window
  (document.documentElement.style as unknown as { zoom: string }).zoom =
    String(clamped);
  document.documentElement.style.setProperty('--app-zoom', String(clamped));
  if (clamped !== 1.0) {
    document.documentElement.classList.add('css-zoom-active');
  } else {
    document.documentElement.classList.remove('css-zoom-active');
  }
}

/**
 * Custom hook to manage app-wide UI zooming via Ctrl/Cmd keyboard shortcuts and mouse wheel.
 *
 * Supported shortcuts:
 * - Ctrl + '-' / Cmd + '-' (or Numpad '-'): Reduce component size / zoom out
 * - Ctrl + '+' / Ctrl + '=' / Cmd + '+' (or Numpad '+'): Increase component size / zoom in
 * - Ctrl + '0' / Cmd + '0' (or Numpad '0'): Reset to 100% default size
 * - Ctrl + Mouse Wheel Up/Down: Smooth zoom in / out
 */
export function useZoomShortcuts() {
  const [zoom, setZoomState] = useState<number>(getInitialZoom);
  const [showIndicator, setShowIndicator] = useState(false);

  const setZoom = useCallback(
    (newZoomOrUpdater: number | ((prev: number) => number)) => {
      setZoomState((prev) => {
        const next =
          typeof newZoomOrUpdater === 'function'
            ? newZoomOrUpdater(prev)
            : newZoomOrUpdater;
        const clamped =
          Math.round(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next)) * 100) / 100;
        void applyZoom(clamped);
        return clamped;
      });
      setShowIndicator(true);
    },
    [],
  );

  const zoomOut = useCallback(() => {
    setZoom((prev) => prev - ZOOM_STEP);
  }, [setZoom]);

  const zoomIn = useCallback(() => {
    setZoom((prev) => prev + ZOOM_STEP);
  }, [setZoom]);

  const resetZoom = useCallback(() => {
    setZoom(DEFAULT_ZOOM);
  }, [setZoom]);

  // Automatically fade out the zoom percentage badge after 1.5 seconds
  useEffect(() => {
    if (!showIndicator) return;
    void zoom;
    const timer = setTimeout(() => {
      setShowIndicator(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [showIndicator, zoom]);

  // Initial apply on mount to sync native webview zoom with current state
  useEffect(() => {
    void applyZoom(zoom);
  }, [zoom]);

  // Register global shortcut listeners with capture: true so child elements cannot block it
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Must be paired with Ctrl (Windows/Linux) or Cmd (macOS)
      if (!e.ctrlKey && !e.metaKey) return;

      const isZoomOut =
        e.key === '-' ||
        e.key === '_' ||
        e.code === 'Minus' ||
        e.code === 'NumpadSubtract';

      const isZoomIn =
        e.key === '+' ||
        e.key === '=' ||
        e.code === 'Equal' ||
        e.code === 'NumpadAdd';

      const isZoomReset =
        e.key === '0' || e.code === 'Digit0' || e.code === 'Numpad0';

      if (isZoomOut) {
        e.preventDefault();
        e.stopPropagation();
        zoomOut();
      } else if (isZoomIn) {
        e.preventDefault();
        e.stopPropagation();
        zoomIn();
      } else if (isZoomReset) {
        e.preventDefault();
        e.stopPropagation();
        resetZoom();
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      if (e.deltaY < 0) {
        zoomIn();
      } else if (e.deltaY > 0) {
        zoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('wheel', handleWheel, {
      passive: false,
      capture: true,
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('wheel', handleWheel, { capture: true });
    };
  }, [zoomIn, zoomOut, resetZoom]);

  return { zoom, zoomIn, zoomOut, resetZoom, showIndicator };
}

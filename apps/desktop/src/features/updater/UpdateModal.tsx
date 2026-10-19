import {
  ArrowClockwise,
  CheckCircle,
  DownloadSimple,
  Sparkle,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import type { useAppUpdater } from './use-app-updater';

type AppUpdaterHook = ReturnType<typeof useAppUpdater>;

interface UpdateModalProps {
  updater: AppUpdaterHook;
}

export function UpdateModal({ updater }: UpdateModalProps) {
  const {
    isOpen,
    isDownloading,
    isInstalled,
    downloadProgress,
    availableUpdate,
    error,
    dismiss,
    startUpdate,
  } = updater;

  if (!isOpen || !availableUpdate) {
    return null;
  }

  const newVersion = availableUpdate.version;
  const currentVersion = availableUpdate.currentVersion;
  const releaseNotes = availableUpdate.body;

  const isLinux =
    typeof navigator !== 'undefined' &&
    navigator.userAgent.toLowerCase().includes('linux');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-stone-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b85028] text-white shadow-md shadow-[#b85028]/30">
                <Sparkle size={22} weight="fill" />
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight">
                  New Update Available
                </h3>
                <p className="text-xs text-stone-300">
                  Version {newVersion} is ready to install
                </p>
              </div>
            </div>
            {!isDownloading && !isInstalled && (
              <button
                type="button"
                onClick={dismiss}
                className="rounded-lg p-1 text-stone-400 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Version Comparison Badge */}
          <div className="flex items-center justify-between rounded-xl bg-stone-50 border border-stone-200/80 p-3 text-xs">
            <span className="text-stone-500 font-medium">Current Version:</span>
            <span className="font-mono text-stone-700 bg-stone-200/60 px-2 py-0.5 rounded">
              v{currentVersion}
            </span>
            <span className="text-stone-300">→</span>
            <span className="text-stone-500 font-medium">New Version:</span>
            <span className="font-mono font-semibold text-[#b85028] bg-[#b85028]/10 px-2 py-0.5 rounded">
              v{newVersion}
            </span>
          </div>

          {/* Release Notes */}
          {releaseNotes && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                What's New:
              </span>
              <div className="max-h-36 overflow-y-auto rounded-lg bg-stone-50 border border-stone-100 p-3 text-xs text-stone-600 leading-relaxed font-sans whitespace-pre-line">
                {releaseNotes}
              </div>
            </div>
          )}

          {/* Progress / Status Display */}
          {isDownloading && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-600 font-medium flex items-center gap-1.5">
                  <ArrowClockwise
                    className="animate-spin text-[#b85028]"
                    size={14}
                  />
                  Downloading update packages...
                </span>
                <span className="font-mono font-semibold text-[#b85028]">
                  {downloadProgress}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full bg-gradient-to-r from-[#b85028] to-[#d46a3d] transition-all duration-300 ease-out"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          )}

          {isInstalled && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-start gap-3">
              <CheckCircle
                size={22}
                weight="fill"
                className="text-emerald-600 shrink-0 mt-0.5"
              />
              <div className="text-xs text-emerald-900 leading-relaxed">
                <strong className="font-semibold block mb-0.5">
                  Update successfully installed!
                </strong>
                {isLinux
                  ? 'Please restart the application now to use the updated version.'
                  : 'The application is finalizing installation and restarting.'}
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 flex items-start gap-2.5">
              <WarningCircle
                size={18}
                weight="fill"
                className="text-red-500 shrink-0 mt-0.5"
              />
              <div className="text-xs text-red-700 leading-relaxed">
                <span className="font-semibold">Update failed: </span>
                {error}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-stone-100 bg-stone-50/60 px-6 py-4">
          {!isDownloading && !isInstalled && (
            <>
              <button
                type="button"
                onClick={dismiss}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer"
              >
                Remind Me Later
              </button>
              <button
                type="button"
                onClick={startUpdate}
                className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#b85028] hover:bg-[#a0431f] active:bg-[#883818] rounded-lg shadow-sm shadow-[#b85028]/30 transition-all cursor-pointer"
              >
                <DownloadSimple size={16} weight="bold" />
                Update Now
              </button>
            </>
          )}

          {isDownloading && (
            <span className="text-xs text-stone-400 italic">
              Please do not close the application while downloading...
            </span>
          )}

          {isInstalled && (
            <button
              type="button"
              onClick={dismiss}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              OK, Got It
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

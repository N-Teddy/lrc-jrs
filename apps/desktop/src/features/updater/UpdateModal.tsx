import { useTranslation } from '@jrs/client-core';
import {
  ArrowClockwise,
  CalendarBlank,
  Check,
  CheckCircle,
  DownloadSimple,
  Sparkle,
  WarningCircle,
  Wrench,
  X,
} from '@phosphor-icons/react';
import type React from 'react';
import { useState } from 'react';
import type { useAppUpdater } from './use-app-updater';
import {
  getLocalChangelog,
  getReleaseNotes,
} from './utils/release-notes-parser';

type AppUpdaterHook = ReturnType<typeof useAppUpdater>;

interface UpdateModalProps {
  updater: AppUpdaterHook;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ updater }) => {
  const { t, i18n } = useTranslation();
  const {
    isOpen,
    isChecking,
    isDownloading,
    isInstalled,
    downloadProgress,
    availableUpdate,
    currentVersion,
    hasUpdate,
    error,
    dismiss,
    startUpdate,
    checkForUpdates,
  } = updater;

  const changelogEntries = getLocalChangelog();
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  // Active version being viewed
  const defaultVersion = availableUpdate
    ? availableUpdate.version
    : currentVersion;
  const activeVersion = selectedVersion || defaultVersion;
  const releaseNotes = getReleaseNotes(
    activeVersion,
    activeVersion === availableUpdate?.version ? availableUpdate?.body : null,
    i18n.language,
  );

  const isLinux =
    typeof navigator !== 'undefined' &&
    navigator.userAgent.toLowerCase().includes('linux');

  // Format date if present
  let formattedDate = '';
  if (releaseNotes.date) {
    try {
      const parsedDate = new Date(releaseNotes.date);
      if (!Number.isNaN(parsedDate.getTime())) {
        formattedDate = parsedDate.toLocaleDateString(
          i18n.language.startsWith('fr') ? 'fr-FR' : 'en-US',
          { year: 'numeric', month: 'long', day: 'numeric' },
        );
      } else {
        formattedDate = releaseNotes.date;
      }
    } catch {
      formattedDate = releaseNotes.date;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#23201e]/40 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl border border-[#e8e1dd] flex flex-col max-h-[88vh]">
        {/* Welcoming Warm Light Header (No Dark Colors) */}
        <div className="bg-gradient-to-r from-[#fff8f5] via-[#faf2ee] to-[#fff8f5] p-5 sm:p-6 border-b border-[#e8e1dd] shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#ffdbcf] text-[#812901] border border-[#ffb59c] shadow-xs shrink-0">
                <Sparkle size={24} weight="fill" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-[#1e1b19] tracking-tight">
                    {releaseNotes.title ||
                      t(
                        'dashboard:whatsNewModal.title',
                        "What's New in LRC JRS",
                      )}
                  </h3>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-white border border-[#e8e1dd] text-[#b85028] shadow-2xs">
                    v{activeVersion}
                  </span>
                </div>
                <p className="text-xs text-[#57423b] mt-0.5">
                  {t(
                    'dashboard:whatsNewModal.subtitle',
                    'Helpful improvements and updates designed for your community teamwork.',
                  )}
                </p>
              </div>
            </div>

            {!isDownloading && !isInstalled && (
              <button
                type="button"
                onClick={dismiss}
                className="rounded-md p-1.5 text-[#8a726a] hover:bg-[#ebdcd5] hover:text-[#1e1b19] transition-colors cursor-pointer shrink-0"
                aria-label="Close"
              >
                <X size={18} weight="bold" />
              </button>
            )}
          </div>

          {/* Version Switcher Bar & Status Badge */}
          <div className="mt-4 pt-3 border-t border-[#ebdcd5]/70 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Version Switcher Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-[#faf2ee] rounded-md border border-[#e8e1dd]">
              <span className="text-[11px] font-bold text-[#8a726a] px-1.5 uppercase tracking-wider">
                {t('dashboard:whatsNewModal.versions', 'Releases')}:
              </span>
              {changelogEntries.map((entry) => {
                const cleanEntry = entry.version.replace(/^v/, '');
                const cleanActive = activeVersion.replace(/^v/, '');
                const cleanCurrent = currentVersion.replace(/^v/, '');
                const isSelected = cleanActive === cleanEntry;
                const isCurrent = cleanCurrent === cleanEntry;

                return (
                  <button
                    key={entry.version}
                    type="button"
                    onClick={() => setSelectedVersion(entry.version)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-white text-[#b85028] shadow-2xs border border-[#e8e1dd]'
                        : 'text-[#57423b] hover:text-[#1e1b19] hover:bg-white/60'
                    }`}
                  >
                    <span>v{entry.version}</span>
                    {isCurrent && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-[#edf3ee] text-[#486b52] font-bold">
                        {t('dashboard:whatsNewModal.current', 'Current')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Date / Status Tag */}
            <div className="flex items-center gap-2">
              {formattedDate && (
                <div className="flex items-center gap-1.5 text-[#8a726a] text-xs">
                  <CalendarBlank size={14} weight="bold" />
                  <span>{formattedDate}</span>
                </div>
              )}

              {hasUpdate ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#fff3e0] border border-[#ffe0b2] text-[#b76e00] font-semibold text-xs">
                  <span className="font-bold text-[#b85028]">
                    v{availableUpdate?.version} Update Available
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#edf3ee] border border-[#d2e0d5] text-[#2c4e37] font-semibold text-xs">
                  <Check size={14} weight="bold" className="text-[#486b52]" />
                  <span>
                    {t(
                      'dashboard:whatsNewModal.upToDate',
                      'You are using the latest version',
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content Body with 2-Column Responsive Layout */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Column 1: New Features */}
            <div className="space-y-3 flex flex-col">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#f0e6e1]">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1e1b19] uppercase tracking-wider">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#ffdbcf] text-[#812901]">
                    <Sparkle size={12} weight="fill" />
                  </span>
                  <span>
                    {t(
                      'dashboard:whatsNewModal.featuresTitle',
                      'New Tools to Help Your Work',
                    )}
                  </span>
                </div>
                {releaseNotes.features.length > 0 && (
                  <span className="text-[11px] font-bold px-1.5 py-0.2 rounded-md bg-[#faf2ee] text-[#b85028] border border-[#e8e1dd]">
                    {releaseNotes.features.length}
                  </span>
                )}
              </div>

              {releaseNotes.features.length > 0 ? (
                <div className="space-y-2 flex-1">
                  {releaseNotes.features.map((feature, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg bg-[#faf2ee]/70 border border-[#e8e1dd] p-2.5 text-xs text-[#57423b] leading-relaxed flex items-start gap-2.5 shadow-2xs hover:bg-[#faf2ee] transition-colors"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[#b85028] mt-1.5 shrink-0" />
                      <span className="flex-1 font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg bg-[#faf2ee]/40 border border-dashed border-[#e8e1dd] p-4 text-center text-xs text-[#8a726a]">
                  No new tools introduced in this release.
                </div>
              )}
            </div>

            {/* Column 2: Improvements & Fixes */}
            <div className="space-y-3 flex flex-col">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#e2ece4]">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1e1b19] uppercase tracking-wider">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#d8ebd9] text-[#2c4e37]">
                    <Wrench size={12} weight="fill" />
                  </span>
                  <span>
                    {t(
                      'dashboard:whatsNewModal.fixesTitle',
                      'Improvements & Smoother Experience',
                    )}
                  </span>
                </div>
                {releaseNotes.fixes.length > 0 && (
                  <span className="text-[11px] font-bold px-1.5 py-0.2 rounded-md bg-[#edf3ee] text-[#486b52] border border-[#d2e0d5]">
                    {releaseNotes.fixes.length}
                  </span>
                )}
              </div>

              {releaseNotes.fixes.length > 0 ? (
                <div className="space-y-2 flex-1">
                  {releaseNotes.fixes.map((fix, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg bg-[#edf3ee]/60 border border-[#d2e0d5] p-2.5 text-xs text-[#2c4e37] leading-relaxed flex items-start gap-2.5 shadow-2xs hover:bg-[#edf3ee] transition-colors"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[#486b52] mt-1.5 shrink-0" />
                      <span className="flex-1 font-medium">{fix}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg bg-[#edf3ee]/30 border border-dashed border-[#d2e0d5] p-4 text-center text-xs text-[#8a726a]">
                  No specific fixes recorded for this release.
                </div>
              )}
            </div>
          </div>

          {/* Download Progress Display */}
          {isDownloading && (
            <div className="space-y-2.5 pt-2 rounded-lg bg-[#fff8f5] border border-[#ffdbcf] p-4">
              <div className="flex items-center justify-between text-xs font-medium text-[#1e1b19]">
                <span className="flex items-center gap-2">
                  <ArrowClockwise
                    className="animate-spin text-[#b85028]"
                    size={16}
                  />
                  {t(
                    'dashboard:whatsNewModal.downloading',
                    'Downloading update files...',
                  )}
                </span>
                <span className="font-mono font-bold text-[#b85028]">
                  {downloadProgress}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-md bg-[#e8e1dd]">
                <div
                  className="h-full bg-gradient-to-r from-[#b85028] to-[#d46a3d] transition-all duration-300 ease-out"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Installation Success */}
          {isInstalled && (
            <div className="rounded-lg bg-[#edf3ee] border border-[#d2e0d5] p-4 flex items-start gap-3">
              <CheckCircle
                size={22}
                weight="fill"
                className="text-[#486b52] shrink-0 mt-0.5"
              />
              <div className="text-xs text-[#2c4e37] leading-relaxed">
                <strong className="font-bold block mb-0.5">
                  {t(
                    'dashboard:whatsNewModal.installed',
                    'Update installed! Please restart the portal to use the new version.',
                  )}
                </strong>
                {isLinux
                  ? 'Please close and restart the application from your menu.'
                  : 'The application will now apply the updates.'}
              </div>
            </div>
          )}

          {/* Error Notice */}
          {error && (
            <div className="rounded-lg bg-[#ffdad6] border border-[#ffb4a8] p-3.5 flex items-start gap-2.5">
              <WarningCircle
                size={18}
                weight="fill"
                className="text-[#ba1a1a] shrink-0 mt-0.5"
              />
              <div className="text-xs text-[#410002] leading-relaxed">
                <span className="font-bold">Notice: </span>
                {error}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions (Light & Clean) */}
        <div className="flex items-center justify-between border-t border-[#e8e1dd] bg-[#faf8f6] px-5 sm:px-6 py-4 shrink-0">
          <div>
            {!hasUpdate && !isDownloading && !isInstalled && (
              <button
                type="button"
                onClick={() => checkForUpdates(true)}
                disabled={isChecking}
                className="flex items-center gap-2 text-xs font-medium text-[#57423b] hover:text-[#1e1b19] transition-colors disabled:opacity-50 cursor-pointer px-3 py-1.5 rounded-md hover:bg-[#ebdcd5]"
              >
                <ArrowClockwise
                  size={15}
                  className={isChecking ? 'animate-spin text-[#b85028]' : ''}
                />
                <span>
                  {isChecking
                    ? t(
                        'dashboard:whatsNewModal.checking',
                        'Checking for updates...',
                      )
                    : t(
                        'dashboard:whatsNewModal.checkForUpdates',
                        'Check for updates',
                      )}
                </span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {hasUpdate && !isDownloading && !isInstalled && (
              <>
                <button
                  type="button"
                  onClick={dismiss}
                  className="px-4 py-2 text-xs font-semibold text-[#57423b] hover:text-[#1e1b19] hover:bg-[#ebdcd5] rounded-md transition-colors cursor-pointer"
                >
                  {t('dashboard:whatsNewModal.remindLater', 'Remind Me Later')}
                </button>
                <button
                  type="button"
                  onClick={startUpdate}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#b85028] hover:bg-[#a0431f] active:bg-[#883818] rounded-md shadow-xs shadow-[#b85028]/30 transition-all cursor-pointer"
                >
                  <DownloadSimple size={16} weight="bold" />
                  <span>
                    {t(
                      'dashboard:whatsNewModal.updateNow',
                      'Install Update Now',
                    )}
                  </span>
                </button>
              </>
            )}

            {!hasUpdate && !isDownloading && !isInstalled && (
              <button
                type="button"
                onClick={dismiss}
                className="px-5 py-2 text-xs font-bold text-[#1e1b19] bg-white border border-[#e8e1dd] hover:bg-[#faf2ee] rounded-md shadow-2xs transition-all cursor-pointer"
              >
                {t('dashboard:whatsNewModal.close', 'Got It, Close')}
              </button>
            )}

            {isDownloading && (
              <span className="text-xs text-[#8a726a] italic">
                Please keep the application open while updating...
              </span>
            )}

            {isInstalled && (
              <button
                type="button"
                onClick={dismiss}
                className="px-5 py-2 text-xs font-bold text-white bg-[#486b52] hover:bg-[#3d5a45] rounded-md shadow-xs transition-all cursor-pointer"
              >
                {t('dashboard:whatsNewModal.close', 'Got It, Close')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

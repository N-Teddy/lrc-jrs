import { useTranslation } from '@jrs/client-core';
import {
  CaretRight,
  Check,
  Compass,
  MagnifyingGlass,
  MapPin,
  MapTrifold,
  Sparkle,
  X,
} from '@phosphor-icons/react';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { useHubSwitcher } from '../hooks/use-hub-switcher';

interface HubSwitcherPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMapView: () => void;
  isSidebarCollapsed?: boolean;
}

export const HubSwitcherPopover: React.FC<HubSwitcherPopoverProps> = ({
  isOpen,
  onClose,
  onOpenMapView,
}) => {
  const { t, i18n } = useTranslation();
  const isFrench = i18n.language?.startsWith('fr');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const {
    availableTowns,
    activeTownId,
    searchQuery,
    setSearchQuery,
    filteredTowns,
    getRegionName,
    selectTown,
  } = useHubSwitcher();

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentTown = availableTowns.find((t) => t.id === activeTownId);

  return (
    <div className="fixed inset-0 z-50 bg-[#1e1b19]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Click-outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Centered Modal Card */}
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-[#e8e1dd] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150 z-10">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#faf6f4] to-[#faf2ee] border-b border-[#e8e1dd] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white border border-[#ffdbcf] text-[#b85028] flex items-center justify-center shadow-xs">
              <Compass size={22} weight="duotone" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#1e1b19] tracking-tight">
                {t('dashboard:hubSwitcher.title')}
              </h3>
              <p className="text-[11px] text-[#8a726a]">
                {t('dashboard:hubSwitcher.scope')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-white border border-[#e8e1dd] text-[#486b52] text-[11px] font-bold shadow-2xs">
              {t('dashboard:hubSwitcher.activeCount', {
                count: availableTowns.length,
              })}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-md bg-white border border-[#e8e1dd] text-[#8a726a] hover:text-[#1e1b19] hover:border-[#b85028] flex items-center justify-center transition cursor-pointer shadow-2xs"
            >
              <X size={15} weight="bold" />
            </button>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="px-5 py-3 border-b border-[#f4ece9] bg-white">
          <div className="relative flex items-center">
            <MagnifyingGlass
              size={16}
              className="absolute left-3 text-[#8a726a]"
              weight="bold"
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('dashboard:hubSwitcher.searchPlaceholder')}
              className="w-full pl-9 pr-8 py-2 bg-[#faf2ee] border border-[#e8e1dd] rounded-md text-xs text-[#1e1b19] placeholder:text-[#8a726a] outline-none transition focus:bg-white focus:border-[#b85028] focus:ring-2 focus:ring-[#b85028]/15"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-[#8a726a] hover:text-[#1e1b19] p-0.5 rounded cursor-pointer"
              >
                <X size={13} weight="bold" />
              </button>
            )}
          </div>
        </div>

        {/* Current Active Hub Banner */}
        {currentTown && !searchQuery && (
          <div className="mx-5 mt-3 px-3 py-2 rounded-lg bg-[#edf3ee] border border-[#c2e9ca] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-[#486b52] animate-pulse shrink-0" />
              <span className="text-[#2c4e37] font-semibold truncate">
                Active:{' '}
                <strong className="font-bold">
                  {currentTown.name} ({currentTown.code})
                </strong>{' '}
                · {getRegionName(currentTown.code, isFrench ? 'fr' : 'en')}
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#486b52] shrink-0">
              {t('dashboard:hubSwitcher.current')}
            </span>
          </div>
        )}

        {/* Hub List */}
        <div className="p-4 overflow-y-auto space-y-2 max-h-[340px]">
          {filteredTowns.map((town) => {
            const isCurrent = activeTownId === town.id;
            const regionName = getRegionName(town.code, isFrench ? 'fr' : 'en');

            return (
              <div
                key={town.id}
                onClick={async () => {
                  await selectTown(town.id);
                  onClose();
                }}
                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                  isCurrent
                    ? 'bg-[#fff2ee] border border-[#ffb59c] shadow-xs'
                    : 'bg-white border border-[#e8e1dd] hover:border-[#b85028]/50 hover:bg-[#faf6f4] hover:shadow-xs'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 shadow-2xs ${
                      isCurrent
                        ? 'bg-[#b85028] text-white shadow-xs'
                        : 'bg-[#faf2ee] text-[#57423b] border border-[#e8e1dd] group-hover:bg-white group-hover:text-[#b85028]'
                    }`}
                  >
                    {town.code}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#1e1b19] truncate group-hover:text-[#b85028] transition-colors">
                        {town.name} {t('towns:hub')}
                      </span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded-full bg-[#ffdbcf] text-[#812901] text-[10px] font-bold">
                          {t('dashboard:hubSwitcher.current')}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#8a726a] flex items-center gap-1 mt-0.5 truncate">
                      <MapPin
                        size={12}
                        weight="fill"
                        className="text-[#486b52] shrink-0"
                      />
                      <span className="truncate">{regionName}</span>
                    </span>
                  </div>
                </div>

                <div className="shrink-0 ml-3">
                  {isCurrent ? (
                    <div className="w-6 h-6 rounded-md bg-[#b85028] text-white flex items-center justify-center shadow-2xs">
                      <Check size={14} weight="bold" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-md flex items-center justify-center text-[#8a726a] group-hover:text-[#b85028] group-hover:bg-white transition-colors">
                      <CaretRight size={14} weight="bold" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {filteredTowns.length === 0 && (
            <div className="py-10 text-center flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-[#faf2ee] text-[#8a726a] flex items-center justify-center mb-2">
                <MapPin size={20} weight="duotone" />
              </div>
              <p className="text-xs font-bold text-[#1e1b19]">
                {t('dashboard:hubSwitcher.noHubsFound')}
              </p>
              <p className="text-[11px] text-[#8a726a] mt-0.5">
                Try searching with another name or code.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#faf2ee] border-t border-[#e8e1dd] flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenMapView();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-white text-[#1e1b19] text-xs font-bold border border-[#e8e1dd] shadow-xs hover:border-[#b85028] hover:text-[#b85028] hover:bg-[#fff9f7] transition cursor-pointer"
          >
            <MapTrifold size={17} weight="duotone" className="text-[#b85028]" />
            <span>{t('dashboard:hubSwitcher.openMapView')}</span>
          </button>

          <div className="flex items-center justify-between text-[11px] text-[#8a726a] px-1">
            <span className="flex items-center gap-1.5">
              <Sparkle size={12} weight="fill" className="text-[#b85028]" />
              <span>{t('common:appName')} Hub</span>
            </span>
            <span className="font-mono text-[10px]">
              {t('dashboard:hubSwitcher.tenRegionsScope')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

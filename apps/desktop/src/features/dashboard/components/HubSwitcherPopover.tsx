import { useTownContext } from '@jrs/client-core';
import {
  CaretRight,
  Check,
  MagnifyingGlass,
  MapPin,
  MapTrifold,
  Sparkle,
  X,
} from '@phosphor-icons/react';
import type React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { CAMEROON_REGIONS } from '../../towns/config/cameroon-map.config';

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
  isSidebarCollapsed = false,
}) => {
  const { availableTowns, activeTownId, setActiveTownId } = useTownContext();
  const [searchQuery, setSearchQuery] = useState('');

  // Map town code to Region display name
  const getRegionName = useCallback((code: string) => {
    const upper = code.toUpperCase();
    const entry = Object.values(CAMEROON_REGIONS).find(
      (r) => r.townCode === upper,
    );
    return entry?.displayNameEn || 'Cameroon Region';
  }, []);

  const filteredTowns = useMemo(() => {
    if (!searchQuery.trim()) return availableTowns;
    const q = searchQuery.toLowerCase();
    return availableTowns.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        getRegionName(t.code).toLowerCase().includes(q),
    );
  }, [availableTowns, searchQuery, getRegionName]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px] transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Floating Card Positioned next to the Sidebar Switch */}
      <div
        className={`fixed top-18 z-50 w-84 sm:w-92 rounded-xl bg-white shadow-2xl border border-[#e8e1dd] overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col transition-all ${
          isSidebarCollapsed ? 'left-[80px]' : 'left-[268px]'
        }`}
      >
        {/* Header */}
        <div className="p-3.5 bg-[#faf2ee] border-b border-[#e8e1dd] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#b85028] text-white flex items-center justify-center shadow-xs">
              <MapPin size={16} weight="fill" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-[#1e1b19] leading-tight">
                Select Fellowship Hub
              </h3>
              <p className="text-[10px] text-[#57423b]">
                Active regional community scope
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#edf3ee] text-[#486b52] text-[10px] font-bold">
              {availableTowns.length} Active
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-[#8a726a] hover:bg-white hover:text-[#1e1b19] transition cursor-pointer"
            >
              <X size={14} weight="bold" />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="p-2.5 border-b border-[#e8e1dd] bg-white">
          <div className="relative flex items-center">
            <MagnifyingGlass
              size={15}
              className="absolute left-3 text-[#8a726a]"
              weight="bold"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find hub by city or code..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#faf2ee] border border-[#e8e1dd] rounded-lg text-xs text-[#1e1b19] placeholder:text-[#8a726a] outline-none transition focus:bg-white focus:border-[#b85028]"
            />
          </div>
        </div>

        {/* Hub List */}
        <div className="p-2 max-h-64 overflow-y-auto space-y-1">
          {filteredTowns.map((town) => {
            const isCurrent = activeTownId === town.id;
            const regionName = getRegionName(town.code);

            return (
              <div
                key={town.id}
                onClick={async () => {
                  await setActiveTownId(town.id);
                  onClose();
                }}
                className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                  isCurrent
                    ? 'bg-[#ffdbcf]/30 border border-[#b85028]'
                    : 'border border-transparent hover:bg-[#faf2ee]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0 shadow-xs ${
                      isCurrent
                        ? 'bg-[#b85028] text-white'
                        : 'bg-[#faf2ee] text-[#57423b] border border-[#e8e1dd] group-hover:bg-white'
                    }`}
                  >
                    {town.code}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#1e1b19] truncate">
                        {town.name} Hub
                      </span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.2 rounded bg-[#ffdbcf] text-[#812901] text-[10px] font-bold">
                          Current
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#8a726a] truncate">
                      {regionName}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 ml-2">
                  {isCurrent ? (
                    <div className="w-5 h-5 rounded bg-[#b85028] text-white flex items-center justify-center">
                      <Check size={12} weight="bold" />
                    </div>
                  ) : (
                    <CaretRight
                      size={14}
                      className="text-[#8a726a] opacity-0 group-hover:opacity-100 transition"
                      weight="bold"
                    />
                  )}
                </div>
              </div>
            );
          })}

          {filteredTowns.length === 0 && (
            <div className="py-6 text-center text-xs text-[#8a726a]">
              No matching fellowship hubs found.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-2.5 bg-[#faf2ee] border-t border-[#e8e1dd] flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenMapView();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white text-[#1e1b19] text-xs font-bold border border-[#e8e1dd] shadow-xs hover:border-[#b85028] hover:text-[#b85028] transition cursor-pointer"
          >
            <MapTrifold size={16} weight="bold" className="text-[#b85028]" />
            <span>Open Cameroon Map View</span>
          </button>

          <div className="flex items-center justify-between text-[10px] text-[#8a726a] px-1">
            <span className="flex items-center gap-1">
              <Sparkle size={11} weight="fill" className="text-[#b85028]" />
              <span>LRC JRS Sanctuary</span>
            </span>
            <span className="font-mono">10 Regions Scope</span>
          </div>
        </div>
      </div>
    </>
  );
};

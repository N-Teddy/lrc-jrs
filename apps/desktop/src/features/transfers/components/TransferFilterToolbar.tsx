import {
  ArrowsLeftRight,
  GridFour,
  MagnifyingGlass,
  Table,
  X,
} from '@phosphor-icons/react';
import type React from 'react';
import { CustomSelect, type SelectOption } from '../../../components';

export type TransferViewMode = 'table' | 'grid';
export type DirectionFilter = 'ALL' | 'INBOUND' | 'OUTBOUND';

interface TransferFilterToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  townFilter: string;
  onTownFilterChange: (townId: string) => void;
  directionFilter: DirectionFilter;
  onDirectionFilterChange: (direction: DirectionFilter) => void;
  townOptions: SelectOption[];
  viewMode: TransferViewMode;
  onViewModeChange: (mode: TransferViewMode) => void;
  onOpenTransferModal: () => void;
  canWrite: boolean;
  hubName?: string;
}

export const TransferFilterToolbar: React.FC<TransferFilterToolbarProps> = ({
  search,
  onSearchChange,
  townFilter,
  onTownFilterChange,
  directionFilter,
  onDirectionFilterChange,
  townOptions,
  viewMode,
  onViewModeChange,
  onOpenTransferModal,
  canWrite,
  hubName = 'Hub',
}) => {
  const directionOptions: SelectOption[] = [
    { value: 'ALL', label: 'All Directions' },
    { value: 'INBOUND', label: `Inbound (${hubName})` },
    { value: 'OUTBOUND', label: `Outbound (${hubName})` },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#e8e1dd] shadow-xs p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
      {/* Left Filter Controls */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1">
        {/* Search Input */}
        <div className="relative flex items-center gap-2.5 px-3.5 h-10 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] flex-1 min-w-[260px] max-w-[420px] focus-within:ring-2 focus-within:ring-[#b85028]/20 focus-within:border-[#b85028] focus-within:bg-white transition-all">
          <MagnifyingGlass
            size={16}
            className="text-[#8a726a] shrink-0"
            weight="bold"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by member, coordinator, city, or note..."
            className="bg-transparent text-xs text-[#1e1b19] placeholder:text-[#8a726a] outline-none w-full pr-6"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 text-[#8a726a] hover:text-[#1e1b19] p-0.5 cursor-pointer"
            >
              <X size={14} weight="bold" />
            </button>
          )}
        </div>

        {/* Town Hub Custom Select */}
        <div className="min-w-[180px]">
          <CustomSelect
            value={townFilter}
            onChange={onTownFilterChange}
            options={townOptions}
            size="md"
            placeholder="Filter Hub..."
          />
        </div>

        {/* Direction Custom Select */}
        <div className="min-w-[170px]">
          <CustomSelect
            value={directionFilter}
            onChange={(val) => onDirectionFilterChange(val as DirectionFilter)}
            options={directionOptions}
            size="md"
            placeholder="Direction..."
          />
        </div>
      </div>

      {/* Right Controls: View Switcher & Primary Action */}
      <div className="flex items-center gap-3 self-end xl:self-auto shrink-0">
        {/* View Switcher */}
        <div className="h-10 flex items-center gap-1 p-1 bg-[#faf2ee] rounded-lg border border-[#e8e1dd]">
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            title="Table View"
            className={`w-8 h-8 rounded-md flex items-center justify-center transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white text-[#b85028] shadow-xs font-bold'
                : 'text-[#8a726a] hover:text-[#1e1b19]'
            }`}
          >
            <Table
              size={18}
              weight={viewMode === 'table' ? 'bold' : 'regular'}
            />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            title="Grid View"
            className={`w-8 h-8 rounded-md flex items-center justify-center transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white text-[#b85028] shadow-xs font-bold'
                : 'text-[#8a726a] hover:text-[#1e1b19]'
            }`}
          >
            <GridFour
              size={18}
              weight={viewMode === 'grid' ? 'bold' : 'regular'}
            />
          </button>
        </div>

        {/* Initiate Transfer Button (When write access exists) */}
        {canWrite && (
          <button
            type="button"
            onClick={onOpenTransferModal}
            className="h-10 flex items-center gap-2 px-4 bg-[#b85028] hover:bg-[#a44520] text-white rounded-lg text-xs font-bold shadow-xs active:scale-[0.98] transition-all cursor-pointer"
          >
            <ArrowsLeftRight size={18} weight="bold" />
            <span>Initiate Transfer</span>
          </button>
        )}
      </div>
    </div>
  );
};

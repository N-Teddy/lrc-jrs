import { useTranslation } from '@jrs/client-core';
import {
  Check,
  GridFour,
  MagnifyingGlass,
  Table,
  UserPlus,
} from '@phosphor-icons/react';
import type React from 'react';
import { CustomSelect, type SelectOption } from '../../../components';

export type ViewMode = 'table' | 'grid';

interface MemberFilterToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (role: string) => void;

  isJrOnly: boolean;
  onToggleJrOnly: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenRegisterModal: () => void;
}

export const MemberFilterToolbar: React.FC<MemberFilterToolbarProps> = ({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,

  isJrOnly,
  onToggleJrOnly,
  viewMode,
  onViewModeChange,
  onOpenRegisterModal,
}) => {
  const { t } = useTranslation();

  const roleOptions: SelectOption[] = [
    { value: 'all', label: t('members:filters.allRoles') },
    { value: 'MEMBER', label: t('roles:member') },
    { value: 'PC', label: t('roles:pc') },
    { value: 'AP', label: t('roles:ap') },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#e8e1dd] shadow-xs p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
      {/* Left Filter Controls */}
      <div className="flex flex-wrap items-center gap-3 flex-1">
        {/* Search Input */}
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#faf2ee] border border-[#e8e1dd] flex-1 min-w-[260px] max-w-[400px] focus-within:ring-2 focus-within:ring-[#b85028] focus-within:bg-white transition-all">
          <MagnifyingGlass size={18} className="text-[#8a726a] shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('members:filters.searchPlaceholder')}
            className="bg-transparent text-sm text-[#1e1b19] placeholder:text-[#8a726a] outline-none w-full"
          />
        </div>

        {/* Role Filter Custom Select */}
        <CustomSelect
          value={roleFilter}
          onChange={onRoleFilterChange}
          options={roleOptions}
        />

        {/* 18–30 JR Toggle Pill */}
        <button
          type="button"
          onClick={onToggleJrOnly}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            isJrOnly
              ? 'bg-[#c2e9ca] text-[#2c4e37] border-[#a9d0b2] shadow-xs'
              : 'bg-[#faf2ee] text-[#57423b] border-[#e8e1dd] hover:bg-[#f4ece9]'
          }`}
        >
          {isJrOnly && <Check size={14} weight="bold" />}
          <span>{t('members:filters.jrEligibleOnly')}</span>
        </button>
      </div>

      {/* Right Controls: View Switcher & Primary Action */}
      <div className="flex items-center gap-3 self-end xl:self-auto shrink-0">
        {/* View Switcher */}
        <div className="flex items-center bg-[#faf2ee] p-1 rounded-xl border border-[#e8e1dd]">
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            title={t('members:filters.tableView')}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
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
            title={t('members:filters.gridView')}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
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

        {/* Register Member Button */}
        <button
          type="button"
          onClick={onOpenRegisterModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#b85028] hover:bg-[#a44520] text-white rounded-xl text-xs font-bold shadow-xs active:scale-[0.98] transition-all cursor-pointer"
        >
          <UserPlus size={18} weight="bold" />
          <span>{t('members:registerMember')}</span>
        </button>
      </div>
    </div>
  );
};

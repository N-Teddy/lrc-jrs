import { useTownContext, useTranslation } from '@jrs/client-core';
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
  const { canWrite } = useTownContext();

  const roleOptions: SelectOption[] = [
    { value: 'all', label: t('members:filters.allRoles') },
    { value: 'MEMBER', label: t('roles:member') },
    { value: 'PC', label: t('roles:pc') },
    { value: 'AP', label: t('roles:ap') },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#e8e1dd] shadow-xs p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
      {/* Left Filter Controls */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1">
        {/* Search Input */}
        <div className="flex items-center gap-2.5 px-3.5 h-10 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] flex-1 min-w-[260px] max-w-[420px] focus-within:ring-2 focus-within:ring-[#b85028]/20 focus-within:border-[#b85028] focus-within:bg-white transition-all">
          <MagnifyingGlass
            size={16}
            className="text-[#8a726a] shrink-0"
            weight="bold"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('members:filters.searchPlaceholder')}
            className="bg-transparent text-xs text-[#1e1b19] placeholder:text-[#8a726a] outline-none w-full"
          />
        </div>

        {/* Role Filter Custom Select */}
        <CustomSelect
          value={roleFilter}
          onChange={onRoleFilterChange}
          options={roleOptions}
          size="md"
        />

        {/* 18–30 JR Toggle Pill */}
        <button
          type="button"
          onClick={onToggleJrOnly}
          className={`h-10 flex items-center gap-1.5 px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
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
        <div className="h-10 flex items-center gap-1 p-1 bg-[#faf2ee] rounded-lg border border-[#e8e1dd]">
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            title={t('members:filters.tableView')}
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
            title={t('members:filters.gridView')}
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

        {/* Register Member Button (Only when write access exists) */}
        {canWrite && (
          <button
            type="button"
            onClick={onOpenRegisterModal}
            className="h-10 flex items-center gap-2 px-4 bg-[#b85028] hover:bg-[#a44520] text-white rounded-lg text-xs font-bold shadow-xs active:scale-[0.98] transition-all cursor-pointer"
          >
            <UserPlus size={18} weight="bold" />
            <span>{t('members:registerMember')}</span>
          </button>
        )}
      </div>
    </div>
  );
};

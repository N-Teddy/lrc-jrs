import { useTownContext, useTranslation } from '@jrs/client-core';
import {
  Check,
  GridFour,
  Link,
  MagnifyingGlass,
  ShieldCheck,
  Table,
  UserPlus,
  X,
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
  onOpenIntakeLinksModal?: () => void;
  pendingReviewsCount?: number;
  onOpenPendingReviewsModal?: () => void;
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
  onOpenIntakeLinksModal,
  pendingReviewsCount = 0,
  onOpenPendingReviewsModal,
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
    <div className="bg-white rounded-xl border border-[#e8e1dd] shadow-xs p-4 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
      {/* Left Filter Controls */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1">
        {/* Search Input */}
        <div className="relative flex items-center gap-2.5 px-3.5 h-10 rounded-md bg-[#faf2ee] border border-[#e8e1dd] focus-within:ring-2 focus-within:ring-[#b85028]/20 focus-within:border-[#b85028] focus-within:bg-white transition-all w-full sm:w-80 md:w-96 flex-initial">
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
            className="bg-transparent text-xs text-[#1e1b19] placeholder:text-[#8a726a] outline-none w-full pr-6"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 text-[#8a726a] hover:text-[#1e1b19] p-0.5 cursor-pointer"
              title="Clear search"
            >
              <X size={14} weight="bold" />
            </button>
          )}
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
          className={`h-10 flex items-center gap-1.5 px-3.5 rounded-md text-xs font-bold transition-all cursor-pointer border ${
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
      <div className="flex items-center gap-2.5 self-end xl:self-auto shrink-0">
        {/* View Switcher */}
        <div className="h-10 flex items-center gap-1 p-1 bg-[#faf2ee] rounded-md border border-[#e8e1dd]">
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

        {/* Register & Intake Actions (Only when write access exists) */}
        {canWrite && (
          <div className="flex items-center gap-2">
            {/* Reviews Queue Button if any pending */}
            {pendingReviewsCount > 0 && onOpenPendingReviewsModal && (
              <button
                type="button"
                onClick={onOpenPendingReviewsModal}
                className="h-10 flex items-center gap-1.5 px-3 bg-[#fff2ee] hover:bg-[#ffe5dc] text-[#b85028] border border-[#ffdbcf] rounded-md text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title={`${pendingReviewsCount} submissions awaiting review`}
              >
                <ShieldCheck size={17} weight="bold" />
                <span>Reviews</span>
                <span className="w-5 h-5 rounded-full bg-[#b85028] text-white text-[10px] flex items-center justify-center font-bold">
                  {pendingReviewsCount}
                </span>
              </button>
            )}

            {/* Intake Links Modal Button */}
            {onOpenIntakeLinksModal && (
              <button
                type="button"
                onClick={onOpenIntakeLinksModal}
                className="h-10 flex items-center gap-1.5 px-3 bg-[#faf2ee] hover:bg-[#f4ece9] text-[#57423b] border border-[#e8e1dd] rounded-md text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title="Share and manage member intake invitation links"
              >
                <Link size={16} weight="bold" />
                <span>Intake Links</span>
              </button>
            )}

            {/* Direct Member Registration Modal */}
            <button
              type="button"
              onClick={onOpenRegisterModal}
              className="h-10 flex items-center gap-2 px-4 bg-[#b85028] hover:bg-[#a44520] text-white rounded-md text-xs font-bold shadow-xs active:scale-[0.98] transition-all cursor-pointer"
            >
              <UserPlus size={18} weight="bold" />
              <span>{t('members:registerMember')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

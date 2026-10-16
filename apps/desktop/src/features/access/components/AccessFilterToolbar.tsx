import { useTranslation } from '@jrs/client-core';
import type { ITown } from '@jrs/shared';
import { MagnifyingGlass, PaperPlaneTilt, X } from '@phosphor-icons/react';
import type React from 'react';
import { useMemo } from 'react';
import { CustomSelect, type SelectOption } from '../../../components';

export type AccountStateFilter = 'ALL' | 'ACTIVE' | 'PENDING' | 'REVOKED';

interface AccessFilterToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedTownId: string | null;
  onTownChange: (townId: string | null) => void;
  availableTowns: ITown[];
  stateFilter: AccountStateFilter;
  onStateFilterChange: (state: AccountStateFilter) => void;
  roleFilter: string;
  onRoleFilterChange: (role: string) => void;
  onOpenBatchInvite: () => void;
  isPrivileged: boolean;
}

export const AccessFilterToolbar: React.FC<AccessFilterToolbarProps> = ({
  search,
  onSearchChange,
  selectedTownId,
  onTownChange,
  availableTowns,
  stateFilter,
  onStateFilterChange,
  roleFilter,
  onRoleFilterChange,
  onOpenBatchInvite,
  isPrivileged,
}) => {
  const { t } = useTranslation(['access', 'common']);

  // Town options
  const townOptions: SelectOption<string>[] = useMemo(() => {
    return [
      {
        value: 'ALL',
        label: t('access:filters.allTowns') || 'All Hubs / Inter-Hub',
      },
      ...availableTowns.map((t) => ({
        value: t.id,
        label: `${t.name} (${t.code})`,
      })),
    ];
  }, [availableTowns, t]);

  // Account state options
  const stateOptions: SelectOption<AccountStateFilter>[] = useMemo(
    () => [
      {
        value: 'ALL',
        label: t('access:filters.allStates') || 'All App Accounts',
      },
      {
        value: 'ACTIVE',
        label: t('access:filters.active') || 'Active Accounts',
      },
      {
        value: 'PENDING',
        label: t('access:filters.pending') || 'Pending First Login',
      },
      {
        value: 'REVOKED',
        label: t('access:filters.suspended') || 'Suspended Access',
      },
    ],
    [t],
  );

  // Role options
  const roleOptions: SelectOption<string>[] = useMemo(
    () => [
      {
        value: 'ALL',
        label: t('access:filters.allRoles') || 'All Roles',
      },
      {
        value: 'AP',
        label: 'AP',
      },
      {
        value: 'PC',
        label: 'PC',
      },
      {
        value: 'MEMBER',
        label: 'Youth Member',
      },
    ],
    [t],
  );

  return (
    <div className="bg-white rounded-xl border border-[#e8e1dd] p-4 shadow-xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
      {/* Search Input */}
      <div className="relative flex items-center gap-2.5 px-3.5 h-10 rounded-md bg-[#faf2ee] border border-[#e8e1dd] focus-within:ring-2 focus-within:ring-[#b85028]/20 focus-within:border-[#b85028] focus-within:bg-white transition-all w-full sm:w-80 md:w-96 flex-initial">
        <MagnifyingGlass
          size={16}
          weight="bold"
          className="text-[#8a726a] shrink-0"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={
            t('access:filters.searchPlaceholder') ||
            'Search by name, phone (+237...), email, or identifier...'
          }
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

      <div className="flex flex-wrap items-center gap-2.5 flex-1 justify-start xl:justify-end">
        {/* Hub Select */}
        <CustomSelect<string>
          value={selectedTownId || 'ALL'}
          onChange={(val) => onTownChange(val === 'ALL' ? null : val)}
          options={townOptions}
          size="md"
          className="w-44"
        />

        {/* Account State Select */}
        <CustomSelect<AccountStateFilter>
          value={stateFilter}
          onChange={onStateFilterChange}
          options={stateOptions}
          size="md"
          className="w-44"
        />

        {/* Role Select */}
        <CustomSelect<string>
          value={roleFilter}
          onChange={onRoleFilterChange}
          options={roleOptions}
          size="md"
          className="w-40"
        />

        {/* Batch Invite Button (AP or PC) */}
        {isPrivileged && (
          <button
            type="button"
            onClick={onOpenBatchInvite}
            className="h-10 px-4 rounded-md bg-[#b85028] hover:bg-[#a44520] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <PaperPlaneTilt size={16} weight="bold" />
            <span>{t('access:filters.batchInvite') || 'Batch Invite'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

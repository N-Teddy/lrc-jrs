import { useTranslation } from '@jrs/client-core';
import type { ITown } from '@jrs/shared';
import {
  ClockCounterClockwise,
  MagnifyingGlass,
  PaperPlaneTilt,
  ShieldCheck,
  Users,
  X,
} from '@phosphor-icons/react';
import type React from 'react';
import { useMemo } from 'react';
import { CustomSelect, type SelectOption } from '../../../components';

export type AccessTabId = 'directory' | 'permissions' | 'audit';
export type AccountStateFilter =
  | 'ALL'
  | 'ACTIVE'
  | 'PENDING'
  | 'REVOKED'
  | 'OFFLINE';

interface AccessFilterToolbarProps {
  activeTab: AccessTabId;
  onSelectTab: (tab: AccessTabId) => void;
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
  activeTab,
  onSelectTab,
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
        label: t('access:filters.allTowns') || 'All Hubs / Diocesan',
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
        label: t('access:filters.allStates') || 'All Account States',
      },
      {
        value: 'ACTIVE',
        label: t('access:filters.active') || 'Active Only',
      },
      {
        value: 'PENDING',
        label: t('access:filters.pending') || 'Pending First Login',
      },
      {
        value: 'REVOKED',
        label: t('access:filters.suspended') || 'Suspended',
      },
      {
        value: 'OFFLINE',
        label: t('access:filters.offline') || 'Offline (No App Access)',
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
        label: 'Apostolic Prefect (AP)',
      },
      {
        value: 'PC',
        label: 'Parish Coordinator (PC)',
      },
      {
        value: 'MEMBER',
        label: 'Youth Member',
      },
    ],
    [t],
  );

  const navTabs: { id: AccessTabId; label: string; icon: React.ElementType }[] =
    [
      {
        id: 'directory',
        label: t('access:tabs.directory') || 'Accounts Directory',
        icon: Users,
      },
      {
        id: 'permissions',
        label: t('access:tabs.permissions') || 'Permissions & Scopes',
        icon: ShieldCheck,
      },
      {
        id: 'audit',
        label: t('access:tabs.audit') || 'Security & Credential Logs',
        icon: ClockCounterClockwise,
      },
    ];

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Sub-Navigation Segmented Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="inline-flex p-1 rounded-2xl bg-[#faf2ee] border border-[#e8e1dd] shadow-2xs">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-[#b85028] shadow-xs'
                    : 'text-[#8a726a] hover:text-[#1e1b19]'
                }`}
              >
                <Icon size={16} weight={isActive ? 'bold' : 'regular'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Batch Invite Button (AP or PC) */}
        {isPrivileged && (
          <button
            type="button"
            onClick={onOpenBatchInvite}
            className="h-10 px-4 rounded-xl bg-[#b85028] hover:bg-[#a44520] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <PaperPlaneTilt size={16} weight="bold" />
            <span>{t('access:filters.batchInvite') || 'Batch Invite'}</span>
          </button>
        )}
      </div>

      {/* 2. Filter & Search Controls (Only applicable in Directory tab) */}
      {activeTab === 'directory' && (
        <div className="bg-white rounded-2xl border border-[#e8e1dd] p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <MagnifyingGlass
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a726a]"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={
                t('access:filters.searchPlaceholder') ||
                'Search by name, phone (+237...), email, or identifier...'
              }
              className="w-full h-10 pl-9 pr-8 rounded-lg bg-[#faf2ee] border border-transparent focus:border-[#b85028] focus:bg-white text-xs text-[#1e1b19] placeholder-[#8a726a] outline-none transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a726a] hover:text-[#1e1b19] p-1 cursor-pointer"
              >
                <X size={14} weight="bold" />
              </button>
            )}
          </div>

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
        </div>
      )}
    </div>
  );
};

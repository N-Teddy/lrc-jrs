import { useTownContext, useTranslation } from '@jrs/client-core';
import { ActivityStatus, ActivityType } from '@jrs/shared';
import {
  ArrowCounterClockwise,
  Calendar,
  CalendarPlus,
  GridFour,
  MagnifyingGlass,
  Table,
  X,
} from '@phosphor-icons/react';
import type React from 'react';
import { useMemo } from 'react';
import {
  CustomSelect,
  DatePeriodFilter,
  type SelectOption,
} from '../../../components';

export type ActivityViewMode = 'table' | 'grid' | 'calendar';

interface ActivityFilterToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  year: number | undefined;
  onYearChange: (year: number | undefined) => void;
  month: number | undefined;
  onMonthChange: (month: number | undefined) => void;
  activityType: ActivityType | 'all';
  onActivityTypeChange: (type: ActivityType | 'all') => void;
  status: ActivityStatus | 'all';
  onStatusChange: (status: ActivityStatus | 'all') => void;
  viewMode: ActivityViewMode;
  onViewModeChange: (mode: ActivityViewMode) => void;
  onOpenCreateModal: () => void;
  onClearFilters: () => void;
}

export const ActivityFilterToolbar: React.FC<ActivityFilterToolbarProps> = ({
  search,
  onSearchChange,
  year,
  onYearChange,
  month,
  onMonthChange,
  activityType,
  onActivityTypeChange,
  status,
  onStatusChange,
  viewMode,
  onViewModeChange,
  onOpenCreateModal,
  onClearFilters,
}) => {
  const { t } = useTranslation();
  const { canWrite } = useTownContext();

  const typeOptions: SelectOption[] = useMemo(
    () => [
      { value: 'all', label: t('activities:filters.allTypes') },
      {
        value: ActivityType.MONTHLY_MEETING,
        label: t('activities:types.MONTHLY_MEETING'),
      },
      { value: ActivityType.SERVICE, label: t('activities:types.SERVICE') },
      {
        value: ActivityType.CONFERENCE,
        label: t('activities:types.CONFERENCE'),
      },
      {
        value: ActivityType.RECREATIONAL,
        label: t('activities:types.RECREATIONAL'),
      },
      { value: ActivityType.CAUSERIE, label: t('activities:types.CAUSERIE') },
      { value: ActivityType.JPO, label: t('activities:types.JPO') },
    ],
    [t],
  );

  const statusOptions: SelectOption[] = useMemo(
    () => [
      { value: 'all', label: t('activities:filters.allStatuses') },
      {
        value: ActivityStatus.SCHEDULED,
        label: t('activities:statuses.SCHEDULED'),
      },
      {
        value: ActivityStatus.IN_PROGRESS,
        label: t('activities:statuses.IN_PROGRESS'),
      },
      {
        value: ActivityStatus.COMPLETED,
        label: t('activities:statuses.COMPLETED'),
      },
      {
        value: ActivityStatus.CANCELLED,
        label: t('activities:statuses.CANCELLED'),
      },
    ],
    [t],
  );

  const hasActiveFilters =
    Boolean(search) ||
    year !== undefined ||
    month !== undefined ||
    activityType !== 'all' ||
    status !== 'all';

  return (
    <div className="bg-white rounded-xl border border-[#e8e1dd] shadow-xs p-4 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
      {/* Left Filter Controls */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1">
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
            placeholder={t('activities:filters.searchPlaceholder')}
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

        {/* Unified DatePeriodFilter */}
        <DatePeriodFilter
          year={year}
          month={month}
          onPeriodChange={(y, m) => {
            onYearChange(y);
            onMonthChange(m);
          }}
          availableYears={[2026, 2025, 2024]}
          size="md"
        />

        {/* Activity Type Custom Select */}
        <CustomSelect
          value={activityType}
          onChange={(val) => onActivityTypeChange(val as ActivityType | 'all')}
          options={typeOptions}
          size="md"
        />

        {/* Status Custom Select */}
        <CustomSelect
          value={status}
          onChange={(val) => onStatusChange(val as ActivityStatus | 'all')}
          options={statusOptions}
          size="md"
        />

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="h-10 px-3.5 bg-[#faf2ee] hover:bg-[#f4ece9] rounded-md border border-[#e8e1dd] text-[#8a726a] hover:text-[#b85028] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowCounterClockwise size={14} weight="bold" />
            <span>{t('activities:filters.clear')}</span>
          </button>
        )}
      </div>

      {/* Right Controls: View Switcher (Icon Only) & Primary Action Button */}
      <div className="flex items-center gap-2.5 self-end xl:self-auto shrink-0">
        {/* View Mode Segmented Controls - Icon Only */}
        <div className="h-10 flex items-center gap-1 p-1 bg-[#faf2ee] rounded-md border border-[#e8e1dd]">
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            title={t('activities:views.table')}
            className={`w-8 h-8 rounded-md flex items-center justify-center transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white text-[#b85028] shadow-xs'
                : 'text-[#57423b] hover:text-[#1e1b19]'
            }`}
          >
            <Table size={18} weight={viewMode === 'table' ? 'fill' : 'bold'} />
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            title={t('activities:views.grid')}
            className={`w-8 h-8 rounded-md flex items-center justify-center transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white text-[#b85028] shadow-xs'
                : 'text-[#57423b] hover:text-[#1e1b19]'
            }`}
          >
            <GridFour
              size={18}
              weight={viewMode === 'grid' ? 'fill' : 'bold'}
            />
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange('calendar')}
            title={t('activities:views.calendar')}
            className={`w-8 h-8 rounded-md flex items-center justify-center transition-all cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-white text-[#b85028] shadow-xs'
                : 'text-[#57423b] hover:text-[#1e1b19]'
            }`}
          >
            <Calendar
              size={18}
              weight={viewMode === 'calendar' ? 'fill' : 'bold'}
            />
          </button>
        </div>

        {/* Planifier une activité / Create Activity Button (Only when write access exists) */}
        {canWrite && (
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="h-10 flex items-center gap-2 px-4 bg-[#b85028] hover:bg-[#a44520] text-white rounded-md text-xs font-bold shadow-xs active:scale-[0.98] transition-all cursor-pointer"
          >
            <CalendarPlus size={18} weight="bold" />
            <span>+ {t('activities:createActivity')}</span>
          </button>
        )}
      </div>
    </div>
  );
};

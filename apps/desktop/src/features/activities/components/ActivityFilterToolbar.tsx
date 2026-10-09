import { useTownContext, useTranslation } from '@jrs/client-core';
import { ActivityStatus, ActivityType } from '@jrs/shared';
import {
  ArrowCounterClockwise,
  Calendar,
  CalendarPlus,
  GridFour,
  MagnifyingGlass,
  Table,
} from '@phosphor-icons/react';
import type React from 'react';
import { CustomSelect, type SelectOption } from '../../../components';

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

const PERIOD_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All Dates' },
  { value: '2026-all', label: 'Cycle 2026 (Full Year)' },
  { value: '2026-1', label: 'January 2026' },
  { value: '2026-2', label: 'February 2026' },
  { value: '2026-3', label: 'March 2026' },
  { value: '2026-4', label: 'April 2026' },
  { value: '2026-5', label: 'May 2026' },
  { value: '2026-6', label: 'June 2026' },
  { value: '2026-7', label: 'July 2026' },
  { value: '2026-8', label: 'August 2026' },
  { value: '2026-9', label: 'September 2026' },
  { value: '2026-10', label: 'October 2026' },
  { value: '2026-11', label: 'November 2026' },
  { value: '2026-12', label: 'December 2026' },
  { value: '2025-all', label: 'Cycle 2025 (Archive)' },
];

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

  const typeOptions: SelectOption[] = [
    { value: 'all', label: t('activities:filters.allTypes') },
    { value: ActivityType.MONTHLY_MEETING, label: 'Monthly Meeting' },
    { value: ActivityType.SERVICE, label: 'Service' },
    { value: ActivityType.CONFERENCE, label: 'Conference' },
    { value: ActivityType.RECREATIONAL, label: 'Recreational' },
    { value: ActivityType.CAUSERIE, label: 'Causerie' },
    { value: ActivityType.JPO, label: 'JPO' },
  ];

  const statusOptions: SelectOption[] = [
    { value: 'all', label: t('activities:filters.allStatuses') },
    { value: ActivityStatus.SCHEDULED, label: 'Scheduled' },
    { value: ActivityStatus.IN_PROGRESS, label: 'In Progress / Live' },
    { value: ActivityStatus.COMPLETED, label: 'Completed' },
    { value: ActivityStatus.CANCELLED, label: 'Cancelled' },
  ];

  // Combined period value
  const currentPeriodValue =
    year === undefined && month === undefined
      ? 'all'
      : month !== undefined && year !== undefined
        ? `${year}-${month}`
        : year !== undefined
          ? `${year}-all`
          : 'all';

  const handlePeriodChange = (val: string) => {
    if (val === 'all') {
      onYearChange(undefined);
      onMonthChange(undefined);
    } else if (val.endsWith('-all')) {
      const y = Number(val.split('-')[0]);
      onYearChange(y);
      onMonthChange(undefined);
    } else {
      const parts = val.split('-');
      onYearChange(Number(parts[0]));
      onMonthChange(Number(parts[1]));
    }
  };

  const hasActiveFilters =
    Boolean(search) ||
    currentPeriodValue !== 'all' ||
    activityType !== 'all' ||
    status !== 'all';

  return (
    <div className="bg-white rounded-2xl border border-[#e8e1dd] shadow-xs p-4 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
      {/* Left Filter Controls */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1">
        {/* Search Input */}
        <div className="relative w-full sm:w-80 md:w-96 flex-initial">
          <MagnifyingGlass
            size={16}
            weight="bold"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a726a]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('activities:filters.searchPlaceholder')}
            className="h-10 w-full pl-9 pr-3.5 bg-[#faf2ee] rounded-lg text-xs text-[#1e1b19] placeholder:text-[#8a726a] outline-none focus:bg-white focus:ring-2 focus:ring-[#b85028]/20 border border-[#e8e1dd] focus:border-[#b85028] transition-all"
          />
        </div>

        {/* Combined Period Custom Select */}
        <CustomSelect
          value={currentPeriodValue}
          onChange={handlePeriodChange}
          options={PERIOD_OPTIONS}
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
            className="h-10 px-3.5 bg-[#faf2ee] hover:bg-[#f4ece9] rounded-lg border border-[#e8e1dd] text-[#8a726a] hover:text-[#b85028] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowCounterClockwise size={14} weight="bold" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Right Controls: View Switcher (Icon Only) & Primary Action Button */}
      <div className="flex items-center gap-3 self-end xl:self-auto shrink-0">
        {/* View Mode Segmented Controls - Icon Only */}
        <div className="h-10 flex items-center gap-1 p-1 bg-[#faf2ee] rounded-lg border border-[#e8e1dd]">
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
            className="h-10 flex items-center gap-2 px-4 bg-[#b85028] hover:bg-[#a44520] text-white rounded-lg text-xs font-bold shadow-xs active:scale-[0.98] transition-all cursor-pointer"
          >
            <CalendarPlus size={18} weight="bold" />
            <span>+ {t('activities:createActivity')}</span>
          </button>
        )}
      </div>
    </div>
  );
};

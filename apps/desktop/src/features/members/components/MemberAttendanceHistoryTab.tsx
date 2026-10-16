import {
  useMemberAttendanceHistoryQuery,
  useTranslation,
} from '@jrs/client-core';
import {
  ActivityType,
  AttendanceStatus,
  type IMemberAttendanceHistoryItem,
  type IUser,
  type MemberEngagementLevel,
} from '@jrs/shared';
import {
  CalendarBlank,
  CalendarCheck,
  ChatCircleText,
  CheckCircle,
  Clock,
  Fire,
  GlobeHemisphereWest,
  MagnifyingGlass,
  MapPin,
  Warning,
  WarningCircle,
  XCircle,
} from '@phosphor-icons/react';
import type React from 'react';
import { useMemo, useState } from 'react';
import { CustomSelect, type SelectOption } from '../../../components';
import { getActivityTypeConfig } from '../../activities/utils/activity-ui.utils';
import { getCleanDigitsForWhatsApp } from '../utils/member-ui.utils';

interface MemberAttendanceHistoryTabProps {
  member: IUser;
}

function getEngagementConfig(level: MemberEngagementLevel) {
  switch (level) {
    case 'COMMITTED':
      return {
        label: 'Committed Fellow',
        badgeBg: 'bg-[#c2e9ca]',
        badgeText: 'text-[#2c4e37]',
        borderColor: 'border-[#a9d0b2]',
        description: 'Consistent participant attending ≥70% of gatherings.',
      };
    case 'OCCASIONAL':
      return {
        label: 'Occasional Attendee',
        badgeBg: 'bg-[#ffdbcf]',
        badgeText: 'text-[#812901]',
        borderColor: 'border-[#ffb59c]',
        description: 'Active participant attending between 40% and 70%.',
      };
    case 'IRREGULAR':
      return {
        label: 'Irregular Attendance',
        badgeBg: 'bg-[#faf2ee]',
        badgeText: 'text-[#57423b]',
        borderColor: 'border-[#e8e1dd]',
        description:
          'Turnout below 40%. May benefit from pastoral re-engagement.',
      };
    case 'NEEDS_FOLLOW_UP':
      return {
        label: 'Needs Follow-Up',
        badgeBg: 'bg-[#ffdad6]',
        badgeText: 'text-[#ba1a1a]',
        borderColor: 'border-[#ffb4a8]',
        description:
          'Missed 2 or more consecutive gatherings. Immediate pastoral contact advised.',
      };
    case 'NEW':
      return {
        label: 'New Participant',
        badgeBg: 'bg-[#faf2ee]',
        badgeText: 'text-[#8a726a]',
        borderColor: 'border-[#e8e1dd]',
        description:
          'Recently enrolled in registry with initial gathering records.',
      };
    default:
      return {
        label: 'New Participant',
        badgeBg: 'bg-[#faf2ee]',
        badgeText: 'text-[#8a726a]',
        borderColor: 'border-[#e8e1dd]',
        description:
          'Recently enrolled in registry with initial gathering records.',
      };
  }
}

function getAttendanceStatusBadge(status: AttendanceStatus) {
  switch (status) {
    case AttendanceStatus.PRESENT:
      return {
        label: 'Present',
        bg: 'bg-[#c2e9ca]',
        text: 'text-[#2c4e37]',
        border: 'border-[#a9d0b2]',
        icon: CheckCircle,
      };
    case AttendanceStatus.ABSENT:
      return {
        label: 'Absent',
        bg: 'bg-[#ffdad6]',
        text: 'text-[#ba1a1a]',
        border: 'border-[#ffb4a8]',
        icon: XCircle,
      };
    default:
      return {
        label: 'Absent',
        bg: 'bg-[#ffdad6]',
        text: 'text-[#ba1a1a]',
        border: 'border-[#ffb4a8]',
        icon: XCircle,
      };
  }
}

function getFilterLabel(
  t: (key: string) => string,
  key: string,
  fallback: string,
): string {
  const val = t(key);
  if (!val || val === key || val.includes(':')) {
    return fallback;
  }
  return val;
}

export const MemberAttendanceHistoryTab: React.FC<
  MemberAttendanceHistoryTabProps
> = ({ member }) => {
  const {
    data: history,
    isLoading,
    error,
    refetch,
  } = useMemberAttendanceHistoryQuery(member.id);

  const { t, i18n } = useTranslation([
    'members',
    'activities',
    'attendance',
    'common',
  ]);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AttendanceStatus>(
    'ALL',
  );
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'HOME' | 'EXTERNAL'>(
    'ALL',
  );
  const [selectedHubFilter, setSelectedHubFilter] = useState<string | null>(
    null,
  );
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');

  // Year options dynamically derived from history items
  const yearOptions: SelectOption<string>[] = useMemo(() => {
    const yearsSet = new Set<number>([2026, 2025, 2024]);
    if (history?.items) {
      for (const item of history.items) {
        if (item.startDate) {
          const yr = new Date(item.startDate).getFullYear();
          if (!Number.isNaN(yr)) yearsSet.add(yr);
        }
      }
    }
    const sortedYears = Array.from(yearsSet).sort((a, b) => b - a);
    return [
      {
        value: 'ALL',
        label: getFilterLabel(t, 'members:filters.allYears', 'All Years'),
      },
      ...sortedYears.map((yr) => ({
        value: String(yr),
        label: `${yr}`,
      })),
    ];
  }, [history?.items, t]);

  // Month options localized with full month names
  const monthOptions: SelectOption<string>[] = useMemo(() => {
    const lang = i18n.language || 'en';
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      const monthName = new Date(2026, i, 1).toLocaleString(lang, {
        month: 'long',
      });
      const capitalized =
        monthName.charAt(0).toUpperCase() + monthName.slice(1);
      return {
        value: String(monthNum),
        label: capitalized,
      };
    });

    return [
      {
        value: 'ALL',
        label: getFilterLabel(t, 'members:filters.allMonths', 'All Months'),
      },
      ...months,
    ];
  }, [t, i18n.language]);

  // Status options localized
  const statusOptions: SelectOption<string>[] = useMemo(
    () => [
      {
        value: 'ALL',
        label: getFilterLabel(t, 'members:filters.allStatuses', 'All Statuses'),
      },
      {
        value: AttendanceStatus.PRESENT,
        label: getFilterLabel(t, 'members:filters.present', 'Present'),
      },
      {
        value: AttendanceStatus.ABSENT,
        label: getFilterLabel(t, 'members:filters.absent', 'Absent'),
      },
    ],
    [t],
  );

  // Scope options localized
  const scopeOptions: SelectOption<string>[] = useMemo(
    () => [
      {
        value: 'ALL',
        label: getFilterLabel(t, 'members:filters.allHubs', 'All Hubs'),
      },
      {
        value: 'HOME',
        label: getFilterLabel(t, 'members:filters.homeHub', 'Home Hub'),
      },
      {
        value: 'EXTERNAL',
        label: getFilterLabel(
          t,
          'members:filters.externalVisits',
          'External Visits',
        ),
      },
    ],
    [t],
  );

  // Filtered attendance items
  const filteredItems = useMemo(() => {
    if (!history?.items) return [];

    return history.items.filter((item: IMemberAttendanceHistoryItem) => {
      // 1. Search text filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = item.activityTitle.toLowerCase().includes(query);
        const matchesVenue = item.venue?.toLowerCase().includes(query) ?? false;
        const matchesTown =
          item.townName?.toLowerCase().includes(query) ||
          item.townCode?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesVenue && !matchesTown) {
          return false;
        }
      }

      // 2. Status filter
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }

      // 3. Scope filter
      if (scopeFilter === 'HOME' && item.isExternal) {
        return false;
      }
      if (scopeFilter === 'EXTERNAL' && !item.isExternal) {
        return false;
      }

      // 4. Selected visited hub filter
      if (selectedHubFilter && item.townId !== selectedHubFilter) {
        return false;
      }

      // 5. Year filter
      if (selectedYear !== 'ALL' && item.startDate) {
        const itemYear = new Date(item.startDate).getFullYear().toString();
        if (itemYear !== selectedYear) {
          return false;
        }
      }

      // 6. Month filter
      if (selectedMonth !== 'ALL' && item.startDate) {
        const itemMonth = (new Date(item.startDate).getMonth() + 1).toString();
        if (itemMonth !== selectedMonth) {
          return false;
        }
      }

      return true;
    });
  }, [
    history?.items,
    searchQuery,
    statusFilter,
    scopeFilter,
    selectedHubFilter,
    selectedYear,
    selectedMonth,
  ]);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    statusFilter !== 'ALL' ||
    scopeFilter !== 'ALL' ||
    Boolean(selectedHubFilter) ||
    selectedYear !== 'ALL' ||
    selectedMonth !== 'ALL';

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setScopeFilter('ALL');
    setSelectedHubFilter(null);
    setSelectedYear('ALL');
    setSelectedMonth('ALL');
  };

  const cleanDigits = getCleanDigitsForWhatsApp(member.phoneNumber);
  const engagement = history
    ? getEngagementConfig(history.engagementLevel)
    : null;

  // Hub pre-filled WhatsApp message
  const pastoralMessage = encodeURIComponent(
    `Bonjour ${member.fullName}, nous avons remarqué votre absence aux récentes rencontres de la Jeunesse LRC. Nous espérons que vous vous portez bien et restons disponibles si vous avez besoin d'accompagnement ou de prière. Que Dieu vous bénisse !`,
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        {/* KPI Skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 rounded-3xl bg-white border border-[#e8e1dd] p-5 flex flex-col justify-between"
            >
              <div className="h-4 w-24 bg-[#f4ece9] rounded" />
              <div className="h-8 w-16 bg-[#f4ece9] rounded" />
            </div>
          ))}
        </div>
        {/* Table Skeleton */}
        <div className="h-72 rounded-3xl bg-white border border-[#e8e1dd]" />
      </div>
    );
  }

  if (error || !history) {
    return (
      <div className="bg-white rounded-3xl border border-[#e8e1dd] p-10 text-center flex flex-col items-center">
        <div className="w-12 h-12 rounded-2xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center mb-3">
          <WarningCircle size={24} weight="bold" />
        </div>
        <h4 className="text-sm font-bold text-[#1e1b19] mb-1">
          Unable to Load Attendance History
        </h4>
        <p className="text-xs text-[#8a726a] mb-4 max-w-md">
          Could not retrieve gathering attendance records for this member from
          the fellowship registry.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-4 py-2 rounded-lg bg-[#faf2ee] hover:bg-[#f4ece9] text-xs font-bold text-[#1e1b19] border border-[#e8e1dd] transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  const isNeedsFollowUp =
    history.engagementLevel === 'NEEDS_FOLLOW_UP' ||
    history.consecutiveMissed >= 2;

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Top KPI Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Hub Attendance Rate & Engagement */}
        <div className="bg-white rounded-3xl border border-[#e8e1dd] p-5 shadow-xs flex flex-col justify-between gap-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
              Hub Attendance Rate
            </span>
            <span className="p-1.5 rounded-lg bg-[#faf2ee] text-[#b85028]">
              <CalendarCheck size={16} weight="bold" />
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#1e1b19] tracking-tight">
              {history.hubAttendanceRate}%
            </span>
            <span className="text-xs text-[#8a726a]">
              ({history.totalAttended} /{' '}
              {history.hubActivitiesCount || history.totalAttended} held)
            </span>
          </div>

          {engagement && (
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${engagement.badgeBg} ${engagement.badgeText} ${engagement.borderColor}`}
              >
                {engagement.label}
              </span>
            </div>
          )}
        </div>

        {/* Card 2: Attendance Breakdown */}
        <div className="bg-white rounded-3xl border border-[#e8e1dd] p-5 shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
              Gatherings Turnout
            </span>
            <span className="p-1.5 rounded-lg bg-[#faf2ee] text-[#486b52]">
              <CheckCircle size={16} weight="bold" />
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#486b52] tracking-tight">
              {history.totalAttended}
            </span>
            <span className="text-xs text-[#8a726a]">Gatherings Present</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-medium">
            <span className="inline-flex items-center gap-1 text-[#ba1a1a] bg-[#ffdad6]/60 px-1.5 py-0.5 rounded">
              <XCircle size={12} weight="bold" />
              <span>{history.totalAbsent} Absent</span>
            </span>
          </div>
        </div>

        {/* Card 3: Momentum & Consecutive Streak */}
        <div className="bg-white rounded-3xl border border-[#e8e1dd] p-5 shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
              Current Streak
            </span>
            <span className="p-1.5 rounded-lg bg-[#faf2ee] text-[#b85028]">
              <Fire size={16} weight="fill" />
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            {history.consecutiveAttended > 0 ? (
              <>
                <span className="text-3xl font-extrabold text-[#b85028] tracking-tight">
                  {history.consecutiveAttended}
                </span>
                <span className="text-xs text-[#57423b] font-medium">
                  Gatherings in a row 🔥
                </span>
              </>
            ) : history.consecutiveMissed > 0 ? (
              <>
                <span className="text-3xl font-extrabold text-[#ba1a1a] tracking-tight">
                  {history.consecutiveMissed}
                </span>
                <span className="text-xs text-[#ba1a1a] font-medium">
                  Missed in a row ⚠️
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-[#8a726a]">
                No streak
              </span>
            )}
          </div>

          <div className="text-[11px] text-[#8a726a]">
            Recent 5 turnout:{' '}
            <span className="font-mono font-bold text-[#1e1b19]">
              {history.recentTurnoutRatio}
            </span>
          </div>
        </div>

        {/* Card 4: Cross-Hub Mobility */}
        <div className="bg-white rounded-3xl border border-[#e8e1dd] p-5 shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
              Cross-Hub Mobility
            </span>
            <span className="p-1.5 rounded-lg bg-[#faf2ee] text-[#b85028]">
              <GlobeHemisphereWest size={16} weight="bold" />
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#1e1b19] tracking-tight">
              {history.externalVisitsCount}
            </span>
            <span className="text-xs text-[#8a726a]">External Visits</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 min-h-[22px]">
            {history.visitedHubs && history.visitedHubs.length > 0 ? (
              history.visitedHubs.map((hub) => {
                const isSelected = selectedHubFilter === hub.townId;
                return (
                  <button
                    key={hub.townId}
                    type="button"
                    onClick={() =>
                      setSelectedHubFilter(isSelected ? null : hub.townId)
                    }
                    title={`Click to filter by ${hub.townName}`}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer border ${
                      isSelected
                        ? 'bg-[#b85028] text-white border-[#b85028]'
                        : 'bg-[#faf2ee] text-[#57423b] border-[#e8e1dd] hover:bg-[#f4ece9]'
                    }`}
                  >
                    <span>{hub.townCode}</span>
                    <span className="opacity-75">({hub.visitCount})</span>
                  </button>
                );
              })
            ) : (
              <span className="text-[11px] text-[#8a726a]">
                Home parish gatherings only
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Follow-Up Alert Banner (When member needs follow-up) */}
      {isNeedsFollowUp && (
        <div className="bg-[#fff2ee] border border-[#ffb59c] rounded-3xl p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0 mt-0.5">
              <Warning size={22} weight="bold" />
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="text-xs font-bold text-[#812901] uppercase tracking-wider">
                Follow-Up Recommended
              </h4>
              <p className="text-xs text-[#57423b] leading-relaxed">
                {member.fullName} has missed{' '}
                <strong className="text-[#ba1a1a]">
                  {history.consecutiveMissed > 0
                    ? `${history.consecutiveMissed} consecutive gatherings`
                    : 'several recent fellowship activities'}
                </strong>
                . A pastoral check-in is advised to provide fellowship support.
              </p>
            </div>
          </div>

          {member.phoneNumber && (
            <a
              href={`https://wa.me/${cleanDigits}?text=${pastoralMessage}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#c2e9ca] hover:bg-[#a9d0b2] text-[#2c4e37] text-xs font-bold transition-all shadow-2xs shrink-0 cursor-pointer"
            >
              <ChatCircleText size={18} weight="fill" />
              <span>Send Follow-Up Check-in</span>
            </a>
          )}
        </div>
      )}

      {/* 3. Search and Filters Toolbar */}
      <div className="bg-white rounded-3xl border border-[#e8e1dd] p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <MagnifyingGlass
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a726a]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search gathering by title, venue, or parish..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#faf2ee] border border-transparent focus:border-[#b85028] focus:bg-white text-xs text-[#1e1b19] placeholder-[#8a726a] outline-none transition-all"
          />
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status CustomSelect Filter */}
          <CustomSelect<string>
            value={statusFilter}
            onChange={(val) => setStatusFilter(val as 'ALL' | AttendanceStatus)}
            options={statusOptions}
            size="sm"
            className="w-36"
          />

          {/* Scope CustomSelect Filter */}
          <CustomSelect<string>
            value={scopeFilter}
            onChange={(val) =>
              setScopeFilter(val as 'ALL' | 'HOME' | 'EXTERNAL')
            }
            options={scopeOptions}
            size="sm"
            className="w-36"
          />

          {/* Year and Month CustomSelect Filters */}
          <CustomSelect<string>
            value={selectedYear}
            onChange={setSelectedYear}
            options={yearOptions}
            size="sm"
            className="w-32"
          />

          <CustomSelect<string>
            value={selectedMonth}
            onChange={setSelectedMonth}
            options={monthOptions}
            size="sm"
            className="w-40"
          />

          {/* Reset button if active */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#ba1a1a] hover:bg-[#ffdad6]/50 transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* 4. Gatherings Chronological History Table */}
      <div className="bg-white rounded-3xl border border-[#e8e1dd] shadow-xs overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-[#e8e1dd] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#1e1b19]">
              Gathering Attendance Records
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-[#faf2ee] text-[#8a726a] text-xs font-bold font-mono">
              {filteredItems.length} of {history.items.length}
            </span>
          </div>

          {selectedHubFilter && (
            <div className="flex items-center gap-1.5 text-xs text-[#8a726a]">
              <span>Filtered by visited hub:</span>
              <span className="font-bold text-[#b85028] font-mono">
                {selectedHubFilter}
              </span>
              <button
                type="button"
                onClick={() => setSelectedHubFilter(null)}
                className="text-[#ba1a1a] hover:underline cursor-pointer"
              >
                (Clear)
              </button>
            </div>
          )}
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-[#faf2ee] text-[#8a726a] flex items-center justify-center mb-3">
              <CalendarBlank size={24} />
            </div>
            <h4 className="text-sm font-bold text-[#1e1b19] mb-1">
              {hasActiveFilters
                ? 'No matching attendance records'
                : 'No gathering records found'}
            </h4>
            <p className="text-xs text-[#8a726a] max-w-sm mb-4">
              {hasActiveFilters
                ? 'Try adjusting your search keywords, status filter, or hub scope.'
                : 'This member has not yet had attendance logged for fellowship gatherings.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-4 py-2 rounded-lg bg-[#faf2ee] hover:bg-[#f4ece9] text-xs font-bold text-[#b85028] transition-colors cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#faf2ee]/70 text-[#8a726a] font-bold uppercase tracking-wider text-[11px] border-b border-[#e8e1dd]">
                  <th className="py-3.5 px-6">Date & Schedule</th>
                  <th className="py-3.5 px-6">Gathering / Activity</th>
                  <th className="py-3.5 px-6">Location & Parish</th>
                  <th className="py-3.5 px-6">Check-In Time</th>
                  <th className="py-3.5 px-6 text-right">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4ece9]">
                {filteredItems.map((item) => {
                  const typeConfig = getActivityTypeConfig(
                    item.activityType as ActivityType,
                  );
                  const statusBadge = getAttendanceStatusBadge(item.status);
                  const StatusIcon = statusBadge.icon;
                  const TypeIcon = typeConfig.icon;

                  const formattedDate = new Date(
                    item.startDate,
                  ).toLocaleDateString('en-GB', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  const formattedStartTime = new Date(
                    item.startDate,
                  ).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  const formattedEndTime = new Date(
                    item.endDate,
                  ).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  const formattedCheckIn = item.checkInTime
                    ? new Date(item.checkInTime).toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : null;

                  return (
                    <tr
                      key={`${item.activityId}-${item.id}`}
                      className="hover:bg-[#faf2ee]/40 transition-colors"
                    >
                      {/* Date & Schedule */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-[#1e1b19]">
                            {formattedDate}
                          </span>
                          <span className="text-[11px] text-[#8a726a] flex items-center gap-1 font-mono">
                            <Clock size={12} />
                            <span>
                              {formattedStartTime} - {formattedEndTime}
                            </span>
                          </span>
                        </div>
                      </td>

                      {/* Activity Title & Type */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1 max-w-xs sm:max-w-md">
                          <span className="font-bold text-[#1e1b19] line-clamp-1">
                            {item.activityTitle}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${typeConfig.badgeBg} ${typeConfig.badgeText} ${typeConfig.badgeBorder}`}
                            >
                              <TypeIcon size={12} weight="bold" />
                              <span>{typeConfig.label}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Location & Town */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-[#f4ece9] text-[#57423b] text-[10px] font-mono font-bold">
                              {item.townCode}
                            </span>
                            <span className="font-medium text-[#1e1b19]">
                              {item.townName}
                            </span>
                            {item.isExternal && (
                              <span className="px-1.5 py-0.5 rounded-full bg-[#ffdbcf] text-[#812901] text-[9px] font-bold uppercase tracking-wider">
                                External Hub
                              </span>
                            )}
                          </div>
                          {item.venue && (
                            <span className="text-[11px] text-[#8a726a] flex items-center gap-1 truncate max-w-xs">
                              <MapPin size={12} className="text-[#b85028]" />
                              <span>{item.venue}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Check-In Time */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {formattedCheckIn ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[#486b52] bg-[#c2e9ca]/40 px-2 py-0.5 rounded">
                            <CheckCircle size={12} weight="fill" />
                            <span>{formattedCheckIn}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#8a726a] italic">
                            —
                          </span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-6 whitespace-nowrap text-right">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
                        >
                          <StatusIcon size={14} weight="bold" />
                          <span>{statusBadge.label}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

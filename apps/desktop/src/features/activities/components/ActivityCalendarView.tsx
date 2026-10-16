import { useTownContext } from '@jrs/client-core';
import type { IActivity } from '@jrs/shared';
import {
  CaretLeft,
  CaretRight,
  Clock,
  Eye,
  MapPin,
  PencilSimple,
} from '@phosphor-icons/react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  formatActivityTime,
  getActivityTypeConfig,
} from '../utils/activity-ui.utils';

interface ActivityCalendarViewProps {
  activities: IActivity[];
  isLoading: boolean;
  selectedYear?: number;
  selectedMonth?: number;
  onMonthChange?: (year: number, month: number) => void;
  onViewDetails: (activity: IActivity) => void;
  onEditActivity: (activity: IActivity) => void;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad = (n: number) => n.toString().padStart(2, '0');
const formatLocalDateKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const ActivityCalendarView: React.FC<ActivityCalendarViewProps> = ({
  activities,
  isLoading,
  selectedYear,
  selectedMonth,
  onMonthChange,
  onViewDetails,
  onEditActivity,
}) => {
  const { canWrite } = useTownContext();
  const [currentDate, setCurrentDate] = useState(() => {
    const year = selectedYear ?? 2026;
    const month =
      selectedMonth !== undefined ? selectedMonth - 1 : new Date().getMonth();
    return new Date(year, month, 1);
  });

  // Sync internal state if selectedYear or selectedMonth changes from parent
  useEffect(() => {
    if (selectedYear !== undefined) {
      const targetMonth = selectedMonth !== undefined ? selectedMonth - 1 : 0;
      setCurrentDate((prev) => {
        if (
          prev.getFullYear() !== selectedYear ||
          prev.getMonth() !== targetMonth
        ) {
          return new Date(selectedYear, targetMonth, 1);
        }
        return prev;
      });
    }
  }, [selectedYear, selectedMonth]);

  const [activeActivityModal, setActiveActivityModal] =
    useState<IActivity | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const handlePrevMonth = () => {
    const newDate = new Date(year, month - 1, 1);
    setCurrentDate(newDate);
    onMonthChange?.(newDate.getFullYear(), newDate.getMonth() + 1);
  };

  const handleNextMonth = () => {
    const newDate = new Date(year, month + 1, 1);
    setCurrentDate(newDate);
    onMonthChange?.(newDate.getFullYear(), newDate.getMonth() + 1);
  };

  const handleToday = () => {
    const now = new Date();
    const newDate = new Date(now.getFullYear(), now.getMonth(), 1);
    setCurrentDate(newDate);
    onMonthChange?.(newDate.getFullYear(), newDate.getMonth() + 1);
  };

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days: {
      date: Date;
      isCurrentMonth: boolean;
      dayNumber: number;
      dateKey: string;
    }[] = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      days.push({
        date: d,
        isCurrentMonth: false,
        dayNumber: prevMonthDays - i,
        dateKey: formatLocalDateKey(d),
      });
    }

    // Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        isCurrentMonth: true,
        dayNumber: i,
        dateKey: formatLocalDateKey(d),
      });
    }

    // Next month padding to complete 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        isCurrentMonth: false,
        dayNumber: i,
        dateKey: formatLocalDateKey(d),
      });
    }

    return days;
  }, [year, month]);

  // Group activities by local date (YYYY-MM-DD)
  const activitiesByDate = useMemo(() => {
    const map = new Map<string, IActivity[]>();
    for (const act of activities) {
      try {
        const d = new Date(act.startDate);
        const dateKey = formatLocalDateKey(d);
        const list = map.get(dateKey) || [];
        list.push(act);
        map.set(dateKey, list);
      } catch {
        // skip invalid dates
      }
    }
    return map;
  }, [activities]);

  const todayKey = formatLocalDateKey(new Date());

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-[#e8e1dd] shadow-xs p-8 flex flex-col items-center justify-center min-h-[400px] animate-pulse">
        <div className="w-10 h-10 rounded-full bg-[#f4ece9] mb-4" />
        <div className="h-4 w-48 bg-[#f4ece9] rounded mb-2" />
        <div className="h-3 w-32 bg-[#f4ece9] rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#e8e1dd] shadow-xs overflow-hidden flex flex-col">
      {/* Calendar Header Navigation */}
      <div className="p-4 bg-[#faf2ee] border-b border-[#e8e1dd] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-extrabold text-[#1e1b19] tracking-tight">
            {monthName} {year}
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-white border border-[#e8e1dd] text-[11px] font-bold text-[#b85028]">
            {activities.length} Gathering{activities.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToday}
            className="px-3 py-1.5 rounded-md bg-white border border-[#e8e1dd] text-xs font-bold text-[#1e1b19] hover:bg-[#faf2ee] transition-colors cursor-pointer"
          >
            Today
          </button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-md bg-white border border-[#e8e1dd] text-[#57423b] hover:text-[#1e1b19] hover:bg-[#faf2ee] transition-colors cursor-pointer"
              title="Previous Month"
            >
              <CaretLeft size={16} weight="bold" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-md bg-white border border-[#e8e1dd] text-[#57423b] hover:text-[#1e1b19] hover:bg-[#faf2ee] transition-colors cursor-pointer"
              title="Next Month"
            >
              <CaretRight size={16} weight="bold" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 border-b border-[#e8e1dd] bg-[#faf2ee]/50 text-center text-[11px] font-bold uppercase tracking-wider text-[#8a726a]">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className="py-2.5 border-r last:border-r-0 border-[#e8e1dd]"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-[#e8e1dd] border-b border-[#e8e1dd]">
        {calendarDays.map((cell) => {
          const isToday = cell.dateKey === todayKey;
          const dayActivities = activitiesByDate.get(cell.dateKey) || [];

          return (
            <div
              key={cell.dateKey}
              className={`min-h-[110px] p-1.5 flex flex-col justify-between transition-colors overflow-hidden ${
                cell.isCurrentMonth
                  ? isToday
                    ? 'bg-[#ffdbcf]/15'
                    : 'bg-white hover:bg-[#faf2ee]/30'
                  : 'bg-[#faf2ee]/40 text-[#8a726a]/60'
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isToday
                      ? 'bg-[#b85028] text-white shadow-2xs'
                      : cell.isCurrentMonth
                        ? 'text-[#1e1b19]'
                        : 'text-[#8a726a]/50'
                  }`}
                >
                  {cell.dayNumber}
                </span>

                {dayActivities.length > 0 && (
                  <span className="text-[10px] font-bold text-[#b85028]">
                    {dayActivities.length}
                  </span>
                )}
              </div>

              {/* Day Activities List */}
              <div className="flex flex-col gap-1 overflow-y-auto max-h-[85px] overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {dayActivities.map((act) => {
                  const typeConfig = getActivityTypeConfig(act.activityType);
                  const time = formatActivityTime(act.startDate);

                  return (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setActiveActivityModal(act)}
                      className={`w-full text-left p-1 rounded-md text-[11px] font-semibold border truncate transition-colors cursor-pointer flex items-center gap-1 ${typeConfig.badgeBg} ${typeConfig.badgeText} ${typeConfig.badgeBorder} hover:brightness-95 hover:border-[#b85028]/80 shadow-2xs`}
                      title={`${act.title} (${time})`}
                    >
                      <span className="shrink-0 font-mono text-[10px] opacity-80">
                        {time}
                      </span>
                      <span className="truncate">{act.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity Details Popover / Modal on Click */}
      {activeActivityModal && (
        <div className="fixed inset-0 z-50 bg-[#1e1b19]/40 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#e8e1dd] shadow-xl max-w-md w-full p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#b85028]">
                  {activeActivityModal.activityType}
                </span>
                <h3 className="text-base font-bold text-[#1e1b19] leading-snug">
                  {activeActivityModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveActivityModal(null)}
                className="p-1 rounded-md hover:bg-[#faf2ee] text-[#8a726a] hover:text-[#1e1b19] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {activeActivityModal.notes && (
              <p className="text-xs text-[#57423b] bg-[#faf2ee] p-3 rounded-md border border-[#e8e1dd]">
                {activeActivityModal.notes}
              </p>
            )}

            <div className="flex flex-col gap-2 text-xs text-[#1e1b19]">
              <div className="flex items-center gap-2">
                <Clock size={16} weight="bold" className="text-[#b85028]" />
                <span>
                  {new Date(activeActivityModal.startDate).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} weight="fill" className="text-[#486b52]" />
                <span>{activeActivityModal.town?.name || 'Local'} Hub</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-[#e8e1dd]">
              <button
                type="button"
                onClick={() => {
                  const act = activeActivityModal;
                  setActiveActivityModal(null);
                  onViewDetails(act);
                }}
                className="flex-1 py-2 px-3 rounded-md bg-[#b85028] text-white hover:bg-[#a44520] font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Eye size={16} weight="bold" />
                <span>Details</span>
              </button>

              {canWrite && (
                <button
                  type="button"
                  onClick={() => {
                    const act = activeActivityModal;
                    setActiveActivityModal(null);
                    onEditActivity(act);
                  }}
                  className="py-2 px-3 rounded-md bg-[#faf2ee] border border-[#e8e1dd] text-[#57423b] hover:text-[#1e1b19] font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <PencilSimple size={15} weight="bold" />
                  <span>Edit</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import { useTranslation } from '@jrs/client-core';
import type { IActivityStats } from '@jrs/shared';
import {
  CalendarBlank,
  CalendarCheck,
  CheckCircle,
  FlagBanner,
  TrendUp,
  Users,
} from '@phosphor-icons/react';
import type React from 'react';

interface ActivityStatsOverviewProps {
  stats: IActivityStats | undefined;
  isLoading: boolean;
  hubName: string;
}

export const ActivityStatsOverview: React.FC<ActivityStatsOverviewProps> = ({
  stats,
  isLoading,
  hubName,
}) => {
  const { t } = useTranslation();

  const totalActivities = stats?.totalActivities ?? 0;
  const upcomingCount = stats?.upcomingCount ?? 0;
  const completedCount = stats?.completedCount ?? 0;
  const avgAttendanceRate = stats?.avgAttendanceRate ?? 0;
  const totalGuestsReached = stats?.totalGuestsReached ?? 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 rounded-2xl bg-white border border-[#e8e1dd] p-5 flex flex-col justify-between"
          >
            <div className="h-4 w-28 bg-[#f4ece9] rounded" />
            <div className="h-8 w-16 bg-[#f4ece9] rounded" />
            <div className="h-3 w-36 bg-[#f4ece9] rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Gatherings */}
      <div className="bg-white p-5 rounded-2xl border border-[#e8e1dd] shadow-xs flex flex-col justify-between gap-3 transition-shadow hover:shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-bold text-[#8a726a] uppercase tracking-wider">
              {t('activities:stats.totalActivities')}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#1e1b19] tracking-tight">
                {totalActivities}
              </span>
              <span className="text-xs font-semibold text-[#8a726a]">
                {hubName}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#fff2ee] border border-[#ffdbcf] flex items-center justify-center text-[#b85028]">
            <CalendarBlank size={22} weight="duotone" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 pt-1 text-xs font-semibold text-[#57423b]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#b85028]" />
          <span>Recorded fellowship cycle</span>
        </div>
      </div>

      {/* 2. Upcoming Gatherings */}
      <div className="bg-white p-5 rounded-2xl border border-[#e8e1dd] shadow-xs flex flex-col justify-between gap-3 transition-shadow hover:shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-bold text-[#8a726a] uppercase tracking-wider">
              {t('activities:stats.upcomingActivities')}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#1e1b19] tracking-tight">
                {upcomingCount}
              </span>
              <span className="text-xs font-semibold text-[#486b52]">
                Scheduled
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#edf3ee] border border-[#c2e9ca] flex items-center justify-center text-[#486b52]">
            <FlagBanner size={22} weight="duotone" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 pt-1 text-xs font-semibold text-[#486b52]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#486b52] animate-pulse" />
          <span>Next scheduled sessions active</span>
        </div>
      </div>

      {/* 3. Completed Sessions */}
      <div className="bg-white p-5 rounded-2xl border border-[#e8e1dd] shadow-xs flex flex-col justify-between gap-3 transition-shadow hover:shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-bold text-[#8a726a] uppercase tracking-wider">
              {t('activities:stats.completedActivities')}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#1e1b19] tracking-tight">
                {completedCount}
              </span>
              <span className="text-xs font-semibold text-[#8a726a]">
                Sessions
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#faf2ee] border border-[#e8e1dd] flex items-center justify-center text-[#1e1b19]">
            <CalendarCheck size={22} weight="duotone" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 pt-1 text-xs font-semibold text-[#8a726a]">
          <CheckCircle size={14} weight="fill" className="text-[#486b52]" />
          <span>Archived & audited logs</span>
        </div>
      </div>

      {/* 4. Average Attendance Turnout / Guests */}
      <div className="bg-white p-5 rounded-2xl border border-[#e8e1dd] shadow-xs flex flex-col justify-between gap-3 transition-shadow hover:shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-bold text-[#8a726a] uppercase tracking-wider">
              {t('activities:stats.avgAttendance')}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#1e1b19] tracking-tight">
                {avgAttendanceRate > 0
                  ? `${avgAttendanceRate}%`
                  : `${totalGuestsReached}`}
              </span>
              <span className="text-xs font-semibold text-[#8a726a]">
                {avgAttendanceRate > 0 ? 'Turnout Rate' : 'Guests reached'}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#fff2ee] border border-[#ffdbcf] flex items-center justify-center text-[#b85028]">
            <Users size={22} weight="duotone" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 pt-1 text-xs font-semibold text-[#486b52]">
          <TrendUp size={14} weight="bold" />
          <span>Turnout tracked across fellowship</span>
        </div>
      </div>
    </div>
  );
};

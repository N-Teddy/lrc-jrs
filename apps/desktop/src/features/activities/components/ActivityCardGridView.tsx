import { useTownContext, useTranslation } from '@jrs/client-core';
import type { IActivity } from '@jrs/shared';
import {
  CalendarBlank,
  CaretLeft,
  CaretRight,
  ClockCounterClockwise,
  DotsThreeVertical,
  MapPin,
  PencilSimple,
  Trash,
  UserCheck,
} from '@phosphor-icons/react';
import type React from 'react';
import { useState } from 'react';
import {
  formatActivityDateRange,
  getActivityStatusConfig,
  getActivityTurnoutStats,
  getActivityTypeConfig,
} from '../utils/activity-ui.utils';

interface ActivityCardGridViewProps {
  activities: IActivity[];
  isLoading: boolean;
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onTrackAttendance: (activity: IActivity) => void;
  onEditActivity: (activity: IActivity) => void;
  onViewHistory: (activity: IActivity) => void;
  onDeleteActivity?: (activity: IActivity) => void;
  isPrivileged: boolean;
}

export const ActivityCardGridView: React.FC<ActivityCardGridViewProps> = ({
  activities,
  isLoading,
  total,
  page,
  limit,
  onPageChange,
  onTrackAttendance,
  onEditActivity,
  onViewHistory,
  onDeleteActivity,
  isPrivileged,
}) => {
  const { t } = useTranslation();
  const { canWrite } = useTownContext();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const totalPages = Math.ceil(total / limit) || 1;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-64 rounded-2xl bg-white border border-[#e8e1dd] p-5 flex flex-col justify-between"
          >
            <div className="h-6 w-32 bg-[#f4ece9] rounded" />
            <div className="h-4 w-48 bg-[#f4ece9] rounded" />
            <div className="h-8 w-full bg-[#f4ece9] rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#e8e1dd] shadow-xs p-12 flex flex-col items-center justify-center text-center min-h-[320px]">
        <div className="w-14 h-14 rounded-2xl bg-[#faf2ee] border border-[#e8e1dd] flex items-center justify-center text-[#8a726a] mb-4">
          <CalendarBlank size={28} weight="duotone" />
        </div>
        <h3 className="text-base font-bold text-[#1e1b19] mb-1">
          {t('activities:table.empty')}
        </h3>
        <p className="text-xs text-[#8a726a] max-w-sm">
          {t('activities:filters.searchPlaceholder')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activities.map((activity) => {
          const typeConfig = getActivityTypeConfig(activity.activityType);
          const statusConfig = getActivityStatusConfig(activity.status);
          const dateInfo = formatActivityDateRange(
            activity.startDate,
            activity.endDate,
          );
          const turnoutStats = getActivityTurnoutStats(activity);
          const TypeIcon = typeConfig.icon;
          const historyCount = activity.changeHistory?.length || 0;

          return (
            <div
              key={activity.id}
              className="bg-white rounded-2xl border border-[#efe9e5] hover:border-[#ddc0b7] hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between gap-4 group"
            >
              {/* Top Header Row */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${typeConfig.badgeBg} ${typeConfig.badgeText} ${typeConfig.badgeBorder}`}
                    >
                      <TypeIcon size={13} weight="bold" />
                      <span>{typeConfig.label}</span>
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig.badgeBg} ${statusConfig.badgeText} ${statusConfig.badgeBorder}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor} ${
                          statusConfig.isPulse ? 'animate-pulse' : ''
                        }`}
                      />
                      <span>{statusConfig.label}</span>
                    </span>
                  </div>

                  {/* Dropdown Options Menu */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenMenuId(
                          openMenuId === activity.id ? null : activity.id,
                        )
                      }
                      className="w-7 h-7 rounded-lg hover:bg-[#faf2ee] text-[#8a726a] hover:text-[#1e1b19] flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <DotsThreeVertical size={16} weight="bold" />
                    </button>

                    {openMenuId === activity.id && (
                      <div
                        className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-[#e8e1dd] shadow-lg py-1 z-30 flex flex-col"
                        onMouseLeave={() => setOpenMenuId(null)}
                      >
                        {canWrite && (
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              onEditActivity(activity);
                            }}
                            className="w-full px-3 py-2 text-left text-xs text-[#1e1b19] hover:bg-[#faf2ee] flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <PencilSimple size={15} weight="bold" />
                            <span>
                              {t('activities:card.edit')} / Reschedule
                            </span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onViewHistory(activity);
                          }}
                          className="w-full px-3 py-2 text-left text-xs text-[#1e1b19] hover:bg-[#faf2ee] flex items-center gap-2 font-medium cursor-pointer"
                        >
                          <ClockCounterClockwise size={15} weight="bold" />
                          <span>
                            {t('activities:card.viewHistory', {
                              count: historyCount,
                            })}
                          </span>
                        </button>

                        {canWrite && isPrivileged && onDeleteActivity && (
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              onDeleteActivity(activity);
                            }}
                            className="w-full px-3 py-2 text-left text-xs text-[#ba1a1a] hover:bg-[#ffdad6]/40 flex items-center gap-2 font-medium cursor-pointer border-t border-[#e8e1dd]"
                          >
                            <Trash size={15} weight="bold" />
                            <span>{t('activities:card.delete')}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Title & Notes */}
                <div>
                  <h3 className="font-bold text-sm text-[#1e1b19] group-hover:text-[#b85028] transition-colors leading-snug line-clamp-2">
                    {activity.title}
                  </h3>
                  {activity.notes && (
                    <p className="text-xs text-[#8a726a] line-clamp-2 mt-1 leading-relaxed">
                      {activity.notes}
                    </p>
                  )}
                </div>

                {/* Date & Location Details */}
                <div className="flex flex-col gap-1.5 pt-0.5 text-xs">
                  <div className="flex items-center gap-2 text-[#57423b]">
                    <CalendarBlank
                      size={15}
                      weight="bold"
                      className="text-[#b85028] shrink-0"
                    />
                    <span className="font-semibold text-[#1e1b19]">
                      {dateInfo.dateRange}
                    </span>
                    <span className="text-[#8a726a]">
                      · {dateInfo.timeRange}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[#57423b]">
                    <MapPin
                      size={15}
                      weight="fill"
                      className="text-[#486b52] shrink-0"
                    />
                    <span className="truncate">
                      {activity.town?.name || 'Local'} Hub
                    </span>
                  </div>
                </div>

                {/* Light Turnout Stats Strip */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#faf6f4] border border-[#f2ebe7] text-xs">
                  <div className="flex items-center gap-1.5">
                    <UserCheck
                      size={15}
                      weight="bold"
                      className="text-[#486b52]"
                    />
                    <span className="font-bold text-xs text-[#1e1b19]">
                      {turnoutStats.total > 0
                        ? `${turnoutStats.total} Attendees`
                        : 'Attendance Pending'}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#8a726a]">
                    {turnoutStats.total > 0
                      ? `${turnoutStats.members} mbrs · ${turnoutStats.guests} gst`
                      : 'Not recorded'}
                  </span>
                </div>
              </div>

              {/* Bottom Actions Footer */}
              <div className="flex items-center gap-2 pt-3 border-t border-[#f4ece9]">
                <button
                  type="button"
                  onClick={() => onTrackAttendance(activity)}
                  className="flex-1 py-2 px-3 rounded-lg bg-[#b85028] text-white hover:bg-[#a44520] font-bold text-xs shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <UserCheck size={15} weight="bold" />
                  <span>{t('activities:card.trackAttendance')}</span>
                </button>

                {canWrite && (
                  <button
                    type="button"
                    onClick={() => onEditActivity(activity)}
                    className="w-8 h-8 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] hover:bg-white text-[#57423b] hover:text-[#1e1b19] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title="Edit or Reschedule"
                  >
                    <PencilSimple size={15} weight="bold" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Footer */}
      <div className="bg-white rounded-2xl border border-[#e8e1dd] py-3 px-4 flex items-center justify-between text-xs text-[#8a726a]">
        <span>
          Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of{' '}
          {total} activities
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1 rounded bg-[#faf2ee] border border-[#e8e1dd] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <CaretLeft size={16} weight="bold" />
          </button>
          <span className="font-bold text-[#1e1b19] px-2">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1 rounded bg-[#faf2ee] border border-[#e8e1dd] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <CaretRight size={16} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
};

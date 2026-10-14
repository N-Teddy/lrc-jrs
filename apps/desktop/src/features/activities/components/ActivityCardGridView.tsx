import { useTownContext, useTranslation } from '@jrs/client-core';
import type { IActivity } from '@jrs/shared';
import {
  CalendarBlank,
  CaretLeft,
  CaretRight,
  ClockCounterClockwise,
  DotsThreeVertical,
  Eye,
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
  onViewDetails: (activity: IActivity) => void;
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
  onViewDetails,
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="h-48 rounded-xl bg-white border border-[#e8e1dd] p-4 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="h-5 w-24 bg-[#f4ece9] rounded-md" />
              <div className="h-5 w-16 bg-[#f4ece9] rounded-md" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-3/4 bg-[#f4ece9] rounded" />
              <div className="h-3 w-1/2 bg-[#f4ece9] rounded" />
            </div>
            <div className="h-8 w-full bg-[#f4ece9] rounded-lg" />
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {activities.map((activity) => {
          const typeConfig = getActivityTypeConfig(activity.activityType, t);
          const statusConfig = getActivityStatusConfig(activity.status, t);
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
              className="bg-white rounded-xl border border-[#e8e1dd] hover:border-[#b85028]/40 hover:shadow-md transition-all duration-200 p-4 flex flex-col justify-between gap-3 group"
            >
              {/* Header: Type, Status & Dropdown */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border truncate ${typeConfig.badgeBg} ${typeConfig.badgeText} ${typeConfig.badgeBorder}`}
                  >
                    <TypeIcon size={12} weight="bold" className="shrink-0" />
                    <span className="truncate">{typeConfig.label}</span>
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border shrink-0 ${statusConfig.badgeBg} ${statusConfig.badgeText} ${statusConfig.badgeBorder}`}
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
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMenuId(
                        openMenuId === activity.id ? null : activity.id,
                      )
                    }
                    className="w-6 h-6 rounded-md hover:bg-[#faf2ee] text-[#8a726a] hover:text-[#1e1b19] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <DotsThreeVertical size={15} weight="bold" />
                  </button>

                  {openMenuId === activity.id && (
                    <div
                      className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-[#e8e1dd] shadow-lg py-1 z-30 flex flex-col animate-in fade-in zoom-in-95 duration-100"
                      onMouseLeave={() => setOpenMenuId(null)}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          onViewDetails(activity);
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs text-[#1e1b19] hover:bg-[#faf2ee] flex items-center gap-2 font-medium cursor-pointer"
                      >
                        <Eye
                          size={14}
                          weight="bold"
                          className="text-[#b85028]"
                        />
                        <span>{t('activities:card.details', 'Details')}</span>
                      </button>

                      {canWrite && (
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onEditActivity(activity);
                          }}
                          className="w-full px-3 py-1.5 text-left text-xs text-[#1e1b19] hover:bg-[#faf2ee] flex items-center gap-2 font-medium cursor-pointer"
                        >
                          <PencilSimple size={14} weight="bold" />
                          <span>{t('activities:card.edit')} / Reschedule</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          onViewHistory(activity);
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs text-[#1e1b19] hover:bg-[#faf2ee] flex items-center gap-2 font-medium cursor-pointer"
                      >
                        <ClockCounterClockwise size={14} weight="bold" />
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
                          className="w-full px-3 py-1.5 text-left text-xs text-[#ba1a1a] hover:bg-[#ffdad6]/40 flex items-center gap-2 font-medium cursor-pointer border-t border-[#e8e1dd]"
                        >
                          <Trash size={14} weight="bold" />
                          <span>{t('activities:card.delete')}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="flex flex-col gap-1.5">
                <h3 className="font-bold text-sm text-[#1e1b19] group-hover:text-[#b85028] transition-colors leading-snug line-clamp-1">
                  {activity.title}
                </h3>

                <div className="flex flex-col gap-1 text-[11px] text-[#57423b]">
                  <div className="flex items-center gap-1.5 truncate">
                    <CalendarBlank
                      size={13}
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

                  <div className="flex items-center gap-1.5 truncate text-[#8a726a]">
                    <MapPin
                      size={13}
                      weight="fill"
                      className="text-[#486b52] shrink-0"
                    />
                    <span className="truncate">
                      {activity.town?.name || 'Local'} Hub
                    </span>
                  </div>
                </div>

                {/* Turnout Pill - Clickable to open Activity Details */}
                <button
                  type="button"
                  onClick={() => onViewDetails(activity)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#faf6f4] hover:bg-[#f4ede9] border border-[#f2ebe7] hover:border-[#b85028]/30 text-[11px] mt-0.5 cursor-pointer transition-colors text-left"
                  title="Click to view full activity & attendance details"
                >
                  <div className="flex items-center gap-1.5">
                    <UserCheck
                      size={14}
                      weight="bold"
                      className="text-[#486b52]"
                    />
                    <span className="font-bold text-[#1e1b19]">
                      {turnoutStats.total > 0
                        ? `${turnoutStats.total} Attendees`
                        : 'Attendance Pending'}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#8a726a]">
                    {turnoutStats.total > 0
                      ? `${turnoutStats.members} mbrs · ${turnoutStats.guests} gst`
                      : 'Not recorded'}
                  </span>
                </button>
              </div>

              {/* Bottom Actions Footer */}
              <div className="flex items-center gap-1.5 pt-2 border-t border-[#f4ece9]">
                <button
                  type="button"
                  onClick={() => onViewDetails(activity)}
                  className="flex-1 h-8 px-2.5 rounded-lg bg-[#b85028] text-white hover:bg-[#a44520] font-bold text-xs shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eye size={14} weight="bold" />
                  <span className="truncate">
                    {t('activities:card.details', 'Details')}
                  </span>
                </button>

                {canWrite && (
                  <button
                    type="button"
                    onClick={() => onEditActivity(activity)}
                    className="w-8 h-8 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] hover:bg-white text-[#57423b] hover:text-[#1e1b19] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title="Edit or Reschedule"
                  >
                    <PencilSimple size={14} weight="bold" />
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

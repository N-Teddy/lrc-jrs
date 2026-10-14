import { useTownContext, useTranslation } from '@jrs/client-core';
import type { IActivity } from '@jrs/shared';
import {
  CalendarBlank,
  CaretLeft,
  CaretRight,
  ClockCounterClockwise,
  DotsThreeVertical,
  PencilSimple,
  Trash,
  UserCheck,
} from '@phosphor-icons/react';
import type React from 'react';
import { useState } from 'react';
import {
  formatActivityDateRange,
  getActivityStatusConfig,
  getActivityTypeConfig,
} from '../utils/activity-ui.utils';

interface ActivityTableViewProps {
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

export const ActivityTableView: React.FC<ActivityTableViewProps> = ({
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
      <div className="bg-white rounded-2xl border border-[#e8e1dd] shadow-xs p-8 flex flex-col items-center justify-center min-h-[360px] animate-pulse">
        <div className="w-10 h-10 rounded-full bg-[#f4ece9] mb-4" />
        <div className="h-4 w-48 bg-[#f4ece9] rounded mb-2" />
        <div className="h-3 w-32 bg-[#f4ece9] rounded" />
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
    <div className="bg-white rounded-2xl border border-[#e8e1dd] shadow-xs overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#faf2ee] border-b border-[#e8e1dd] text-[#8a726a] text-[11px] font-bold uppercase tracking-wider">
              <th className="py-3 px-4 font-bold min-w-[280px]">
                {t('activities:table.activity')}
              </th>
              <th className="py-3 px-3 font-bold min-w-[130px]">
                {t('activities:table.type')}
              </th>
              <th className="py-3 px-3 font-bold min-w-[190px]">
                {t('activities:table.dates')}
              </th>
              <th className="py-3 px-3 font-bold min-w-[120px]">
                {t('activities:table.status')}
              </th>
              <th className="py-3 px-4 text-right font-bold min-w-[100px]">
                {t('activities:table.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e8e1dd] text-xs text-[#1e1b19]">
            {activities.map((activity) => {
              const typeConfig = getActivityTypeConfig(
                activity.activityType,
                t,
              );
              const statusConfig = getActivityStatusConfig(activity.status, t);
              const dateInfo = formatActivityDateRange(
                activity.startDate,
                activity.endDate,
              );
              const TypeIcon = typeConfig.icon;
              const historyCount = activity.changeHistory?.length || 0;

              return (
                <tr
                  key={activity.id}
                  className="hover:bg-[#faf2ee]/60 transition-colors group"
                >
                  {/* Activity & Agenda */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#faf2ee] border border-[#e8e1dd] flex items-center justify-center text-[#b85028] mt-0.5 shrink-0 shadow-2xs">
                        <TypeIcon size={18} weight="duotone" />
                      </div>
                      <div className="flex flex-col min-w-0 max-w-sm">
                        <span className="font-bold text-sm text-[#1e1b19] group-hover:text-[#b85028] transition-colors leading-snug truncate">
                          {activity.title}
                        </span>
                        {activity.notes && (
                          <span className="text-[11px] text-[#8a726a] line-clamp-1 mt-0.5">
                            {activity.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="py-3.5 px-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${typeConfig.badgeBg} ${typeConfig.badgeText} ${typeConfig.badgeBorder}`}
                    >
                      {typeConfig.label}
                    </span>
                  </td>

                  {/* Date & Time */}
                  <td className="py-3.5 px-3">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 font-semibold text-[#1e1b19]">
                        <CalendarBlank
                          size={14}
                          weight="bold"
                          className="text-[#b85028]"
                        />
                        <span>{dateInfo.dateRange}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#8a726a]">
                        <span>{dateInfo.timeRange}</span>
                        {dateInfo.isMultiDay && (
                          <span className="px-1.5 py-0.2 rounded bg-[#faf2ee] border border-[#e8e1dd] text-[10px] font-bold uppercase text-[#57423b]">
                            Multi-Day
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusConfig.badgeBg} ${statusConfig.badgeText} ${statusConfig.badgeBorder}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor} ${
                          statusConfig.isPulse ? 'animate-pulse' : ''
                        }`}
                      />
                      {statusConfig.label}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="relative inline-flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenuId(
                            openMenuId === activity.id ? null : activity.id,
                          )
                        }
                        className="p-1.5 rounded-lg hover:bg-[#faf2ee] text-[#8a726a] hover:text-[#1e1b19] transition-colors cursor-pointer"
                      >
                        <DotsThreeVertical size={16} weight="bold" />
                      </button>

                      {openMenuId === activity.id && (
                        <div
                          className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-[#e8e1dd] shadow-lg py-1 z-30 flex flex-col"
                          onMouseLeave={() => setOpenMenuId(null)}
                        >
                          {/* Track Attendance Action */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              onTrackAttendance(activity);
                            }}
                            className="w-full px-3 py-2 text-left text-xs text-[#b85028] hover:bg-[#fff2ee] flex items-center gap-2 font-bold cursor-pointer"
                          >
                            <UserCheck size={15} weight="bold" />
                            <span>{t('activities:card.trackAttendance')}</span>
                          </button>

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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="py-3 px-4 bg-[#faf2ee] border-t border-[#e8e1dd] flex items-center justify-between text-xs text-[#8a726a]">
        <span>
          Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of{' '}
          {total} activities
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1 rounded bg-white border border-[#e8e1dd] hover:bg-[#faf2ee] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
            className="p-1 rounded bg-white border border-[#e8e1dd] hover:bg-[#faf2ee] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <CaretRight size={16} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
};

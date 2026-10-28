import {
  useTownContext,
  useTranslation,
  useUpdateActivityMutation,
} from '@jrs/client-core';
import { ActivityStatus, type IActivity } from '@jrs/shared';
import { Buildings, CalendarBlank } from '@phosphor-icons/react';
import type React from 'react';
import { useState } from 'react';
import { PaginationControl, TableSkeleton } from '../../../components';
import {
  formatActivityDateRange,
  getActivityStatusConfig,
  getActivityTypeConfig,
} from '../utils/activity-ui.utils';
import { ActivityActionMenu } from './ActivityActionMenu';

interface ActivityTableViewProps {
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

export const ActivityTableView: React.FC<ActivityTableViewProps> = ({
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
  const { activeTownId } = useTownContext();
  const updateActivityMutation = useUpdateActivityMutation();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const totalPages = Math.ceil(total / limit) || 1;

  const handleCancelActivity = async (activity: IActivity) => {
    if (
      !window.confirm(
        t(
          'activities:detail.confirmCancel',
          'Are you sure you want to cancel this activity? You can undo this cancellation at any time.',
        ),
      )
    ) {
      return;
    }
    await updateActivityMutation.mutateAsync({
      id: activity.id,
      dto: {
        status: ActivityStatus.CANCELLED,
        changeReason: t(
          'activities:detail.cancelReason',
          'Activity cancelled by coordinator',
        ),
      },
    });
  };

  const handleUndoCancel = async (activity: IActivity) => {
    await updateActivityMutation.mutateAsync({
      id: activity.id,
      dto: {
        status: ActivityStatus.SCHEDULED,
        changeReason: t(
          'activities:detail.restoreReason',
          'Activity cancellation reversed and restored',
        ),
      },
    });
  };

  if (isLoading) {
    return (
      <TableSkeleton
        columns={[
          t('activities:table.activity', 'Activity Title'),
          t('activities:table.schedule', 'Date & Venue'),
          t('activities:table.status', 'Status'),
          t('common:actions', 'Actions'),
        ]}
        rowCount={Math.min(limit, 8)}
      />
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#e8e1dd] shadow-xs p-12 flex flex-col items-center justify-center text-center min-h-[320px]">
        <div className="w-14 h-14 rounded-xl bg-[#faf2ee] border border-[#e8e1dd] flex items-center justify-center text-[#8a726a] mb-4">
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
    <div className="bg-white rounded-xl border border-[#e8e1dd] shadow-xs overflow-hidden flex flex-col">
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
            {activities.map((activity, index) => {
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
              const isHostTown =
                !activeTownId ||
                activeTownId === (activity.hostTownId || activity.townId);
              const isParticipating = Boolean(
                activeTownId &&
                  !isHostTown &&
                  activity.includedTownIds?.includes(activeTownId),
              );

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
                        <button
                          type="button"
                          onClick={() => onViewDetails(activity)}
                          className="font-bold text-sm text-[#1e1b19] group-hover:text-[#b85028] transition-colors leading-snug truncate text-left cursor-pointer"
                        >
                          {activity.title}
                        </button>
                        {activity.notes && (
                          <span className="text-[11px] text-[#8a726a] line-clamp-1 mt-0.5">
                            {activity.notes}
                          </span>
                        )}
                        {isParticipating && (
                          <div className="flex items-center mt-1">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border bg-[#edf3ee] text-[#486b52] border-[#c2e9ca]">
                              <Buildings size={11} weight="bold" />
                              <span>
                                Inter-villes · Hôte:{' '}
                                {activity.hostTown?.name ||
                                  activity.town?.name ||
                                  'Autre'}
                              </span>
                            </span>
                          </div>
                        )}
                        {!isParticipating &&
                          (activity.includedTownIds?.length ?? 0) > 0 && (
                            <div className="flex items-center mt-1">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border bg-[#faf2ee] text-[#b85028] border-[#e8e1dd]">
                                <Buildings size={11} weight="duotone" />
                                <span>
                                  +{activity.includedTownIds?.length}{' '}
                                  {activity.includedTownIds?.length === 1
                                    ? 'ville participante'
                                    : 'villes participantes'}
                                </span>
                              </span>
                            </div>
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
                    <ActivityActionMenu
                      activity={activity}
                      isOpen={openMenuId === activity.id}
                      onToggle={() =>
                        setOpenMenuId(
                          openMenuId === activity.id ? null : activity.id,
                        )
                      }
                      onClose={() => setOpenMenuId(null)}
                      onViewDetails={onViewDetails}
                      onEditActivity={onEditActivity}
                      onViewHistory={onViewHistory}
                      onCancelActivity={handleCancelActivity}
                      onUndoCancelActivity={handleUndoCancel}
                      onDeleteActivity={onDeleteActivity}
                      isPrivileged={isPrivileged}
                      openUpwards={
                        index >= Math.max(1, activities.length - 2) &&
                        activities.length > 2
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="py-3 px-4 bg-[#faf2ee] border-t border-[#e8e1dd] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8a726a]">
        <span>
          {t('common:showingActivities', {
            start: (page - 1) * limit + 1,
            end: Math.min(page * limit, total),
            total,
          }) ||
            `Showing ${(page - 1) * limit + 1} - ${Math.min(page * limit, total)} of ${total} activities`}
        </span>

        <PaginationControl
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          variant="white"
        />
      </div>
    </div>
  );
};

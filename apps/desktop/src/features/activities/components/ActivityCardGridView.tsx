import {
  useTownContext,
  useTranslation,
  useUpdateActivityMutation,
} from '@jrs/client-core';
import { ActivityStatus, type IActivity } from '@jrs/shared';
import {
  ArrowCounterClockwise,
  ArrowRight,
  Bell,
  Buildings,
  CalendarBlank,
  Clock,
  PencilSimple,
  Plus,
  UserCheck,
} from '@phosphor-icons/react';
import type React from 'react';
import { useState } from 'react';
import emptyActivitiesImg from '../../../assets/illustrations/empty-activities.jpg';
import {
  CardGridSkeleton,
  EmptyState,
  PaginationControl,
} from '../../../components';
import {
  formatActivityDateRange,
  getActivityStatusConfig,
  getActivityTurnoutStats,
  getActivityTypeConfig,
} from '../utils/activity-ui.utils';
import { ActivityActionMenu } from './ActivityActionMenu';

interface ActivityCardGridViewProps {
  activities: IActivity[];
  isLoading: boolean;
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onViewDetails: (activity: IActivity) => void;
  onViewPreparation?: (activity: IActivity) => void;
  onEditActivity: (activity: IActivity) => void;
  onViewHistory: (activity: IActivity) => void;
  onDeleteActivity?: (activity: IActivity) => void;
  isPrivileged: boolean;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  onPlanActivity?: () => void;
}

export const ActivityCardGridView: React.FC<ActivityCardGridViewProps> = ({
  activities,
  isLoading,
  total,
  page,
  limit,
  onPageChange,
  onViewDetails,
  onViewPreparation,
  onEditActivity,
  onViewHistory,
  onDeleteActivity,
  isPrivileged,
  hasActiveFilters = false,
  onClearFilters,
  onPlanActivity,
}) => {
  const { t } = useTranslation();
  const { canWrite, activeTownId } = useTownContext();
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
    return <CardGridSkeleton cardCount={Math.min(limit, 8)} />;
  }

  if (activities.length === 0) {
    if (hasActiveFilters) {
      return (
        <EmptyState
          size="lg"
          imageSrc={emptyActivitiesImg}
          imageAlt="No activities match filters"
          title={t(
            'activities:filters.noMatchesTitle',
            'No activities match your filters',
          )}
          description={t(
            'activities:filters.noMatchesDescShort',
            'Try adjusting your search terms or filters.',
          )}
          primaryAction={
            onClearFilters
              ? {
                  label: t('common:clearFilters', 'Clear all filters'),
                  icon: <ArrowCounterClockwise size={15} weight="bold" />,
                  onClick: onClearFilters,
                }
              : undefined
          }
        />
      );
    }

    return (
      <EmptyState
        size="lg"
        imageSrc={emptyActivitiesImg}
        imageAlt="No activities"
        title={t('activities:table.empty', 'No activities scheduled yet')}
        description={t(
          'activities:table.emptyDescShort',
          'No scheduled activities in this hub yet.',
        )}
        primaryAction={
          isPrivileged && onPlanActivity
            ? {
                label: t(
                  'activities:actions.newActivity',
                  'Plan First Activity',
                ),
                icon: <Plus size={16} weight="bold" />,
                onClick: onPlanActivity,
              }
            : undefined
        }
      />
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
          const isHostTown =
            !activeTownId ||
            activeTownId === (activity.hostTownId || activity.townId);
          const isParticipating = Boolean(
            activeTownId &&
              !isHostTown &&
              activity.includedTownIds?.includes(activeTownId),
          );

          return (
            <div
              key={activity.id}
              onClick={() => onViewDetails(activity)}
              className="bg-white rounded-md border border-[#e8e1dd] hover:border-[#b85028]/40 hover:shadow-md transition-all duration-200 p-4 flex flex-col justify-between gap-3 group cursor-pointer"
            >
              {/* Header: Type, Status & Dropdown */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border truncate ${typeConfig.badgeBg} ${typeConfig.badgeText} ${typeConfig.badgeBorder}`}
                  >
                    <TypeIcon size={12} weight="bold" className="shrink-0" />
                    <span className="truncate">{typeConfig.label}</span>
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${statusConfig.badgeBg} ${statusConfig.badgeText} ${statusConfig.badgeBorder}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor} ${
                        statusConfig.isPulse ? 'animate-pulse' : ''
                      }`}
                    />
                    <span>{statusConfig.label}</span>
                  </span>

                  {/* Reminder Milestone Status Pill */}
                  {activity.remindersSent?.includes('1_WEEK') ? (
                    <span
                      title={t(
                        'activities:reminders.d7Title',
                        '7-Day Final Call (D-7)',
                      )}
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#edf3ee] text-[#486b52] border border-[#c2e9ca] shrink-0"
                    >
                      <Bell size={10} weight="fill" />
                      <span>
                        {t('activities:reminders.d7Pill', 'D-7 Sent')}
                      </span>
                    </span>
                  ) : activity.remindersSent?.includes('2_WEEKS') ? (
                    <span
                      title={t(
                        'activities:reminders.d14Title',
                        '14-Day Advance Notice (D-14)',
                      )}
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#fff0eb] text-[#b85028] border border-[#ffd8cb] shrink-0"
                    >
                      <Bell size={10} weight="fill" />
                      <span>
                        {t('activities:reminders.d14Pill', 'D-14 Sent')}
                      </span>
                    </span>
                  ) : null}
                </div>

                <div onClick={(e) => e.stopPropagation()}>
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
                    onViewPreparation={onViewPreparation}
                    onEditActivity={onEditActivity}
                    onViewHistory={onViewHistory}
                    onCancelActivity={handleCancelActivity}
                    onUndoCancelActivity={handleUndoCancel}
                    onDeleteActivity={onDeleteActivity}
                    isPrivileged={isPrivileged}
                  />
                </div>
              </div>

              {/* Metadata */}
              <div className="flex flex-col gap-2">
                {isParticipating && (
                  <div className="flex items-center">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border bg-[#edf3ee] text-[#486b52] border-[#c2e9ca]">
                      <Buildings size={11} weight="bold" />
                      <span>
                        {t(
                          'activities:detail.interTownHost',
                          'Inter-Town · Host: {{host}}',
                          {
                            host:
                              activity.hostTown?.name ||
                              activity.town?.name ||
                              t('activities:detail.otherHost', 'Other'),
                          },
                        )}
                      </span>
                    </span>
                  </div>
                )}
                {!isParticipating &&
                  (activity.includedTownIds?.length ?? 0) > 0 && (
                    <div className="flex items-center">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border bg-[#faf2ee] text-[#b85028] border-[#e8e1dd]">
                        <Buildings size={11} weight="duotone" />
                        <span>
                          +{activity.includedTownIds?.length}{' '}
                          {activity.includedTownIds?.length === 1
                            ? t(
                                'activities:interTown.singleTown',
                                'participating city',
                              )
                            : t(
                                'activities:interTown.multipleTowns',
                                'participating cities',
                              )}
                        </span>
                      </span>
                    </div>
                  )}

                <div className="flex items-center gap-1.5 text-xs text-[#57423b]">
                  <CalendarBlank
                    size={14}
                    weight="bold"
                    className="text-[#b85028] shrink-0"
                  />
                  <span className="font-semibold text-[#1e1b19]">
                    {dateInfo.dateRange}
                  </span>
                  <span className="text-[#d8cfca]">·</span>
                  <Clock size={13} className="text-[#8a726a] shrink-0" />
                  <span className="text-[#8a726a]">{dateInfo.timeRange}</span>
                </div>
              </div>

              {/* Bottom Actions Footer */}
              <div className="flex items-center justify-between pt-2.5 border-t border-[#f4ece9] mt-auto gap-2">
                <div className="flex items-center gap-1.5 text-xs min-w-0">
                  <UserCheck
                    size={15}
                    weight="bold"
                    className={
                      turnoutStats.total > 0
                        ? 'text-[#486b52] shrink-0'
                        : 'text-[#8a726a] shrink-0'
                    }
                  />
                  {turnoutStats.total > 0 ? (
                    <span className="text-[11px] font-medium text-[#1e1b19] truncate">
                      <span className="font-bold">{turnoutStats.total}</span>{' '}
                      {turnoutStats.total === 1
                        ? t('activities:card.attendee', 'Attendee')
                        : t('activities:card.attendees', 'Attendees')}{' '}
                      <span className="text-[#8a726a] font-normal">
                        {t(
                          'activities:card.attendanceBreakdown',
                          '({{members}}m · {{guests}}g)',
                          {
                            members: turnoutStats.members,
                            guests: turnoutStats.guests,
                          },
                        )}
                      </span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#8a726a] truncate">
                      {t(
                        'activities:card.attendancePending',
                        'Attendance Pending',
                      )}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {canWrite && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditActivity(activity);
                      }}
                      className="w-7 h-7 rounded text-[#8a726a] hover:text-[#1e1b19] hover:bg-[#faf2ee] flex items-center justify-center transition-colors cursor-pointer"
                      title={t('common:edit', 'Edit')}
                    >
                      <PencilSimple size={14} weight="bold" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails(activity);
                    }}
                    className="h-7 px-2.5 rounded bg-[#faf2ee] hover:bg-[#b85028] text-[#b85028] hover:text-white border border-[#e8d5cc] font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>{t('activities:card.details', 'Details')}</span>
                    <ArrowRight size={12} weight="bold" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="bg-white rounded-md border border-[#e8e1dd] shadow-xs py-3 px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8a726a]">
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
          />
        </div>
      )}
    </div>
  );
};

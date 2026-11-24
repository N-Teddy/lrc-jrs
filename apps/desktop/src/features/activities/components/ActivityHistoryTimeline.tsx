import { useTownsQuery, useTranslation } from '@jrs/client-core';
import type { IActivity, IActivityChangeLog } from '@jrs/shared';
import {
  CalendarBlank,
  Clock,
  ClockCounterClockwise,
  Lock,
  LockOpen,
  MapPin,
  Notebook,
  Tag,
  TextAlignLeft,
  User,
  Users,
} from '@phosphor-icons/react';
import type React from 'react';
import { useMemo } from 'react';
import emptyTimelineSvg from '../../../assets/illustrations/empty-timeline.svg';
import { EmptyState } from '../../../components';
import { getActivityTypeConfig } from '../utils/activity-ui.utils';

interface ActivityHistoryTimelineProps {
  activity: IActivity;
}

interface DiffField {
  id: string;
  label: string;
  prev: React.ReactNode;
  current: React.ReactNode;
  icon: React.ElementType;
}

export const ActivityHistoryTimeline: React.FC<
  ActivityHistoryTimelineProps
> = ({ activity }) => {
  const { t } = useTranslation(['activities', 'common']);

  const { data: towns = [] } = useTownsQuery();
  const townsMap = useMemo(
    () => new Map(towns.map((tw) => [tw.id, tw])),
    [towns],
  );

  const history = activity.changeHistory || [];

  const formatDateTime = (val?: string) => {
    if (!val) return '—';
    try {
      const d = new Date(val);
      if (Number.isNaN(d.getTime())) return val;
      return d.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return val;
    }
  };

  const renderTownList = (townIds?: string[]) => {
    if (!townIds || townIds.length === 0) {
      return (
        <span className="text-[#8a726a] italic">
          {t('activities:audit.fields.none', 'None')}
        </span>
      );
    }
    return (
      <div className="flex flex-wrap gap-1">
        {townIds.map((id) => {
          const tw = townsMap.get(id);
          const name = tw ? `${tw.name} (${tw.code})` : id;
          return (
            <span
              key={id}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#faf2ee] border border-[#e8e1dd] text-[#57423b]"
            >
              {name}
            </span>
          );
        })}
      </div>
    );
  };

  const getChangedFields = (log: IActivityChangeLog): DiffField[] => {
    const fields: DiffField[] = [];
    const prev = log.previousValues || {};
    const next = log.newValues || {};

    // 1. Title
    if (prev.title !== undefined || next.title !== undefined) {
      fields.push({
        id: 'title',
        label: t('activities:audit.fields.title', 'Activity Title'),
        prev: prev.title || '—',
        current: next.title || '—',
        icon: TextAlignLeft,
      });
    }

    // 2. Activity Type
    if (prev.activityType !== undefined || next.activityType !== undefined) {
      const prevConfig = prev.activityType
        ? getActivityTypeConfig(prev.activityType)
        : null;
      const nextConfig = next.activityType
        ? getActivityTypeConfig(next.activityType)
        : null;

      fields.push({
        id: 'activityType',
        label: t('activities:audit.fields.activityType', 'Activity Type'),
        prev: prevConfig ? (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold border ${prevConfig.badgeBg} ${prevConfig.badgeText} ${prevConfig.badgeBorder}`}
          >
            {prevConfig.label}
          </span>
        ) : (
          '—'
        ),
        current: nextConfig ? (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold border ${nextConfig.badgeBg} ${nextConfig.badgeText} ${nextConfig.badgeBorder}`}
          >
            {nextConfig.label}
          </span>
        ) : (
          '—'
        ),
        icon: Tag,
      });
    }

    // 3. Start Date
    if (prev.startDate || next.startDate) {
      fields.push({
        id: 'startDate',
        label: t('activities:audit.fields.startDate', 'Start Date & Time'),
        prev: formatDateTime(prev.startDate),
        current: formatDateTime(next.startDate),
        icon: CalendarBlank,
      });
    }

    // 4. End Date
    if (prev.endDate || next.endDate) {
      fields.push({
        id: 'endDate',
        label: t('activities:audit.fields.endDate', 'End Date & Time'),
        prev: formatDateTime(prev.endDate),
        current: formatDateTime(next.endDate),
        icon: Clock,
      });
    }

    // 5. Host Town Hub
    if (prev.townId || next.townId) {
      const prevTownName = prev.townId
        ? townsMap.get(prev.townId)?.name || prev.townId
        : '—';
      const nextTownName = next.townId
        ? townsMap.get(next.townId)?.name || next.townId
        : '—';
      fields.push({
        id: 'townId',
        label: t('activities:audit.fields.town', 'Host Community Hub'),
        prev: prevTownName,
        current: nextTownName,
        icon: MapPin,
      });
    }

    // 6. Participating Towns
    if (
      prev.includedTownIds !== undefined ||
      next.includedTownIds !== undefined
    ) {
      fields.push({
        id: 'includedTownIds',
        label: t(
          'activities:audit.fields.participantTowns',
          'Participating Hubs',
        ),
        prev: renderTownList(prev.includedTownIds),
        current: renderTownList(next.includedTownIds),
        icon: Users,
      });
    }

    // 7. Status
    if (prev.status || next.status) {
      fields.push({
        id: 'status',
        label: t('activities:audit.fields.status', 'Activity Status'),
        prev: prev.status
          ? t(`activities:statuses.${prev.status}`, {
              defaultValue: prev.status,
            })
          : '—',
        current: next.status
          ? t(`activities:statuses.${next.status}`, {
              defaultValue: next.status,
            })
          : '—',
        icon: Tag,
      });
    }

    // 8. Notes
    if (prev.notes !== undefined || next.notes !== undefined) {
      fields.push({
        id: 'notes',
        label: t('activities:audit.fields.notes', 'Notes / Remarks'),
        prev: prev.notes ? (
          <span className="italic">{prev.notes}</span>
        ) : (
          <span className="text-[#8a726a] italic">
            {t('activities:audit.fields.none', 'None')}
          </span>
        ),
        current: next.notes ? (
          <span className="italic">{next.notes}</span>
        ) : (
          <span className="text-[#8a726a] italic">
            {t('activities:audit.fields.none', 'None')}
          </span>
        ),
        icon: Notebook,
      });
    }

    // 9. Attendance Lock Override
    if (
      (prev as any).isAttendanceLocked !== undefined ||
      (next as any).isAttendanceLocked !== undefined
    ) {
      const prevLocked = Boolean((prev as any).isAttendanceLocked);
      const nextLocked = Boolean((next as any).isAttendanceLocked);
      fields.push({
        id: 'isAttendanceLocked',
        label: t(
          'activities:audit.fields.attendanceLock',
          'Attendance Lock Override',
        ),
        prev: prevLocked
          ? t('activities:audit.fields.locked', 'Locked')
          : t('activities:audit.fields.unlocked', 'Unlocked'),
        current: nextLocked
          ? t('activities:audit.fields.locked', 'Locked')
          : t('activities:audit.fields.unlocked', 'Unlocked'),
        icon: nextLocked ? Lock : LockOpen,
      });
    }

    return fields;
  };

  const getChangeTypeBadgeStyle = (changeType: string) => {
    switch (changeType) {
      case 'CANCELLED':
        return 'bg-[#ffdad6] text-[#ba1a1a]';
      case 'REOPENED':
        return 'bg-[#d1e7d8] text-[#1c6536]';
      case 'RESCHEDULED':
        return 'bg-[#ffdbcf] text-[#812901]';
      case 'LOCATION_CHANGED':
        return 'bg-[#edf3ee] text-[#486b52]';
      case 'TYPE_CHANGED':
        return 'bg-[#e0eafc] text-[#2452a8]';
      case 'PARTICIPANTS_CHANGED':
        return 'bg-[#f6e8ff] text-[#6d259e]';
      default:
        return 'bg-[#faf2ee] text-[#1e1b19]';
    }
  };

  const getTimelineIconColor = (changeType: string) => {
    switch (changeType) {
      case 'CANCELLED':
        return 'bg-[#ba1a1a] text-white';
      case 'REOPENED':
        return 'bg-[#1c6536] text-white';
      case 'RESCHEDULED':
        return 'bg-[#b85028] text-white';
      case 'LOCATION_CHANGED':
        return 'bg-[#486b52] text-white';
      case 'TYPE_CHANGED':
        return 'bg-[#2452a8] text-white';
      case 'PARTICIPANTS_CHANGED':
        return 'bg-[#6d259e] text-white';
      default:
        return 'bg-[#1e1b19] text-white';
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-150">
      {/* 1. Header Toolbar */}
      <div className="bg-white rounded-lg border border-[#e8e1dd] shadow-2xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-bold text-[#1e1b19] flex items-center gap-2">
            <ClockCounterClockwise
              size={17}
              weight="bold"
              className="text-[#b85028]"
            />
            <span>
              {t(
                'activities:detail.historyTab.title',
                'Activity Change & Audit History',
              )}
            </span>
          </h3>
          <p className="text-xs text-[#8a726a]">
            {t(
              'activities:audit.subtitle',
              'Trace complete modification baselines, reschedules, and hub roster changes.',
            )}
          </p>
        </div>
      </div>

      {/* 2. Timeline List View */}
      {history.length === 0 ? (
        <div className="bg-white rounded-lg border border-[#e8e1dd] shadow-2xs p-8">
          <EmptyState
            size="md"
            imageSrc={emptyTimelineSvg}
            imageAlt="No modifications recorded"
            title={t('activities:noHistory', 'No modifications recorded.')}
            description={t(
              'activities:audit.emptyStateDesc',
              'This activity follows its original schedule and baseline configuration.',
            )}
          />
        </div>
      ) : (
        <div className="flex flex-col pt-1">
          {history.map((log, index) => {
            const changedFields = getChangedFields(log);
            const isLast = index === history.length - 1;
            const badgeStyle = getChangeTypeBadgeStyle(log.changeType);
            const iconBg = getTimelineIconColor(log.changeType);

            return (
              <div key={log.id || index} className="flex gap-4 sm:gap-6">
                {/* Timeline Spine Column */}
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shadow-xs border-2 border-white shrink-0 z-10 ${iconBg}`}
                  >
                    <ClockCounterClockwise size={14} weight="bold" />
                  </div>
                  {!isLast && (
                    <div className="w-0.5 flex-1 bg-[#e8e1dd] my-1" />
                  )}
                </div>

                {/* Card Container */}
                <div className="flex-1 pb-5">
                  <div className="bg-white rounded-lg border border-[#e8e1dd] shadow-2xs p-4 sm:p-5 flex flex-col gap-3 hover:border-[#b85028]/40 transition-colors">
                    {/* Entry Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#e8e1dd]/70">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-sm text-[11px] font-bold ${badgeStyle}`}
                        >
                          {log.changeType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] font-mono text-[#8a726a]">
                          {t('activities:audit.revisionNumber', {
                            number: history.indexOf(log) + 1,
                            defaultValue: `Revision #${history.indexOf(log) + 1}`,
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-[#8a726a]">
                        <Clock size={14} weight="bold" />
                        <span>{new Date(log.changedAt).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Actor Banner */}
                    <div className="flex items-center gap-2 bg-[#faf2ee] px-3 py-1.5 rounded-sm border border-[#e8e1dd]/60 text-xs">
                      <div className="w-5 h-5 rounded-sm overflow-hidden bg-white border border-[#e8e1dd] shrink-0 flex items-center justify-center">
                        {log.changedByName ? (
                          <img
                            src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(log.changedByName)}`}
                            alt={log.changedByName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User
                            size={13}
                            weight="bold"
                            className="text-[#b85028]"
                          />
                        )}
                      </div>
                      <span className="font-semibold text-[#1e1b19]">
                        {t('activities:audit.modifiedBy', {
                          name: log.changedByName,
                          defaultValue: `Modified by: ${log.changedByName || 'Administrator'}`,
                        })}
                      </span>
                    </div>

                    {/* Documented Reason */}
                    {log.reason && (
                      <div className="text-xs text-[#57423b] bg-white p-3 rounded-sm border border-[#e8e1dd] flex flex-col gap-1">
                        <span className="font-bold text-[10px] uppercase tracking-wider text-[#8a726a]">
                          {t(
                            'activities:audit.documentedReason',
                            'Documented Reason:',
                          )}
                        </span>
                        <p className="italic">"{log.reason}"</p>
                      </div>
                    )}

                    {/* Before / After Comparison Grid */}
                    {changedFields.length > 0 && (
                      <div className="flex flex-col gap-2 pt-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {/* Previous State */}
                          <div className="bg-[#faf2ee]/70 rounded-sm p-3 border border-[#e8e1dd] flex flex-col gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a726a]">
                              {t(
                                'activities:audit.previousState',
                                'Previous State',
                              )}
                            </span>
                            {changedFields.map((field) => {
                              const Icon = field.icon;
                              return (
                                <div
                                  key={`prev-${field.id}`}
                                  className="flex flex-col gap-1 pb-1.5 border-b border-[#e8e1dd]/50 last:border-0 last:pb-0"
                                >
                                  <span className="text-[10px] font-bold text-[#8a726a]">
                                    {field.label}
                                  </span>
                                  <div className="flex items-center gap-1.5 text-[#57423b]">
                                    <Icon
                                      size={13}
                                      weight="bold"
                                      className="shrink-0 text-[#8a726a]"
                                    />
                                    <div className="line-through truncate">
                                      {field.prev}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* New State */}
                          <div className="bg-[#edf3ee]/60 rounded-sm p-3 border border-[#c2e9ca] flex flex-col gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#486b52]">
                              {t('activities:audit.newState', 'New State')}
                            </span>
                            {changedFields.map((field) => {
                              const Icon = field.icon;
                              return (
                                <div
                                  key={`next-${field.id}`}
                                  className="flex flex-col gap-1 pb-1.5 border-b border-[#c2e9ca]/50 last:border-0 last:pb-0"
                                >
                                  <span className="text-[10px] font-bold text-[#486b52]">
                                    {field.label}
                                  </span>
                                  <div className="flex items-center gap-1.5 text-[#2c4e37] font-semibold">
                                    <Icon
                                      size={13}
                                      weight="bold"
                                      className="shrink-0 text-[#486b52]"
                                    />
                                    <div className="truncate">
                                      {field.current}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

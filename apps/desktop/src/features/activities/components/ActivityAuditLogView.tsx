import { useTownsQuery, useTranslation } from '@jrs/client-core';
import type { IActivity, IActivityChangeLog } from '@jrs/shared';
import {
  ArrowLeft,
  CalendarBlank,
  Clock,
  ClockCounterClockwise,
  Fingerprint,
  Lock,
  LockOpen,
  MapPin,
  PencilSimple,
  ShieldCheck,
  Tag,
  User,
} from '@phosphor-icons/react';
import type React from 'react';
import { useMemo, useState } from 'react';
import {
  formatActivityDate,
  getActivityTypeConfig,
} from '../utils/activity-ui.utils';

interface ActivityAuditLogViewProps {
  activity: IActivity;
  onBack: () => void;
  onEditActivity: (activity: IActivity) => void;
}

interface DiffField {
  id: string;
  label: string;
  prev: React.ReactNode;
  current: React.ReactNode;
  icon: React.ElementType;
}

export const ActivityAuditLogView: React.FC<ActivityAuditLogViewProps> = ({
  activity,
  onBack,
  onEditActivity,
}) => {
  const { t } = useTranslation(['activities', 'common']);
  const [filterType, setFilterType] = useState<string>('ALL');

  const { data: towns = [] } = useTownsQuery();
  const townsMap = useMemo(
    () => new Map(towns.map((tw) => [tw.id, tw])),
    [towns],
  );

  const history = activity.changeHistory || [];

  const filteredHistory = useMemo(() => {
    if (filterType === 'ALL') return history;
    return history.filter((log) => log.changeType === filterType);
  }, [history, filterType]);

  const typeConfig = getActivityTypeConfig(activity.activityType);

  const rescheduleCount = history.filter(
    (h) => h.changeType === 'RESCHEDULED',
  ).length;
  const locationCount = history.filter(
    (h) => h.changeType === 'LOCATION_CHANGED',
  ).length;
  const statusCount = history.filter(
    (h) => h.changeType === 'STATUS_CHANGED',
  ).length;

  const latestLog = history.length > 0 ? history[history.length - 1] : null;

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

  const getChangedFields = (log: IActivityChangeLog): DiffField[] => {
    const fields: DiffField[] = [];
    const prev = log.previousValues || {};
    const next = log.newValues || {};

    // 1. Start Date
    if (prev.startDate || next.startDate) {
      fields.push({
        id: 'startDate',
        label: t('activities:audit.fields.startDate', 'Start Date & Time'),
        prev: formatDateTime(prev.startDate),
        current: formatDateTime(next.startDate),
        icon: CalendarBlank,
      });
    }

    // 2. End Date
    if (prev.endDate || next.endDate) {
      fields.push({
        id: 'endDate',
        label: t('activities:audit.fields.endDate', 'End Date & Time'),
        prev: formatDateTime(prev.endDate),
        current: formatDateTime(next.endDate),
        icon: Clock,
      });
    }

    // 3. Location Venue
    if (prev.locationVenue || next.locationVenue) {
      fields.push({
        id: 'locationVenue',
        label: t('activities:audit.fields.locationVenue', 'Venue / Room'),
        prev: prev.locationVenue || '—',
        current: next.locationVenue || '—',
        icon: MapPin,
      });
    }

    // 4. Town Hub
    if (prev.townId || next.townId) {
      const prevTownName = prev.townId
        ? townsMap.get(prev.townId)?.name || prev.townId
        : '—';
      const nextTownName = next.townId
        ? townsMap.get(next.townId)?.name || next.townId
        : '—';
      fields.push({
        id: 'townId',
        label: t('activities:audit.fields.town', 'Community Hub'),
        prev: prevTownName,
        current: nextTownName,
        icon: MapPin,
      });
    }

    // 5. Status
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

    // 6. Attendance Lock Override
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

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full animate-in fade-in duration-200">
      {/* 1. Breadcrumbs & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <nav className="flex items-center gap-2 text-xs font-semibold text-[#8a726a]">
          <button
            type="button"
            onClick={onBack}
            className="hover:text-[#b85028] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} weight="bold" />
            <span>
              {t(
                'activities:audit.communityActivities',
                'Community Activities',
              )}
            </span>
          </button>
          <span>/</span>
          <span className="truncate max-w-[200px] text-[#1e1b19]">
            {activity.title}
          </span>
          <span>/</span>
          <span className="text-[#b85028]">
            {t('activities:audit.title', 'Audit History')}
          </span>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEditActivity(activity)}
            className="px-3.5 py-1.5 rounded-md bg-[#b85028] text-white hover:bg-[#a44520] font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <PencilSimple size={15} weight="bold" />
            <span>
              {t('activities:audit.editActivity', 'Edit / Reschedule Activity')}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Context Summary Banner Card */}
      <div className="bg-white rounded-xl border border-[#e8e1dd] shadow-xs p-6 flex flex-col gap-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${typeConfig.badgeBg} ${typeConfig.badgeText} ${typeConfig.badgeBorder}`}
              >
                <span>{typeConfig.label}</span>
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#faf2ee] border border-[#e8e1dd] text-xs font-medium text-[#57423b]">
                <MapPin size={13} weight="fill" className="text-[#486b52]" />
                <span>
                  {activity.town?.name || 'Local'} Hub (
                  {activity.town?.code || 'HUB'})
                </span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ffdad4]/50 border border-[#ffb4a8] text-xs font-bold text-[#9f2f23]">
                <ClockCounterClockwise size={13} weight="bold" />
                <span>
                  {t('activities:audit.revisionsRecorded', {
                    count: history.length,
                    defaultValue: `${history.length} Revisions Recorded`,
                  })}
                </span>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1e1b19] tracking-tight">
              {activity.title}
            </h1>

            <p className="text-xs text-[#8a726a] flex items-center gap-1.5 font-mono">
              <Fingerprint size={15} weight="bold" className="text-[#8a726a]" />
              <span>
                {t('activities:audit.refId', {
                  id: activity.id.slice(-8).toUpperCase(),
                  defaultValue: `Ref ID: ACT-${activity.id.slice(-8).toUpperCase()}`,
                })}
              </span>
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
            <div className="bg-[#faf2ee] rounded-xl p-3 border border-[#e8e1dd] flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a726a]">
                {t('activities:audit.auditDepth', 'Audit Depth')}
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <ClockCounterClockwise
                  size={18}
                  weight="duotone"
                  className="text-[#b85028]"
                />
                <span className="text-lg font-extrabold text-[#1e1b19]">
                  {t('activities:audit.logEntries', {
                    count: history.length,
                    defaultValue: `${history.length} Log Entries`,
                  })}
                </span>
              </div>
              <span className="text-[10px] text-[#8a726a] mt-0.5">
                {t('activities:audit.created', {
                  date: formatActivityDate(activity.createdAt),
                  defaultValue: `Created: ${formatActivityDate(activity.createdAt)}`,
                })}
              </span>
            </div>

            <div className="bg-[#faf2ee] rounded-xl p-3 border border-[#e8e1dd] flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a726a]">
                {t(
                  'activities:audit.latestModification',
                  'Latest Modification',
                )}
              </span>
              <div className="flex items-center gap-2 mt-1">
                {latestLog?.changedByName ? (
                  <div className="w-5 h-5 rounded-md overflow-hidden bg-[#faf2ee] border border-[#e8e1dd] shrink-0 flex items-center justify-center">
                    <img
                      src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(latestLog.changedByName)}`}
                      alt={latestLog.changedByName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <User size={18} weight="duotone" className="text-[#486b52]" />
                )}
                <span className="text-xs font-extrabold text-[#1e1b19] truncate max-w-[150px]">
                  {latestLog?.changedByName ||
                    t('activities:audit.originalBaseline', 'Original Baseline')}
                </span>
              </div>
              <span className="text-[10px] text-[#8a726a] mt-0.5">
                {latestLog
                  ? new Date(latestLog.changedAt).toLocaleString()
                  : t('activities:audit.noChangesYet', 'No changes yet')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter Chips Strip */}
      <div className="bg-white rounded-xl border border-[#e8e1dd] shadow-xs p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClockCounterClockwise
            size={18}
            weight="bold"
            className="text-[#b85028]"
          />
          <h2 className="text-xs font-bold text-[#1e1b19] uppercase tracking-wider">
            {t(
              'activities:audit.revisionTrail',
              'Chronological Revision Trail',
            )}
          </h2>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filterType === 'ALL'
                ? 'bg-[#b85028] text-white shadow-xs'
                : 'bg-[#faf2ee] text-[#57423b] hover:bg-[#e8e1dd]'
            }`}
          >
            {t('activities:audit.allChanges', {
              count: history.length,
              defaultValue: `All Changes (${history.length})`,
            })}
          </button>

          <button
            type="button"
            onClick={() => setFilterType('RESCHEDULED')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filterType === 'RESCHEDULED'
                ? 'bg-[#b85028] text-white shadow-xs'
                : 'bg-[#faf2ee] text-[#57423b] hover:bg-[#e8e1dd]'
            }`}
          >
            {t('activities:audit.reschedules', {
              count: rescheduleCount,
              defaultValue: `Reschedules (${rescheduleCount})`,
            })}
          </button>

          <button
            type="button"
            onClick={() => setFilterType('LOCATION_CHANGED')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filterType === 'LOCATION_CHANGED'
                ? 'bg-[#b85028] text-white shadow-xs'
                : 'bg-[#faf2ee] text-[#57423b] hover:bg-[#e8e1dd]'
            }`}
          >
            {t('activities:audit.venueShifts', {
              count: locationCount,
              defaultValue: `Venue Shifts (${locationCount})`,
            })}
          </button>

          {statusCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterType('STATUS_CHANGED')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filterType === 'STATUS_CHANGED'
                  ? 'bg-[#b85028] text-white shadow-xs'
                  : 'bg-[#faf2ee] text-[#57423b] hover:bg-[#e8e1dd]'
              }`}
            >
              {t('activities:audit.statusChanges', {
                count: statusCount,
                defaultValue: `Status Changes (${statusCount})`,
              })}
            </button>
          )}
        </div>
      </div>

      {/* 4. Timeline View */}
      {filteredHistory.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e8e1dd] shadow-xs p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-xl bg-[#faf2ee] border border-[#e8e1dd] flex items-center justify-center text-[#8a726a] mb-3">
            <ShieldCheck size={24} weight="duotone" />
          </div>
          <h3 className="text-sm font-bold text-[#1e1b19] mb-1">
            {t('activities:noHistory', 'No modifications recorded.')}
          </h3>
          <p className="text-xs text-[#8a726a]">
            {t(
              'activities:audit.emptyStateDesc',
              'This gathering follows its original schedule and venue baseline.',
            )}
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {filteredHistory.map((log, index) => {
            const isReschedule = log.changeType === 'RESCHEDULED';
            const isLocation = log.changeType === 'LOCATION_CHANGED';
            const changedFields = getChangedFields(log);
            const isLast = index === filteredHistory.length - 1;

            return (
              <div key={log.id || index} className="flex gap-4 sm:gap-6">
                {/* Timeline Spine Column: Icon is 100% centered on the vertical line */}
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shadow-xs border-2 border-white shrink-0 z-10 ${
                      isReschedule
                        ? 'bg-[#b85028] text-white'
                        : isLocation
                          ? 'bg-[#486b52] text-white'
                          : 'bg-[#1e1b19] text-white'
                    }`}
                  >
                    <ClockCounterClockwise size={15} weight="bold" />
                  </div>
                  {!isLast && (
                    <div className="w-0.5 flex-1 bg-[#e8e1dd] my-1" />
                  )}
                </div>

                {/* Card Container */}
                <div className="flex-1 pb-6">
                  <div className="bg-white rounded-xl border border-[#e8e1dd] shadow-xs p-5 flex flex-col gap-3">
                    {/* Entry Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#e8e1dd]/70">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isReschedule
                              ? 'bg-[#ffdbcf] text-[#812901]'
                              : isLocation
                                ? 'bg-[#edf3ee] text-[#486b52]'
                                : 'bg-[#faf2ee] text-[#1e1b19]'
                          }`}
                        >
                          {log.changeType.replace('_', ' ')}
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
                    <div className="flex items-center gap-2 bg-[#faf2ee] px-3 py-1.5 rounded-lg border border-[#e8e1dd]/60 text-xs">
                      <div className="w-5 h-5 rounded-md overflow-hidden bg-white border border-[#e8e1dd] shrink-0 flex items-center justify-center">
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
                          defaultValue: `Modified by: ${log.changedByName}`,
                        })}
                      </span>
                    </div>

                    {/* Documented Reason */}
                    {log.reason && (
                      <div className="text-xs text-[#57423b] bg-white p-3 rounded-lg border border-[#e8e1dd] flex flex-col gap-1">
                        <span className="font-bold text-[11px] uppercase tracking-wider text-[#8a726a]">
                          {t(
                            'activities:audit.documentedReason',
                            'Documented Reason:',
                          )}
                        </span>
                        <p className="italic">"{log.reason}"</p>
                      </div>
                    )}

                    {/* Before / After Comparison Grid */}
                    <div className="flex flex-col gap-2 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {/* Previous State */}
                        <div className="bg-[#faf2ee]/70 rounded-md p-3.5 border border-[#e8e1dd] flex flex-col gap-2.5">
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
                                className="flex flex-col gap-0.5 pb-1 border-b border-[#e8e1dd]/50 last:border-0 last:pb-0"
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
                                  <span className="line-through truncate">
                                    {field.prev}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* New State */}
                        <div className="bg-[#edf3ee]/60 rounded-md p-3.5 border border-[#c2e9ca] flex flex-col gap-2.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#486b52]">
                            {t('activities:audit.newState', 'New State')}
                          </span>
                          {changedFields.map((field) => {
                            const Icon = field.icon;
                            return (
                              <div
                                key={`next-${field.id}`}
                                className="flex flex-col gap-0.5 pb-1 border-b border-[#c2e9ca]/50 last:border-0 last:pb-0"
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
                                  <span className="truncate">
                                    {field.current}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
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

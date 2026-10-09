import { useTranslation } from '@jrs/client-core';
import type { IActivity } from '@jrs/shared';
import {
  ArrowLeft,
  ArrowRight,
  CalendarBlank,
  Clock,
  ClockCounterClockwise,
  Fingerprint,
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

export const ActivityAuditLogView: React.FC<ActivityAuditLogViewProps> = ({
  activity,
  onBack,
  onEditActivity,
}) => {
  const { t } = useTranslation();
  const [filterType, setFilterType] = useState<string>('ALL');

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

  const latestLog = history.length > 0 ? history[history.length - 1] : null;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full animate-in fade-in duration-200">
      {/* 1. Breadcrumbs & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <nav className="flex items-center gap-2 text-xs font-semibold text-[#8a726a]">
          <button
            type="button"
            onClick={onBack}
            className="hover:text-[#b85028] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} weight="bold" />
            <span>Fellowship Activities</span>
          </button>
          <span>/</span>
          <span className="truncate max-w-[200px] text-[#1e1b19]">
            {activity.title}
          </span>
          <span>/</span>
          <span className="text-[#b85028]">Audit History</span>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEditActivity(activity)}
            className="px-3.5 py-1.5 rounded-xl bg-[#b85028] text-white hover:bg-[#a44520] font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <PencilSimple size={15} weight="bold" />
            <span>Edit / Reschedule Activity</span>
          </button>
        </div>
      </div>

      {/* 2. Context Summary Banner Card */}
      <div className="bg-white rounded-2xl border border-[#e8e1dd] shadow-xs p-6 flex flex-col gap-5">
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
                <span>{history.length} Revisions Recorded</span>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1e1b19] tracking-tight">
              {activity.title}
            </h1>

            <p className="text-xs text-[#8a726a] flex items-center gap-1.5 font-mono">
              <Fingerprint size={15} weight="bold" className="text-[#8a726a]" />
              <span>Ref ID: ACT-{activity.id.slice(-8).toUpperCase()}</span>
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
            <div className="bg-[#faf2ee] rounded-xl p-3 border border-[#e8e1dd] flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a726a]">
                Audit Depth
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <ClockCounterClockwise
                  size={18}
                  weight="duotone"
                  className="text-[#b85028]"
                />
                <span className="text-lg font-extrabold text-[#1e1b19]">
                  {history.length} Log Entries
                </span>
              </div>
              <span className="text-[10px] text-[#8a726a] mt-0.5">
                Created: {formatActivityDate(activity.createdAt)}
              </span>
            </div>

            <div className="bg-[#faf2ee] rounded-xl p-3 border border-[#e8e1dd] flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a726a]">
                Latest Modification
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
                  {latestLog?.changedByName || 'Original Baseline'}
                </span>
              </div>
              <span className="text-[10px] text-[#8a726a] mt-0.5">
                {latestLog
                  ? new Date(latestLog.changedAt).toLocaleString()
                  : 'No changes yet'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter Chips Strip */}
      <div className="bg-white rounded-2xl border border-[#e8e1dd] shadow-xs p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClockCounterClockwise
            size={18}
            weight="bold"
            className="text-[#b85028]"
          />
          <h2 className="text-xs font-bold text-[#1e1b19] uppercase tracking-wider">
            Chronological Revision Trail
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
            All Changes ({history.length})
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
            Reschedules ({rescheduleCount})
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
            Venue Shifts ({locationCount})
          </button>
        </div>
      </div>

      {/* 4. Timeline View */}
      {filteredHistory.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e8e1dd] shadow-xs p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-[#faf2ee] border border-[#e8e1dd] flex items-center justify-center text-[#8a726a] mb-3">
            <ShieldCheck size={24} weight="duotone" />
          </div>
          <h3 className="text-sm font-bold text-[#1e1b19] mb-1">
            {t('activities:noHistory')}
          </h3>
          <p className="text-xs text-[#8a726a]">
            This gathering follows its original schedule and venue baseline.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 flex flex-col gap-5">
          {/* Timeline Spine Line */}
          <div
            aria-hidden="true"
            className="absolute left-3 sm:left-4 top-4 bottom-4 w-0.5 bg-[#e8e1dd]"
          />

          {filteredHistory.map((log, index) => {
            const isReschedule = log.changeType === 'RESCHEDULED';
            const isLocation = log.changeType === 'LOCATION_CHANGED';

            return (
              <div
                key={log.id || index}
                className="relative bg-white rounded-2xl border border-[#e8e1dd] shadow-xs p-5 flex flex-col gap-3"
              >
                {/* Node Dot Pin */}
                <div
                  className={`absolute -left-[31px] sm:-left-[39px] top-5 w-7 h-7 rounded-full flex items-center justify-center shadow-xs border-2 border-white ${
                    isReschedule
                      ? 'bg-[#b85028] text-white'
                      : isLocation
                        ? 'bg-[#486b52] text-white'
                        : 'bg-[#1e1b19] text-white'
                  }`}
                >
                  <ClockCounterClockwise size={14} weight="bold" />
                </div>

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
                      Revision #{history.indexOf(log) + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-[#8a726a]">
                    <Clock size={14} weight="bold" />
                    <span>{new Date(log.changedAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* Actor Banner */}
                <div className="flex items-center gap-2 bg-[#faf2ee] px-3 py-1.5 rounded-xl border border-[#e8e1dd]/60 text-xs">
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
                    Modified by: {log.changedByName}
                  </span>
                </div>

                {/* Documented Reason */}
                {log.reason && (
                  <div className="text-xs text-[#57423b] bg-white p-3 rounded-xl border border-[#e8e1dd] flex flex-col gap-1">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-[#8a726a]">
                      Documented Reason:
                    </span>
                    <p className="italic">"{log.reason}"</p>
                  </div>
                )}

                {/* Before / After Comparison Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                  {/* Previous Values */}
                  <div className="bg-[#faf2ee]/70 rounded-xl p-3 border border-[#e8e1dd] flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a726a]">
                      Previous State
                    </span>
                    {log.previousValues.startDate && (
                      <div className="flex items-center gap-1 text-[#57423b]">
                        <CalendarBlank size={13} weight="bold" />
                        <span className="line-through">
                          {new Date(
                            log.previousValues.startDate,
                          ).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {log.previousValues.status && (
                      <div className="flex items-center gap-1 text-[#57423b]">
                        <Tag size={13} weight="bold" />
                        <span className="line-through">
                          {log.previousValues.status}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* New Values */}
                  <div className="bg-[#edf3ee]/60 rounded-xl p-3 border border-[#c2e9ca] flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#486b52]">
                      New State
                    </span>
                    {log.newValues.startDate && (
                      <div className="flex items-center gap-1 text-[#486b52] font-semibold">
                        <ArrowRight size={13} weight="bold" />
                        <span>
                          {new Date(log.newValues.startDate).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {log.newValues.status && (
                      <div className="flex items-center gap-1 text-[#486b52] font-semibold">
                        <ArrowRight size={13} weight="bold" />
                        <span>{log.newValues.status}</span>
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

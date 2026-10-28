import {
  useAttendanceQuery,
  useAuth,
  useDeleteActivityReportMutation,
  useLockAttendanceMutation,
  useTownContext,
  useTranslation,
  useUnlockAttendanceMutation,
  useUpdateActivityMutation,
} from '@jrs/client-core';
import {
  ActivityStatus,
  AttendanceStatus,
  AttendeeType,
  type IActivity,
  type IActivityReport,
} from '@jrs/shared';
import {
  ArrowCounterClockwise,
  ArrowLeft,
  ArrowSquareOut,
  Buildings,
  CalendarBlank,
  Clock,
  ClockCounterClockwise,
  CloudArrowUp,
  Eye,
  FileDoc,
  FilePdf,
  FileText,
  HardDrives,
  Info,
  ListChecks,
  Lock,
  LockOpen,
  MagnifyingGlass,
  MapPin,
  PencilSimple,
  Plus,
  Trash,
  UserCheck,
  Users,
  WarningCircle,
  X,
  XCircle,
} from '@phosphor-icons/react';
import { openUrl } from '@tauri-apps/plugin-opener';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';

import Skeleton from 'react-loading-skeleton';
import { AppSkeletonTheme, UserAvatar } from '../../../components';
import { formatCameroonPhone } from '../../members/utils/member-ui.utils';
import {
  formatActivityDate,
  formatActivityDateRange,
  getActivityStatusConfig,
  getActivityTypeConfig,
} from '../utils/activity-ui.utils';
import { ActivityPreparationTab } from './ActivityPreparationTab';
import { ActivityReminderTemplatesModal } from './ActivityReminderTemplatesModal';
import { ActivityReportUploadModal } from './ActivityReportUploadModal';
import { DriveFilePreviewModal } from './DriveFilePreviewModal';

interface ActivityDetailPageProps {
  activity: IActivity;
  onBack: () => void;
  onTrackAttendance: (activity: IActivity) => void;
  onEditActivity: (activity: IActivity) => void;
  onDeleteActivity?: (activity: IActivity) => void;
  isPrivileged: boolean;
  initialTab?: ActivityDetailTab;
}

type ActivityDetailTab =
  | 'overview'
  | 'preparation'
  | 'attendance'
  | 'report'
  | 'history';

export const ActivityDetailPage: React.FC<ActivityDetailPageProps> = ({
  activity,
  onBack,
  onTrackAttendance,
  onEditActivity,
  onDeleteActivity,
  isPrivileged,
  initialTab = 'overview',
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { canWrite, activeTownId } = useTownContext();
  const isHostTown =
    !activeTownId || activeTownId === (activity.hostTownId || activity.townId);
  const isParticipating = Boolean(
    activeTownId &&
      !isHostTown &&
      activity.includedTownIds?.includes(activeTownId),
  );
  const canManageActivity = canWrite && (isHostTown || isPrivileged);

  const [activeTabState, setActiveTab] =
    useState<ActivityDetailTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [search, setSearch] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState<'ALL' | 'GUESTS'>(
    'ALL',
  );
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<IActivityReport | null>(
    null,
  );
  const [previewFile, setPreviewFile] = useState<IActivityReport | null>(null);
  const [lockPromptOpen, setLockPromptOpen] = useState(false);
  const [lockReason, setLockReason] = useState('');

  // Attendance live data
  const { data: attendanceData, isLoading: isAttendanceLoading } =
    useAttendanceQuery(activity.id);

  const lockMutation = useLockAttendanceMutation();
  const unlockMutation = useUnlockAttendanceMutation();
  const deleteReportMutation = useDeleteActivityReportMutation();
  const updateActivityMutation = useUpdateActivityMutation();

  const isCurrentUserAp = user?.role === 'AP';
  const isLocked = Boolean(
    activity.isAttendanceLocked || attendanceData?.isLocked,
  );

  const now = new Date();
  const startDate = new Date(activity.startDate);
  const startDay = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate(),
    0,
    0,
    0,
    0,
  );
  const todayDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );
  const isDayOfActivityOrLater = todayDay.getTime() >= startDay.getTime();
  const isCancelled = activity.status === ActivityStatus.CANCELLED;
  const isPastActivity = now >= new Date(activity.endDate);
  const isCompleted = activity.status === ActivityStatus.COMPLETED;
  const canShowReportUi = isCompleted && isPastActivity && !isCancelled;

  const activeTab =
    !isDayOfActivityOrLater && activeTabState === 'attendance'
      ? 'overview'
      : activeTabState;

  const handleCancelActivity = async () => {
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

  const handleUndoCancel = async () => {
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

  // Existing reports list
  const reports: IActivityReport[] = useMemo(() => {
    if (activity.reports && activity.reports.length > 0) {
      return activity.reports;
    }
    return activity.report?.fileId ? [activity.report] : [];
  }, [activity.reports, activity.report]);

  // Attendees & Turnout KPIs
  const attendees = attendanceData?.attendees || [];
  const summary = attendanceData?.summary || {
    totalPresent: 0,
    membersPresent: 0,
    guestsPresent: 0,
  };

  const membersCount = attendees.filter(
    (a) => a.attendeeType === AttendeeType.MEMBER,
  ).length;
  const absentCount = attendees.filter(
    (a) =>
      a.attendeeType === AttendeeType.MEMBER &&
      a.status === AttendanceStatus.ABSENT,
  ).length;
  const turnoutPercent =
    membersCount > 0
      ? Math.round((summary.membersPresent / membersCount) * 100)
      : 0;

  // Only display those who attended (status === PRESENT)
  const attendedAttendees = useMemo(() => {
    return attendees.filter((item) => item.status === AttendanceStatus.PRESENT);
  }, [attendees]);

  const attendedGuests = useMemo(() => {
    return attendedAttendees.filter(
      (item) => item.attendeeType === AttendeeType.GUEST,
    );
  }, [attendedAttendees]);

  // Filtered Attendees list (cards)
  const filteredAttendees = useMemo(() => {
    return attendedAttendees.filter((item) => {
      const name =
        item.member?.fullName || item.guestInfo?.fullName || 'Anonymous';
      const phone =
        item.member?.phoneNumber || item.guestInfo?.phoneNumber || '';

      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = name.toLowerCase().includes(query);
        const matchesPhone = phone.includes(query);
        if (!matchesName && !matchesPhone) return false;
      }

      if (attendanceFilter === 'GUESTS') {
        return item.attendeeType === AttendeeType.GUEST;
      }

      return true;
    });
  }, [attendedAttendees, search, attendanceFilter]);

  const typeConfig = getActivityTypeConfig(activity.activityType, t);
  const statusConfig = getActivityStatusConfig(activity.status, t);
  const dateInfo = formatActivityDateRange(
    activity.startDate,
    activity.endDate,
  );
  const history = activity.changeHistory || [];

  const handleToggleLock = async () => {
    try {
      if (isLocked) {
        if (!isCurrentUserAp) return;
        await unlockMutation.mutateAsync({
          activityId: activity.id,
          reason:
            lockReason.trim() ||
            t(
              'activities:detail.lockPrompt.apOverrideDefaultReason',
              'AP Administrative Override',
            ),
        });
      } else {
        await lockMutation.mutateAsync({
          activityId: activity.id,
          reason:
            lockReason.trim() ||
            t(
              'activities:detail.lockPrompt.rollCallFinalizedReason',
              'Roll call finalized',
            ),
        });
      }
      setLockPromptOpen(false);
      setLockReason('');
    } catch {
      // Handled by mutation error toast
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf')
      return <FilePdf size={28} className="text-[#ba1a1a]" weight="fill" />;
    if (ext === 'doc' || ext === 'docx')
      return <FileDoc size={28} className="text-[#0284c7]" weight="fill" />;
    return <FileText size={28} className="text-[#b85028]" weight="fill" />;
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* 1. Top Navigation & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#8a726a] hover:text-[#1e1b19] transition-colors cursor-pointer self-start"
        >
          <ArrowLeft size={16} weight="bold" />
          <span>
            {t('activities:detail.backToActivities', 'Back to Activities')}
          </span>
        </button>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {canManageActivity && !isCompleted && (
            <button
              type="button"
              onClick={() => onEditActivity(activity)}
              className="px-3.5 py-1.5 rounded-md bg-white border border-[#e8e1dd] hover:bg-[#faf2ee] text-xs font-bold text-[#1e1b19] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <PencilSimple size={14} weight="bold" />
              <span>
                {t('activities:detail.editActivity', 'Edit Activity')}
              </span>
            </button>
          )}

          {canManageActivity && !isCompleted && !isCancelled && (
            <button
              type="button"
              onClick={handleCancelActivity}
              className="px-3.5 py-1.5 rounded-md bg-white border border-[#ffdad6] hover:bg-[#ffdad6]/40 text-xs font-bold text-[#ba1a1a] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <XCircle size={14} weight="bold" />
              <span>
                {t('activities:detail.cancelActivity', 'Cancel Activity')}
              </span>
            </button>
          )}

          {canManageActivity && isCancelled && (
            <button
              type="button"
              onClick={handleUndoCancel}
              className="px-3.5 py-1.5 rounded-md bg-white border border-[#c2e9ca] hover:bg-[#edf3ee] text-xs font-bold text-[#486b52] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <ArrowCounterClockwise size={14} weight="bold" />
              <span>
                {t('activities:detail.restoreActivity', 'Restore Activity')}
              </span>
            </button>
          )}

          {/* Delete action is forbidden before activity start date per item 3 */}
          {canManageActivity &&
            isPrivileged &&
            isDayOfActivityOrLater &&
            onDeleteActivity && (
              <button
                type="button"
                onClick={() => onDeleteActivity(activity)}
                className="px-3.5 py-1.5 rounded-md bg-white border border-[#ffdad6] hover:bg-[#ffdad6]/40 text-xs font-bold text-[#ba1a1a] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Trash size={14} weight="bold" />
                <span>{t('common:delete', 'Delete')}</span>
              </button>
            )}
        </div>
      </div>

      {/* Cancelled Alert Banner */}
      {isCancelled && (
        <div className="p-4 rounded-xl bg-[#ffdad6]/60 border border-[#ffdad6] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-[#ba1a1a]">
            <XCircle size={20} weight="fill" />
            <span className="font-bold">
              {t(
                'activities:detail.activityCancelledNotice',
                'This activity has been cancelled.',
              )}
            </span>
          </div>
          {canManageActivity && (
            <button
              type="button"
              onClick={handleUndoCancel}
              className="px-3.5 py-1.5 rounded-md bg-white border border-[#ffdad6] text-[#ba1a1a] font-bold hover:bg-[#ffdad6] transition-colors cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
            >
              <ArrowCounterClockwise size={14} weight="bold" />
              <span>
                {t(
                  'activities:detail.undoCancelAndRestore',
                  'Undo Cancel & Restore',
                )}
              </span>
            </button>
          )}
        </div>
      )}

      {/* 2. Activity Hero Banner */}
      <section className="bg-white rounded-xl border border-[#e8e1dd] shadow-xs p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-3 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold border ${typeConfig.badgeBg} ${typeConfig.badgeText} ${typeConfig.badgeBorder}`}
            >
              <typeConfig.icon size={14} weight="bold" />
              <span>{typeConfig.label}</span>
            </span>

            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold border ${statusConfig.badgeBg} ${statusConfig.badgeText} ${statusConfig.badgeBorder}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor} ${
                  statusConfig.isPulse ? 'animate-pulse' : ''
                }`}
              />
              <span>{statusConfig.label}</span>
            </span>

            <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-[#faf2ee] text-[#57423b] border border-[#e8e1dd]">
              {activity.town?.name || activity.town?.code}{' '}
              {t('activities:detail.hub', 'Hub')}
            </span>

            {isParticipating && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-[#edf3ee] border border-[#c2e9ca] text-[#486b52]">
                <Buildings size={13} weight="bold" />
                <span>
                  {t('activities:detail.interTownHost', {
                    host:
                      activity.hostTown?.name ||
                      activity.town?.name ||
                      t('activities:detail.otherHost', 'Other'),
                    defaultValue: 'Inter-Town · Host: {{host}}',
                  })}
                </span>
              </span>
            )}

            {isLocked && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-[#fff8e1] border border-[#ffe082] text-[#812901]">
                <Lock size={13} weight="bold" />
                <span>
                  {t('activities:detail.attendanceSealed', 'Attendance Sealed')}
                </span>
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[#1e1b19] tracking-tight leading-snug">
            {activity.title}
          </h1>

          <div className="flex items-center gap-4 text-xs text-[#57423b] flex-wrap">
            <div className="flex items-center gap-1.5">
              <CalendarBlank
                size={16}
                weight="bold"
                className="text-[#b85028]"
              />
              <span className="font-semibold text-[#1e1b19]">
                {dateInfo.dateRange}
              </span>
              <span className="text-[#8a726a]">· {dateInfo.timeRange}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <MapPin size={16} weight="fill" className="text-[#486b52]" />
              <span>{activity.locationVenue}</span>
            </div>

            {activity.town?.name && (
              <div className="flex items-center gap-1.5 text-[#8a726a]">
                <span>
                  {t('activities:detail.hostPrefix', {
                    host: activity.town.name,
                    defaultValue: 'Host: {{host}}',
                  })}
                </span>
              </div>
            )}

            {activity.includedTowns && activity.includedTowns.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-[#57423b]">
                <Buildings
                  size={14}
                  weight="duotone"
                  className="text-[#b85028]"
                />
                <span>
                  {t('activities:detail.participatingPrefix', {
                    towns: activity.includedTowns.map((t) => t.name).join(', '),
                    defaultValue: 'Participating: {{towns}}',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          {isCancelled ? (
            <div className="h-11 px-5 rounded-md bg-[#ffdad6]/60 border border-[#ffdad6] text-[#ba1a1a] font-bold text-xs flex items-center justify-center gap-2 select-none shadow-2xs">
              <XCircle size={18} weight="bold" />
              <span>
                {t('activities:detail.activityCancelled', 'Activity Cancelled')}
              </span>
            </div>
          ) : !isDayOfActivityOrLater ? (
            <div
              className="h-11 px-5 rounded-md bg-[#faf2ee] border border-[#e8e1dd] text-[#8a726a] font-semibold text-xs flex items-center justify-center gap-2 select-none shadow-2xs"
              title={t(
                'activities:detail.attendanceOpensOnDayTooltip',
                'Attendance roll-call opens on the day of the activity',
              )}
            >
              <Clock size={18} weight="bold" className="text-[#b85028]" />
              <span>
                {t(
                  'activities:detail.attendanceOpensOnDay',
                  'Attendance Opens on Activity Day',
                )}
              </span>
            </div>
          ) : !canManageActivity ? (
            <div
              className="h-11 px-5 rounded-md bg-[#faf2ee] border border-[#e8e1dd] text-[#8a726a] font-semibold text-xs flex items-center justify-center gap-2 select-none shadow-2xs"
              title={t(
                'activities:detail.hostTownEventTooltip',
                'Attendance is managed exclusively by the host town Contact Person',
              )}
            >
              <Buildings
                size={18}
                weight="duotone"
                className="text-[#b85028]"
              />
              <span>
                {t('activities:detail.hostTownEvent', {
                  host:
                    activity.hostTown?.name ||
                    activity.town?.name ||
                    t('activities:detail.hostFallback', 'Host'),
                  defaultValue: 'Host Town Event ({{host}})',
                })}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onTrackAttendance(activity)}
              disabled={isLocked && !isCurrentUserAp}
              className={`h-11 px-5 rounded-md font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                isLocked && !isCurrentUserAp
                  ? 'bg-[#8a726a]/30 text-[#8a726a] cursor-not-allowed'
                  : 'bg-[#b85028] hover:bg-[#a44520] text-white'
              }`}
              title={
                isLocked && !isCurrentUserAp
                  ? t(
                      'activities:detail.attendanceSealedTooltip',
                      'Attendance roll-call is sealed. Only an AP can modify.',
                    )
                  : t(
                      'activities:detail.trackAttendanceTooltip',
                      'Open live attendance roll-call roster',
                    )
              }
            >
              <UserCheck size={18} weight="bold" />
              <span>
                {isLocked
                  ? isCurrentUserAp
                    ? t(
                        'activities:detail.modifyAttendanceAp',
                        'Modify Attendance (AP Override)',
                      )
                    : t(
                        'activities:detail.attendanceSealed',
                        'Attendance Sealed',
                      )
                  : t('activities:detail.trackAttendance', 'Track Attendance')}
              </span>
            </button>
          )}

          {canShowReportUi && (
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="h-11 px-4 rounded-md bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd] text-[#1e1b19] font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <CloudArrowUp
                size={18}
                weight="bold"
                className="text-[#b85028]"
              />
              <span>
                {reports.length > 0
                  ? t('activities:detail.manageReportsCount', {
                      count: reports.length,
                      defaultValue: `Manage Reports (${reports.length})`,
                    })
                  : t('activities:detail.uploadReport', 'Upload Report')}
              </span>
            </button>
          )}
        </div>
      </section>

      {/* 3. Centralized Segmented Pill Tab Bar */}
      <div className="flex justify-center w-full">
        <div className="inline-flex p-1 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] shadow-2xs gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white text-[#1e1b19] shadow-2xs border border-[#e8e1dd]/60'
                : 'text-[#8a726a] hover:text-[#1e1b19]'
            }`}
          >
            <Info size={15} weight="bold" />
            <span>{t('activities:detail.tabs.overview', 'Overview')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preparation')}
            className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'preparation'
                ? 'bg-white text-[#1e1b19] shadow-2xs border border-[#e8e1dd]/60'
                : 'text-[#8a726a] hover:text-[#1e1b19]'
            }`}
          >
            <ListChecks size={15} weight="bold" />
            <span>
              {t('activities:detail.tabs.preparation', 'Checklist & Reminders')}
            </span>
            {(activity.remindersSent?.length ?? 0) > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#b85028]" />
            )}
          </button>

          {/* Attendance tab ONLY appears on or after the day of the activity */}
          {isDayOfActivityOrLater && (
            <button
              type="button"
              onClick={() => setActiveTab('attendance')}
              className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'attendance'
                  ? 'bg-white text-[#1e1b19] shadow-2xs border border-[#e8e1dd]/60'
                  : 'text-[#8a726a] hover:text-[#1e1b19]'
              }`}
            >
              <UserCheck size={15} weight="bold" />
              <span>
                {t('activities:detail.tabs.attendance', {
                  count: summary.totalPresent,
                  defaultValue: `Attendance (${summary.totalPresent})`,
                })}
              </span>
            </button>
          )}

          {/* Strictly conditional Report Tab - ONLY visible if activity completed and past */}
          {canShowReportUi && (
            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'report'
                  ? 'bg-white text-[#1e1b19] shadow-2xs border border-[#e8e1dd]/60'
                  : 'text-[#8a726a] hover:text-[#1e1b19]'
              }`}
            >
              <HardDrives size={15} weight="bold" />
              <span>
                {reports.length > 0
                  ? t('activities:detail.tabs.reportsCount', {
                      count: reports.length,
                      defaultValue: `Activity Reports (${reports.length})`,
                    })
                  : t('activities:detail.tabs.reports', 'Activity Reports')}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white text-[#1e1b19] shadow-2xs border border-[#e8e1dd]/60'
                : 'text-[#8a726a] hover:text-[#1e1b19]'
            }`}
          >
            <ClockCounterClockwise size={15} weight="bold" />
            <span>
              {t('activities:detail.tabs.history', {
                count: history.length,
                defaultValue: `Audit History (${history.length})`,
              })}
            </span>
          </button>
        </div>
      </div>

      {/* 4. Tab Content Area */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-150">
          {/* Turnout KPI Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-[#e8e1dd] shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
                {t('activities:detail.kpis.turnoutRate', 'Turnout Rate')}
              </span>
              <div className="text-3xl font-black text-[#1e1b19] mt-2">
                {turnoutPercent}%
              </div>
              <span className="text-[11px] text-[#8a726a] mt-1">
                {t(
                  'activities:detail.kpis.registeredYouth',
                  'of registered hub youth',
                )}
              </span>
            </div>

            <div className="bg-white rounded-xl p-5 border border-[#e8e1dd] shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
                {t('activities:detail.kpis.totalPresent', 'Total Present')}
              </span>
              <div className="text-3xl font-black text-[#2c4e37] mt-2">
                {summary.totalPresent}
              </div>
              <span className="text-[11px] text-[#57423b] mt-1">
                {t('activities:detail.kpis.presentBreakdown', {
                  members: summary.membersPresent,
                  guests: summary.guestsPresent,
                  defaultValue: `${summary.membersPresent} members + ${summary.guestsPresent} guests`,
                })}
              </span>
            </div>

            <div className="bg-white rounded-xl p-5 border border-[#e8e1dd] shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
                {t('activities:detail.kpis.membersAbsent', 'Members Absent')}
              </span>
              <div className="text-3xl font-black text-[#ba1a1a] mt-2">
                {absentCount}
              </div>
              <span className="text-[11px] text-[#8a726a] mt-1">
                {t('activities:detail.kpis.homeMembers', 'home hub members')}
              </span>
            </div>

            <div className="bg-white rounded-xl p-5 border border-[#e8e1dd] shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
                {t('activities:detail.kpis.externalGuests', 'External Guests')}
              </span>
              <div className="text-3xl font-black text-[#b85028] mt-2">
                {summary.guestsPresent}
              </div>
              <span className="text-[11px] text-[#8a726a] mt-1">
                {t(
                  'activities:detail.kpis.visitorsWelcomed',
                  'visitors welcomed',
                )}
              </span>
            </div>
          </div>

          {/* Lock Status & Roll Call Banner */}
          <div
            className={`p-4 sm:p-5 rounded-xl border flex items-center justify-between gap-4 flex-wrap shadow-2xs max-w-2xl ${
              isLocked
                ? 'bg-[#fffbf2] border-[#fde8bb] text-[#812901]'
                : 'bg-[#eef7f0] border-[#c2e9ca] text-[#2c4e37]'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${
                  isLocked
                    ? 'bg-[#ffe082] text-[#812901]'
                    : 'bg-[#c2e9ca] text-[#2c4e37]'
                }`}
              >
                {isLocked ? (
                  <Lock size={22} weight="bold" />
                ) : (
                  <LockOpen size={22} weight="bold" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm">
                  {isLocked
                    ? t(
                        'activities:detail.lockBanner.sealedTitle',
                        'Attendance Finalized & Sealed',
                      )
                    : t(
                        'activities:detail.lockBanner.openTitle',
                        'Attendance Open for Check-In',
                      )}
                </span>
                <span className="text-xs opacity-85">
                  {isLocked
                    ? t('activities:detail.lockBanner.sealedSubtitle', {
                        name:
                          activity.attendanceLockedByName ||
                          t('common:roles.administrator', 'Administrator'),
                        defaultValue: `Locked by ${activity.attendanceLockedByName || 'Administrator'} • Edits disabled without AP override`,
                      })
                    : t(
                        'activities:detail.lockBanner.openSubtitle',
                        'Active check-in session • Changes are autosaved to hub record',
                      )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isLocked
                ? isCurrentUserAp && (
                    <button
                      type="button"
                      onClick={() => setLockPromptOpen(true)}
                      className="px-3.5 py-1.5 rounded-md bg-white border border-[#ffe082] text-xs font-bold text-[#812901] hover:bg-[#fffbf0] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <LockOpen size={14} weight="bold" />
                      <span>
                        {t(
                          'activities:detail.lockBanner.unlockAp',
                          'Unlock (AP Override)',
                        )}
                      </span>
                    </button>
                  )
                : isPrivileged && (
                    <button
                      type="button"
                      onClick={() => setLockPromptOpen(true)}
                      className="px-4 py-2 rounded-md bg-[#2c4e37] hover:bg-[#233f2c] text-xs font-bold text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <Lock size={15} weight="bold" />
                      <span>
                        {t(
                          'activities:detail.lockBanner.finalizeAndLock',
                          'Finalize & Lock Attendance',
                        )}
                      </span>
                    </button>
                  )}
            </div>
          </div>

          {/* Lock / Unlock Confirmation Prompt */}
          {lockPromptOpen && (
            <div className="p-5 rounded-xl bg-white border-2 border-[#b85028] shadow-md flex flex-col gap-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#1e1b19] flex items-center gap-2">
                  <WarningCircle
                    size={16}
                    weight="bold"
                    className="text-[#b85028]"
                  />
                  <span>
                    {isLocked
                      ? t(
                          'activities:detail.lockPrompt.confirmUnlockTitle',
                          'Confirm AP Attendance Unlock',
                        )
                      : t(
                          'activities:detail.lockPrompt.confirmLockTitle',
                          'Confirm Finalizing Attendance',
                        )}
                  </span>
                </h4>
                <button
                  type="button"
                  onClick={() => setLockPromptOpen(false)}
                  className="text-[#8a726a] hover:text-[#1e1b19] text-xs cursor-pointer"
                >
                  {t('common:cancel', 'Cancel')}
                </button>
              </div>
              <p className="text-xs text-[#57423b]">
                {isLocked
                  ? t(
                      'activities:detail.lockPrompt.unlockWarning',
                      'Unlocking this attendance will allow coordinators to alter member check-in states. An audit record will be logged with your administrator credentials.',
                    )
                  : t(
                      'activities:detail.lockPrompt.lockWarning',
                      'Once locked, attendance records cannot be modified without an AP administrative override. Ensure all member and guest attendance is accurate.',
                    )}
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  placeholder={
                    isLocked
                      ? t(
                          'activities:detail.lockPrompt.unlockPlaceholder',
                          'Reason for AP override (e.g. Late check-in correction)...',
                        )
                      : t(
                          'activities:detail.lockPrompt.lockPlaceholder',
                          'Notes (Optional)...',
                        )
                  }
                  className="flex-1 px-3.5 py-2 text-xs rounded-md bg-[#faf2ee] border border-[#e8e1dd] focus:outline-none focus:border-[#b85028]"
                />
                <button
                  type="button"
                  onClick={handleToggleLock}
                  disabled={lockMutation.isPending || unlockMutation.isPending}
                  className={`px-4 py-2 rounded-md text-xs font-bold text-white transition-colors cursor-pointer shrink-0 ${
                    isLocked
                      ? 'bg-[#b85028] hover:bg-[#a44520]'
                      : 'bg-[#2c4e37] hover:bg-[#233f2c]'
                  }`}
                >
                  {isLocked
                    ? t(
                        'activities:detail.lockPrompt.confirmUnlock',
                        'Confirm Unlock',
                      )
                    : t(
                        'activities:detail.lockPrompt.confirmLock',
                        'Confirm & Seal',
                      )}
                </button>
              </div>
            </div>
          )}

          {/* Agenda & Notes Card */}
          <div className="bg-white rounded-xl border border-[#e8e1dd] p-6 shadow-xs flex flex-col gap-3">
            <h3 className="text-sm font-bold text-[#1e1b19] flex items-center gap-2">
              <Info size={16} weight="bold" className="text-[#b85028]" />
              <span>
                {t('activities:detail.notes.title', 'Activity Agenda & Notes')}
              </span>
            </h3>
            {activity.notes ? (
              <p className="text-xs text-[#57423b] leading-relaxed whitespace-pre-wrap bg-[#faf2ee]/40 p-4 rounded-lg border border-[#f4ece9]">
                {activity.notes}
              </p>
            ) : (
              <p className="text-xs text-[#8a726a] italic">
                {t(
                  'activities:detail.notes.empty',
                  'No supplementary notes or agenda items recorded for this activity.',
                )}
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB: PREPARATION & REMINDERS */}
      {activeTab === 'preparation' && (
        <ActivityPreparationTab
          activity={activity}
          isPrivileged={isPrivileged}
          onOpenTemplatesModal={() => setIsTemplatesModalOpen(true)}
        />
      )}

      {/* TAB 2: ATTENDANCE */}
      {isDayOfActivityOrLater && activeTab === 'attendance' && (
        <div className="bg-white rounded-xl border border-[#e8e1dd] shadow-xs p-6 flex flex-col gap-6 animate-in fade-in duration-150">
          {/* Attendees Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <MagnifyingGlass
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a726a]"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t(
                  'activities:detail.attendanceTab.searchPlaceholder',
                  'Search attendees by name or phone...',
                )}
                className="w-full pl-10 pr-3.5 py-2 rounded-md bg-[#faf2ee]/60 border border-[#e8e1dd] text-xs text-[#1e1b19] focus:outline-none focus:border-[#b85028]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Only ALL and GUESTS filters */}
              <div className="inline-flex p-1 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] gap-1">
                {(
                  [
                    {
                      id: 'ALL',
                      label: t('activities:detail.attendanceTab.allCount', {
                        count: attendedAttendees.length,
                        defaultValue: `All (${attendedAttendees.length})`,
                      }),
                    },
                    {
                      id: 'GUESTS',
                      label: t('activities:detail.attendanceTab.guestsCount', {
                        count: attendedGuests.length,
                        defaultValue: `Guests (${attendedGuests.length})`,
                      }),
                    },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setAttendanceFilter(tab.id)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      attendanceFilter === tab.id
                        ? 'bg-white text-[#1e1b19] shadow-2xs'
                        : 'text-[#8a726a] hover:text-[#1e1b19]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onTrackAttendance(activity)}
                disabled={isLocked && !isCurrentUserAp}
                className={`px-3.5 py-1.5 rounded-md text-xs font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  isLocked && !isCurrentUserAp
                    ? 'bg-[#8a726a]/30 text-[#8a726a] cursor-not-allowed'
                    : 'bg-[#b85028] hover:bg-[#a44520]'
                }`}
              >
                <UserCheck size={14} weight="bold" />
                <span>
                  {isLocked
                    ? t(
                        'activities:detail.attendanceTab.editAttendanceAp',
                        'Edit Attendance (AP)',
                      )
                    : t(
                        'activities:detail.attendanceTab.trackAttendance',
                        'Track Attendance',
                      )}
                </span>
              </button>
            </div>
          </div>

          {/* Attendees Cards Grid */}
          <div>
            {isAttendanceLoading ? (
              <AppSkeletonTheme>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-[#e8e1dd] bg-white p-4 flex items-center justify-between shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <Skeleton circle width={40} height={40} />
                        <div className="flex flex-col gap-1">
                          <Skeleton width={110} height={14} />
                          <Skeleton width={70} height={11} />
                        </div>
                      </div>
                      <Skeleton width={48} height={20} borderRadius={6} />
                    </div>
                  ))}
                </div>
              </AppSkeletonTheme>
            ) : filteredAttendees.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center text-xs text-[#8a726a] border border-[#e8e1dd] rounded-xl bg-[#faf2ee]/30">
                <Users size={32} className="text-[#b85028]/60 mb-2" />
                <span className="font-bold text-[#1e1b19]">
                  {t(
                    'activities:detail.attendanceTab.noAttendeesTitle',
                    'No Attendees Recorded',
                  )}
                </span>
                <span className="mt-1 text-[11px]">
                  {search
                    ? t(
                        'activities:detail.attendanceTab.noSearchMatches',
                        'No attendees match your search query.',
                      )
                    : t(
                        'activities:detail.attendanceTab.noAttendeesRecorded',
                        'No members or guests have been recorded as present for this activity yet.',
                      )}
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredAttendees.map((att) => {
                  const name =
                    att.member?.fullName ||
                    att.guestInfo?.fullName ||
                    t('activities:detail.attendanceTab.anonymous', 'Anonymous');
                  const phone =
                    att.member?.phoneNumber || att.guestInfo?.phoneNumber || '';
                  const avatarUrl = att.member?.avatarUrl;
                  const role =
                    att.attendeeType === AttendeeType.GUEST
                      ? t('activities:detail.attendanceTab.guestBadge', 'Guest')
                      : att.member?.role ||
                        t(
                          'activities:detail.attendanceTab.memberBadge',
                          'Member',
                        );
                  const checkIn = att.checkInTime
                    ? new Date(att.checkInTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—';

                  return (
                    <div
                      key={att.id || att.memberId || name}
                      className="bg-white rounded-lg border border-[#e8e1dd] hover:border-[#b85028]/40 p-4 flex flex-col gap-3 shadow-2xs hover:shadow-xs transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          name={name}
                          avatarUrl={avatarUrl}
                          size="lg"
                          className="rounded-lg shadow-2xs shrink-0"
                        />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-bold text-xs text-[#1e1b19] truncate group-hover:text-[#b85028] transition-colors">
                            {name}
                          </span>
                          {phone ? (
                            <span className="text-[10px] text-[#8a726a] font-mono mt-0.5 truncate">
                              {formatCameroonPhone(phone)}
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#8a726a] italic mt-0.5">
                              {t(
                                'activities:detail.attendanceTab.noPhone',
                                'No phone',
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#f4ece9] flex items-center justify-between text-xs">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            att.attendeeType === AttendeeType.GUEST
                              ? 'bg-[#f4ece9] text-[#715b53] border-[#e8e1dd]'
                              : 'bg-[#faf2ee] text-[#b85028] border-[#ffdbcf]'
                          }`}
                        >
                          {role}
                        </span>

                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#57423b]">
                          <Clock
                            size={13}
                            className="text-[#486b52]"
                            weight="bold"
                          />
                          <span>{checkIn}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ACTIVITY REPORTS (STRICTLY IF COMPLETED & PAST) */}
      {canShowReportUi && activeTab === 'report' && (
        <div className="bg-white rounded-xl border border-[#e8e1dd] shadow-xs p-6 sm:p-8 flex flex-col gap-6 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f4ece9] pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#fff2ee] border border-[#ffdbcf] text-[#b85028] flex items-center justify-center shrink-0">
                <HardDrives size={24} weight="duotone" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-[#1e1b19]">
                  {t('activities:detail.reportsTab.title', {
                    count: reports.length,
                    defaultValue: `Google Drive Activity Reports (${reports.length})`,
                  })}
                </h3>
                <p className="text-xs text-[#8a726a]">
                  {t(
                    'activities:detail.reportsTab.subtitle',
                    'Archived activity minutes, attendance summaries, photos, and documents.',
                  )}
                </p>
              </div>
            </div>

            {isPrivileged && (
              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="px-4 py-2.5 rounded-md bg-[#b85028] hover:bg-[#a44520] text-xs font-bold text-white transition-all flex items-center gap-2 shadow-2xs cursor-pointer self-start sm:self-auto"
              >
                <Plus size={15} weight="bold" />
                <span>
                  {reports.length > 0
                    ? t(
                        'activities:detail.reportsTab.uploadMore',
                        'Upload More Reports',
                      )
                    : t(
                        'activities:detail.reportsTab.uploadReports',
                        'Upload Reports',
                      )}
                </span>
              </button>
            )}
          </div>

          {reports.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-lg bg-[#faf2ee]/60 border border-[#e8e1dd] flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-white border border-[#e8e1dd] text-[#b85028] flex items-center justify-center font-bold text-xs">
                  {reports.length}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#8a726a] uppercase tracking-wider">
                    {t(
                      'activities:detail.reportsTab.totalDocuments',
                      'Total Documents',
                    )}
                  </span>
                  <span className="text-xs font-semibold text-[#1e1b19]">
                    {t('activities:detail.reportsTab.filesArchived', {
                      count: reports.length,
                      defaultValue: `${reports.length} files archived`,
                    })}
                  </span>
                </div>
              </div>
              <div className="p-3.5 rounded-lg bg-[#faf2ee]/60 border border-[#e8e1dd] flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-white border border-[#e8e1dd] text-[#b85028] flex items-center justify-center font-bold text-xs">
                  MB
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#8a726a] uppercase tracking-wider">
                    {t('activities:detail.reportsTab.totalSize', 'Total Size')}
                  </span>
                  <span className="text-xs font-semibold text-[#1e1b19]">
                    {t('activities:detail.reportsTab.mbStored', {
                      size: (
                        reports.reduce((acc, r) => acc + (r.fileSize || 0), 0) /
                        (1024 * 1024)
                      ).toFixed(2),
                      defaultValue: `${(reports.reduce((acc, r) => acc + (r.fileSize || 0), 0) / (1024 * 1024)).toFixed(2)} MB stored`,
                    })}
                  </span>
                </div>
              </div>
              <div className="p-3.5 rounded-lg bg-[#faf2ee]/60 border border-[#e8e1dd] flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-white border border-[#e8e1dd] text-[#b85028] flex items-center justify-center">
                  <Clock size={16} weight="bold" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#8a726a] uppercase tracking-wider">
                    {t(
                      'activities:detail.reportsTab.latestUpload',
                      'Latest Upload',
                    )}
                  </span>
                  <span className="text-xs font-semibold text-[#1e1b19]">
                    {reports[reports.length - 1]?.uploadedAt
                      ? new Date(
                          reports[reports.length - 1].uploadedAt,
                        ).toLocaleDateString()
                      : t('activities:detail.reportsTab.recently', 'Recently')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {reports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {reports.map((rep) => (
                <div
                  key={rep.fileId}
                  className="p-5 rounded-lg bg-white border border-[#e8e1dd] hover:border-[#b85028]/40 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3 group"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#faf2ee] flex items-center justify-center shrink-0 border border-[#e8e1dd] text-[#b85028]">
                        {getFileIcon(rep.filename)}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isPrivileged && (
                          <button
                            type="button"
                            onClick={() => setReportToDelete(rep)}
                            className="p-1.5 rounded-md text-[#ba1a1a]/70 hover:text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-colors cursor-pointer"
                            title={t(
                              'activities:detail.reportsTab.deleteTooltip',
                              'Delete this report from Google Drive',
                            )}
                          >
                            <Trash size={15} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4
                        className="font-bold text-sm text-[#1e1b19] line-clamp-1 group-hover:text-[#b85028] transition-colors"
                        title={rep.filename}
                      >
                        {rep.filename}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#8a726a] flex-wrap mt-1">
                        <span>
                          {rep.uploadedByName ||
                            t(
                              'activities:detail.reportsTab.coordinatorFallback',
                              'Coordinator',
                            )}
                        </span>
                        <span>•</span>
                        <span>
                          {rep.uploadedAt
                            ? new Date(rep.uploadedAt).toLocaleDateString()
                            : t(
                                'activities:detail.reportsTab.recently',
                                'Recently',
                              )}
                        </span>
                        {rep.fileSize && (
                          <>
                            <span>•</span>
                            <span>
                              {(rep.fileSize / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {rep.summary && (
                      <div className="p-3 rounded-md bg-[#faf2ee]/40 border border-[#f4ece9] text-xs text-[#57423b] leading-relaxed line-clamp-2">
                        {rep.summary}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-[#f4ece9]">
                    <button
                      type="button"
                      onClick={() => setPreviewFile(rep)}
                      className="flex-1 py-2 px-3.5 rounded-md bg-[#b85028] hover:bg-[#9c421f] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Eye size={15} weight="bold" />
                      <span>
                        {t(
                          'activities:detail.reportsTab.previewFile',
                          'Preview File',
                        )}
                      </span>
                    </button>
                    {rep.webViewLink && (
                      <button
                        type="button"
                        onClick={() => {
                          const target = rep.webViewLink;
                          if (!target) return;
                          openUrl(target).catch(() => {
                            window.open(
                              target,
                              '_blank',
                              'noopener,noreferrer',
                            );
                          });
                        }}
                        className="p-2 rounded-md bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd] text-[#1e1b19] transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                        title={t(
                          'activities:detail.reportsTab.openInDriveTooltip',
                          'Open in Google Drive (External Browser)',
                        )}
                      >
                        <ArrowSquareOut size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 rounded-xl border-2 border-dashed border-[#e8e1dd] flex flex-col items-center justify-center text-center gap-3 bg-[#faf2ee]/20">
              <div className="w-12 h-12 rounded-lg bg-[#faf2ee] text-[#b85028] flex items-center justify-center">
                <CloudArrowUp size={24} weight="duotone" />
              </div>
              <h4 className="text-sm font-bold text-[#1e1b19]">
                {t(
                  'activities:detail.reportsTab.noReportsTitle',
                  'No Reports Attached Yet',
                )}
              </h4>
              <p className="text-xs text-[#8a726a] max-w-sm">
                {t(
                  'activities:detail.reportsTab.noReportsDesc',
                  'This activity has concluded. Hub coordinators can upload session minutes, attendance summaries, photos, or meeting notes directly to Google Drive.',
                )}
              </p>
              {isPrivileged && (
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  className="mt-2 px-5 py-2.5 rounded-md bg-[#b85028] hover:bg-[#a44520] text-xs font-bold text-white transition-all shadow-xs cursor-pointer flex items-center gap-2"
                >
                  <Plus size={16} weight="bold" />
                  <span>
                    {t(
                      'activities:detail.reportsTab.uploadActivityReports',
                      'Upload Activity Reports',
                    )}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AUDIT HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-[#e8e1dd] shadow-xs p-6 flex flex-col gap-4 animate-in fade-in duration-150">
          <h3 className="text-sm font-bold text-[#1e1b19] flex items-center gap-2">
            <ClockCounterClockwise
              size={16}
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

          {history.length === 0 ? (
            <p className="text-xs text-[#8a726a] italic p-6 text-center">
              {t(
                'activities:detail.historyTab.empty',
                'No modifications recorded. This activity has remained in its initial configuration.',
              )}
            </p>
          ) : (
            <div className="divide-y divide-[#f4ece9] border border-[#e8e1dd] rounded-lg overflow-hidden">
              {history.map((log) => (
                <div
                  key={log.id}
                  className="p-4 flex flex-col gap-1.5 hover:bg-[#faf2ee]/30 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-[#1e1b19]">
                      {log.changeType.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] text-[#8a726a] font-mono">
                      {formatActivityDate(log.changedAt)}
                    </span>
                  </div>
                  {log.reason && (
                    <p className="text-xs text-[#57423b] italic">
                      "{log.reason}"
                    </p>
                  )}
                  <span className="text-[10px] text-[#8a726a]">
                    {t('activities:detail.historyTab.recordedBy', {
                      name:
                        log.changedByName ||
                        log.changedBy ||
                        t('common:roles.administrator', 'Administrator'),
                      defaultValue: `Recorded by ${log.changedByName || log.changedBy || 'Administrator'}`,
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Report Upload Modal Dialog */}
      {isReportModalOpen && (
        <ActivityReportUploadModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          activity={activity}
          isPrivileged={isPrivileged}
        />
      )}

      {/* Direct Report Delete Confirmation Modal */}
      {reportToDelete && (
        <div className="fixed inset-0 z-50 bg-[#1e1b19]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-xl border border-[#e8e1dd] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#f4ece9] flex items-start justify-between bg-[#fffbf9]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-[#ffdad6] border border-[#ffb4ab] text-[#ba1a1a] flex items-center justify-center shrink-0">
                  <Trash size={22} weight="bold" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1e1b19]">
                    {t(
                      'activities:detail.deleteReportModal.title',
                      'Delete Report File',
                    )}
                  </h3>
                  <p className="text-xs text-[#8a726a] truncate max-w-xs">
                    {reportToDelete.filename}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReportToDelete(null)}
                className="w-8 h-8 rounded-md bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd] flex items-center justify-center text-[#8a726a] hover:text-[#1e1b19] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <p className="text-xs text-[#57423b] leading-relaxed">
                {t(
                  'activities:detail.deleteReportModal.desc',
                  'Are you sure you want to permanently delete this report file from Google Drive and remove it from this activity record?',
                )}
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#f4ece9]">
                <button
                  type="button"
                  onClick={() => setReportToDelete(null)}
                  className="px-4 py-2 rounded-md bg-white border border-[#e8e1dd] text-[#57423b] font-bold text-xs hover:bg-[#faf2ee] cursor-pointer"
                >
                  {t('common:cancel', 'Cancel')}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await deleteReportMutation.mutateAsync({
                        activityId: activity.id,
                        fileId: reportToDelete.fileId,
                      });
                      setReportToDelete(null);
                    } catch {
                      // Handled by mutation error state
                    }
                  }}
                  disabled={deleteReportMutation.isPending}
                  className="px-5 py-2 rounded-md bg-[#ba1a1a] hover:bg-[#93000a] text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Trash size={14} weight="bold" />
                  <span>
                    {deleteReportMutation.isPending
                      ? t(
                          'activities:detail.deleteReportModal.deleting',
                          'Deleting...',
                        )
                      : t(
                          'activities:detail.deleteReportModal.confirm',
                          'Confirm Delete',
                        )}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Google Drive Document In-App Preview Modal */}
      <DriveFilePreviewModal
        isOpen={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />

      {/* Reminder Templates Guidelines Modal */}
      <ActivityReminderTemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        initialType={activity.activityType}
      />
    </div>
  );
};

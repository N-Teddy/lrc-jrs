import {
  useAttendanceQuery,
  useAuth,
  useDeleteActivityReportMutation,
  useLockAttendanceMutation,
  useTownContext,
  useTranslation,
  useUnlockAttendanceMutation,
} from '@jrs/client-core';
import {
  ActivityStatus,
  AttendanceStatus,
  AttendeeType,
  type IActivity,
  type IActivityReport,
} from '@jrs/shared';
import {
  ArrowLeft,
  ArrowSquareOut,
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
} from '@phosphor-icons/react';
import type React from 'react';
import { useMemo, useState } from 'react';
import { UserAvatar } from '../../../components';
import { formatCameroonPhone } from '../../members/utils/member-ui.utils';
import {
  formatActivityDate,
  formatActivityDateRange,
  getActivityStatusConfig,
  getActivityTypeConfig,
} from '../utils/activity-ui.utils';
import { ActivityReportUploadModal } from './ActivityReportUploadModal';
import { DriveFilePreviewModal } from './DriveFilePreviewModal';

interface ActivityDetailPageProps {
  activity: IActivity;
  onBack: () => void;
  onTrackAttendance: (activity: IActivity) => void;
  onEditActivity: (activity: IActivity) => void;
  onDeleteActivity?: (activity: IActivity) => void;
  isPrivileged: boolean;
}

type ActivityDetailTab = 'overview' | 'attendance' | 'report' | 'history';

export const ActivityDetailPage: React.FC<ActivityDetailPageProps> = ({
  activity,
  onBack,
  onTrackAttendance,
  onEditActivity,
  onDeleteActivity,
  isPrivileged,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { canWrite } = useTownContext();

  const [activeTab, setActiveTab] = useState<ActivityDetailTab>('overview');
  const [search, setSearch] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState<'ALL' | 'GUESTS'>(
    'ALL',
  );
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
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

  const isCurrentUserAp = user?.role === 'AP';
  const isLocked = Boolean(
    activity.isAttendanceLocked || attendanceData?.isLocked,
  );

  // STRICT REQUIREMENT: Report available ONLY after activity AND if completed
  const now = new Date();
  const isPastActivity = now >= new Date(activity.endDate);
  const isCompleted = activity.status === ActivityStatus.COMPLETED;
  const canShowReportUi = isCompleted && isPastActivity;

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
          reason: lockReason.trim() || 'AP Administrative Override',
        });
      } else {
        await lockMutation.mutateAsync({
          activityId: activity.id,
          reason: lockReason.trim() || 'Roll call finalized',
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
          <span>Back to Activities</span>
        </button>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {canWrite && (
            <button
              type="button"
              onClick={() => onEditActivity(activity)}
              className="px-3.5 py-1.5 rounded-lg bg-white border border-[#e8e1dd] hover:bg-[#faf2ee] text-xs font-bold text-[#1e1b19] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <PencilSimple size={14} weight="bold" />
              <span>Edit Activity</span>
            </button>
          )}

          {canWrite && isPrivileged && onDeleteActivity && (
            <button
              type="button"
              onClick={() => onDeleteActivity(activity)}
              className="px-3.5 py-1.5 rounded-lg bg-white border border-[#ffdad6] hover:bg-[#ffdad6]/40 text-xs font-bold text-[#ba1a1a] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Trash size={14} weight="bold" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Activity Hero Banner */}
      <section className="bg-white rounded-3xl border border-[#e8e1dd] shadow-xs p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
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
              {activity.town?.name || activity.town?.code} Hub
            </span>

            {isLocked && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-[#fff8e1] border border-[#ffe082] text-[#812901]">
                <Lock size={13} weight="bold" />
                <span>Attendance Sealed</span>
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
                <span>Host: {activity.town.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onTrackAttendance(activity)}
            disabled={isLocked && !isCurrentUserAp}
            className={`h-11 px-5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
              isLocked && !isCurrentUserAp
                ? 'bg-[#8a726a]/30 text-[#8a726a] cursor-not-allowed'
                : 'bg-[#b85028] hover:bg-[#a44520] text-white'
            }`}
            title={
              isLocked && !isCurrentUserAp
                ? 'Attendance roll-call is sealed. Only an AP can modify.'
                : 'Open live attendance roll-call roster'
            }
          >
            <UserCheck size={18} weight="bold" />
            <span>
              {isLocked
                ? isCurrentUserAp
                  ? 'Modify Attendance (AP Override)'
                  : 'Attendance Sealed'
                : 'Track Attendance'}
            </span>
          </button>

          {canShowReportUi && (
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="h-11 px-4 rounded-xl bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd] text-[#1e1b19] font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <CloudArrowUp
                size={18}
                weight="bold"
                className="text-[#b85028]"
              />
              <span>
                {reports.length > 0
                  ? `Manage Reports (${reports.length})`
                  : 'Upload Report'}
              </span>
            </button>
          )}
        </div>
      </section>

      {/* 3. Centralized Segmented Pill Tab Bar */}
      <div className="flex justify-center w-full">
        <div className="inline-flex p-1 rounded-xl bg-[#faf2ee] border border-[#e8e1dd] shadow-2xs gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white text-[#1e1b19] shadow-2xs border border-[#e8e1dd]/60'
                : 'text-[#8a726a] hover:text-[#1e1b19]'
            }`}
          >
            <Info size={15} weight="bold" />
            <span>Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'attendance'
                ? 'bg-white text-[#1e1b19] shadow-2xs border border-[#e8e1dd]/60'
                : 'text-[#8a726a] hover:text-[#1e1b19]'
            }`}
          >
            <UserCheck size={15} weight="bold" />
            <span>Attendance ({summary.totalPresent})</span>
          </button>

          {/* Strictly conditional Report Tab - ONLY visible if activity completed and past */}
          {canShowReportUi && (
            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'report'
                  ? 'bg-white text-[#1e1b19] shadow-2xs border border-[#e8e1dd]/60'
                  : 'text-[#8a726a] hover:text-[#1e1b19]'
              }`}
            >
              <HardDrives size={15} weight="bold" />
              <span>
                Activity Reports{' '}
                {reports.length > 0 ? `(${reports.length})` : ''}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white text-[#1e1b19] shadow-2xs border border-[#e8e1dd]/60'
                : 'text-[#8a726a] hover:text-[#1e1b19]'
            }`}
          >
            <ClockCounterClockwise size={15} weight="bold" />
            <span>Audit History ({history.length})</span>
          </button>
        </div>
      </div>

      {/* 4. Tab Content Area */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-150">
          {/* Turnout KPI Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-[#e8e1dd] shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
                Turnout Rate
              </span>
              <div className="text-3xl font-black text-[#1e1b19] mt-2">
                {turnoutPercent}%
              </div>
              <span className="text-[11px] text-[#8a726a] mt-1">
                of registered hub youth
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#e8e1dd] shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
                Total Present
              </span>
              <div className="text-3xl font-black text-[#2c4e37] mt-2">
                {summary.totalPresent}
              </div>
              <span className="text-[11px] text-[#57423b] mt-1">
                {summary.membersPresent} members + {summary.guestsPresent}{' '}
                guests
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#e8e1dd] shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
                Members Absent
              </span>
              <div className="text-3xl font-black text-[#ba1a1a] mt-2">
                {absentCount}
              </div>
              <span className="text-[11px] text-[#8a726a] mt-1">
                home hub members
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#e8e1dd] shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
                External Guests
              </span>
              <div className="text-3xl font-black text-[#b85028] mt-2">
                {summary.guestsPresent}
              </div>
              <span className="text-[11px] text-[#8a726a] mt-1">
                visitors welcomed
              </span>
            </div>
          </div>

          {/* Lock Status & Roll Call Banner */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border flex items-center justify-between gap-4 flex-wrap shadow-2xs max-w-2xl ${
              isLocked
                ? 'bg-[#fffbf2] border-[#fde8bb] text-[#812901]'
                : 'bg-[#eef7f0] border-[#c2e9ca] text-[#2c4e37]'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
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
                    ? 'Attendance Finalized & Sealed'
                    : 'Attendance Open for Check-In'}
                </span>
                <span className="text-xs opacity-85">
                  {isLocked
                    ? `Locked by ${activity.attendanceLockedByName || 'Administrator'} • Edits disabled without AP override`
                    : 'Active check-in session • Changes are autosaved to hub record'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isLocked
                ? isCurrentUserAp && (
                    <button
                      type="button"
                      onClick={() => setLockPromptOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-white border border-[#ffe082] text-xs font-bold text-[#812901] hover:bg-[#fffbf0] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <LockOpen size={14} weight="bold" />
                      <span>Unlock (AP Override)</span>
                    </button>
                  )
                : isPrivileged && (
                    <button
                      type="button"
                      onClick={() => setLockPromptOpen(true)}
                      className="px-4 py-2 rounded-xl bg-[#2c4e37] hover:bg-[#233f2c] text-xs font-bold text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <Lock size={15} weight="bold" />
                      <span>Finalize & Lock Attendance</span>
                    </button>
                  )}
            </div>
          </div>

          {/* Lock / Unlock Confirmation Prompt */}
          {lockPromptOpen && (
            <div className="p-5 rounded-2xl bg-white border-2 border-[#b85028] shadow-md flex flex-col gap-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#1e1b19] flex items-center gap-2">
                  <WarningCircle
                    size={16}
                    weight="bold"
                    className="text-[#b85028]"
                  />
                  <span>
                    {isLocked
                      ? 'Confirm AP Attendance Unlock'
                      : 'Confirm Finalizing Attendance'}
                  </span>
                </h4>
                <button
                  type="button"
                  onClick={() => setLockPromptOpen(false)}
                  className="text-[#8a726a] hover:text-[#1e1b19] text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-[#57423b]">
                {isLocked
                  ? 'Unlocking this attendance will allow coordinators to alter member check-in states. An audit record will be logged with your administrator credentials.'
                  : 'Once locked, attendance records cannot be modified without an Apostolic Prefect (AP) administrative override. Ensure all member and guest attendance is accurate.'}
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  placeholder={
                    isLocked
                      ? 'Reason for AP override (e.g. Late check-in correction)...'
                      : 'Notes (Optional)...'
                  }
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-[#faf2ee] border border-[#e8e1dd] focus:outline-none focus:border-[#b85028]"
                />
                <button
                  type="button"
                  onClick={handleToggleLock}
                  disabled={lockMutation.isPending || unlockMutation.isPending}
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer shrink-0 ${
                    isLocked
                      ? 'bg-[#b85028] hover:bg-[#a44520]'
                      : 'bg-[#2c4e37] hover:bg-[#233f2c]'
                  }`}
                >
                  {isLocked ? 'Confirm Unlock' : 'Confirm & Seal'}
                </button>
              </div>
            </div>
          )}

          {/* Agenda & Notes Card */}
          <div className="bg-white rounded-3xl border border-[#e8e1dd] p-6 shadow-xs flex flex-col gap-3">
            <h3 className="text-sm font-bold text-[#1e1b19] flex items-center gap-2">
              <Info size={16} weight="bold" className="text-[#b85028]" />
              <span>Activity Agenda & Notes</span>
            </h3>
            {activity.notes ? (
              <p className="text-xs text-[#57423b] leading-relaxed whitespace-pre-wrap bg-[#faf2ee]/40 p-4 rounded-2xl border border-[#f4ece9]">
                {activity.notes}
              </p>
            ) : (
              <p className="text-xs text-[#8a726a] italic">
                No supplementary notes or agenda items recorded for this
                activity.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-3xl border border-[#e8e1dd] shadow-xs p-6 flex flex-col gap-6 animate-in fade-in duration-150">
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
                placeholder="Search attendees by name or phone..."
                className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-[#faf2ee]/60 border border-[#e8e1dd] text-xs text-[#1e1b19] focus:outline-none focus:border-[#b85028]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Only ALL and GUESTS filters */}
              <div className="inline-flex p-1 rounded-xl bg-[#faf2ee] border border-[#e8e1dd] gap-1">
                {(
                  [
                    { id: 'ALL', label: `All (${attendedAttendees.length})` },
                    {
                      id: 'GUESTS',
                      label: `Guests (${attendedGuests.length})`,
                    },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setAttendanceFilter(tab.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  isLocked && !isCurrentUserAp
                    ? 'bg-[#8a726a]/30 text-[#8a726a] cursor-not-allowed'
                    : 'bg-[#b85028] hover:bg-[#a44520]'
                }`}
              >
                <UserCheck size={14} weight="bold" />
                <span>
                  {isLocked ? 'Edit Attendance (AP)' : 'Track Attendance'}
                </span>
              </button>
            </div>
          </div>

          {/* Attendees Cards Grid */}
          <div>
            {isAttendanceLoading ? (
              <div className="p-12 text-center text-xs text-[#8a726a] animate-pulse">
                Loading attendance records...
              </div>
            ) : filteredAttendees.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center text-xs text-[#8a726a] border border-[#e8e1dd] rounded-2xl bg-[#faf2ee]/30">
                <Users size={32} className="text-[#b85028]/60 mb-2" />
                <span className="font-bold text-[#1e1b19]">
                  No Attendees Recorded
                </span>
                <span className="mt-1 text-[11px]">
                  {search
                    ? 'No attendees match your search query.'
                    : 'No members or guests have been recorded as present for this activity yet.'}
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredAttendees.map((att) => {
                  const name =
                    att.member?.fullName ||
                    att.guestInfo?.fullName ||
                    'Anonymous';
                  const phone =
                    att.member?.phoneNumber || att.guestInfo?.phoneNumber || '';
                  const avatarUrl = att.member?.avatarUrl;
                  const role =
                    att.attendeeType === AttendeeType.GUEST
                      ? 'Guest'
                      : att.member?.role || 'Member';
                  const checkIn = att.checkInTime
                    ? new Date(att.checkInTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—';

                  return (
                    <div
                      key={att.id || att.memberId || name}
                      className="bg-white rounded-2xl border border-[#e8e1dd] hover:border-[#b85028]/40 p-4 flex flex-col gap-3 shadow-2xs hover:shadow-xs transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          name={name}
                          avatarUrl={avatarUrl}
                          size="lg"
                          className="rounded-xl shadow-2xs shrink-0"
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
                              No phone
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
        <div className="bg-white rounded-3xl border border-[#e8e1dd] shadow-xs p-6 sm:p-8 flex flex-col gap-6 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f4ece9] pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#fff2ee] border border-[#ffdbcf] text-[#b85028] flex items-center justify-center shrink-0">
                <HardDrives size={24} weight="duotone" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-[#1e1b19]">
                  Google Drive Activity Reports ({reports.length})
                </h3>
                <p className="text-xs text-[#8a726a]">
                  Archived fellowship minutes, attendance summaries, photos, and
                  documents.
                </p>
              </div>
            </div>

            {isPrivileged && (
              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-[#b85028] hover:bg-[#a44520] text-xs font-bold text-white transition-all flex items-center gap-2 shadow-2xs cursor-pointer self-start sm:self-auto"
              >
                <Plus size={15} weight="bold" />
                <span>
                  {reports.length > 0
                    ? 'Upload More Reports'
                    : 'Upload Reports'}
                </span>
              </button>
            )}
          </div>

          {reports.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#faf2ee]/60 border border-[#e8e1dd] flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-[#e8e1dd] text-[#b85028] flex items-center justify-center font-bold text-xs">
                  {reports.length}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#8a726a] uppercase tracking-wider">
                    Total Documents
                  </span>
                  <span className="text-xs font-semibold text-[#1e1b19]">
                    {reports.length} {reports.length === 1 ? 'file' : 'files'}{' '}
                    archived
                  </span>
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#faf2ee]/60 border border-[#e8e1dd] flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-[#e8e1dd] text-[#b85028] flex items-center justify-center font-bold text-xs">
                  MB
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#8a726a] uppercase tracking-wider">
                    Total Size
                  </span>
                  <span className="text-xs font-semibold text-[#1e1b19]">
                    {(
                      reports.reduce((acc, r) => acc + (r.fileSize || 0), 0) /
                      (1024 * 1024)
                    ).toFixed(2)}{' '}
                    MB stored
                  </span>
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#faf2ee]/60 border border-[#e8e1dd] flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-[#e8e1dd] text-[#b85028] flex items-center justify-center">
                  <Clock size={16} weight="bold" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#8a726a] uppercase tracking-wider">
                    Latest Upload
                  </span>
                  <span className="text-xs font-semibold text-[#1e1b19]">
                    {reports[reports.length - 1]?.uploadedAt
                      ? new Date(
                          reports[reports.length - 1].uploadedAt,
                        ).toLocaleDateString()
                      : 'Recently'}
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
                  className="p-5 rounded-2xl bg-white border border-[#e8e1dd] hover:border-[#b85028]/40 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3 group"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#faf2ee] flex items-center justify-center shrink-0 border border-[#e8e1dd] text-[#b85028]">
                        {getFileIcon(rep.filename)}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isPrivileged && (
                          <button
                            type="button"
                            onClick={() => setReportToDelete(rep)}
                            className="p-1.5 rounded-lg text-[#ba1a1a]/70 hover:text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-colors cursor-pointer"
                            title="Delete this report from Google Drive"
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
                        <span>{rep.uploadedByName || 'Coordinator'}</span>
                        <span>•</span>
                        <span>
                          {rep.uploadedAt
                            ? new Date(rep.uploadedAt).toLocaleDateString()
                            : 'Recently'}
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
                      <div className="p-3 rounded-xl bg-[#faf2ee]/40 border border-[#f4ece9] text-xs text-[#57423b] leading-relaxed line-clamp-2">
                        {rep.summary}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-[#f4ece9]">
                    <button
                      type="button"
                      onClick={() => setPreviewFile(rep)}
                      className="flex-1 py-2 px-3.5 rounded-xl bg-[#b85028] hover:bg-[#9c421f] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Eye size={15} weight="bold" />
                      <span>Preview File</span>
                    </button>
                    {rep.webViewLink && (
                      <a
                        href={rep.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd] text-[#1e1b19] transition-all flex items-center justify-center shadow-2xs"
                        title="Open in Google Drive"
                      >
                        <ArrowSquareOut size={16} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 rounded-2xl border-2 border-dashed border-[#e8e1dd] flex flex-col items-center justify-center text-center gap-3 bg-[#faf2ee]/20">
              <div className="w-12 h-12 rounded-2xl bg-[#faf2ee] text-[#b85028] flex items-center justify-center">
                <CloudArrowUp size={24} weight="duotone" />
              </div>
              <h4 className="text-sm font-bold text-[#1e1b19]">
                No Reports Attached Yet
              </h4>
              <p className="text-xs text-[#8a726a] max-w-sm">
                This activity has concluded. Parish coordinators can upload
                session minutes, attendance summaries, photos, or pastoral notes
                directly to Google Drive.
              </p>
              {isPrivileged && (
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-[#b85028] hover:bg-[#a44520] text-xs font-bold text-white transition-all shadow-xs cursor-pointer flex items-center gap-2"
                >
                  <Plus size={16} weight="bold" />
                  <span>Upload Activity Reports</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AUDIT HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-[#e8e1dd] shadow-xs p-6 flex flex-col gap-4 animate-in fade-in duration-150">
          <h3 className="text-sm font-bold text-[#1e1b19] flex items-center gap-2">
            <ClockCounterClockwise
              size={16}
              weight="bold"
              className="text-[#b85028]"
            />
            <span>Activity Change & Audit History</span>
          </h3>

          {history.length === 0 ? (
            <p className="text-xs text-[#8a726a] italic p-6 text-center">
              No modifications recorded. This activity has remained in its
              initial configuration.
            </p>
          ) : (
            <div className="divide-y divide-[#f4ece9] border border-[#e8e1dd] rounded-2xl overflow-hidden">
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
                    Recorded by{' '}
                    {log.changedByName || log.changedBy || 'Administrator'}
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
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#e8e1dd] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#f4ece9] flex items-start justify-between bg-[#fffbf9]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#ffdad6] border border-[#ffb4ab] text-[#ba1a1a] flex items-center justify-center shrink-0">
                  <Trash size={22} weight="bold" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1e1b19]">
                    Delete Report File
                  </h3>
                  <p className="text-xs text-[#8a726a] truncate max-w-xs">
                    {reportToDelete.filename}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReportToDelete(null)}
                className="w-8 h-8 rounded-lg bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd] flex items-center justify-center text-[#8a726a] hover:text-[#1e1b19] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <p className="text-xs text-[#57423b] leading-relaxed">
                Are you sure you want to permanently delete this report file
                from Google Drive and remove it from this activity record?
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#f4ece9]">
                <button
                  type="button"
                  onClick={() => setReportToDelete(null)}
                  className="px-4 py-2 rounded-xl bg-white border border-[#e8e1dd] text-[#57423b] font-bold text-xs hover:bg-[#faf2ee] cursor-pointer"
                >
                  Cancel
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
                  className="px-5 py-2 rounded-xl bg-[#ba1a1a] hover:bg-[#93000a] text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Trash size={14} weight="bold" />
                  <span>
                    {deleteReportMutation.isPending
                      ? 'Deleting...'
                      : 'Confirm Delete'}
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
    </div>
  );
};

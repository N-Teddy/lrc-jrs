import {
  useAttendanceQuery,
  useAuth,
  useLockAttendanceMutation,
  useUnlockAttendanceMutation,
} from '@jrs/client-core';
import {
  ActivityStatus,
  AttendanceStatus,
  AttendeeType,
  type IActivity,
} from '@jrs/shared';
import {
  ArrowSquareOut,
  CalendarBlank,
  Clock,
  CloudArrowUp,
  HardDrives,
  Lock,
  LockOpen,
  MagnifyingGlass,
  MapPin,
  PencilSimple,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import type React from 'react';
import { useMemo, useState } from 'react';
import { UserAvatar } from '../../../components';
import { formatCameroonPhone } from '../../members/utils/member-ui.utils';
import {
  formatActivityDateRange,
  getActivityStatusConfig,
  getActivityTypeConfig,
} from '../utils/activity-ui.utils';
import { ActivityReportUploadModal } from './ActivityReportUploadModal';

interface ActivityAttendanceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: IActivity;
  onNavigateToRoster?: (activity: IActivity) => void;
}

type AttendeeStatusFilter = 'ALL' | 'PRESENT' | 'ABSENT' | 'GUESTS';

export const ActivityAttendanceDetailsModal: React.FC<
  ActivityAttendanceDetailsModalProps
> = ({ isOpen, onClose, activity, onNavigateToRoster }) => {
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AttendeeStatusFilter>('ALL');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [lockPromptOpen, setLockPromptOpen] = useState(false);
  const [lockReason, setLockReason] = useState('');

  // Fetch full attendance data for the activity
  const { data: attendanceData, isLoading: isAttendanceLoading } =
    useAttendanceQuery(activity.id);

  const lockMutation = useLockAttendanceMutation();
  const unlockMutation = useUnlockAttendanceMutation();

  const isCurrentUserAp = user?.role === 'AP';
  const isPrivileged = user?.role === 'AP' || user?.role === 'PC';

  const attendees = attendanceData?.attendees || [];

  // Summary Metrics
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

  // STRICT REQUIREMENT: Report upload available ONLY after the activity AND if activity is completed
  const now = new Date();
  const isPastActivity = now >= new Date(activity.endDate);
  const isCompleted = activity.status === ActivityStatus.COMPLETED;
  const canShowReportUi = isCompleted && isPastActivity;

  // Filtered Attendees list
  const filteredAttendees = useMemo(() => {
    return attendees.filter((item) => {
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

      if (statusFilter === 'PRESENT') {
        return item.status === AttendanceStatus.PRESENT;
      }
      if (statusFilter === 'ABSENT') {
        return item.status === AttendanceStatus.ABSENT;
      }
      if (statusFilter === 'GUESTS') {
        return item.attendeeType === AttendeeType.GUEST;
      }

      return true;
    });
  }, [attendees, search, statusFilter]);

  if (!isOpen) return null;

  const isLocked = Boolean(
    activity.isAttendanceLocked || attendanceData?.isLocked,
  );
  const typeConfig = getActivityTypeConfig(activity.activityType);
  const statusConfig = getActivityStatusConfig(activity.status);

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
      // error handled by mutation
    }
  };

  const dateInfo = formatActivityDateRange(
    activity.startDate,
    activity.endDate,
  );

  return (
    <>
      <div className="fixed inset-0 z-50 bg-[#1e1b19]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl border border-[#e8e1dd] shadow-2xl overflow-hidden flex flex-col">
          {/* 1. Header Bar */}
          <div className="p-6 border-b border-[#f4ece9] flex items-start justify-between bg-[#fffbf9]">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${typeConfig.badgeBg} ${typeConfig.badgeText} ${typeConfig.badgeBorder}`}
                >
                  {typeConfig.label}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${statusConfig.badgeBg} ${statusConfig.badgeText} ${statusConfig.badgeBorder}`}
                >
                  {statusConfig.label}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#faf2ee] text-[#57423b] border border-[#e8e1dd]">
                  {activity.town?.name || activity.town?.code}
                </span>
              </div>
              <h2 className="text-xl font-black text-[#1e1b19] tracking-tight">
                {activity.title}
              </h2>
              <div className="flex items-center gap-4 text-xs text-[#8a726a] flex-wrap">
                <div className="flex items-center gap-1.5">
                  <CalendarBlank size={14} className="text-[#b85028]" />
                  <span>
                    {dateInfo.dateRange} • {dateInfo.timeRange}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-[#b85028]" />
                  <span>{activity.locationVenue}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd] flex items-center justify-center text-[#8a726a] hover:text-[#1e1b19] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* 2. Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            {/* Lock Status Banner */}
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between gap-4 flex-wrap ${
                isLocked
                  ? 'bg-[#fff8e1] border-[#ffe082] text-[#812901]'
                  : 'bg-[#eef7f0] border-[#c2e9ca] text-[#2c4e37]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isLocked
                      ? 'bg-[#ffe082] text-[#812901]'
                      : 'bg-[#c2e9ca] text-[#2c4e37]'
                  }`}
                >
                  {isLocked ? (
                    <Lock size={20} weight="bold" />
                  ) : (
                    <LockOpen size={20} weight="bold" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xs sm:text-sm">
                    {isLocked
                      ? 'Attendance Finalized & Sealed'
                      : 'Attendance Open for Check-In'}
                  </span>
                  <span className="text-[11px] opacity-80">
                    {isLocked
                      ? `Locked by ${
                          activity.attendanceLockedByName || 'Administrator'
                        } • Edits disabled`
                      : 'Active check-in session • Changes are autosaved to hub record'}
                  </span>
                </div>
              </div>

              {/* Lock/Unlock Buttons */}
              <div className="flex items-center gap-2">
                {isLocked
                  ? isCurrentUserAp && (
                      <button
                        type="button"
                        onClick={() => setLockPromptOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-white border border-[#ffe082] text-xs font-bold text-[#812901] hover:bg-[#fffbf0] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <LockOpen size={14} weight="bold" />
                        <span>Unlock (AP Override)</span>
                      </button>
                    )
                  : isPrivileged && (
                      <button
                        type="button"
                        onClick={() => setLockPromptOpen(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#2c4e37] hover:bg-[#233f2c] text-xs font-bold text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <Lock size={14} weight="bold" />
                        <span>Finalize & Lock Attendance</span>
                      </button>
                    )}
              </div>
            </div>

            {/* Lock / Unlock Confirmation Prompt */}
            {lockPromptOpen && (
              <div className="p-4 rounded-2xl bg-white border-2 border-[#b85028] shadow-md flex flex-col gap-3 animate-in fade-in duration-150">
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
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-[#faf2ee] border border-[#e8e1dd] focus:outline-none focus:border-[#b85028]"
                  />
                  <button
                    type="button"
                    onClick={handleToggleLock}
                    disabled={
                      lockMutation.isPending || unlockMutation.isPending
                    }
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer shrink-0 ${
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

            {/* 3. KPI Metrics Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#faf2ee]/70 rounded-2xl p-4 border border-[#e8e1dd] flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
                  Turnout Rate
                </span>
                <div className="text-2xl font-black text-[#1e1b19] mt-2">
                  {turnoutPercent}%
                </div>
                <span className="text-[10px] text-[#8a726a] mt-0.5">
                  of registered hub youth
                </span>
              </div>

              <div className="bg-[#faf2ee]/70 rounded-2xl p-4 border border-[#e8e1dd] flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
                  Total Present
                </span>
                <div className="text-2xl font-black text-[#2c4e37] mt-2">
                  {summary.totalPresent}
                </div>
                <span className="text-[10px] text-[#57423b] mt-0.5">
                  {summary.membersPresent} members + {summary.guestsPresent}{' '}
                  guests
                </span>
              </div>

              <div className="bg-[#faf2ee]/70 rounded-2xl p-4 border border-[#e8e1dd] flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
                  Members Absent
                </span>
                <div className="text-2xl font-black text-[#ba1a1a] mt-2">
                  {absentCount}
                </div>
                <span className="text-[10px] text-[#8a726a] mt-0.5">
                  home hub members
                </span>
              </div>

              <div className="bg-[#faf2ee]/70 rounded-2xl p-4 border border-[#e8e1dd] flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
                  External Guests
                </span>
                <div className="text-2xl font-black text-[#b85028] mt-2">
                  {summary.guestsPresent}
                </div>
                <span className="text-[10px] text-[#8a726a] mt-0.5">
                  visitors welcomed
                </span>
              </div>
            </div>

            {/* 4. Activity Report Section (ONLY IF COMPLETED AND PAST) */}
            {canShowReportUi && (
              <div className="p-5 rounded-2xl bg-white border border-[#e8e1dd] shadow-2xs flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#fff2ee] border border-[#ffdbcf] text-[#b85028] flex items-center justify-center shrink-0">
                    <HardDrives size={20} weight="duotone" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-xs text-[#1e1b19]">
                      {activity.report?.fileId
                        ? 'Activity Report Synced to Google Drive'
                        : 'Post-Activity Report Pending'}
                    </span>
                    <span className="text-[11px] text-[#8a726a] truncate">
                      {activity.report?.fileId
                        ? `${activity.report.filename} • Uploaded by ${
                            activity.report.uploadedByName || 'Coordinator'
                          }`
                        : 'Upload session minutes, photos, or pastoral summary to Google Drive'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activity.report?.webViewLink && (
                    <a
                      href={activity.report.webViewLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd] text-xs font-bold text-[#1e1b19] flex items-center gap-1.5 transition-colors"
                    >
                      <span>View in Google Drive</span>
                      <ArrowSquareOut size={13} />
                    </a>
                  )}
                  {isPrivileged && (
                    <button
                      type="button"
                      onClick={() => setIsReportModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#b85028] hover:bg-[#a44520] text-xs font-bold text-white transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <CloudArrowUp size={15} weight="bold" />
                      <span>
                        {activity.report?.fileId
                          ? 'Manage Report'
                          : 'Upload Report'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 5. Attendee Table Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="relative w-full sm:w-72">
                <MagnifyingGlass
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a726a]"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search attendees..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#faf2ee]/60 border border-[#e8e1dd] text-xs text-[#1e1b19] focus:outline-none focus:border-[#b85028]"
                />
              </div>

              {/* Status Filters Segmented Control */}
              <div className="inline-flex p-1 rounded-xl bg-[#faf2ee] border border-[#e8e1dd] gap-1 self-start sm:self-auto">
                {(
                  [
                    { id: 'ALL', label: `All (${attendees.length})` },
                    {
                      id: 'PRESENT',
                      label: `Present (${summary.totalPresent})`,
                    },
                    { id: 'ABSENT', label: `Absent (${absentCount})` },
                    {
                      id: 'GUESTS',
                      label: `Guests (${summary.guestsPresent})`,
                    },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      statusFilter === tab.id
                        ? 'bg-white text-[#1e1b19] shadow-2xs'
                        : 'text-[#8a726a] hover:text-[#1e1b19]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 6. Attendees Table */}
            <div className="border border-[#e8e1dd] rounded-2xl overflow-hidden">
              {isAttendanceLoading ? (
                <div className="p-8 text-center text-xs text-[#8a726a] animate-pulse">
                  Loading attendance records...
                </div>
              ) : filteredAttendees.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#8a726a]">
                  No attendees matching filter.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#faf2ee] border-b border-[#e8e1dd] text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
                      <th className="py-2.5 px-4">Attendee</th>
                      <th className="py-2.5 px-3">Role / Hub</th>
                      <th className="py-2.5 px-3">Check-In Time</th>
                      <th className="py-2.5 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f4ece9] text-xs text-[#1e1b19]">
                    {filteredAttendees.map((att) => {
                      const name =
                        att.member?.fullName ||
                        att.guestInfo?.fullName ||
                        'Anonymous';
                      const phone =
                        att.member?.phoneNumber ||
                        att.guestInfo?.phoneNumber ||
                        '';
                      const isPresent = att.status === AttendanceStatus.PRESENT;
                      const checkIn = att.checkInTime
                        ? new Date(att.checkInTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—';

                      return (
                        <tr
                          key={att.id || att.memberId || name}
                          className="hover:bg-[#fffbf9] transition-colors"
                        >
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-3">
                              <UserAvatar name={name} size="sm" />
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold truncate text-[#1e1b19]">
                                  {name}
                                </span>
                                {phone && (
                                  <span className="text-[10px] text-[#8a726a] font-mono">
                                    {formatCameroonPhone(phone)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#faf2ee] text-[#57423b] border border-[#e8e1dd]">
                              {att.attendeeType === AttendeeType.GUEST
                                ? 'Guest'
                                : att.member?.role || 'Member'}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 font-mono text-[11px] text-[#57423b]">
                            {isPresent ? (
                              <div className="flex items-center gap-1.5">
                                <Clock
                                  size={13}
                                  className="text-[#486b52] shrink-0"
                                />
                                <span>{checkIn}</span>
                              </div>
                            ) : (
                              <span className="text-[#8a726a]">—</span>
                            )}
                          </td>

                          <td className="py-2.5 px-4 text-right">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isPresent
                                  ? 'bg-[#c2e9ca] text-[#2c4e37]'
                                  : 'bg-[#f4ece9] text-[#8a726a]'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isPresent ? 'bg-[#2c4e37]' : 'bg-[#8a726a]'
                                }`}
                              />
                              <span>{isPresent ? 'Present' : 'Absent'}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* 7. Footer Actions */}
          <div className="p-4 px-6 border-t border-[#f4ece9] bg-[#faf2ee]/40 flex items-center justify-between">
            <span className="text-xs text-[#8a726a]">
              {attendees.length} total attendees tracked in database
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[#e8e1dd] text-xs font-bold text-[#57423b] hover:bg-[#faf2ee] transition-colors cursor-pointer"
              >
                Close
              </button>

              {onNavigateToRoster && (!isLocked || isCurrentUserAp) && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToRoster(activity);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#b85028] hover:bg-[#a44520] text-xs font-bold text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <PencilSimple size={14} weight="bold" />
                  <span>
                    {isLocked ? 'Modify (AP Override)' : 'Edit Roster'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Report Upload Modal */}
      {isReportModalOpen && (
        <ActivityReportUploadModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          activity={activity}
          isPrivileged={isPrivileged}
        />
      )}
    </>
  );
};

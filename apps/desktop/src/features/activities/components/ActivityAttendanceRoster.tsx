import {
  useAttendanceQuery,
  useAuth,
  useLockAttendanceMutation,
  useMembersQuery,
  useRecordAttendanceMutation,
  useTownContext,
  useTranslation,
  useUnlockAttendanceMutation,
} from '@jrs/client-core';
import {
  ActivityStatus,
  AttendanceStatus,
  AttendeeType,
  type IActivity,
  type IGuestInfo,
  type IRecordAttendanceItemDto,
  type IUser,
} from '@jrs/shared';
import {
  ArrowLeft,
  CalendarBlank,
  Check,
  CheckCircle,
  FloppyDisk,
  Lock,
  LockOpen,
  MagnifyingGlass,
  MapPin,
  Plus,
  ShieldCheck,
  Trash,
  UserCheck,
  Users,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { UserAvatar } from '../../../components';
import {
  formatActivityDateRange,
  getActivityTypeConfig,
  isActivityStarted,
} from '../utils/activity-ui.utils';

interface ActivityAttendanceRosterProps {
  activity: IActivity;
  onBack: () => void;
}

interface MemberAttendanceState {
  member: IUser;
  status: AttendanceStatus;
  checkInTime?: string;
}

interface GuestAttendanceState {
  id: string;
  guestInfo: IGuestInfo;
  status: AttendanceStatus;
  checkInTime?: string;
}

function computeRosterSnapshot(
  membersMap: Map<string, MemberAttendanceState>,
  guestsList: GuestAttendanceState[],
): string {
  const memberPart = Array.from(membersMap.entries())
    .map(([id, rec]) => `${id}:${rec.status}`)
    .sort()
    .join(';');
  const guestPart = guestsList
    .map((g) => `${g.id || g.guestInfo?.fullName}:${g.status}`)
    .sort()
    .join(';');
  return `${memberPart}|${guestPart}`;
}

export const ActivityAttendanceRoster: React.FC<
  ActivityAttendanceRosterProps
> = ({ activity, onBack }) => {
  const { t, i18n } = useTranslation(['attendance', 'towns', 'common']);
  const isFrench = i18n.language?.startsWith('fr');
  const { canWrite } = useTownContext();
  const { user } = useAuth();
  const isCurrentUserAp = user?.role === 'AP';
  const isPrivileged = user?.role === 'AP' || user?.role === 'PC';

  // Active sub-tab: 'members' | 'guests'
  const [activeTab, setActiveTab] = useState<'members' | 'guests'>('members');
  const [memberSearch, setMemberSearch] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Queries
  const { data: attendanceData, isLoading: isAttendanceLoading } =
    useAttendanceQuery(activity.id);

  // Timing guard & simulation
  const actuallyStarted = isActivityStarted(activity.startDate);
  const [simulatedUnlocked, setSimulatedUnlocked] = useState(false);
  const isUnlocked = actuallyStarted || simulatedUnlocked;

  // Lock status
  const isAttendanceLocked = Boolean(
    activity.isAttendanceLocked || attendanceData?.isLocked,
  );
  const isEditable = isUnlocked && (!isAttendanceLocked || isCurrentUserAp);

  const lockMutation = useLockAttendanceMutation();
  const unlockMutation = useUnlockAttendanceMutation();

  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [lockReason, setLockReason] = useState('');
  const [unlockReason, setUnlockReason] = useState('');

  const handleConfirmLock = async () => {
    try {
      await lockMutation.mutateAsync({
        activityId: activity.id,
        reason: lockReason.trim() || 'Roll call finalized',
      });
      setSaveSuccessMsg('Attendance finalized and locked successfully');
      setIsLockModalOpen(false);
      setLockReason('');
    } catch (err: any) {
      setSaveErrorMsg(
        err.response?.data?.message ||
          err.message ||
          'Failed to lock attendance',
      );
    }
  };

  const handleConfirmUnlock = async () => {
    if (!unlockReason.trim()) return;
    try {
      await unlockMutation.mutateAsync({
        activityId: activity.id,
        reason: unlockReason.trim(),
      });
      setSaveSuccessMsg('Attendance unlocked via AP override');
      setIsUnlockModalOpen(false);
      setUnlockReason('');
    } catch (err: any) {
      setSaveErrorMsg(
        err.response?.data?.message ||
          err.message ||
          'Failed to unlock attendance',
      );
    }
  };

  // Modals
  const [isAddGuestModalOpen, setIsAddGuestModalOpen] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestNotes, setGuestNotes] = useState('');

  // 1. Local town hub members (default roster)
  const { data: membersData, isLoading: isMembersLoading } = useMembersQuery({
    townId: activity.townId,
    limit: 150,
  });

  // 2. Global search across all regions when searching
  const isSearching = Boolean(memberSearch.trim());
  const { data: globalSearchResults, isLoading: isSearchingGlobal } =
    useMembersQuery(
      isSearching
        ? {
            search: memberSearch.trim(),
            townId: 'all',
            limit: 50,
          }
        : undefined,
    );

  const recordAttendanceMutation = useRecordAttendanceMutation();

  // Local state for tracking member selections
  const [memberRecords, setMemberRecords] = useState<
    Map<string, MemberAttendanceState>
  >(new Map());

  // Local state for guests
  const [guestRecords, setGuestRecords] = useState<GuestAttendanceState[]>([]);
  const [initialSnapshot, setInitialSnapshot] = useState<string>('');

  // Synchronize initial attendance data and member roster
  useEffect(() => {
    if (!membersData?.items) return;

    const newMap = new Map<string, MemberAttendanceState>();

    // 1. Populate all town members with default status ABSENT
    for (const member of membersData.items) {
      newMap.set(member.id, {
        member,
        status: AttendanceStatus.ABSENT,
      });
    }

    const newGuests: GuestAttendanceState[] = [];

    // 2. If existing attendance doc attendees exist, merge them
    if (attendanceData?.attendees && attendanceData.attendees.length > 0) {
      for (const att of attendanceData.attendees) {
        if (att.attendeeType === AttendeeType.MEMBER && att.memberId) {
          const effectiveStatus =
            att.status === AttendanceStatus.PRESENT
              ? AttendanceStatus.PRESENT
              : AttendanceStatus.ABSENT;

          const existing = newMap.get(att.memberId);
          if (existing) {
            existing.status = effectiveStatus;
            existing.checkInTime = att.checkInTime;
          } else if (att.member) {
            // member from another town or unlisted
            newMap.set(att.memberId, {
              member: att.member as any,
              status: effectiveStatus,
              checkInTime: att.checkInTime,
            });
          }
        } else if (att.attendeeType === AttendeeType.GUEST && att.guestInfo) {
          newGuests.push({
            id: att.id || Math.random().toString(),
            guestInfo: att.guestInfo,
            status:
              att.status === AttendanceStatus.PRESENT
                ? AttendanceStatus.PRESENT
                : AttendanceStatus.ABSENT,
            checkInTime: att.checkInTime,
          });
        }
      }
    }

    setMemberRecords(newMap);
    setGuestRecords(newGuests);
    setInitialSnapshot(computeRosterSnapshot(newMap, newGuests));
  }, [membersData, attendanceData]);

  const currentSnapshot = useMemo(
    () => computeRosterSnapshot(memberRecords, guestRecords),
    [memberRecords, guestRecords],
  );
  const isDirty = initialSnapshot !== '' && currentSnapshot !== initialSnapshot;

  // Turnout KPI calculations
  const totalTownMembers = membersData?.total ?? memberRecords.size;
  const membersList = useMemo(
    () => Array.from(memberRecords.values()),
    [memberRecords],
  );

  const membersPresentCount = useMemo(
    () =>
      membersList.filter((m) => m.status === AttendanceStatus.PRESENT).length,
    [membersList],
  );

  const guestsPresentCount = useMemo(
    () =>
      guestRecords.filter((g) => g.status === AttendanceStatus.PRESENT).length,
    [guestRecords],
  );

  const totalPresentCount = membersPresentCount + guestsPresentCount;
  const turnoutRate =
    totalTownMembers > 0
      ? Math.round((membersPresentCount / totalTownMembers) * 100)
      : 0;

  // Filtered members list: incorporates local roster matches and cross-region search results
  const filteredMembers = useMemo(() => {
    if (!isSearching) return membersList;

    const query = memberSearch.toLowerCase().trim();
    // 1. Members already registered in this roster that match query
    const existingMatches = membersList.filter(
      (m) =>
        m.member.fullName?.toLowerCase().includes(query) ||
        m.member.phoneNumber?.includes(query) ||
        m.member.role?.toLowerCase().includes(query) ||
        m.member.homeTown?.name?.toLowerCase().includes(query),
    );

    const existingIds = new Set(membersList.map((m) => m.member.id));

    // 2. Members from other regions/towns returned by the global search
    const crossRegionMatches: MemberAttendanceState[] = [];
    if (globalSearchResults?.items) {
      for (const user of globalSearchResults.items) {
        if (!existingIds.has(user.id)) {
          crossRegionMatches.push({
            member: user,
            status: AttendanceStatus.ABSENT,
          });
        }
      }
    }

    return [...existingMatches, ...crossRegionMatches];
  }, [membersList, isSearching, memberSearch, globalSearchResults]);

  // Handlers for Member Status changes (strictly binary: Present vs Absent)
  const handleSetMemberStatus = (
    memberId: string,
    status: AttendanceStatus,
    fallbackMember?: IUser,
  ) => {
    setMemberRecords((prev) => {
      const next = new Map(prev);
      const cur = next.get(memberId);
      if (cur) {
        next.set(memberId, {
          ...cur,
          status,
          checkInTime:
            status === AttendanceStatus.PRESENT
              ? cur.checkInTime || new Date().toISOString()
              : undefined,
        });
      } else if (fallbackMember) {
        // Cross-region member added dynamically
        next.set(memberId, {
          member: fallbackMember,
          status,
          checkInTime:
            status === AttendanceStatus.PRESENT
              ? new Date().toISOString()
              : undefined,
        });
      }
      return next;
    });
  };

  const handleToggleMember = (
    member: IUser,
    currentStatus: AttendanceStatus,
  ) => {
    const nextStatus =
      currentStatus === AttendanceStatus.PRESENT
        ? AttendanceStatus.ABSENT
        : AttendanceStatus.PRESENT;
    handleSetMemberStatus(member.id, nextStatus, member);
  };

  const handleMarkAllPresent = () => {
    const nowIso = new Date().toISOString();
    setMemberRecords((prev) => {
      const next = new Map(prev);
      for (const [id, rec] of next.entries()) {
        next.set(id, {
          ...rec,
          status: AttendanceStatus.PRESENT,
          checkInTime: rec.checkInTime || nowIso,
        });
      }
      return next;
    });
  };

  const handleClearAll = () => {
    setMemberRecords((prev) => {
      const next = new Map(prev);
      for (const [id, rec] of next.entries()) {
        next.set(id, {
          ...rec,
          status: AttendanceStatus.ABSENT,
          checkInTime: undefined,
        });
      }
      return next;
    });
  };

  // Guest Handlers
  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    setGuestRecords((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        guestInfo: {
          fullName: guestName.trim(),
          phoneNumber: guestPhone.trim() || undefined,
          notes: guestNotes.trim() || undefined,
        },
        status: AttendanceStatus.PRESENT,
        checkInTime: new Date().toISOString(),
      },
    ]);

    setGuestName('');
    setGuestPhone('');
    setGuestNotes('');
    setIsAddGuestModalOpen(false);
  };

  const handleRemoveGuest = (id: string) => {
    setGuestRecords((prev) => prev.filter((g) => g.id !== id));
  };

  const handleToggleGuest = (
    guestId: string,
    currentStatus: AttendanceStatus,
  ) => {
    const nextStatus =
      currentStatus === AttendanceStatus.PRESENT
        ? AttendanceStatus.ABSENT
        : AttendanceStatus.PRESENT;
    setGuestRecords((prev) =>
      prev.map((g) =>
        g.id === guestId
          ? {
              ...g,
              status: nextStatus,
              checkInTime:
                nextStatus === AttendanceStatus.PRESENT
                  ? g.checkInTime || new Date().toISOString()
                  : undefined,
            }
          : g,
      ),
    );
  };

  // Submit attendance to backend
  const handleSaveAttendance = async () => {
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);

    const attendeesPayload: IRecordAttendanceItemDto[] = [];

    // Members (strictly PRESENT or ABSENT)
    for (const [_, rec] of memberRecords.entries()) {
      attendeesPayload.push({
        attendeeType: AttendeeType.MEMBER,
        memberId: rec.member.id,
        status:
          rec.status === AttendanceStatus.PRESENT
            ? AttendanceStatus.PRESENT
            : AttendanceStatus.ABSENT,
        checkInTime:
          rec.status === AttendanceStatus.PRESENT ? rec.checkInTime : undefined,
      });
    }

    // Guests
    for (const g of guestRecords) {
      attendeesPayload.push({
        attendeeType: AttendeeType.GUEST,
        guestInfo: g.guestInfo,
        status:
          g.status === AttendanceStatus.PRESENT
            ? AttendanceStatus.PRESENT
            : AttendanceStatus.ABSENT,
        checkInTime:
          g.status === AttendanceStatus.PRESENT ? g.checkInTime : undefined,
      });
    }

    try {
      await recordAttendanceMutation.mutateAsync({
        activityId: activity.id,
        dto: {
          activityId: activity.id,
          attendees: attendeesPayload,
        },
      });
      setInitialSnapshot(currentSnapshot);
      setSaveSuccessMsg('Attendance recorded and synchronized successfully.');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      setSaveErrorMsg(
        err?.message ||
          'Failed to record attendance. Please check that the activity has started.',
      );
    }
  };

  const typeConfig = getActivityTypeConfig(activity.activityType);
  const dateInfo = formatActivityDateRange(
    activity.startDate,
    activity.endDate,
  );

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full animate-in fade-in duration-200">
      {/* 1. Back Navigation & Action Bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#8a726a] hover:text-[#b85028] transition-colors cursor-pointer group"
        >
          <ArrowLeft
            size={16}
            weight="bold"
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span>{t('attendance:backToActivities')}</span>
        </button>

        <div className="flex items-center gap-2.5">
          {!canWrite ? (
            <span className="px-3 py-1.5 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] text-xs font-bold text-[#8a726a] flex items-center gap-1.5">
              <Lock size={14} weight="bold" />
              Read-Only Hub
            </span>
          ) : (
            <>
              {/* Timing Guard Demo Simulation Toggle */}
              {!actuallyStarted && (
                <button
                  type="button"
                  onClick={() => setSimulatedUnlocked(!simulatedUnlocked)}
                  className="px-3 py-1.5 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] text-xs font-semibold text-[#57423b] hover:text-[#1e1b19] flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Toggle locked simulation for testing"
                >
                  {simulatedUnlocked ? (
                    <LockOpen
                      size={14}
                      weight="bold"
                      className="text-[#486b52]"
                    />
                  ) : (
                    <Lock size={14} weight="bold" className="text-[#b85028]" />
                  )}
                  <span>
                    {simulatedUnlocked
                      ? 'Simulating: Unlocked'
                      : 'Simulate Unlock'}
                  </span>
                </button>
              )}

              {/* Lock / Unlock Attendance Button */}
              {isAttendanceLocked
                ? isCurrentUserAp && (
                    <button
                      type="button"
                      onClick={() => setIsUnlockModalOpen(true)}
                      disabled={unlockMutation.isPending}
                      className="px-3.5 py-2 rounded-lg bg-white border border-[#ffe082] text-[#812901] hover:bg-[#fffbf0] font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <LockOpen size={15} weight="bold" />
                      <span>Unlock (AP Override)</span>
                    </button>
                  )
                : isPrivileged && (
                    <button
                      type="button"
                      onClick={() => setIsLockModalOpen(true)}
                      disabled={lockMutation.isPending}
                      className="px-3.5 py-2 rounded-lg bg-[#2c4e37] hover:bg-[#233f2c] text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Lock size={15} weight="bold" />
                      <span>Finalize & Lock</span>
                    </button>
                  )}

              {/* Primary Save Attendance Button */}
              <button
                type="button"
                onClick={handleSaveAttendance}
                disabled={
                  !isEditable || recordAttendanceMutation.isPending || !isDirty
                }
                title={!isDirty ? 'No changes detected' : undefined}
                className="px-4 py-2 rounded-lg bg-[#b85028] hover:bg-[#a44520] text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {recordAttendanceMutation.isPending ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <FloppyDisk size={16} weight="bold" />
                )}
                <span>{t('attendance:markAttendance')}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Notifications / Alerts */}
      {saveSuccessMsg && (
        <div className="p-3.5 bg-[#edf3ee] border border-[#c2e9ca] rounded-2xl text-[#486b52] flex items-center gap-2 text-xs font-bold">
          <CheckCircle size={18} weight="fill" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {saveErrorMsg && (
        <div className="p-3.5 bg-[#ffdad6]/50 border border-[#ffb4a8] rounded-2xl text-[#ba1a1a] flex items-center gap-2 text-xs font-bold">
          <WarningCircle size={18} weight="fill" />
          <span>{saveErrorMsg}</span>
        </div>
      )}

      {/* 2. Activity Summary Banner Card */}
      <div className="bg-white rounded-2xl border border-[#e8e1dd] shadow-xs p-6 flex flex-col gap-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#e8e1dd]">
          <div className="flex flex-col gap-2">
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

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#faf2ee] border border-[#e8e1dd] text-xs font-medium text-[#57423b]">
                <CalendarBlank
                  size={13}
                  weight="bold"
                  className="text-[#b85028]"
                />
                <span>
                  {dateInfo.dateRange} · {dateInfo.timeRange}
                </span>
              </span>

              {activity.status === ActivityStatus.IN_PROGRESS && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#edf3ee] border border-[#c2e9ca] text-xs font-bold text-[#486b52]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#486b52] animate-ping" />
                  <span>Live Session</span>
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1e1b19] tracking-tight">
              {activity.title}
            </h1>

            {activity.notes && (
              <p className="text-xs text-[#57423b] leading-relaxed max-w-3xl">
                {activity.notes}
              </p>
            )}
          </div>

          <div className="flex flex-col items-start lg:items-end gap-1 text-xs text-[#8a726a] shrink-0">
            <span className="font-mono text-[11px]">
              Hub:{' '}
              <strong className="text-[#1e1b19]">
                {activity.town?.name || 'Local'}
              </strong>
            </span>
            <span className="font-mono text-[10px]">
              ID: #{activity.id.slice(-8).toUpperCase()}
            </span>
          </div>
        </div>

        {/* 3. Live Turnout Counter Strip (Strictly 4 KPIs, No Excused) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* KPI 1: Total Present */}
          <div className="bg-[#faf2ee] rounded-xl p-3.5 border border-[#e8e1dd] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#8a726a]">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {t('attendance:metrics.totalPresent')}
              </span>
              <UserCheck
                size={18}
                weight="duotone"
                className="text-[#b85028]"
              />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-extrabold text-[#1e1b19] leading-none">
                {totalPresentCount}
              </span>
              <span className="text-xs text-[#486b52] font-semibold">
                / {totalTownMembers} Target
              </span>
            </div>
          </div>

          {/* KPI 2: Members Present */}
          <div className="bg-[#faf2ee] rounded-xl p-3.5 border border-[#e8e1dd] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#8a726a]">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {t('attendance:metrics.membersPresent')}
              </span>
              <Users size={18} weight="duotone" className="text-[#486b52]" />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-extrabold text-[#1e1b19] leading-none">
                {membersPresentCount}
              </span>
              <span className="text-xs text-[#8a726a]">
                of {totalTownMembers} Town
              </span>
            </div>
          </div>

          {/* KPI 3: Guests Present */}
          <div className="bg-[#faf2ee] rounded-xl p-3.5 border border-[#e8e1dd] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#8a726a]">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {t('attendance:metrics.guestsPresent')}
              </span>
              <Users size={18} weight="duotone" className="text-[#b85028]" />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-extrabold text-[#1e1b19] leading-none">
                {guestsPresentCount}
              </span>
              <span className="text-xs text-[#486b52] font-semibold">
                Walk-ins
              </span>
            </div>
          </div>

          {/* KPI 4: Turnout Rate */}
          <div className="bg-[#faf2ee] rounded-xl p-3.5 border border-[#e8e1dd] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#8a726a]">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {t('attendance:metrics.rate')}
              </span>
              <ShieldCheck
                size={18}
                weight="duotone"
                className="text-[#486b52]"
              />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-extrabold text-[#b85028] leading-none">
                {turnoutRate}%
              </span>
              <span className="text-xs text-[#486b52] font-semibold">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Timing Guard Lock Notice */}
      {!isUnlocked && (
        <div className="bg-[#faf2ee] border border-[#ffdbcf] rounded-2xl p-4 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-[#ffdbcf]/60 border border-[#ffb59c] flex items-center justify-center text-[#812901] shrink-0">
            <Lock size={20} weight="bold" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-xs text-[#812901]">
              {t('attendance:notStartedTitle')}
            </h3>
            <p className="text-xs text-[#57423b]">
              {t('attendance:notStartedDesc', {
                date: new Date(activity.startDate).toLocaleString(),
              })}
            </p>
          </div>
        </div>
      )}

      {/* Attendance Finalized & Locked Notice */}
      {isAttendanceLocked && (
        <div className="bg-[#fff8e1] border border-[#ffe082] rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffe082] text-[#812901] flex items-center justify-center shrink-0">
              <Lock size={20} weight="bold" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 className="font-bold text-xs text-[#812901]">
                Attendance Finalized & Sealed
              </h3>
              <p className="text-xs text-[#57423b]">
                {activity.attendanceLockedByName
                  ? `Finalized by ${activity.attendanceLockedByName}. Modifying attendance is locked to preserve records.`
                  : 'Attendance has been officially locked and cannot be edited.'}
              </p>
            </div>
          </div>
          {isCurrentUserAp && (
            <button
              type="button"
              onClick={() => setIsUnlockModalOpen(true)}
              disabled={unlockMutation.isPending}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-[#ffe082] text-xs font-bold text-[#812901] hover:bg-[#fffbf0] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <LockOpen size={14} weight="bold" />
              <span>Unlock (AP Override)</span>
            </button>
          )}
        </div>
      )}

      {/* 5. Attendance Roster Section */}
      <div className="flex flex-col gap-4">
        {/* Centralized Cohesive Tab Bar */}
        <div className="flex justify-center">
          <div className="inline-flex items-center p-1.5 bg-[#faf2ee] rounded-2xl border border-[#e8e1dd] shadow-xs gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('members')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'members'
                  ? 'bg-white text-[#b85028] shadow-xs border border-[#e8e1dd]'
                  : 'text-[#57423b] hover:text-[#1e1b19] hover:bg-white/50 border border-transparent'
              }`}
            >
              <Users
                size={16}
                weight={activeTab === 'members' ? 'bold' : 'regular'}
              />
              <span>{t('attendance:tabs.members')}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'members'
                    ? 'bg-[#fff2ee] text-[#b85028]'
                    : 'bg-[#e8e1dd] text-[#57423b]'
                }`}
              >
                {filteredMembers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('guests')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'guests'
                  ? 'bg-white text-[#b85028] shadow-xs border border-[#e8e1dd]'
                  : 'text-[#57423b] hover:text-[#1e1b19] hover:bg-white/50 border border-transparent'
              }`}
            >
              <UserCheck
                size={16}
                weight={activeTab === 'guests' ? 'bold' : 'regular'}
              />
              <span>{t('attendance:tabs.guests')}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'guests'
                    ? 'bg-[#fff2ee] text-[#b85028]'
                    : 'bg-[#e8e1dd] text-[#57423b]'
                }`}
              >
                {guestRecords.length}
              </span>
            </button>
          </div>
        </div>

        {/* Tab Actions Toolbar & Content Container */}
        <div className="bg-white rounded-2xl border border-[#e8e1dd] shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 bg-[#faf2ee] flex flex-wrap items-center justify-between gap-3">
            {activeTab === 'members' ? (
              <div className="flex flex-wrap items-center gap-2.5 w-full justify-between">
                <div className="relative min-w-[260px] flex-1 max-w-md">
                  <MagnifyingGlass
                    size={16}
                    weight="bold"
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a726a]"
                  />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search by name, phone, or region across all hubs..."
                    className="h-10 w-full pl-9 pr-3.5 bg-white rounded-lg text-xs text-[#1e1b19] outline-none border border-[#e8e1dd] focus:border-[#b85028]"
                  />
                  {isSearchingGlobal && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#b85028] border-t-transparent" />
                    </div>
                  )}
                </div>

                {canWrite && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleMarkAllPresent}
                      disabled={!isUnlocked}
                      className="h-10 px-3.5 rounded-lg bg-white border border-[#e8e1dd] text-xs font-bold text-[#486b52] hover:bg-[#edf3ee] transition-colors cursor-pointer shrink-0 disabled:opacity-40"
                    >
                      {t('attendance:markAllPresent', {
                        defaultValue: isFrench
                          ? 'Tous présents'
                          : 'Mark All Present',
                      })}
                    </button>

                    <button
                      type="button"
                      onClick={handleClearAll}
                      disabled={!isUnlocked}
                      className="h-10 px-3.5 rounded-lg bg-white border border-[#e8e1dd] text-xs font-bold text-[#8a726a] hover:bg-[#f4ece9] transition-colors cursor-pointer shrink-0 disabled:opacity-40"
                    >
                      {t('attendance:clearAll', {
                        defaultValue: isFrench ? 'Tout effacer' : 'Clear All',
                      })}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-end w-full">
                {canWrite && (
                  <button
                    type="button"
                    onClick={() => setIsAddGuestModalOpen(true)}
                    disabled={!isUnlocked}
                    className="h-10 px-4 rounded-lg bg-[#b85028] text-white font-bold text-xs shadow-xs hover:bg-[#a44520] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <Plus size={16} weight="bold" />
                    <span>{t('attendance:guest.addGuest')}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Members Roster Tab View: Compact Rectangular Cards (Strictly 4 per row) */}
          {activeTab === 'members' && (
            <div className="p-4">
              {isMembersLoading || isAttendanceLoading ? (
                <div className="p-12 text-center text-xs text-[#8a726a] animate-pulse">
                  Loading member roster...
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="p-12 text-center text-xs text-[#8a726a]">
                  No members found matching your search.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-3.5">
                  {filteredMembers.map(({ member, status, checkInTime }) => {
                    const isPresent = status === AttendanceStatus.PRESENT;
                    const isExternal =
                      Boolean(member.homeTownId) &&
                      member.homeTownId !== activity.townId;

                    return (
                      <div
                        key={member.id}
                        className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2.5 shadow-2xs ${
                          isPresent
                            ? 'bg-[#f2f8f3] border-[#a9d0b2] ring-1 ring-[#486b52]/20'
                            : 'bg-white border-[#e8e1dd] hover:border-[#ddc0b7]'
                        }`}
                      >
                        {/* Member Card Header */}
                        <div className="flex items-start gap-2.5 min-w-0">
                          <UserAvatar
                            avatarUrl={member.avatarUrl}
                            name={member.fullName}
                            size="sm"
                            className={
                              isPresent
                                ? 'bg-[#c2e9ca] text-[#2c4e37] border-[#a9d0b2]'
                                : 'bg-[#faf2ee] text-[#b85028] border-[#e8e1dd]'
                            }
                          />

                          <div className="flex flex-col min-w-0 flex-1">
                            <span
                              className="font-bold text-xs text-[#1e1b19] truncate leading-tight"
                              title={member.fullName}
                            >
                              {member.fullName}
                            </span>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className="text-[10px] font-semibold text-[#8a726a] bg-[#faf2ee] px-1.5 py-0.2 rounded border border-[#e8e1dd]">
                                {member.role}
                              </span>
                              {(member.homeTown?.name || isExternal) && (
                                <span
                                  className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border flex items-center gap-0.5 ${
                                    isExternal
                                      ? 'bg-[#fff2ee] text-[#b85028] border-[#ffdbcf]'
                                      : 'bg-[#faf2ee] text-[#57423b] border-[#e8e1dd]'
                                  }`}
                                  title={
                                    member.homeTown?.name
                                      ? `${t('towns:hub', { defaultValue: isFrench ? 'Centre' : 'Hub' })}: ${member.homeTown.name}`
                                      : t('attendance:visiting', {
                                          defaultValue: isFrench
                                            ? 'En visite'
                                            : 'Visiting',
                                        })
                                  }
                                >
                                  <MapPin size={9} weight="fill" />
                                  <span className="truncate max-w-[65px]">
                                    {member.homeTown?.name ||
                                      t('attendance:visiting', {
                                        defaultValue: isFrench
                                          ? 'En visite'
                                          : 'Visiting',
                                      })}
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Attendance State & Toggle Action */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#e8e1dd]/60">
                          <div className="text-[10px] text-[#8a726a] truncate">
                            {isPresent && checkInTime ? (
                              <span className="text-[#486b52] font-mono font-semibold">
                                In:{' '}
                                {new Date(checkInTime).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            ) : isExternal ? (
                              <span className="text-[#b85028] font-semibold text-[10px]">
                                {t('attendance:visitor', {
                                  defaultValue: isFrench
                                    ? 'Visiteur'
                                    : 'Visitor',
                                })}
                              </span>
                            ) : (
                              <span className="text-[#8a726a]">
                                {t('attendance:status.absent', {
                                  defaultValue: isFrench
                                    ? 'Absent(e)'
                                    : 'Absent',
                                })}
                              </span>
                            )}
                          </div>

                          {!canWrite ? (
                            <span
                              className={`px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs ${
                                isPresent
                                  ? 'bg-[#c2e9ca] text-[#2c4e37]'
                                  : isExternal
                                    ? 'bg-[#fff2ee] text-[#b85028] border border-[#ffdbcf]'
                                    : 'bg-[#faf2ee] text-[#8a726a] border border-[#e8e1dd]'
                              }`}
                            >
                              {isPresent && <Check size={12} weight="bold" />}
                              <span>
                                {isPresent
                                  ? t('attendance:status.present', {
                                      defaultValue: isFrench
                                        ? 'Présent(e)'
                                        : 'Present',
                                    })
                                  : isExternal
                                    ? t('attendance:visitor', {
                                        defaultValue: isFrench
                                          ? 'Visiteur'
                                          : 'Visitor',
                                      })
                                    : t('attendance:status.absent', {
                                        defaultValue: isFrench
                                          ? 'Absent(e)'
                                          : 'Absent',
                                      })}
                              </span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={!isUnlocked}
                              onClick={() => handleToggleMember(member, status)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40 shadow-2xs ${
                                isPresent
                                  ? 'bg-[#486b52] hover:bg-[#3d5b45] text-white shadow-xs'
                                  : 'bg-[#faf2ee] hover:bg-[#f4ece9] text-[#57423b] border border-[#e8e1dd] hover:border-[#b85028]'
                              }`}
                            >
                              {isPresent ? (
                                <>
                                  <Check size={13} weight="bold" />
                                  <span>
                                    {t('attendance:status.present', {
                                      defaultValue: isFrench
                                        ? 'Présent(e)'
                                        : 'Present',
                                    })}
                                  </span>
                                </>
                              ) : (
                                <span>
                                  {isExternal
                                    ? t('attendance:recordPresent', {
                                        defaultValue: isFrench
                                          ? 'Enregistrer présent'
                                          : 'Record Present',
                                      })
                                    : t('attendance:markPresent', {
                                        defaultValue: isFrench
                                          ? 'Marquer présent'
                                          : 'Mark Present',
                                      })}
                                </span>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Guests Tab View: Clean Table with Strictly Binary State */}
          {activeTab === 'guests' && (
            <div className="overflow-x-auto">
              {guestRecords.length === 0 ? (
                <div className="p-12 text-center text-xs text-[#8a726a]">
                  {t('attendance:guest.noGuests')}
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#faf2ee]/70 border-b border-[#e8e1dd] text-[#8a726a] text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-3 px-4 font-bold">Guest Full Name</th>
                      <th className="py-3 px-3 font-bold">Phone Number</th>
                      <th className="py-3 px-3 font-bold">Invitation Notes</th>
                      <th className="py-3 px-4 text-center font-bold">
                        Status
                      </th>
                      {canWrite && (
                        <th className="py-3 px-4 text-right font-bold">
                          Action
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e8e1dd] text-xs text-[#1e1b19]">
                    {guestRecords.map((g) => {
                      const isPresent = g.status === AttendanceStatus.PRESENT;

                      return (
                        <tr
                          key={g.id}
                          className="hover:bg-[#faf2ee]/50 transition-colors"
                        >
                          <td className="py-3 px-4 font-bold text-xs">
                            {g.guestInfo.fullName}
                          </td>
                          <td className="py-3 px-3 font-mono text-xs text-[#57423b]">
                            {g.guestInfo.phoneNumber || '—'}
                          </td>
                          <td className="py-3 px-3 text-xs text-[#8a726a]">
                            {g.guestInfo.notes || '—'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {!canWrite ? (
                              <span
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 ${
                                  isPresent
                                    ? 'bg-[#c2e9ca] text-[#2c4e37]'
                                    : 'bg-[#faf2ee] text-[#8a726a] border border-[#e8e1dd]'
                                }`}
                              >
                                {isPresent && <Check size={12} weight="bold" />}
                                <span>
                                  {isPresent
                                    ? t('attendance:status.present', {
                                        defaultValue: isFrench
                                          ? 'Présent(e)'
                                          : 'Present',
                                      })
                                    : t('attendance:status.absent', {
                                        defaultValue: isFrench
                                          ? 'Absent(e)'
                                          : 'Absent',
                                      })}
                                </span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={!isUnlocked}
                                onClick={() =>
                                  handleToggleGuest(g.id, g.status)
                                }
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                                  isPresent
                                    ? 'bg-[#486b52] text-white shadow-xs'
                                    : 'bg-[#faf2ee] text-[#8a726a] border border-[#e8e1dd]'
                                }`}
                              >
                                {isPresent && <Check size={12} weight="bold" />}
                                <span>
                                  {isPresent
                                    ? t('attendance:status.present', {
                                        defaultValue: isFrench
                                          ? 'Présent(e)'
                                          : 'Present',
                                      })
                                    : t('attendance:status.absent', {
                                        defaultValue: isFrench
                                          ? 'Absent(e)'
                                          : 'Absent',
                                      })}
                                </span>
                              </button>
                            )}
                          </td>
                          {canWrite && (
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveGuest(g.id)}
                                className="p-1.5 rounded-lg text-[#ba1a1a] hover:bg-[#ffdad6]/50 cursor-pointer transition-colors"
                                title="Remove Guest"
                              >
                                <Trash size={15} weight="bold" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Guest Modal */}
      {isAddGuestModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#23201e]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#e8e1dd] shadow-2xl max-w-md w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 flex items-center justify-between border-b border-[#f4ece9] bg-[#faf8f6]/50">
              <h3 className="font-bold text-base text-[#1e1b19]">
                {t('attendance:guest.addGuest')}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddGuestModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-[#faf2ee] hover:bg-[#f4ece9] flex items-center justify-center text-[#8a726a] hover:text-[#1e1b19] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={handleAddGuest}
              className="p-6 flex flex-col gap-4 text-xs"
            >
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="guest-fullname-input"
                  className="font-bold text-[#1e1b19]"
                >
                  {t('attendance:guest.fullName')}{' '}
                  <span className="text-[#b85028]">*</span>
                </label>
                <input
                  id="guest-fullname-input"
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Marie Claire Fotso"
                  className="w-full h-10 px-3.5 bg-[#faf2ee] focus:bg-white text-xs rounded-lg border border-[#e8e1dd] focus:border-[#b85028] outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="guest-phone-input"
                  className="font-bold text-[#1e1b19]"
                >
                  {t('attendance:guest.phoneNumber')}
                </label>
                <input
                  id="guest-phone-input"
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="e.g. +237 699 00 00 00"
                  className="w-full h-10 px-3.5 bg-[#faf2ee] focus:bg-white text-xs rounded-lg border border-[#e8e1dd] focus:border-[#b85028] outline-none font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="guest-notes-input"
                  className="font-bold text-[#1e1b19]"
                >
                  {t('attendance:guest.notes')}
                </label>
                <textarea
                  id="guest-notes-input"
                  rows={2}
                  value={guestNotes}
                  onChange={(e) => setGuestNotes(e.target.value)}
                  placeholder="Invited by, visitor background..."
                  className="w-full p-3 bg-[#faf2ee] focus:bg-white text-xs rounded-lg border border-[#e8e1dd] focus:border-[#b85028] outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#f4ece9]">
                <button
                  type="button"
                  onClick={() => setIsAddGuestModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-[#e8e1dd] text-[#57423b] font-bold text-xs hover:bg-[#faf2ee] cursor-pointer"
                >
                  {t('common:cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#b85028] hover:bg-[#a44520] text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  {t('attendance:guest.confirmAdd')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Lock Attendance Modal */}
      {isLockModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1e1b19]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#e8e1dd] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#f4ece9] flex items-start justify-between bg-[#fffbf9]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#fff8e1] border border-[#ffe082] text-[#812901] flex items-center justify-center shrink-0">
                  <Lock size={22} weight="bold" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1e1b19]">
                    Finalize & Lock Attendance
                  </h3>
                  <p className="text-xs text-[#8a726a] truncate max-w-xs">
                    {activity.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLockModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd] flex items-center justify-center text-[#8a726a] hover:text-[#1e1b19] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <p className="text-xs text-[#57423b] leading-relaxed">
                Are you sure you want to finalize and seal attendance for this
                activity? Once locked, check-in records are preserved and cannot
                be altered without an
                <strong className="text-[#1e1b19]">
                  {' '}
                  Apostolic Prefect (AP)
                </strong>{' '}
                override.
              </p>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="lock-notes-input"
                  className="text-xs font-bold text-[#1e1b19]"
                >
                  Closing Notes or Summary (Optional)
                </label>
                <input
                  id="lock-notes-input"
                  type="text"
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  placeholder="e.g. Roll call finalized by coordinator"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf2ee]/60 border border-[#e8e1dd] text-xs text-[#1e1b19] focus:outline-none focus:border-[#b85028]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#f4ece9]">
                <button
                  type="button"
                  onClick={() => setIsLockModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-[#e8e1dd] text-[#57423b] font-bold text-xs hover:bg-[#faf2ee] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLock}
                  disabled={lockMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-[#2c4e37] hover:bg-[#233f2c] text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Lock size={14} weight="bold" />
                  <span>
                    {lockMutation.isPending ? 'Sealing...' : 'Confirm & Lock'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Unlock Attendance Modal */}
      {isUnlockModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1e1b19]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#e8e1dd] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#f4ece9] flex items-start justify-between bg-[#fffbf9]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#fff2ee] border border-[#ffdbcf] text-[#b85028] flex items-center justify-center shrink-0">
                  <LockOpen size={22} weight="bold" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1e1b19]">
                    AP Attendance Unlock
                  </h3>
                  <p className="text-xs text-[#8a726a] truncate max-w-xs">
                    Administrative Override
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUnlockModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd] flex items-center justify-center text-[#8a726a] hover:text-[#1e1b19] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <p className="text-xs text-[#57423b] leading-relaxed">
                Unlocking will reopen roll call for coordinator editing. An
                administrative audit record will be permanently logged with your
                Apostolic Prefect credentials.
              </p>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="unlock-reason-input"
                  className="text-xs font-bold text-[#1e1b19]"
                >
                  Administrative Justification{' '}
                  <span className="text-[#ba1a1a]">*</span>
                </label>
                <textarea
                  id="unlock-reason-input"
                  rows={3}
                  value={unlockReason}
                  onChange={(e) => setUnlockReason(e.target.value)}
                  placeholder="Provide detailed justification (e.g. Correcting late attendance recorded in error)..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf2ee]/60 border border-[#e8e1dd] text-xs text-[#1e1b19] focus:outline-none focus:border-[#b85028] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#f4ece9]">
                <button
                  type="button"
                  onClick={() => setIsUnlockModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-[#e8e1dd] text-[#57423b] font-bold text-xs hover:bg-[#faf2ee] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmUnlock}
                  disabled={unlockMutation.isPending || !unlockReason.trim()}
                  className="px-5 py-2 rounded-xl bg-[#b85028] hover:bg-[#a44520] text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <LockOpen size={14} weight="bold" />
                  <span>
                    {unlockMutation.isPending
                      ? 'Unlocking...'
                      : 'Confirm Unlock'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

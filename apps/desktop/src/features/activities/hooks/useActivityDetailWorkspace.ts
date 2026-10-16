import {
  useAttendanceQuery,
  useAuth,
  useDeleteActivityReportMutation,
  useLockAttendanceMutation,
  useTownContext,
  useUnlockAttendanceMutation,
} from '@jrs/client-core';
import type { IActivity, IActivityReport } from '@jrs/shared';
import { useMemo, useState } from 'react';

export type ActivityDetailTab =
  | 'overview'
  | 'attendance'
  | 'report'
  | 'history';

export const useActivityDetailWorkspace = (activity: IActivity) => {
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

  const { data: attendanceData, isLoading: isAttendanceLoading } =
    useAttendanceQuery(activity.id);

  const lockMutation = useLockAttendanceMutation();
  const unlockMutation = useUnlockAttendanceMutation();
  const deleteReportMutation = useDeleteActivityReportMutation();

  const isCurrentUserAp = user?.role === 'AP';
  const isLocked = activity.isAttendanceLocked || attendanceData?.isLocked;

  const summary = attendanceData?.summary || {
    total: 0,
    members: 0,
    guests: 0,
    males: 0,
    females: 0,
  };

  const filteredAttendance = useMemo(() => {
    if (!attendanceData?.attendees) return [];
    let list = attendanceData.attendees;

    if (attendanceFilter === 'GUESTS') {
      list = list.filter((a: any) => a.attendeeType === 'GUEST');
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a: any) =>
          a.attendeeName.toLowerCase().includes(q) ||
          a.attendeePhone?.includes(q),
      );
    }
    return list;
  }, [attendanceData, attendanceFilter, search]);

  const handleToggleLock = async () => {
    if (isLocked) {
      if (!isCurrentUserAp) return;
      await unlockMutation.mutateAsync({
        activityId: activity.id,
        reason: lockReason.trim() || 'AP Administrative Override',
      });
      setLockPromptOpen(false);
      setLockReason('');
    } else {
      await lockMutation.mutateAsync({ activityId: activity.id });
      setLockPromptOpen(false);
    }
  };

  const handleDeleteReport = async () => {
    if (!reportToDelete) return;
    await deleteReportMutation.mutateAsync({
      activityId: activity.id,
      fileId: reportToDelete.fileId,
    });
    setReportToDelete(null);
  };

  return {
    state: {
      activeTab,
      search,
      attendanceFilter,
      isReportModalOpen,
      reportToDelete,
      previewFile,
      lockPromptOpen,
      lockReason,
      attendanceData,
      isAttendanceLoading,
      isCurrentUserAp,
      isLocked,
      summary,
      filteredAttendance,
      canWrite,
    },
    actions: {
      setActiveTab,
      setSearch,
      setAttendanceFilter,
      setIsReportModalOpen,
      setReportToDelete,
      setPreviewFile,
      setLockPromptOpen,
      setLockReason,
      handleToggleLock,
      handleDeleteReport,
    },
  };
};

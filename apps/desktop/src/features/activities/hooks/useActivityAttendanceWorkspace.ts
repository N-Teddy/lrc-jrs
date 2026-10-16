import {
  useAttendanceQuery,
  useAuth,
  useLockAttendanceMutation,
  useRecordAttendanceMutation,
  useTownContext,
  useUnlockAttendanceMutation,
} from '@jrs/client-core';
import { type IActivity } from '@jrs/shared';
import { useState } from 'react';

export const useActivityAttendanceWorkspace = (activity: IActivity) => {
  const { user } = useAuth();
  const { canWrite } = useTownContext();

  const [activeTab, setActiveTab] = useState<'roster' | 'manual' | 'scanner'>(
    'roster',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestGender, setGuestGender] = useState<'MALE' | 'FEMALE' | ''>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [lockPromptOpen, setLockPromptOpen] = useState(false);
  const [lockReason, setLockReason] = useState('');

  const { data: attendanceData, isLoading: isAttendanceLoading } =
    useAttendanceQuery(activity.id);

  const recordMutation = useRecordAttendanceMutation();
  const lockMutation = useLockAttendanceMutation();
  const unlockMutation = useUnlockAttendanceMutation();

  const isCurrentUserAp = user?.role === 'AP';
  const isPrivileged = user?.role === 'AP' || user?.role === 'PC';

  const isLocked = activity.isAttendanceLocked || attendanceData?.isLocked;
  const summary = attendanceData?.summary || {
    total: 0,
    members: 0,
    guests: 0,
    males: 0,
    females: 0,
  };
  const attendees = attendanceData?.attendees || [];

  const handleRecordAttendance = async (payload: any) => {
    try {
      setErrorMsg('');
      await recordMutation.mutateAsync({
        activityId: activity.id,
        dto: payload,
      });
      setSaveSuccessMsg(`Attendance recorded successfully`);
      setTimeout(() => setSaveSuccessMsg(''), 3000);
      setGuestName('');
      setGuestPhone('');
      setGuestGender('');
      setSearchQuery('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record attendance');
    }
  };

  const handleToggleLock = async () => {
    if (isLocked) {
      if (!isCurrentUserAp) return;
      await unlockMutation.mutateAsync({
        activityId: activity.id,
        reason: lockReason.trim() || 'AP Administrative Override',
      });
      setSaveSuccessMsg('Attendance unlocked via AP override');
      setLockPromptOpen(false);
      setLockReason('');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } else {
      await lockMutation.mutateAsync({ activityId: activity.id });
      setSaveSuccessMsg('Attendance roster locked');
      setLockPromptOpen(false);
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    }
  };

  return {
    state: {
      activeTab,
      searchQuery,
      guestName,
      guestPhone,
      guestGender,
      saveSuccessMsg,
      errorMsg,
      lockPromptOpen,
      lockReason,
      attendanceData,
      isAttendanceLoading,
      isCurrentUserAp,
      isPrivileged,
      canWrite,
      isLocked,
      summary,
      attendees,
    },
    actions: {
      setActiveTab,
      setSearchQuery,
      setGuestName,
      setGuestPhone,
      setGuestGender,
      setSaveSuccessMsg,
      setErrorMsg,
      setLockPromptOpen,
      setLockReason,
      handleRecordAttendance,
      handleToggleLock,
    },
  };
};

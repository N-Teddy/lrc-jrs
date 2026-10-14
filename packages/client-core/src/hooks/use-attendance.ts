import type {
  IActivity,
  IAttendance,
  IMemberAttendanceHistoryResponse,
  IRecordAttendanceDto,
} from '@jrs/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useHttp } from '../context/http.context';
import { queryKeys } from '../query/query-keys';

export function useAttendanceQuery(activityId: string) {
  const http = useHttp();
  return useQuery({
    queryKey: queryKeys.attendance.byActivity(activityId),
    queryFn: () =>
      http.get<IAttendance>(`/activities/${activityId}/attendance`),
    enabled: Boolean(activityId),
  });
}

export function useMemberAttendanceHistoryQuery(memberId: string) {
  const http = useHttp();
  return useQuery({
    queryKey: queryKeys.activities.memberHistory(memberId),
    queryFn: () =>
      http.get<IMemberAttendanceHistoryResponse>(
        `/activities/member/${memberId}/history`,
      ),
    enabled: Boolean(memberId),
  });
}

export function useRecordAttendanceMutation() {
  const http = useHttp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      activityId,
      dto,
    }: {
      activityId: string;
      dto: IRecordAttendanceDto;
    }) => http.post<IAttendance>(`/activities/${activityId}/attendance`, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.attendance.byActivity(variables.activityId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.activities.detail(variables.activityId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
    },
  });
}

export function useLockAttendanceMutation() {
  const http = useHttp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      activityId,
      reason,
    }: {
      activityId: string;
      reason?: string;
    }) =>
      http.post<IActivity>(`/activities/${activityId}/attendance/lock`, {
        reason,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.attendance.byActivity(variables.activityId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.activities.detail(variables.activityId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
    },
  });
}

export function useUnlockAttendanceMutation() {
  const http = useHttp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      activityId,
      reason,
    }: {
      activityId: string;
      reason?: string;
    }) =>
      http.post<IActivity>(`/activities/${activityId}/attendance/unlock`, {
        reason,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.attendance.byActivity(variables.activityId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.activities.detail(variables.activityId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
    },
  });
}

export function useUploadActivityReportMutation() {
  const http = useHttp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      activityId,
      formData,
    }: {
      activityId: string;
      formData: FormData;
    }) =>
      http.post<IActivity>(`/activities/${activityId}/report`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.activities.detail(variables.activityId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
    },
  });
}

export function useDeleteActivityReportMutation() {
  const http = useHttp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      variables: string | { activityId: string; fileId?: string },
    ) => {
      const activityId =
        typeof variables === 'string' ? variables : variables.activityId;
      const fileId =
        typeof variables === 'string' ? undefined : variables.fileId;
      return fileId
        ? http.delete<IActivity>(`/activities/${activityId}/report/${fileId}`)
        : http.delete<IActivity>(`/activities/${activityId}/report`);
    },
    onSuccess: (_, variables) => {
      const activityId =
        typeof variables === 'string' ? variables : variables.activityId;
      queryClient.invalidateQueries({
        queryKey: queryKeys.activities.detail(activityId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
    },
  });
}

export interface IDriveFolderOption {
  id: string;
  name: string;
  path: string;
}

export function useDriveFoldersQuery() {
  const http = useHttp();
  return useQuery({
    queryKey: ['activities', 'report-folders'],
    queryFn: () => http.get<IDriveFolderOption[]>('/activities/report/folders'),
    staleTime: 5 * 60 * 1000,
  });
}

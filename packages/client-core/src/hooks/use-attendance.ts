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
  parentId?: string;
}

export interface IDriveFileVaultItem {
  fileId: string;
  filename: string;
  mimeType?: string;
  webViewLink?: string;
  fileSize?: number;
  uploadedAt?: string;
  folderId?: string;
  activityId?: string;
  activityTitle?: string;
  activityDate?: string;
  uploadedByName?: string;
  summary?: string;
}

export function useDriveFoldersQuery() {
  const http = useHttp();
  return useQuery({
    queryKey: ['activities', 'report-folders'],
    queryFn: () => http.get<IDriveFolderOption[]>('/activities/report/folders'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDriveFilesQuery(folderId?: string) {
  const http = useHttp();
  return useQuery({
    queryKey: ['activities', 'drive-files', folderId],
    queryFn: () =>
      http.get<IDriveFileVaultItem[]>('/activities/report/drive-files', {
        params: folderId && folderId !== 'ALL' ? { folderId } : undefined,
      }),
    staleTime: 60 * 1000,
  });
}

export function useUploadStandaloneDriveFilesMutation() {
  const http = useHttp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ formData }: { formData: FormData }) =>
      http.post<any>('/activities/report/drive-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['activities', 'drive-files'],
      });
      queryClient.invalidateQueries({
        queryKey: ['activities', 'report-folders'],
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
    },
  });
}

export function useDeleteDriveFileMutation() {
  const http = useHttp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileId: string) =>
      http.delete<{ success: boolean; fileId: string }>(
        `/activities/report/drive-file/${fileId}`,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['activities', 'drive-files'],
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
    },
  });
}

export function useCreateDriveFolderMutation() {
  const http = useHttp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, parentId }: { name: string; parentId?: string }) =>
      http.post<IDriveFolderOption>('/activities/report/drive-folders', {
        name,
        parentId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['activities', 'report-folders'],
      });
      queryClient.invalidateQueries({
        queryKey: ['activities', 'drive-files'],
      });
    },
  });
}

export function useRenameDriveFolderMutation() {
  const http = useHttp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      http.patch<IDriveFolderOption>(`/activities/report/drive-folders/${id}`, {
        name,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['activities', 'report-folders'],
      });
      queryClient.invalidateQueries({
        queryKey: ['activities', 'drive-files'],
      });
    },
  });
}

export function useDeleteDriveFolderMutation() {
  const http = useHttp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      http.delete<boolean>(`/activities/report/drive-folders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['activities', 'report-folders'],
      });
      queryClient.invalidateQueries({
        queryKey: ['activities', 'drive-files'],
      });
    },
  });
}

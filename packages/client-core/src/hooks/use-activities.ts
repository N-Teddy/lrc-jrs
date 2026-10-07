import type { IActivity, IActivityReport } from '@jrs/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useHttp } from '../context/http.context';
import { queryKeys } from '../query/query-keys';

export interface ICreateActivityDto {
  title: string;
  description?: string;
  activityType: string;
  date: string;
  location: string;
  isGlobal?: boolean;
  townIds?: string[];
  hostTownId: string;
}

export interface IUpdateActivityDto {
  title?: string;
  description?: string;
  date?: string;
  location?: string;
  isGlobal?: boolean;
  townIds?: string[];
}

export function useActivitiesQuery(townId?: string) {
  const http = useHttp();
  return useQuery({
    queryKey: queryKeys.activities.byTown(townId),
    queryFn: () =>
      http.get<IActivity[]>('/activities', {
        params: townId ? { townId } : undefined,
      }),
  });
}

export function useActivityDetailQuery(id: string) {
  const http = useHttp();
  return useQuery({
    queryKey: queryKeys.activities.detail(id),
    queryFn: () => http.get<IActivity>(`/activities/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateActivityMutation() {
  const http = useHttp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: ICreateActivityDto) =>
      http.post<IActivity>('/activities', dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
    },
  });
}

export function useUpdateActivityMutation() {
  const http = useHttp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: IUpdateActivityDto }) =>
      http.patch<IActivity>(`/activities/${id}`, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.activities.detail(variables.id),
      });
    },
  });
}

export function useUploadActivityReportMutation() {
  const http = useHttp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      http.post<IActivityReport>(`/activities/${id}/report`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.activities.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
    },
  });
}

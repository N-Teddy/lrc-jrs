import type {
  IActivity,
  IActivityQueryDto,
  IActivityStats,
  ICreateActivityDto,
  IPaginatedActivitiesResponse,
  IUpdateActivityDto,
} from '@jrs/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useHttp } from '../context/http.context';
import { queryKeys } from '../query/query-keys';

export function useActivitiesQuery(query?: IActivityQueryDto) {
  const http = useHttp();
  return useQuery({
    queryKey: queryKeys.activities.list(query),
    queryFn: () =>
      http.get<IPaginatedActivitiesResponse>('/activities', {
        params: query as Record<string, any>,
      }),
  });
}

export function useActivityStatsQuery(params?: {
  townId?: string;
  year?: number;
  month?: number;
}) {
  const http = useHttp();
  return useQuery({
    queryKey: queryKeys.activities.stats(params),
    queryFn: () =>
      http.get<IActivityStats>('/activities/stats', {
        params: params as Record<string, any>,
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

export function useDeleteActivityMutation() {
  const http = useHttp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => http.delete(`/activities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
    },
  });
}

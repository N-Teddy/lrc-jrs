import type { ICreateTownDto, ITown, IUpdateTownDto } from '@jrs/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useHttp } from '../context/http.context';
import { queryKeys } from '../query/query-keys';

export function useTownsQuery() {
  const http = useHttp();
  return useQuery({
    queryKey: queryKeys.towns.all,
    queryFn: () => http.get<ITown[]>('/towns'),
  });
}

export function useTownDetailQuery(townId: string) {
  const http = useHttp();
  return useQuery({
    queryKey: queryKeys.towns.detail(townId),
    queryFn: () => http.get<ITown>(`/towns/${townId}`),
    enabled: Boolean(townId),
  });
}

export function useCreateTownMutation() {
  const http = useHttp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: ICreateTownDto) => http.post<ITown>('/towns', dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.towns.all });
    },
  });
}

export function useUpdateTownMutation() {
  const http = useHttp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: IUpdateTownDto }) =>
      http.patch<ITown>(`/towns/${id}`, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.towns.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.towns.detail(variables.id),
      });
    },
  });
}

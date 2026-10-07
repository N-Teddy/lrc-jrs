import type { IUser, UserRole } from '@jrs/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useHttp } from '../context/http.context';
import { queryKeys } from '../query/query-keys';

export interface ITransferTownDto {
  toTownId: string;
  reason?: string;
}

export interface IInviteUserDto {
  fullName: string;
  phoneNumber: string;
  role: UserRole;
  homeTownId: string;
  dateOfBirth?: string;
  allowedReadTownIds?: string[];
}

export function useUsersByTownQuery(townId?: string) {
  const http = useHttp();
  return useQuery({
    queryKey: townId ? queryKeys.users.byTown(townId) : queryKeys.users.all,
    queryFn: () =>
      http.get<IUser[]>('/users', {
        params: townId ? { townId } : undefined,
      }),
  });
}

export function useUserDetailQuery(id: string) {
  const http = useHttp();
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => http.get<IUser>(`/users/${id}`),
    enabled: Boolean(id),
  });
}

export function useTransferTownMutation() {
  const http = useHttp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, dto }: { userId: string; dto: ITransferTownDto }) =>
      http.post<IUser>(`/users/${userId}/transfer`, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.detail(variables.userId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.towns.all });
    },
  });
}

export function useInviteUserMutation() {
  const http = useHttp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: IInviteUserDto) => http.post<IUser>('/users/invite', dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

import type {
  IChangeTownPcDto,
  ICreateMemberDto,
  IMemberQueryDto,
  IMemberStats,
  IPaginatedMembersResponse,
  IUpdateMemberAccessDto,
  IUpdateMemberDto,
  IUser,
  UserRole,
} from '@jrs/shared';
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

/**
 * Hook to query paginated, filtered, and searched members
 */
export function useMembersQuery(
  query?: IMemberQueryDto,
  options?: { enabled?: boolean },
) {
  const http = useHttp();
  return useQuery({
    queryKey: queryKeys.users.list(query),
    queryFn: () =>
      http.get<IPaginatedMembersResponse>('/users', {
        params: query,
      }),
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook to fetch member hub aggregate metrics
 */
export function useMemberStatsQuery(townId?: string) {
  const http = useHttp();
  return useQuery({
    queryKey: queryKeys.users.stats(townId),
    queryFn: () =>
      http.get<IMemberStats>('/users/stats', {
        params: townId ? { townId } : undefined,
      }),
  });
}

/**
 * Hook to fetch single member details
 */
export function useMemberDetailQuery(id: string) {
  const http = useHttp();
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => http.get<IUser>(`/users/${id}`),
    enabled: Boolean(id),
  });
}

/**
 * Hook to register a new member in the fellowship
 */
export function useCreateMemberMutation() {
  const http = useHttp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: ICreateMemberDto | FormData) =>
      http.post<IUser>('/users', dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: ['users', 'stats'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.towns.all });
    },
  });
}

/**
 * Hook to update a member profile
 */
export function useUpdateMemberMutation() {
  const http = useHttp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: IUpdateMemberDto | FormData;
    }) => http.patch<IUser>(`/users/${id}`, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: ['users', 'stats'] });
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.towns.all });
    },
  });
}

/**
 * Hook to toggle member platform access or resend temporary credentials
 */
export function useUpdateMemberAccessMutation() {
  const http = useHttp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: IUpdateMemberAccessDto }) =>
      http.patch<IUser>(`/users/${id}/access`, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: ['users', 'stats'] });
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.detail(variables.id),
      });
    },
  });
}

/**
 * Hook to transition Town PC leadership (appoint new PC, demote/revoke outgoing PC)
 */
export function useChangeTownPcMutation() {
  const http = useHttp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: IChangeTownPcDto) =>
      http.post<{ message: string; newPc: IUser; outgoingPc?: IUser }>(
        '/users/change-pc',
        dto,
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: ['users', 'stats'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.towns.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.detail(variables.newPcUserId),
      });
      if (variables.outgoingPcUserId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.users.detail(variables.outgoingPcUserId),
        });
      }
    },
  });
}

/**
 * Hook to remove a member (AP only)
 */
export function useDeleteMemberMutation() {
  const http = useHttp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => http.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: ['users', 'stats'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.towns.all });
    },
  });
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
  return useMemberDetailQuery(id);
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

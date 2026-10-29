import type { IRegistrationLink, IUser } from '@jrs/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useHttp } from '../context/http.context';
import { queryKeys } from '../query/query-keys';

export interface ICreateRegistrationLinkDto {
  title: string;
  homeTownId?: string;
  expiresInHours?: number;
  expiresAt?: string;
  maxUses?: number;
  customMessage?: string;
}

export interface IReviewMemberDto {
  action: 'APPROVE' | 'REJECT';
  grantAppAccess?: boolean;
  notes?: string;
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  homeTownId?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE';
}

export function useRegistrationLinksQuery(
  townId?: string,
  options?: { enabled?: boolean },
) {
  const http = useHttp();
  return useQuery({
    queryKey: queryKeys.registrationLinks.list(townId),
    queryFn: () =>
      http.get<IRegistrationLink[]>('/registration-links', {
        params: townId && townId !== 'all' ? { townId } : undefined,
      }),
    enabled: options?.enabled ?? true,
  });
}

export function useCreateRegistrationLinkMutation() {
  const http = useHttp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: ICreateRegistrationLinkDto) =>
      http.post<IRegistrationLink>('/registration-links', dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.registrationLinks.all,
      });
    },
  });
}

export function useDeactivateRegistrationLinkMutation() {
  const http = useHttp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      http.delete<{ success: boolean; message: string }>(
        `/registration-links/${encodeURIComponent(id)}`,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.registrationLinks.all,
      });
    },
  });
}

export function usePendingReviewsQuery(
  townId?: string,
  options?: { enabled?: boolean },
) {
  const http = useHttp();
  return useQuery({
    queryKey: queryKeys.registrationLinks.pendingReviews(townId),
    queryFn: () =>
      http.get<IUser[]>('/registration-links/pending-reviews', {
        params: townId && townId !== 'all' ? { townId } : undefined,
      }),
    enabled: options?.enabled ?? true,
    refetchInterval: 30000,
  });
}

export function useReviewMemberMutation() {
  const http = useHttp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      dto,
    }: {
      memberId: string;
      dto: IReviewMemberDto;
    }) =>
      http.patch<{
        success: boolean;
        message: string;
        member: IUser;
      }>(`/registration-links/review/${encodeURIComponent(memberId)}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.registrationLinks.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.all,
      });
    },
  });
}

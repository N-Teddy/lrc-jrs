import type {
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

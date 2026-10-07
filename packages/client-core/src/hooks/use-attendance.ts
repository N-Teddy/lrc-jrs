import type { IAttendance, IAttendanceItem } from '@jrs/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useHttp } from '../context/http.context';
import { queryKeys } from '../query/query-keys';

export interface IRecordAttendanceDto {
  activityId: string;
  attendees: IAttendanceItem[];
}

export function useAttendanceQuery(activityId: string) {
  const http = useHttp();
  return useQuery({
    queryKey: queryKeys.attendance.byActivity(activityId),
    queryFn: () => http.get<IAttendance>(`/attendance/activity/${activityId}`),
    enabled: Boolean(activityId),
  });
}

export function useRecordAttendanceMutation() {
  const http = useHttp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: IRecordAttendanceDto) =>
      http.post<IAttendance>('/attendance', dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.attendance.byActivity(variables.activityId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.activities.detail(variables.activityId),
      });
    },
  });
}

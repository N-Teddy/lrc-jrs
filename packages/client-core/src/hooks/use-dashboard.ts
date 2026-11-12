import type { IDashboardOverviewDto } from '@jrs/shared';
import { useQuery } from '@tanstack/react-query';
import { useHttp } from '../context/http.context';
import { queryKeys } from '../query/query-keys';

export interface IDashboardOverviewParams {
  townId?: string;
  period?: 'month' | 'quarter' | 'year';
  year?: number;
  month?: number;
}

/**
 * Hook to query aggregated executive dashboard analytics, KPIs, attendance trends,
 * demographics, and upcoming birthdays.
 */
export function useDashboardOverviewQuery(
  params?: IDashboardOverviewParams,
  options?: { enabled?: boolean },
) {
  const http = useHttp();
  return useQuery({
    queryKey: queryKeys.dashboard.overview(params),
    queryFn: () =>
      http.get<IDashboardOverviewDto>('/dashboard/overview', {
        params,
      }),
    enabled: options?.enabled ?? true,
    staleTime: 60 * 1000, // 1 minute fresh cache
  });
}

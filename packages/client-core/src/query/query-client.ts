import { QueryClient } from '@tanstack/react-query';

export { useQueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes cache freshness
        gcTime: 1000 * 60 * 60 * 24, // 24 hours garbage collection (persist in memory/offline)
        networkMode: 'offlineFirst', // Return cached data even when offline or disconnected
        retry: (failureCount, error: unknown) => {
          // Do not retry 401 or 403 authorization errors
          const err = error as { statusCode?: number } | undefined;
          if (err?.statusCode === 401 || err?.statusCode === 403) {
            return false;
          }
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        networkMode: 'offlineFirst',
        retry: false,
      },
    },
  });
}

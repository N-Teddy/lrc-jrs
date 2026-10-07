import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 2, // 2 minutes cache validity
        gcTime: 1000 * 60 * 10, // 10 minutes garbage collection
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
        retry: false,
      },
    },
  });
}

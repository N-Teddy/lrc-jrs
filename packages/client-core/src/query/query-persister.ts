import {
  type DehydratedState,
  dehydrate,
  hydrate,
  type QueryClient,
} from '@tanstack/react-query';
import type { IStorageAdapter } from '../storage/storage.interface';

export const QUERY_CACHE_STORAGE_KEY = 'jrs_react_query_cache';
export const QUERY_CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export interface PersistedQueryCache {
  timestamp: number;
  dehydratedState: DehydratedState;
}

/**
 * Hydrates the QueryClient cache from persistent storage.
 */
export async function hydrateQueryClient(
  queryClient: QueryClient,
  storage: IStorageAdapter,
): Promise<boolean> {
  try {
    const raw = await storage.getItem(QUERY_CACHE_STORAGE_KEY);
    if (!raw) return false;

    const parsed = JSON.parse(raw) as PersistedQueryCache;
    if (!parsed?.dehydratedState || !parsed.timestamp) {
      return false;
    }

    // Discard cache if older than max age
    if (Date.now() - parsed.timestamp > QUERY_CACHE_MAX_AGE_MS) {
      await storage.removeItem(QUERY_CACHE_STORAGE_KEY);
      return false;
    }

    hydrate(queryClient, parsed.dehydratedState);
    return true;
  } catch (error) {
    console.warn('[QueryPersister] Failed to hydrate cache:', error);
    return false;
  }
}

/**
 * Dehydrates successful query cache data to persistent storage.
 */
export async function saveQueryCache(
  queryClient: QueryClient,
  storage: IStorageAdapter,
): Promise<void> {
  try {
    const dehydratedState = dehydrate(queryClient, {
      shouldDehydrateQuery: (query) => {
        // Only persist queries that have valid resolved data and are not in error state
        return (
          query.state.status === 'success' && query.state.data !== undefined
        );
      },
    });

    const payload: PersistedQueryCache = {
      timestamp: Date.now(),
      dehydratedState,
    };

    await storage.setItem(QUERY_CACHE_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('[QueryPersister] Failed to save query cache:', error);
  }
}

/**
 * Subscribes to QueryClient updates and persists successful queries to storage (debounced).
 * Automatically initiates cache hydration on startup.
 */
export function setupQueryCachePersistence(
  queryClient: QueryClient,
  storage: IStorageAdapter,
): () => void {
  // Immediately hydrate cached queries from disk / local storage
  hydrateQueryClient(queryClient, storage);

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const triggerSave = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      saveQueryCache(queryClient, storage);
    }, 1000);
  };

  const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
    // Only trigger persistence when a query has updated with new data successfully
    if (event.type === 'updated' && event.action?.type === 'success') {
      triggerSave();
    }
  });

  return () => {
    unsubscribe();
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
  };
}

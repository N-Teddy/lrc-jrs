import {
  DEFAULT_TOWNS,
  evaluateTownPermissions,
  type ITown,
} from '@jrs/shared';
import { useQueryClient } from '@tanstack/react-query';
import type React from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { queryKeys } from '../query/query-keys';
import type { IStorageAdapter } from '../storage/storage.interface';
import { useAuth } from './auth.context';
import { useHttp } from './http.context';

export interface TownContextValue {
  activeTownId: string | null;
  activeTown: ITown | null;
  availableTowns: ITown[];
  isLoadingTowns: boolean;
  canRead: boolean;
  canWrite: boolean;
  isReadOnly: boolean;
  isViewingHomeTown: boolean;
  setActiveTownId: (townId: string) => Promise<void>;
  refreshTowns: () => Promise<void>;
}

const TownContext = createContext<TownContextValue | null>(null);

export interface TownProviderProps {
  children: React.ReactNode;
  storage: IStorageAdapter;
}

const STORAGE_ACTIVE_TOWN_KEY = 'jrs_active_town_id';

const FALLBACK_TOWNS: ITown[] = DEFAULT_TOWNS.map((dt) => ({
  id: dt.code.toLowerCase(),
  name: dt.name,
  code: dt.code,
  activePcCount: 1,
}));

export function TownProvider({ children, storage }: TownProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const http = useHttp();
  const queryClient = useQueryClient();

  const [activeTownId, setActiveTownIdState] = useState<string | null>(null);
  const [availableTowns, setAvailableTowns] = useState<ITown[]>(FALLBACK_TOWNS);
  const [isLoadingTowns, setIsLoadingTowns] = useState<boolean>(true);

  // Fetch list of towns
  const refreshTowns = useCallback(async () => {
    try {
      setIsLoadingTowns(true);
      const towns = await http.get<ITown[]>('/towns');
      if (Array.isArray(towns) && towns.length > 0) {
        setAvailableTowns(towns);
        await storage.setItem('jrs_cached_towns', JSON.stringify(towns));
      }
    } catch {
      // keep fallback towns
    } finally {
      setIsLoadingTowns(false);
    }
  }, [http, storage]);

  // Initial load of towns and active town ID
  useEffect(() => {
    let isMounted = true;

    async function initTown() {
      try {
        if (!isAuthenticated || !user) {
          if (isMounted) {
            setActiveTownIdState(null);
            http.setActiveTownId(null);
            setIsLoadingTowns(false);
          }
          return;
        }

        setIsLoadingTowns(true);

        const savedTownId = await storage.getItem(STORAGE_ACTIVE_TOWN_KEY);

        // Fetch towns from backend, or fallback to cached towns if offline
        const towns = await http
          .get<ITown[]>('/towns')
          .catch(() => [] as ITown[]);

        if (isMounted) {
          if (Array.isArray(towns) && towns.length > 0) {
            setAvailableTowns(towns);
            await storage.setItem('jrs_cached_towns', JSON.stringify(towns));
          } else {
            // Offline fallback: restore cached towns from persistent storage
            const cachedTownsJson = await storage.getItem('jrs_cached_towns');
            if (cachedTownsJson) {
              try {
                const parsed = JSON.parse(cachedTownsJson);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  setAvailableTowns(parsed);
                }
              } catch {
                // Keep fallback towns
              }
            }
          }
        }

        // Prioritize previously saved active town ID from storage (user's chosen hub),
        // then user's assigned home town, then first available
        const currentTowns = towns.length > 0 ? towns : FALLBACK_TOWNS;
        const savedMatch = currentTowns.find(
          (t) =>
            t.id === savedTownId ||
            (savedTownId &&
              t.code?.toUpperCase() === savedTownId.toUpperCase()),
        );
        const homeMatch = currentTowns.find(
          (t) =>
            t.id === user.homeTownId ||
            (user.homeTownId &&
              t.code?.toUpperCase() === user.homeTownId.toUpperCase()),
        );

        const resolvedTownId =
          savedMatch?.id ||
          savedTownId ||
          homeMatch?.id ||
          user.homeTownId ||
          (currentTowns[0]?.id ?? null);

        if (isMounted && resolvedTownId) {
          setActiveTownIdState(resolvedTownId);
          http.setActiveTownId(resolvedTownId);
          await storage.setItem(STORAGE_ACTIVE_TOWN_KEY, resolvedTownId);
        }
      } catch {
        // Ignore initialization errors
      } finally {
        if (isMounted) {
          setIsLoadingTowns(false);
        }
      }
    }

    initTown();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user, http, storage]);

  // Handle town switch
  const setActiveTownId = useCallback(
    async (newTownId: string) => {
      const match = availableTowns.find(
        (t) =>
          t.id === newTownId ||
          t.code?.toUpperCase() === newTownId.toUpperCase(),
      );
      const canonicalId = match?.id || newTownId;
      setActiveTownIdState(canonicalId);
      http.setActiveTownId(canonicalId);
      await storage.setItem(STORAGE_ACTIVE_TOWN_KEY, canonicalId);

      // Invalidate town-specific queries so views update instantly
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.registrationLinks.all,
      });
    },
    [http, storage, queryClient, availableTowns],
  );

  const activeTown = useMemo(() => {
    if (!activeTownId) return null;
    return (
      availableTowns.find(
        (t) =>
          t.id === activeTownId ||
          t.code?.toUpperCase() === activeTownId.toUpperCase(),
      ) || null
    );
  }, [activeTownId, availableTowns]);

  const permissions = useMemo(() => {
    if (!user || !activeTownId) {
      return { canRead: false, canWrite: false, isReadOnly: true };
    }
    return evaluateTownPermissions(user, activeTownId);
  }, [user, activeTownId]);

  const isViewingHomeTown = useMemo(() => {
    if (!user?.homeTownId || !activeTownId) return false;
    return String(user.homeTownId) === String(activeTownId);
  }, [user?.homeTownId, activeTownId]);

  const value: TownContextValue = {
    activeTownId,
    activeTown,
    availableTowns,
    isLoadingTowns,
    canRead: permissions.canRead,
    canWrite: permissions.canWrite,
    isReadOnly: permissions.isReadOnly,
    isViewingHomeTown,
    setActiveTownId,
    refreshTowns,
  };

  return <TownContext.Provider value={value}>{children}</TownContext.Provider>;
}

export function useTownContext(): TownContextValue {
  const context = useContext(TownContext);
  if (!context) {
    throw new Error('useTownContext must be used within a TownProvider');
  }
  return context;
}

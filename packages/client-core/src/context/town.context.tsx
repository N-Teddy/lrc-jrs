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
  const [isLoadingTowns, setIsLoadingTowns] = useState<boolean>(false);

  // Fetch list of towns
  const refreshTowns = useCallback(async () => {
    try {
      setIsLoadingTowns(true);
      const towns = await http.get<ITown[]>('/towns');
      if (Array.isArray(towns) && towns.length > 0) {
        setAvailableTowns(towns);
      }
    } catch {
      // keep fallback towns
    } finally {
      setIsLoadingTowns(false);
    }
  }, [http]);

  // Initial load of towns and active town ID
  useEffect(() => {
    let isMounted = true;

    async function initTown() {
      try {
        if (!isAuthenticated || !user) {
          if (isMounted) {
            setActiveTownIdState(null);
            http.setActiveTownId(null);
          }
          return;
        }

        // Fetch towns
        const towns = await http
          .get<ITown[]>('/towns')
          .catch(() => [] as ITown[]);
        if (isMounted) {
          setAvailableTowns(towns);
          setIsLoadingTowns(false);
        }

        // Try reading stored town ID, fallback to user's home town
        const savedTownId = await storage.getItem(STORAGE_ACTIVE_TOWN_KEY);
        const resolvedTownId =
          savedTownId || user.homeTownId || (towns[0]?.id ?? null);

        if (isMounted && resolvedTownId) {
          setActiveTownIdState(resolvedTownId);
          http.setActiveTownId(resolvedTownId);
        }
      } catch {
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
      setActiveTownIdState(newTownId);
      http.setActiveTownId(newTownId);
      await storage.setItem(STORAGE_ACTIVE_TOWN_KEY, newTownId);

      // Invalidate town-specific queries so views update instantly
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
    [http, storage, queryClient],
  );

  const activeTown = useMemo(() => {
    if (!activeTownId) return null;
    return availableTowns.find((t) => t.id === activeTownId) || null;
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

import type { IAuthUser, ILoginResponse } from '@jrs/shared';
import { useQueryClient } from '@tanstack/react-query';
import type React from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { HttpService } from '../http/axios-client';
import { useTranslation } from '../i18n/i18n';
import type { IStorageAdapter } from '../storage/storage.interface';
import { toast } from '../toast';

export interface AuthContextValue {
  user: IAuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (identifier: string, password: string) => Promise<ILoginResponse>;
  signOut: () => Promise<void>;
  updateUser: (user: IAuthUser) => Promise<void>;
  completeSetup: (
    newPassword: string,
    setupToken?: string,
  ) => Promise<ILoginResponse>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: React.ReactNode;
  storage: IStorageAdapter;
  http: HttpService;
}

export function AuthProvider({ children, storage, http }: AuthProviderProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<IAuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state from secure storage
  useEffect(() => {
    let isMounted = true;

    async function loadStoredAuth() {
      try {
        const token = await storage.getItem('jrs_access_token');
        const userJson = await storage.getItem('jrs_user');

        if (token && userJson && isMounted) {
          const parsedUser = JSON.parse(userJson) as IAuthUser;
          setUser(parsedUser);
          setToken(token);
          setIsAuthenticated(true);

          // Refresh user profile asynchronously to sync avatarUrl or role updates
          http
            .get<IAuthUser>('/auth/me', { skipToast: true })
            .then(async (freshUser) => {
              if (isMounted && freshUser?.id) {
                setUser(freshUser);
                await storage.setItem('jrs_user', JSON.stringify(freshUser));
              }
            })
            .catch(() => {
              // Non-blocking background sync
            });
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadStoredAuth();

    return () => {
      isMounted = false;
    };
  }, [storage, http]);

  // Synchronize state when session is terminated by http service
  useEffect(() => {
    const unsubscribeUnauthorized = http.onUnauthorizedEvent(() => {
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      queryClient.clear();
    });

    const unsubscribeRefreshed = http.onTokenRefreshed((newToken) => {
      setToken(newToken);
    });

    return () => {
      unsubscribeUnauthorized();
      unsubscribeRefreshed();
    };
  }, [http, queryClient]);

  const signIn = useCallback(
    async (identifier: string, password: string): Promise<ILoginResponse> => {
      const res = await http.post<ILoginResponse>('/auth/login', {
        identifier,
        password,
      });

      if (res.accessToken) {
        await storage.setItem('jrs_access_token', res.accessToken);
        setToken(res.accessToken);
      }
      if (res.refreshToken) {
        await storage.setItem('jrs_refresh_token', res.refreshToken);
      }
      if (res.user && !res.requiresPasswordChange) {
        await storage.setItem('jrs_user', JSON.stringify(res.user));
        if (res.user.homeTownId) {
          await storage.setItem('jrs_active_town_id', res.user.homeTownId);
        }
        setUser(res.user);
        setIsAuthenticated(true);
        queryClient.clear();
      }

      return res;
    },
    [http, storage, queryClient],
  );

  const signOut = useCallback(async (): Promise<void> => {
    try {
      const refreshToken = await storage.getItem('jrs_refresh_token');
      await http
        .post('/auth/logout', { refreshToken: refreshToken || undefined })
        .catch(() => {});
    } finally {
      await storage.removeItem('jrs_access_token');
      await storage.removeItem('jrs_refresh_token');
      await storage.removeItem('jrs_user');
      await storage.removeItem('jrs_active_town_id');
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      queryClient.clear();
      toast.info(
        t('common:toast.signedOut', {
          defaultValue: 'You have been signed out successfully.',
        }),
        {
          title: t('common:signOut', { defaultValue: 'Sign Out' }),
          duration: 3500,
        },
      );
    }
  }, [http, storage, queryClient, t]);

  const updateUser = useCallback(
    async (updatedUser: IAuthUser): Promise<void> => {
      await storage.setItem('jrs_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    },
    [storage],
  );

  const completeSetup = useCallback(
    async (
      newPassword: string,
      setupToken?: string,
    ): Promise<ILoginResponse> => {
      const config = setupToken
        ? {
            headers: {
              Authorization: `Bearer ${setupToken}`,
            },
          }
        : undefined;

      const res = await http.post<ILoginResponse>(
        '/auth/complete-setup',
        { newPassword },
        config,
      );

      if (res.accessToken) {
        await storage.setItem('jrs_access_token', res.accessToken);
        setToken(res.accessToken);
      }
      if (res.refreshToken) {
        await storage.setItem('jrs_refresh_token', res.refreshToken);
      }
      if (res.user) {
        await storage.setItem('jrs_user', JSON.stringify(res.user));
        setUser(res.user);
        setIsAuthenticated(true);
        queryClient.clear();
      }

      return res;
    },
    [http, storage, queryClient],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        signIn,
        signOut,
        updateUser,
        completeSetup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

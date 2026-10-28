import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { AuthProvider } from '../context/auth.context';
import { HttpProvider } from '../context/http.context';
import { TownProvider } from '../context/town.context';
import { HttpService } from '../http/axios-client';
import { i18n, initI18n } from '../i18n/i18n';
import { WebSocketProvider } from '../notifications/socket.context';
import { createQueryClient } from '../query/query-client';
import { setupQueryCachePersistence } from '../query/query-persister';
import type { IStorageAdapter } from '../storage/storage.interface';
import { ToastProvider } from '../toast/toast.context';

export interface CoreProvidersProps {
  children: React.ReactNode;
  storage?: IStorageAdapter;
  storageAdapter?: IStorageAdapter;
  baseUrl: string;
  initialLanguage?: string;
  onUnauthorized?: () => void;
  queryClient?: QueryClient;
  isDev?: boolean;
}

export function CoreProviders({
  children,
  storage,
  storageAdapter,
  baseUrl,
  initialLanguage = 'fr',
  onUnauthorized,
  queryClient: customQueryClient,
  isDev,
}: CoreProvidersProps) {
  const activeStorage = (storageAdapter || storage) as IStorageAdapter;
  if (!activeStorage) {
    throw new Error(
      'A storage or storageAdapter must be provided to CoreProviders',
    );
  }
  // Ensure i18n is initialized once
  initI18n(initialLanguage, { isDev });

  // Initialize language from storage if present
  useEffect(() => {
    Promise.resolve(activeStorage.getItem('jrs_language')).then((savedLng) => {
      if (
        savedLng &&
        (savedLng === 'fr' || savedLng === 'en') &&
        i18n.language !== savedLng
      ) {
        i18n.changeLanguage(savedLng);
      }
    });
  }, [activeStorage]);

  // Instantiate HttpService
  const http = useMemo(
    () =>
      new HttpService({
        baseUrl,
        storage: activeStorage,
        onUnauthorized,
        getLanguage: () => i18n.language,
      }),
    [baseUrl, activeStorage, onUnauthorized],
  );

  // Fallback or custom QueryClient
  const [defaultQueryClient] = useState(
    () => customQueryClient || createQueryClient(),
  );
  const activeQueryClient = customQueryClient || defaultQueryClient;

  // Persist TanStack Query cache across reloads and offline periods
  useEffect(() => {
    const cleanup = setupQueryCachePersistence(
      activeQueryClient,
      activeStorage,
    );
    return cleanup;
  }, [activeQueryClient, activeStorage]);

  return (
    <QueryClientProvider client={activeQueryClient}>
      <HttpProvider http={http}>
        <ToastProvider>
          <AuthProvider storage={activeStorage} http={http}>
            <TownProvider storage={activeStorage}>
              <WebSocketProvider>{children}</WebSocketProvider>
            </TownProvider>
          </AuthProvider>
        </ToastProvider>
      </HttpProvider>
    </QueryClientProvider>
  );
}

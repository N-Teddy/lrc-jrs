import type {
  INotification,
  NotificationQueryDto,
  NotificationStatsDto,
  RegisterPushTokenDto,
} from '@jrs/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from '../context/auth.context';
import { useHttp } from '../context/http.context';
import { i18n } from '../i18n/i18n';
import { queryKeys } from '../query/query-keys';
import { toast } from '../toast/toast.context';
import type { ToastType } from '../toast/toast.types';

export interface PaginatedNotifications {
  data: INotification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Query paginated notifications list for the current user
 */
export function useNotificationsQuery(queryDto?: NotificationQueryDto) {
  const http = useHttp();
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.notifications.list(queryDto),
    queryFn: () =>
      http.get<PaginatedNotifications>('/notifications', {
        params: queryDto,
      }),
    enabled: isAuthenticated,
    staleTime: 30000,
  });
}

/**
 * Query current unread notification count
 */
export function useUnreadNotificationCountQuery() {
  const http = useHttp();
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: async () => {
      const res = await http.get<NotificationStatsDto>(
        '/notifications/unread-count',
      );
      return res.unreadCount;
    },
    enabled: isAuthenticated,
    staleTime: 15000,
    refetchInterval: 60000,
  });
}

/**
 * Mutation to mark a single notification as read
 */
export function useMarkNotificationReadMutation() {
  const http = useHttp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      http.patch<INotification>(`/notifications/${id}/read`),
    onSuccess: (updatedNotification) => {
      // Optimistically update list cache
      queryClient.setQueriesData<PaginatedNotifications>(
        { queryKey: queryKeys.notifications.all },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((n) =>
              n._id === updatedNotification._id ? { ...n, read: true } : n,
            ),
          };
        },
      );

      // Decrement unread count
      queryClient.setQueryData<number>(
        queryKeys.notifications.unreadCount,
        (prev = 1) => Math.max(0, prev - 1),
      );
    },
  });
}

/**
 * Mutation to mark all notifications as read
 */
export function useMarkAllNotificationsReadMutation() {
  const http = useHttp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      http.patch<{ modifiedCount: number }>('/notifications/mark-all-read'),
    onSuccess: () => {
      // Mark all in cache as read
      queryClient.setQueriesData<PaginatedNotifications>(
        { queryKey: queryKeys.notifications.all },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((n) => ({ ...n, read: true })),
          };
        },
      );

      // Set unread count to 0
      queryClient.setQueryData<number>(queryKeys.notifications.unreadCount, 0);
    },
  });
}

/**
 * Register push notification device token
 */
export function useRegisterPushTokenMutation() {
  const http = useHttp();

  return useMutation({
    mutationFn: (dto: RegisterPushTokenDto) =>
      http.post<{ success: boolean }>('/notifications/push-token', dto),
  });
}

/**
 * Hook to manage real-time WebSocket connection and events
 */
export function useNotificationsSubscription(options?: {
  onNotificationReceived?: (notification: INotification) => void;
}): void {
  const { user, isAuthenticated, token } = useAuth();
  const http = useHttp();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const baseUrl =
      (http as unknown as { instance?: { defaults?: { baseURL?: string } } })
        ?.instance?.defaults?.baseURL || 'http://localhost:3500/api';
    const socketHost = baseUrl.replace(/\/api\/?$/, '');

    try {
      const socket = io(`${socketHost}/notifications`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 10,
      });

      socketRef.current = socket;

      socket.on('notification:new', (notification: INotification) => {
        // Localize title and body dynamically via i18n
        const title = i18n.t(notification.titleKey, {
          defaultValue: notification.titleKey,
          ...(notification.titleParams || {}),
        });

        const body = i18n.t(notification.bodyKey, {
          defaultValue: notification.bodyKey,
          ...(notification.bodyParams || {}),
        });

        // 1. Pop non-persistent in-app toast
        const toastType = (notification.level?.toLowerCase() ||
          'info') as ToastType;
        toast.show(toastType, body, {
          title,
          duration: 5000,
        });

        // 2. Invalidate queries to refresh inbox & badge count
        queryClient.invalidateQueries({
          queryKey: queryKeys.notifications.all,
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.notifications.unreadCount,
        });

        options?.onNotificationReceived?.(notification);
      });

      socket.on(
        'notification:unread_count',
        ({ unreadCount }: { unreadCount: number }) => {
          queryClient.setQueryData<number>(
            queryKeys.notifications.unreadCount,
            unreadCount,
          );
        },
      );

      socket.on('connect_error', () => {
        // Silently handle connection drops or token auth rejections in the background
      });

      return () => {
        socket.disconnect();
        socketRef.current = null;
      };
    } catch {
      // Ignore socket connection failures in environments without network
    }
  }, [isAuthenticated, token, user, http, queryClient, options]);
}

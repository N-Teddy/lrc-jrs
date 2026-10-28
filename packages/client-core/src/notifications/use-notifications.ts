import type {
  INotification,
  NotificationQueryDto,
  NotificationStatsDto,
  RegisterPushTokenDto,
} from '@jrs/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import { useAuth } from '../context/auth.context';
import { useHttp } from '../context/http.context';
import { queryKeys } from '../query/query-keys';
import { type SocketStatus, useWebSocket } from './socket.context';

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
        skipToast: true,
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
        { skipToast: true },
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

export interface UseNotificationsSubscriptionResult {
  isConnected: boolean;
  isConnecting: boolean;
  isDisconnected: boolean;
  status: SocketStatus;
  socket: Socket | null;
}

/**
 * Hook to manage real-time WebSocket connection and events
 */
export function useNotificationsSubscription(options?: {
  onNotificationReceived?: (notification: INotification) => void;
}): UseNotificationsSubscriptionResult {
  const {
    isConnected,
    isConnecting,
    isDisconnected,
    status,
    subscribeToNotifications,
    socket,
  } = useWebSocket();

  useEffect(() => {
    if (!options?.onNotificationReceived) return;
    return subscribeToNotifications(options.onNotificationReceived);
  }, [options?.onNotificationReceived, subscribeToNotifications]);

  return { isConnected, isConnecting, isDisconnected, status, socket };
}

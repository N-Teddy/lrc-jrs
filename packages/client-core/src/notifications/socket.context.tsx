import type { INotification } from '@jrs/shared';
import { useQueryClient } from '@tanstack/react-query';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from '../context/auth.context';
import { useHttp } from '../context/http.context';
import { i18n } from '../i18n/i18n';
import { queryKeys } from '../query/query-keys';
import { toast } from '../toast/toast.context';
import type { ToastType } from '../toast/toast.types';

export type SocketStatus = 'connected' | 'connecting' | 'disconnected';

export interface WebSocketContextValue {
  socket: Socket | null;
  status: SocketStatus;
  isConnected: boolean;
  isConnecting: boolean;
  isDisconnected: boolean;
  subscribeToNotifications: (
    handler: (notification: INotification) => void,
  ) => () => void;
}

const defaultContext: WebSocketContextValue = {
  socket: null,
  status: 'disconnected',
  isConnected: false,
  isConnecting: false,
  isDisconnected: true,
  subscribeToNotifications: () => () => {},
};

const WebSocketContext = createContext<WebSocketContextValue>(defaultContext);

export interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
}) => {
  const { user, isAuthenticated, token } = useAuth();
  const http = useHttp();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<SocketStatus>('disconnected');
  const socketRef = useRef<Socket | null>(null);
  const notificationListenersRef = useRef<
    Set<(notification: INotification) => void>
  >(new Set());

  const subscribeToNotifications = useCallback(
    (handler: (notification: INotification) => void) => {
      notificationListenersRef.current.add(handler);
      return () => {
        notificationListenersRef.current.delete(handler);
      };
    },
    [],
  );

  useEffect(() => {
    if (!isAuthenticated || !token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setStatus('disconnected');
      return;
    }

    const baseUrl =
      (typeof http?.getBaseUrl === 'function' ? http.getBaseUrl() : '') ||
      'http://localhost:3000/api';
    const socketHost = baseUrl.replace(/\/api\/?$/, '');

    setStatus('connecting');

    try {
      const socket = io(`${socketHost}/notifications`, {
        auth: async (cb: (data: { token: string | null }) => void) => {
          const storedToken =
            (await http.getStorage().getItem('jrs_access_token')) || token;
          cb({ token: storedToken });
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 10,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        setStatus('connected');
        // Refresh notifications & unread count upon successful connection/reconnection
        queryClient.invalidateQueries({
          queryKey: queryKeys.notifications.all,
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.notifications.unreadCount,
        });
      });

      socket.on('disconnect', () => {
        setStatus('disconnected');
      });

      socket.io.on('reconnect_attempt', () => {
        setStatus('connecting');
      });

      socket.io.on('reconnect', () => {
        setStatus('connected');
        queryClient.invalidateQueries({
          queryKey: queryKeys.notifications.all,
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.notifications.unreadCount,
        });
      });

      socket.io.on('reconnect_failed', () => {
        setStatus('disconnected');
      });

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
        if (
          notification.action?.includes('INTAKE') ||
          notification.action?.includes('MEMBER') ||
          notification.resource?.entityType === 'INTAKE' ||
          notification.resource?.entityType === 'MEMBER'
        ) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.registrationLinks.all,
          });
          queryClient.invalidateQueries({
            queryKey: queryKeys.users.all,
          });
        }

        // 3. Notify all registered subscribers
        notificationListenersRef.current.forEach((listener) => {
          try {
            listener(notification);
          } catch (e) {
            console.error('Error executing notification listener', e);
          }
        });
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

      socket.on('connect_error', async (err: Error) => {
        setStatus('disconnected');
        const msg = err?.message || '';
        if (
          msg.includes('jwt') ||
          msg.includes('expired') ||
          msg.includes('unauthorized') ||
          msg.includes('Authentication')
        ) {
          const newToken = await http.refreshToken();
          if (newToken && socketRef.current) {
            socketRef.current.auth = { token: newToken };
            socketRef.current.connect();
          }
        }
      });

      return () => {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('notification:new');
        socket.off('notification:unread_count');
        socket.off('connect_error');
        socket.io.off('reconnect_attempt');
        socket.io.off('reconnect');
        socket.io.off('reconnect_failed');

        if (socket.connected) {
          socket.disconnect();
        } else {
          // Defer disconnection if socket is still in handshake settle phase
          socket.once('connect', () => {
            socket.disconnect();
          });
          socket.once('connect_error', () => {
            socket.disconnect();
          });
        }
        socketRef.current = null;
      };
    } catch {
      setStatus('disconnected');
    }
  }, [isAuthenticated, user, token, http, queryClient]);

  const value = useMemo<WebSocketContextValue>(
    () => ({
      socket: socketRef.current,
      status,
      isConnected: status === 'connected',
      isConnecting: status === 'connecting',
      isDisconnected: status === 'disconnected',
      subscribeToNotifications,
    }),
    [status, subscribeToNotifications],
  );

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export function useWebSocket(): WebSocketContextValue {
  return useContext(WebSocketContext);
}

export function useSocketStatus(): {
  status: SocketStatus;
  isConnected: boolean;
  isConnecting: boolean;
  isDisconnected: boolean;
} {
  const { status, isConnected, isConnecting, isDisconnected } = useWebSocket();
  return { status, isConnected, isConnecting, isDisconnected };
}

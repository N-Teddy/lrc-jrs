import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { ToastContextValue, ToastItem, ToastType } from './toast.types';

export const ToastContext = createContext<ToastContextValue | null>(null);

let activeToastDispatcher: ((toast: Omit<ToastItem, 'id'>) => string) | null =
  null;
let activeToastRemover: ((id: string) => void) | null = null;

/**
 * Global toast dispatcher for imperative calls outside React components
 */
export const toast = {
  show: (
    type: ToastType,
    message: string,
    options?: Partial<Omit<ToastItem, 'id' | 'type' | 'message'>>,
  ) => {
    if (activeToastDispatcher) {
      return activeToastDispatcher({
        type,
        message,
        title: options?.title,
        duration: options?.duration ?? 4000,
        action: options?.action,
        params: options?.params,
      });
    }
    return '';
  },
  info: (
    message: string,
    options?: Partial<Omit<ToastItem, 'id' | 'type' | 'message'>>,
  ) => toast.show('info', message, options),
  success: (
    message: string,
    options?: Partial<Omit<ToastItem, 'id' | 'type' | 'message'>>,
  ) => toast.show('success', message, options),
  warning: (
    message: string,
    options?: Partial<Omit<ToastItem, 'id' | 'type' | 'message'>>,
  ) => toast.show('warning', message, options),
  error: (
    message: string,
    options?: Partial<Omit<ToastItem, 'id' | 'type' | 'message'>>,
  ) => toast.show('error', message, options),
  dismiss: (id: string) => {
    if (activeToastRemover) {
      activeToastRemover(id);
    }
  },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (item: Omit<ToastItem, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const duration = item.duration ?? 4000;

      const newToast: ToastItem = { ...item, id, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast],
  );

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Register global dispatchers
  activeToastDispatcher = addToast;
  activeToastRemover = removeToast;

  const value = useMemo(
    () => ({
      toasts,
      addToast,
      removeToast,
      clearToasts,
    }),
    [toasts, addToast, removeToast, clearToasts],
  );

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

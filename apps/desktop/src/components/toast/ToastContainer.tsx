import type { ToastItem, ToastType } from '@jrs/client-core';
import { useToast } from '@jrs/client-core';
import {
  CheckCircle,
  Info,
  Warning,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import type React from 'react';

const TOAST_STYLES: Record<
  ToastType,
  {
    bg: string;
    border: string;
    iconColor: string;
    Icon: React.ComponentType<{
      size?: number;
      weight?: 'fill' | 'bold' | 'regular';
      className?: string;
    }>;
  }
> = {
  info: {
    bg: 'bg-white',
    border: 'border-blue-200 shadow-blue-50/50',
    iconColor: 'text-blue-500',
    Icon: Info,
  },
  success: {
    bg: 'bg-white',
    border: 'border-emerald-200 shadow-emerald-50/50',
    iconColor: 'text-emerald-500',
    Icon: CheckCircle,
  },
  warning: {
    bg: 'bg-white',
    border: 'border-amber-200 shadow-amber-50/50',
    iconColor: 'text-amber-500',
    Icon: Warning,
  },
  error: {
    bg: 'bg-white',
    border: 'border-rose-200 shadow-rose-50/50',
    iconColor: 'text-rose-500',
    Icon: WarningCircle,
  },
};

export const ToastItemComponent: React.FC<{
  item: ToastItem;
  onDismiss: (id: string) => void;
}> = ({ item, onDismiss }) => {
  const style = TOAST_STYLES[item.type] || TOAST_STYLES.info;
  const Icon = style.Icon;

  return (
    <div
      role="alert"
      className={`relative flex items-start gap-3 p-4 rounded-xl border shadow-lg ${style.bg} ${style.border} transition-all duration-200 hover:shadow-xl max-w-sm w-full animate-in slide-in-from-bottom-2 fade-in duration-200`}
    >
      <div className={`mt-0.5 shrink-0 ${style.iconColor}`}>
        <Icon size={20} weight="fill" />
      </div>

      <div className="flex-1 min-w-0 pr-2">
        {item.title && (
          <h4 className="text-xs font-bold text-[#1e1b19] leading-snug mb-0.5 truncate">
            {item.title}
          </h4>
        )}
        <p className="text-xs text-[#57423b] leading-relaxed break-words">
          {item.message}
        </p>

        {item.action && (
          <button
            type="button"
            onClick={() => {
              item.action?.onClick();
              onDismiss(item.id);
            }}
            className="mt-2 text-[11px] font-bold text-[#b85028] hover:underline cursor-pointer"
          >
            {item.action.label}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        className="shrink-0 p-1 rounded-md text-[#8a726a] hover:text-[#1e1b19] hover:bg-[#faf2ee] transition cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X size={14} weight="bold" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-auto"
    >
      {toasts.map((item) => (
        <ToastItemComponent key={item.id} item={item} onDismiss={removeToast} />
      ))}
    </div>
  );
};

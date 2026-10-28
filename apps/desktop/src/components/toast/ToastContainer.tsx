import type { ToastItem, ToastType } from '@jrs/client-core';
import { useToast, useTranslation } from '@jrs/client-core';
import {
  CheckCircle,
  Info,
  Warning,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import type React from 'react';

const TOAST_CONFIG: Record<
  ToastType,
  {
    bg: string;
    border: string;
    glow: string;
    progressBar: string;
    badgeBg: string;
    badgeText: string;
    badgeKey: string;
    badgeDefault: string;
    iconColor: string;
    Icon: React.ComponentType<{
      size?: number;
      weight?: 'fill' | 'bold' | 'regular';
      className?: string;
    }>;
  }
> = {
  success: {
    bg: 'bg-white dark:bg-[#1e1b19]',
    border: 'border-[#c2e9ca] dark:border-[#2d4d35]',
    glow: 'shadow-[0_10px_25px_-5px_rgba(30,27,25,0.12),0_4px_10px_rgba(30,27,25,0.06)]',
    progressBar: 'bg-[#486b52]',
    badgeBg:
      'bg-[#edf3ee] dark:bg-[#1e3324] border-[#c2e9ca] dark:border-[#2d4d35]',
    badgeText: 'text-[#2c4e37] dark:text-[#a0d8ab]',
    badgeKey: 'common:toast.successTitle',
    badgeDefault: 'Awesome!',
    iconColor: 'text-[#486b52] dark:text-[#68a377]',
    Icon: CheckCircle,
  },
  error: {
    bg: 'bg-white dark:bg-[#1e1b19]',
    border: 'border-[#ffdad6] dark:border-[#5c1d18]',
    glow: 'shadow-[0_10px_25px_-5px_rgba(30,27,25,0.12),0_4px_10px_rgba(30,27,25,0.06)]',
    progressBar: 'bg-[#ba1a1a]',
    badgeBg:
      'bg-[#fff2ee] dark:bg-[#3d1612] border-[#ffdad6] dark:border-[#5c1d18]',
    badgeText: 'text-[#ba1a1a] dark:text-[#ffb4ab]',
    badgeKey: 'common:toast.errorTitle',
    badgeDefault: 'Error',
    iconColor: 'text-[#ba1a1a] dark:text-[#ff897d]',
    Icon: WarningCircle,
  },
  warning: {
    bg: 'bg-white dark:bg-[#1e1b19]',
    border: 'border-[#ffecbf] dark:border-[#523c0c]',
    glow: 'shadow-[0_10px_25px_-5px_rgba(30,27,25,0.12),0_4px_10px_rgba(30,27,25,0.06)]',
    progressBar: 'bg-[#d97706]',
    badgeBg:
      'bg-[#fff8ea] dark:bg-[#382806] border-[#ffecbf] dark:border-[#523c0c]',
    badgeText: 'text-[#9a6400] dark:text-[#ffd27a]',
    badgeKey: 'common:toast.warningTitle',
    badgeDefault: 'Warning',
    iconColor: 'text-[#d97706] dark:text-[#f59e0b]',
    Icon: Warning,
  },
  info: {
    bg: 'bg-white dark:bg-[#1e1b19]',
    border: 'border-[#ffd8cb] dark:border-[#542918]',
    glow: 'shadow-[0_10px_25px_-5px_rgba(30,27,25,0.12),0_4px_10px_rgba(30,27,25,0.06)]',
    progressBar: 'bg-[#b85028]',
    badgeBg:
      'bg-[#fff5f0] dark:bg-[#39190d] border-[#ffd8cb] dark:border-[#542918]',
    badgeText: 'text-[#b85028] dark:text-[#ffb59d]',
    badgeKey: 'common:toast.infoTitle',
    badgeDefault: 'Notice',
    iconColor: 'text-[#b85028] dark:text-[#ff8c69]',
    Icon: Info,
  },
};

export const ToastItemComponent: React.FC<{
  item: ToastItem;
  onDismiss: (id: string) => void;
}> = ({ item, onDismiss }) => {
  const { t, i18n } = useTranslation();
  const config = TOAST_CONFIG[item.type] || TOAST_CONFIG.info;
  const Icon = config.Icon;

  // Multi-language translation resolver: handles raw keys like 'activities:activityUpdatedSuccess'
  const resolveI18n = (text?: string): string => {
    if (!text) return '';
    // If text contains whitespace, it is already a formatted message or translated sentence, not a raw i18n key
    if (/\s/.test(text.trim())) {
      return text;
    }
    // Only resolve if it actually exists in i18n as a key to avoid triggering missingKeyHandler in dev
    if (i18n.exists(text)) {
      const translated = t(text, {
        defaultValue: text,
        ...(item.params || {}),
      });
      if (translated && translated !== text) {
        return translated;
      }
    }
    return text;
  };

  const resolvedTitle = item.title
    ? resolveI18n(item.title)
    : t(config.badgeKey, { defaultValue: config.badgeDefault });

  let resolvedMessage = resolveI18n(item.message);

  // Sanitize raw technical or network errors: never display raw stack/axios errors in toast
  const lowerMsg = (item.message || '').toLowerCase();
  if (
    lowerMsg.includes('network error') ||
    lowerMsg.includes('err_network') ||
    lowerMsg.includes('failed to fetch') ||
    lowerMsg.includes('network request failed') ||
    lowerMsg.includes('econnrefused') ||
    lowerMsg.includes('etimedout') ||
    lowerMsg.includes('timeout')
  ) {
    resolvedMessage = t('errors:ERR_NETWORK', {
      defaultValue:
        'Network connection error. Please verify your internet connection.',
    });
  } else if (
    lowerMsg.includes('axioserror') ||
    lowerMsg.includes('status code 500') ||
    lowerMsg.includes('internal server error')
  ) {
    resolvedMessage = t('errors:ERR_INTERNAL_SERVER', {
      defaultValue: 'A server error occurred. Please try again later.',
    });
  }

  const duration = item.duration ?? 4000;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 450, damping: 28 }}
      role="alert"
      className={`pointer-events-auto relative overflow-hidden flex flex-col rounded-lg border ${config.bg} ${config.border} ${config.glow} max-w-md w-full transition-shadow duration-200`}
    >
      <div className="flex items-start gap-3 p-3.5">
        {/* Type Icon with sleek container */}
        <div
          className={`shrink-0 p-1.5 rounded-md ${config.badgeBg} border ${config.iconColor}`}
        >
          <Icon size={18} weight="fill" />
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${config.badgeBg} ${config.badgeText}`}
            >
              {resolvedTitle}
            </span>
          </div>

          <p className="text-xs font-medium text-[#1e1b19] dark:text-[#f0e9e4] leading-relaxed break-words">
            {resolvedMessage}
          </p>

          {item.action && (
            <button
              type="button"
              onClick={() => {
                item.action?.onClick();
                onDismiss(item.id);
              }}
              className="mt-2 inline-flex items-center text-xs font-bold text-[#b85028] hover:text-[#963711] hover:underline cursor-pointer transition-colors"
            >
              {item.action.label}
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => onDismiss(item.id)}
          className="shrink-0 p-1 rounded-md text-[#8a726a] hover:text-[#1e1b19] hover:bg-[#faf2ee] dark:hover:bg-[#2b2522] transition-colors cursor-pointer"
          aria-label={t('common:toast.dismiss', 'Dismiss notification')}
        >
          <X size={15} weight="bold" />
        </button>
      </div>

      {/* Animated countdown progress bar */}
      {duration > 0 && (
        <div className="w-full h-0.5 bg-black/5 dark:bg-white/5 overflow-hidden">
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: duration / 1000, ease: 'linear' }}
            className={`h-full ${config.progressBar}`}
          />
        </div>
      )}
    </motion.div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div
      aria-live="polite"
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2.5 max-w-md w-full pointer-events-none px-4"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((item) => (
          <ToastItemComponent
            key={item.id}
            item={item}
            onDismiss={removeToast}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

import {
  type INotification,
  type NotificationResource,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
  useNotificationsSubscription,
  useTownContext,
  useTranslation,
  useUnreadNotificationCountQuery,
} from '@jrs/client-core';
import {
  Bell,
  Check,
  CheckCircle,
  CircleNotch,
  Info,
  Warning,
  WarningCircle,
} from '@phosphor-icons/react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';

// Safe native desktop notification trigger
async function triggerNativeDesktopNotification(title: string, body: string) {
  try {
    const tauriNotification = await import('@tauri-apps/plugin-notification');
    let permissionGranted = await tauriNotification.isPermissionGranted();
    if (!permissionGranted) {
      const permission = await tauriNotification.requestPermission();
      permissionGranted = permission === 'granted';
    }
    if (permissionGranted) {
      tauriNotification.sendNotification({ title, body });
    }
  } catch {
    // Web environment or plugin not configured, fallback gracefully
  }
}

interface NotificationBellProps {
  onNavigateToResource?: (resource: NotificationResource) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  onNavigateToResource,
}) => {
  const { t } = useTranslation();
  const { setActiveTownId, availableTowns } = useTownContext();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Queries & Mutations
  const { data: unreadCount = 0 } = useUnreadNotificationCountQuery();
  const { data: notificationsData, isLoading } = useNotificationsQuery({
    unreadOnly: activeTab === 'unread',
    limit: 25,
  });

  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();

  // Real-time WebSocket subscription & Native Notification integration
  useNotificationsSubscription({
    onNotificationReceived: (notification) => {
      if (document.hidden) {
        const title = t(notification.titleKey, {
          defaultValue: notification.titleKey,
          ...(notification.titleParams || {}),
        });
        const body = t(notification.bodyKey, {
          defaultValue: notification.bodyKey,
          ...(notification.bodyParams || {}),
        });
        triggerNativeDesktopNotification(title, body);
      }
    },
  });

  // Close dropdown on outside click or escape
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleNotificationClick = (notification: INotification) => {
    if (!notification.read) {
      markReadMutation.mutate(notification._id);
    }

    if (notification.resource && onNavigateToResource) {
      // Auto-switch town context if townId is specified and user has access
      if (notification.resource.townId) {
        const hasAccess = availableTowns.some(
          (town) => town.id === notification.resource?.townId,
        );
        if (hasAccess) {
          setActiveTownId(notification.resource.townId);
        }
      }

      onNavigateToResource(notification.resource);
      setIsOpen(false);
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t('notifications:justNow');
    if (diffMins < 60)
      return t('notifications:minutesAgo', { count: diffMins });
    if (diffHours < 24)
      return t('notifications:hoursAgo', { count: diffHours });
    return t('notifications:daysAgo', { count: diffDays });
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'SUCCESS':
        return (
          <CheckCircle size={16} weight="fill" className="text-emerald-500" />
        );
      case 'WARNING':
        return <Warning size={16} weight="fill" className="text-amber-500" />;
      case 'ERROR':
        return (
          <WarningCircle size={16} weight="fill" className="text-rose-500" />
        );
      default:
        return <Info size={16} weight="fill" className="text-blue-500" />;
    }
  };

  const notifications = notificationsData?.data || [];

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-10 w-10 flex items-center justify-center rounded-lg border border-[#e8e1dd] bg-white hover:bg-[#faf2ee] text-[#57423b] transition cursor-pointer"
        aria-label="View notifications"
      >
        <Bell size={18} weight="bold" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#b85028] text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-96 rounded-2xl bg-white border border-[#e8e1dd] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-[#f0eae6] flex items-center justify-between bg-[#fffbf9]">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#1e1b19]">
                {t('notifications:title')}
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#b85028]/10 text-[#b85028] text-xs font-bold">
                  {unreadCount}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="text-xs font-bold text-[#b85028] hover:text-[#983912] transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {markAllReadMutation.isPending ? (
                  <CircleNotch size={12} className="animate-spin" />
                ) : (
                  <Check size={12} weight="bold" />
                )}
                <span>{t('notifications:markAllRead')}</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-[#f0eae6] bg-[#faf2ee]/50 px-3 pt-2 gap-2 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`pb-2 px-3 border-b-2 transition cursor-pointer ${
                activeTab === 'all'
                  ? 'border-[#b85028] text-[#b85028]'
                  : 'border-transparent text-[#8a726a] hover:text-[#1e1b19]'
              }`}
            >
              {t('notifications:all')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              className={`pb-2 px-3 border-b-2 transition cursor-pointer ${
                activeTab === 'unread'
                  ? 'border-[#b85028] text-[#b85028]'
                  : 'border-transparent text-[#8a726a] hover:text-[#1e1b19]'
              }`}
            >
              {t('notifications:unread')}
              {unreadCount > 0 && ` (${unreadCount})`}
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-[#f5ede8]">
            {isLoading ? (
              <div className="p-8 flex items-center justify-center text-[#8a726a]">
                <CircleNotch
                  size={24}
                  className="animate-spin text-[#b85028]"
                />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8a726a]">
                <Bell
                  size={28}
                  className="mx-auto mb-2 opacity-30 text-[#b85028]"
                />
                <p>
                  {activeTab === 'unread'
                    ? t('notifications:emptyUnread')
                    : t('notifications:empty')}
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const title = t(item.titleKey, {
                  defaultValue: item.titleKey,
                  ...(item.titleParams || {}),
                });
                const body = t(item.bodyKey, {
                  defaultValue: item.bodyKey,
                  ...(item.bodyParams || {}),
                });

                return (
                  <div
                    key={item._id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3.5 transition flex items-start gap-3 cursor-pointer ${
                      item.read
                        ? 'bg-white hover:bg-[#fffbf9]'
                        : 'bg-[#fff5f0]/60 hover:bg-[#fff0e6]'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {getLevelIcon(item.level)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h4
                          className={`text-xs truncate ${
                            item.read
                              ? 'font-medium text-[#1e1b19]'
                              : 'font-bold text-[#1e1b19]'
                          }`}
                        >
                          {title}
                        </h4>
                        <span className="text-[10px] text-[#8a726a] shrink-0">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs text-[#57423b] line-clamp-2 leading-relaxed">
                        {body}
                      </p>

                      {item.resource && (
                        <span className="inline-block mt-1 text-[10px] font-bold text-[#b85028] bg-[#b85028]/10 px-1.5 py-0.5 rounded">
                          {item.resource.entityType}
                        </span>
                      )}
                    </div>

                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-[#b85028] shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

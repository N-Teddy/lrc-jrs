import {
  type INotification,
  type NotificationResource,
  toast,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
  useNotificationsSubscription,
  useTownContext,
  useTranslation,
  useUnreadNotificationCountQuery,
} from '@jrs/client-core';
import {
  ArrowRight,
  ArrowsLeftRight,
  Bell,
  BellSlash,
  Buildings,
  CalendarCheck,
  CaretRight,
  Check,
  CheckCircle,
  Checks,
  CircleNotch,
  Clock,
  FileText,
  ShieldCheck,
  Sparkle,
  UserPlus,
  Warning,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

// Safe native desktop notification trigger for Tauri
async function triggerNativeDesktopNotification(title: string, body: string) {
  try {
    const tauriNotification = await import('@tauri-apps/plugin-notification');
    tauriNotification.sendNotification({ title, body });
    return;
  } catch (err) {
    console.error('Failed to trigger native desktop notification:', err);
  }

  try {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') {
            new Notification(title, { body });
          }
        });
      }
    }
  } catch (err) {
    console.error('Fallback notification error:', err);
  }
}

interface NotificationBellProps {
  onNavigateToResource?: (resource: NotificationResource) => void;
  onOpenNotificationsPage?: () => void;
}

interface NotificationVisualConfig {
  icon: React.ReactNode;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  categoryLabel: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  onNavigateToResource,
  onOpenNotificationsPage,
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
  const handleIncomingNotification = useCallback(
    async (notification: INotification) => {
      const title = t(notification.titleKey, {
        defaultValue: notification.titleKey,
        ...(notification.titleParams || {}),
      });
      const body = t(notification.bodyKey, {
        defaultValue: notification.bodyKey,
        ...(notification.bodyParams || {}),
      });

      // Always dispatch native OS push notification
      await triggerNativeDesktopNotification(title, body);

      // In-app toast feedback
      toast.info(body, {
        title,
        duration: 5000,
      });
    },
    [t],
  );

  const { status: socketStatus } = useNotificationsSubscription({
    onNotificationReceived: handleIncomingNotification,
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
          (town) =>
            town.id === notification.resource?.townId ||
            town.code?.toLowerCase() ===
              notification.resource?.townId?.toLowerCase(),
        );
        if (hasAccess) {
          void setActiveTownId(notification.resource.townId);
        }
      }

      onNavigateToResource(notification.resource);
      setIsOpen(false);
    }
  };

  const handleQuickMarkRead = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    markReadMutation.mutate(id);
  };

  const handleSeeAll = () => {
    setIsOpen(false);
    onOpenNotificationsPage?.();
  };

  const formatRelativeTime = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t('notifications:justNow', 'Just now');
    if (diffMins < 60)
      return (
        t('notifications:minutesAgo', { count: diffMins }) || `${diffMins}m ago`
      );
    if (diffHours < 24)
      return (
        t('notifications:hoursAgo', { count: diffHours }) || `${diffHours}h ago`
      );
    if (diffDays < 7)
      return (
        t('notifications:daysAgo', { count: diffDays }) || `${diffDays}d ago`
      );

    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  const getVisualConfig = (
    notification: INotification,
  ): NotificationVisualConfig => {
    const entityType = notification.resource?.entityType?.toUpperCase();
    const action = notification.action?.toUpperCase();

    if (entityType === 'ACTIVITY' || action?.includes('ACTIVITY')) {
      return {
        icon: <CalendarCheck size={18} weight="fill" />,
        badgeBg: 'bg-[#fff5f0]',
        badgeText: 'text-[#b85028]',
        badgeBorder: 'border-[#ffd8cb]',
        categoryLabel: t('notifications:categories.activity', 'Activity'),
      };
    }

    if (entityType === 'ATTENDANCE' || action?.includes('ATTENDANCE')) {
      return {
        icon: <CheckCircle size={18} weight="fill" />,
        badgeBg: 'bg-[#edf3ee]',
        badgeText: 'text-[#2c4e37]',
        badgeBorder: 'border-[#c2e9ca]',
        categoryLabel: t('notifications:categories.attendance', 'Attendance'),
      };
    }

    if (
      entityType === 'MEMBER' ||
      entityType === 'INTAKE' ||
      action?.includes('MEMBER') ||
      action?.includes('INTAKE')
    ) {
      return {
        icon: <UserPlus size={18} weight="fill" />,
        badgeBg: 'bg-[#eff6ff]',
        badgeText: 'text-[#1d4ed8]',
        badgeBorder: 'border-[#bfdbfe]',
        categoryLabel: t('notifications:categories.member', 'Member'),
      };
    }

    if (entityType === 'TOWN_TRANSFER' || action?.includes('TRANSFER')) {
      return {
        icon: <ArrowsLeftRight size={18} weight="bold" />,
        badgeBg: 'bg-[#faf5ff]',
        badgeText: 'text-[#6b21a8]',
        badgeBorder: 'border-[#e9d5ff]',
        categoryLabel: t('notifications:categories.transfer', 'Transfer'),
      };
    }

    if (
      entityType === 'ACCESS' ||
      action?.includes('PASSWORD') ||
      action?.includes('SETUP') ||
      action?.includes('SCOPE')
    ) {
      return {
        icon: <ShieldCheck size={18} weight="fill" />,
        badgeBg: 'bg-[#fff8ea]',
        badgeText: 'text-[#9a6400]',
        badgeBorder: 'border-[#ffecbf]',
        categoryLabel: t('notifications:categories.security', 'Security'),
      };
    }

    if (
      entityType === 'REPORT' ||
      entityType === 'DRIVE_FILE' ||
      action?.includes('REPORT') ||
      action?.includes('DRIVE')
    ) {
      return {
        icon: <FileText size={18} weight="fill" />,
        badgeBg: 'bg-[#f0f9ff]',
        badgeText: 'text-[#0369a1]',
        badgeBorder: 'border-[#bae6fd]',
        categoryLabel: t('notifications:categories.report', 'Reports'),
      };
    }

    switch (notification.level) {
      case 'WARNING':
        return {
          icon: <Warning size={18} weight="fill" />,
          badgeBg: 'bg-[#fff8ea]',
          badgeText: 'text-[#9a6400]',
          badgeBorder: 'border-[#ffecbf]',
          categoryLabel: t('notifications:categories.notice', 'Notice'),
        };
      case 'ERROR':
        return {
          icon: <WarningCircle size={18} weight="fill" />,
          badgeBg: 'bg-[#fff2ee]',
          badgeText: 'text-[#ba1a1a]',
          badgeBorder: 'border-[#ffdad6]',
          categoryLabel: t('notifications:categories.alert', 'Alert'),
        };
      default:
        return {
          icon: <Sparkle size={18} weight="fill" />,
          badgeBg: 'bg-[#faf2ee]',
          badgeText: 'text-[#57423b]',
          badgeBorder: 'border-[#e8e1dd]',
          categoryLabel: t('notifications:categories.system', 'System'),
        };
    }
  };

  const notifications = notificationsData?.data || [];
  const totalCount = notificationsData?.total || notifications.length;

  return (
    <div ref={dropdownRef} className="relative">
      {/* 1. Header Notification Launcher Button: crisp rounded-lg style */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative h-10 w-10 flex items-center justify-center rounded-lg border transition-all cursor-pointer ${
          isOpen
            ? 'border-[#b85028] bg-[#fff5f0] text-[#b85028] ring-2 ring-[#b85028]/20 shadow-xs'
            : 'border-[#e8e1dd] bg-white hover:bg-[#faf2ee] hover:border-[#dbcac2] text-[#57423b] shadow-2xs'
        }`}
        aria-label="View notifications"
        aria-expanded={isOpen}
      >
        <Bell size={19} weight={isOpen || unreadCount > 0 ? 'fill' : 'bold'} />

        {/* Unread badge with subtle ping */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#b85028] text-[10px] font-black text-white shadow-sm ring-2 ring-white">
            <span className="absolute inset-0 rounded-full bg-[#b85028] animate-ping opacity-35" />
            <span className="relative z-10">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* 2. Redesigned Creative Notification Dropdown: crisp rounded-lg, sanctuary aesthetic */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-12 z-50 w-[420px] sm:w-[460px] rounded-lg bg-white/98 backdrop-blur-xl border border-[#e8e1dd] shadow-[0_20px_50px_-10px_rgba(30,27,25,0.18)] overflow-hidden flex flex-col"
          >
            {/* Header Toolbar */}
            <div className="p-3.5 border-b border-[#f2eae5] bg-gradient-to-b from-[#fffbf9] to-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#fff5f0] text-[#b85028] border border-[#ffd8cb] flex items-center justify-center shadow-2xs">
                  <Bell size={17} weight="fill" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#1e1b19] tracking-tight">
                      {t('notifications:title', 'Notifications')}
                    </h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-[#fff2ee] text-[#b85028] border border-[#ffd8cb] text-[10px] font-bold">
                        {unreadCount} {t('notifications:unread', 'unread')}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#8a726a] font-medium leading-none mt-0.5">
                    {t(
                      'notifications:centerSubtitle',
                      'Hub activities & team alerts',
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllReadMutation.mutate()}
                    disabled={markAllReadMutation.isPending}
                    className="h-7 px-2.5 rounded-md bg-[#faf2ee] hover:bg-[#f2e6e0] text-[#b85028] text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50 border border-[#ecdcd4] shadow-2xs"
                    title={t('notifications:markAllRead', 'Mark all as read')}
                  >
                    {markAllReadMutation.isPending ? (
                      <CircleNotch size={13} className="animate-spin" />
                    ) : (
                      <Checks size={14} weight="bold" />
                    )}
                    <span className="hidden sm:inline">
                      {t('notifications:markRead', 'Mark read')}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="h-7 w-7 rounded-md text-[#8a726a] hover:text-[#1e1b19] hover:bg-[#faf2ee] transition flex items-center justify-center cursor-pointer"
                  aria-label="Close notifications"
                >
                  <X size={15} weight="bold" />
                </button>
              </div>
            </div>

            {/* Segmented Filter Pills */}
            <div className="px-3 py-2 bg-[#faf7f4] border-b border-[#f2eae5] flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#eee6e0] border border-[#e4d8d0] w-full">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`flex-1 py-1 px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-white text-[#1e1b19] shadow-2xs'
                      : 'text-[#8a726a] hover:text-[#1e1b19]'
                  }`}
                >
                  <span>{t('notifications:all', 'All')}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                      activeTab === 'all'
                        ? 'bg-[#faf2ee] text-[#b85028]'
                        : 'bg-[#e2d5cd] text-[#6e5851]'
                    }`}
                  >
                    {totalCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('unread')}
                  className={`flex-1 py-1 px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'unread'
                      ? 'bg-white text-[#b85028] shadow-2xs'
                      : 'text-[#8a726a] hover:text-[#1e1b19]'
                  }`}
                >
                  <span>{t('notifications:unread', 'Unread')}</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-md bg-[#b85028] text-white text-[10px] font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Notification Scrollable Feed */}
            <div className="max-h-[390px] overflow-y-auto p-2 space-y-1.5 divide-y-0 scrollbar-thin scrollbar-thumb-[#e8e1dd]">
              {isLoading ? (
                /* Shimmer rows */
                <div className="space-y-2 p-2">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="p-3.5 rounded-lg bg-white border border-[#f0eae6] flex items-start gap-3 animate-pulse"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[#f2ede9] shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 bg-[#f2ede9] rounded w-2/3" />
                        <div className="h-3 bg-[#f7f2ef] rounded w-full" />
                        <div className="h-3 bg-[#f7f2ef] rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                /* Empty State */
                <div className="py-12 px-6 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-lg bg-[#fff5f0] border border-[#ffd8cb] flex items-center justify-center text-[#b85028] mb-2.5 shadow-2xs">
                    {activeTab === 'unread' ? (
                      <CheckCircle
                        size={24}
                        weight="fill"
                        className="text-[#486b52]"
                      />
                    ) : (
                      <BellSlash size={24} weight="duotone" />
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-[#1e1b19]">
                    {activeTab === 'unread'
                      ? t('notifications:allCaughtUp', 'All caught up!')
                      : t(
                          'notifications:noNotifications',
                          'No notifications yet',
                        )}
                  </h4>
                  <p className="text-xs text-[#8a726a] max-w-[280px] mt-1 leading-relaxed">
                    {activeTab === 'unread'
                      ? t(
                          'notifications:emptyUnreadSubtitle',
                          'All your notifications have been viewed.',
                        )
                      : t(
                          'notifications:emptySubtitle',
                          'Activity and community notices will appear here.',
                        )}
                  </p>
                </div>
              ) : (
                /* Rich Notification Item Cards */
                notifications.map((item) => {
                  const title = t(item.titleKey, {
                    defaultValue: item.titleKey,
                    ...(item.titleParams || {}),
                  });
                  const body = t(item.bodyKey, {
                    defaultValue: item.bodyKey,
                    ...(item.bodyParams || {}),
                  });
                  const visuals = getVisualConfig(item);
                  const itemTown = availableTowns.find(
                    (t) =>
                      t.id === item.townId ||
                      t.id === item.resource?.townId ||
                      t.code.toUpperCase() ===
                        (item.townId || item.resource?.townId)?.toUpperCase(),
                  );

                  return (
                    <div
                      key={item._id}
                      onClick={() => handleNotificationClick(item)}
                      className={`group relative p-3 rounded-lg border transition-all cursor-pointer overflow-hidden ${
                        item.read
                          ? 'bg-white hover:bg-[#fffcf9] border-[#f0eae6] hover:border-[#dbcac2] shadow-2xs'
                          : 'bg-[#fffcf9] hover:bg-white border-[#fbd4c6] shadow-xs hover:border-[#f9beaa]'
                      }`}
                    >
                      {/* Left accent bar for unread items */}
                      {!item.read && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#b85028] rounded-l-lg" />
                      )}

                      <div className="flex items-start gap-3">
                        {/* Categorized Visual Avatar */}
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${visuals.badgeBg} ${visuals.badgeText} ${visuals.badgeBorder} shadow-2xs mt-0.5`}
                        >
                          {visuals.icon}
                        </div>

                        {/* Text and Actions */}
                        <div className="flex-1 min-w-0">
                          {/* Badges & Timestamp */}
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border tracking-wider uppercase ${visuals.badgeBg} ${visuals.badgeText} ${visuals.badgeBorder}`}
                              >
                                {visuals.categoryLabel}
                              </span>

                              {itemTown && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#faf2ee] text-[#8a726a] text-[10px] font-semibold border border-[#ecdcd4]">
                                  <Buildings size={11} weight="bold" />
                                  <span>{itemTown.name}</span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[11px] font-medium text-[#8a726a] flex items-center gap-1">
                                <Clock size={12} weight="bold" />
                                {formatRelativeTime(item.createdAt)}
                              </span>

                              {!item.read && (
                                <span className="w-2 h-2 rounded-full bg-[#b85028] ring-3 ring-[#b85028]/20 animate-pulse" />
                              )}
                            </div>
                          </div>

                          {/* Title */}
                          <h4
                            className={`text-xs mb-0.5 leading-snug line-clamp-1 ${
                              item.read
                                ? 'font-semibold text-[#1e1b19]'
                                : 'font-bold text-[#1e1b19]'
                            }`}
                          >
                            {title}
                          </h4>

                          {/* Body */}
                          <p className="text-xs text-[#57423b] line-clamp-2 leading-relaxed">
                            {body}
                          </p>

                          {/* Footer Action Preview */}
                          <div className="mt-2 pt-1.5 border-t border-[#f7f0ec] flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-[#b85028] flex items-center gap-1 group-hover:underline">
                              <span>
                                {t('notifications:viewDetails', 'Details')}
                              </span>
                              <CaretRight
                                size={12}
                                weight="bold"
                                className="transition-transform group-hover:translate-x-0.5"
                              />
                            </span>

                            {!item.read && (
                              <button
                                type="button"
                                onClick={(e) =>
                                  handleQuickMarkRead(e, item._id)
                                }
                                className="text-[11px] font-bold text-[#8a726a] hover:text-[#1e1b19] px-2 py-0.5 rounded hover:bg-[#faf2ee] transition flex items-center gap-1 cursor-pointer"
                                title="Mark as read"
                              >
                                <Check size={12} weight="bold" />
                                <span>
                                  {t('notifications:markRead', 'Mark read')}
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Footer Bar: Live indicator + Creative "See all" redirect button */}
            <div className="p-3 bg-[#faf7f4] border-t border-[#f2eae5] flex items-center justify-between text-[11px] text-[#8a726a]">
              <div className="flex items-center gap-1.5 font-medium">
                {socketStatus === 'connected' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[#486b52] animate-pulse" />
                    <span className="text-[#2c4e37] font-semibold">
                      {t('notifications:realtimeConnected', 'Live')}
                    </span>
                  </>
                ) : socketStatus === 'connecting' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[#d97706] animate-pulse" />
                    <span className="text-[#8d6e19] font-medium">
                      {t('notifications:realtimeConnecting', 'Connecting...')}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[#8a726a]" />
                    <span className="text-[#8a726a] font-medium">
                      {t('notifications:realtimeDisconnected', 'Offline')}
                    </span>
                  </>
                )}
              </div>

              {/* Dedicated "See all" redirect button */}
              <button
                type="button"
                onClick={handleSeeAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#b85028] hover:bg-[#9e3f1c] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer group"
              >
                <span>{t('notifications:seeAll', 'See all')}</span>
                <ArrowRight
                  size={13}
                  weight="bold"
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

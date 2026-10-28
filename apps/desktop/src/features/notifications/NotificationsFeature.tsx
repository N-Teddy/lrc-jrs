import {
  type INotification,
  type NotificationResource,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
  useTownContext,
  useTranslation,
  useUnreadNotificationCountQuery,
} from '@jrs/client-core';
import {
  ArrowsClockwise,
  ArrowsLeftRight,
  Bell,
  BellSlash,
  Buildings,
  CalendarCheck,
  CaretRight,
  Check,
  CheckCircle,
  Checks,
  Clock,
  Funnel,
  MagnifyingGlass,
  ShieldCheck,
  Sparkle,
  UserPlus,
  Warning,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import type React from 'react';
import { useMemo, useState } from 'react';

interface NotificationsFeatureProps {
  onNavigateToResource?: (resource: NotificationResource) => void;
}

type CategoryFilter =
  | 'ALL'
  | 'ACTIVITY'
  | 'ATTENDANCE'
  | 'MEMBER'
  | 'TRANSFER'
  | 'SECURITY';

export const NotificationsFeature: React.FC<NotificationsFeatureProps> = ({
  onNavigateToResource,
}) => {
  const { t } = useTranslation();
  const { availableTowns, setActiveTownId } = useTownContext();

  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>('ALL');
  const [selectedTownFilter, setSelectedTownFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Queries & Mutations
  const { data: unreadCount = 0 } = useUnreadNotificationCountQuery();
  const {
    data: notificationsResponse,
    isLoading,
    refetch,
    isRefetching,
  } = useNotificationsQuery({
    unreadOnly: activeTab === 'unread',
    limit: 150,
  });

  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();

  const allNotifications = notificationsResponse?.data || [];
  const totalCount = notificationsResponse?.total || allNotifications.length;

  // Filter items by category, town, and search query
  const filteredNotifications = useMemo(() => {
    return allNotifications.filter((item) => {
      // 1. Category Filter
      if (selectedCategory !== 'ALL') {
        const entityType =
          item.resource?.entityType?.toUpperCase() ||
          item.action?.toUpperCase() ||
          '';
        switch (selectedCategory) {
          case 'ACTIVITY':
            if (
              !entityType.includes('ACTIVITY') ||
              entityType.includes('ATTENDANCE')
            )
              return false;
            break;
          case 'ATTENDANCE':
            if (!entityType.includes('ATTENDANCE')) return false;
            break;
          case 'MEMBER':
            if (
              !entityType.includes('MEMBER') &&
              !entityType.includes('INTAKE')
            )
              return false;
            break;
          case 'TRANSFER':
            if (!entityType.includes('TRANSFER')) return false;
            break;
          case 'SECURITY':
            if (
              !entityType.includes('ACCESS') &&
              !entityType.includes('PASSWORD') &&
              !entityType.includes('SETUP')
            )
              return false;
            break;
        }
      }

      // 2. Town Filter
      if (selectedTownFilter !== 'ALL') {
        const itemTown = item.townId || item.resource?.townId;
        if (!itemTown) return false;
        const matchesTown =
          itemTown === selectedTownFilter ||
          itemTown.toLowerCase() === selectedTownFilter.toLowerCase();
        if (!matchesTown) return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const title = t(item.titleKey, {
          defaultValue: item.titleKey,
          ...(item.titleParams || {}),
        }).toLowerCase();
        const body = t(item.bodyKey, {
          defaultValue: item.bodyKey,
          ...(item.bodyParams || {}),
        }).toLowerCase();
        if (!title.includes(q) && !body.includes(q)) return false;
      }

      return true;
    });
  }, [allNotifications, selectedCategory, selectedTownFilter, searchQuery, t]);

  // Grouping into chronological sections: Today, Yesterday, Earlier This Week, Older
  const groupedNotifications = useMemo(() => {
    const today: INotification[] = [];
    const yesterday: INotification[] = [];
    const thisWeek: INotification[] = [];
    const older: INotification[] = [];

    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
    const weekStart = todayStart - 6 * 24 * 60 * 60 * 1000;

    for (const item of filteredNotifications) {
      const time = new Date(item.createdAt).getTime();
      if (time >= todayStart) {
        today.push(item);
      } else if (time >= yesterdayStart) {
        yesterday.push(item);
      } else if (time >= weekStart) {
        thisWeek.push(item);
      } else {
        older.push(item);
      }
    }

    return [
      { label: t('notifications:today', 'Today'), items: today },
      { label: t('notifications:yesterday', 'Yesterday'), items: yesterday },
      {
        label: t('notifications:earlierThisWeek', 'Earlier this week'),
        items: thisWeek,
      },
      { label: t('notifications:older', 'Older'), items: older },
    ].filter((group) => group.items.length > 0);
  }, [filteredNotifications, t]);

  const handleNotificationClick = (item: INotification) => {
    if (!item.read) {
      markReadMutation.mutate(item._id);
    }

    if (item.resource && onNavigateToResource) {
      if (item.resource.townId) {
        const hasAccess = availableTowns.some(
          (town) =>
            town.id === item.resource?.townId ||
            town.code?.toLowerCase() === item.resource?.townId?.toLowerCase(),
        );
        if (hasAccess) {
          void setActiveTownId(item.resource.townId);
        }
      }
      onNavigateToResource(item.resource);
    }
  };

  const getVisualConfig = (notification: INotification) => {
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
      action?.includes('SETUP')
    ) {
      return {
        icon: <ShieldCheck size={18} weight="fill" />,
        badgeBg: 'bg-[#fff8ea]',
        badgeText: 'text-[#9a6400]',
        badgeBorder: 'border-[#ffecbf]',
        categoryLabel: t('notifications:categories.security', 'Security'),
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const categoryChips: { id: CategoryFilter; label: string }[] = [
    { id: 'ALL', label: t('notifications:all', 'All') },
    {
      id: 'ACTIVITY',
      label: t('notifications:categories.activity', 'Activities'),
    },
    {
      id: 'ATTENDANCE',
      label: t('notifications:categories.attendance', 'Attendance'),
    },
    { id: 'MEMBER', label: t('notifications:categories.member', 'Members') },
    {
      id: 'TRANSFER',
      label: t('notifications:categories.transfer', 'Transfers'),
    },
    {
      id: 'SECURITY',
      label: t('notifications:categories.security', 'Security'),
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* 1. Header Overview Banner */}
      <div className="relative rounded-lg bg-white border border-[#e8e1dd] p-6 shadow-xs overflow-hidden flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-lg bg-[#fff5f0] border border-[#ffd8cb] text-[#b85028] flex items-center justify-center shrink-0 shadow-2xs">
            <Bell size={24} weight="duotone" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-[#1e1b19] tracking-tight">
                {t('notifications:pageTitle', 'Notifications & Alerts')}
              </h2>
              {unreadCount > 0 ? (
                <span className="px-2.5 py-0.5 rounded-md bg-[#fff2ee] text-[#b85028] border border-[#ffd8cb] text-xs font-bold">
                  {unreadCount} {t('notifications:unread', 'unread')}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-md bg-[#edf3ee] text-[#2c4e37] border border-[#c2e9ca] text-xs font-bold flex items-center gap-1">
                  <Check size={12} weight="bold" />
                  <span>{t('notifications:allCaughtUp', 'All caught up')}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-[#8a726a] mt-0.5 font-medium">
              {t(
                'notifications:pageSubtitle',
                'Live archive and activity alerts across all fellowship towns',
              )}
            </p>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-9 px-3 rounded-lg border border-[#e8e1dd] bg-white hover:bg-[#faf2ee] text-[#57423b] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
            title="Refresh notifications"
          >
            <ArrowsClockwise
              size={15}
              weight="bold"
              className={isRefetching ? 'animate-spin' : ''}
            />
            <span className="hidden sm:inline">
              {t('common:refresh', 'Refresh')}
            </span>
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="h-9 px-3.5 rounded-lg bg-[#b85028] hover:bg-[#9e3f1c] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Checks size={16} weight="bold" />
              <span>{t('notifications:markAllRead', 'Mark all as read')}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Search, Status Tabs, and Filtering Toolbar */}
      <div className="rounded-lg bg-white border border-[#e8e1dd] p-4 shadow-xs space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <MagnifyingGlass
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a726a]"
              weight="bold"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t(
                'notifications:searchPlaceholder',
                'Search notifications by title or details...',
              )}
              className="w-full h-9 pl-9 pr-8 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] text-xs text-[#1e1b19] placeholder:text-[#8a726a] outline-none transition focus:bg-white focus:border-[#b85028]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#8a726a] hover:text-[#1e1b19] rounded cursor-pointer"
              >
                <X size={12} weight="bold" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Unread / All Segmented Switch */}
            <div className="flex items-center p-0.5 rounded-lg bg-[#faf2ee] border border-[#e8e1dd]">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`py-1.5 px-3 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'all'
                    ? 'bg-white text-[#1e1b19] shadow-2xs'
                    : 'text-[#8a726a] hover:text-[#1e1b19]'
                }`}
              >
                <span>{t('notifications:all', 'All')}</span>
                <span className="text-[10px] font-semibold opacity-70">
                  ({totalCount})
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('unread')}
                className={`py-1.5 px-3 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
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

            {/* Town Selector Filter (if multiple towns exist) */}
            {availableTowns.length > 1 && (
              <div className="relative">
                <select
                  value={selectedTownFilter}
                  onChange={(e) => setSelectedTownFilter(e.target.value)}
                  className="h-9 px-3 pr-8 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] text-xs font-semibold text-[#1e1b19] outline-none transition focus:bg-white focus:border-[#b85028] cursor-pointer"
                >
                  <option value="ALL">
                    {t('notifications:allHubs', 'All Hubs')}
                  </option>
                  {availableTowns.map((town) => (
                    <option key={town.id} value={town.id}>
                      {town.name} ({town.code})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-[#f4ece9]">
          <span className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider mr-1 flex items-center gap-1 shrink-0">
            <Funnel size={12} weight="bold" />
            <span>Category:</span>
          </span>
          {categoryChips.map((chip) => {
            const isSelected = selectedCategory === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setSelectedCategory(chip.id)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-[#b85028] text-white shadow-2xs'
                    : 'bg-[#faf2ee] hover:bg-[#f2e6e0] text-[#57423b] border border-[#e8e1dd]'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Notification Feed */}
      <div className="space-y-6">
        {isLoading ? (
          /* Shimmer Skeleton rows */
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="p-4 rounded-lg bg-white border border-[#e8e1dd] flex items-start gap-3.5 animate-pulse"
              >
                <div className="w-10 h-10 rounded-lg bg-[#f2ede9] shrink-0" />
                <div className="flex-1 space-y-2.5">
                  <div className="h-4 bg-[#f2ede9] rounded-md w-1/4" />
                  <div className="h-3.5 bg-[#f7f2ef] rounded-md w-3/4" />
                  <div className="h-3 bg-[#f7f2ef] rounded-md w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          /* Empty State */
          <div className="rounded-lg bg-white border border-[#e8e1dd] p-12 text-center flex flex-col items-center justify-center shadow-xs">
            <div className="w-16 h-16 rounded-lg bg-[#fff5f0] border border-[#ffd8cb] flex items-center justify-center text-[#b85028] mb-3.5 shadow-2xs">
              {activeTab === 'unread' ? (
                <CheckCircle
                  size={32}
                  weight="fill"
                  className="text-[#486b52]"
                />
              ) : (
                <BellSlash size={32} weight="duotone" />
              )}
            </div>
            <h3 className="text-base font-bold text-[#1e1b19]">
              {searchQuery ||
              selectedCategory !== 'ALL' ||
              selectedTownFilter !== 'ALL'
                ? t('notifications:noResultsTitle', 'No notifications found')
                : activeTab === 'unread'
                  ? t('notifications:allCaughtUp', "You're all caught up!")
                  : t('notifications:noNotifications', 'No notifications yet')}
            </h3>
            <p className="text-xs text-[#8a726a] max-w-sm mt-1 leading-relaxed">
              {searchQuery ||
              selectedCategory !== 'ALL' ||
              selectedTownFilter !== 'ALL'
                ? t(
                    'notifications:noResultsSubtitle',
                    'Try adjusting your search query or category filters.',
                  )
                : activeTab === 'unread'
                  ? t(
                      'notifications:emptyUnreadSubtitle',
                      'All your notifications have been viewed.',
                    )
                  : t(
                      'notifications:emptySubtitle',
                      'Activity and community notices will appear here.',
                    )}
            </p>
            {(searchQuery ||
              selectedCategory !== 'ALL' ||
              selectedTownFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                  setSelectedTownFilter('ALL');
                }}
                className="mt-4 px-4 py-2 rounded-lg bg-[#faf2ee] hover:bg-[#f2e6e0] text-[#b85028] text-xs font-bold transition cursor-pointer border border-[#e8e1dd]"
              >
                {t('notifications:clearFilters', 'Clear filters')}
              </button>
            )}
          </div>
        ) : (
          /* Chronologically Grouped Notification Cards */
          groupedNotifications.map((group) => (
            <div key={group.label} className="space-y-2.5">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs font-black text-[#57423b] uppercase tracking-wider">
                  {group.label}
                </span>
                <span className="text-[10px] font-bold text-[#8a726a] bg-[#faf2ee] px-2 py-0.5 rounded-md border border-[#e8e1dd]">
                  {group.items.length}
                </span>
                <div className="flex-1 h-px bg-[#f0eae6]" />
              </div>

              <div className="space-y-2">
                {group.items.map((item) => {
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
                      className={`group relative p-4 rounded-lg border transition-all cursor-pointer ${
                        item.read
                          ? 'bg-white hover:bg-[#fffcf9] border-[#e8e1dd] hover:border-[#dbcac2] shadow-2xs hover:shadow-xs'
                          : 'bg-[#fffcf9] hover:bg-white border-[#f8c4b2] shadow-xs hover:border-[#b85028]/60 hover:shadow-sm'
                      }`}
                    >
                      {/* Left vertical terracotta highlight indicator for unread notifications */}
                      {!item.read && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#b85028] rounded-l-lg" />
                      )}

                      <div className="flex items-start gap-3.5">
                        {/* Visual Category Badge */}
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${visuals.badgeBg} ${visuals.badgeText} ${visuals.badgeBorder} shadow-2xs mt-0.5`}
                        >
                          {visuals.icon}
                        </div>

                        {/* Main Notification Content */}
                        <div className="flex-1 min-w-0">
                          {/* Top Badges & Timestamp */}
                          <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${visuals.badgeBg} ${visuals.badgeText} ${visuals.badgeBorder}`}
                              >
                                {visuals.categoryLabel}
                              </span>

                              {itemTown && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#faf2ee] text-[#57423b] text-[10px] font-semibold border border-[#e8e1dd]">
                                  <Buildings size={12} weight="bold" />
                                  <span>{itemTown.name}</span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] font-medium text-[#8a726a] flex items-center gap-1">
                                <Clock size={12} weight="bold" />
                                {formatRelativeTime(item.createdAt)}
                              </span>

                              {!item.read && (
                                <span className="w-2 h-2 rounded-full bg-[#b85028] ring-3 ring-[#b85028]/20" />
                              )}
                            </div>
                          </div>

                          {/* Title */}
                          <h4
                            className={`text-sm leading-snug ${
                              item.read
                                ? 'font-semibold text-[#1e1b19]'
                                : 'font-bold text-[#1e1b19]'
                            }`}
                          >
                            {title}
                          </h4>

                          {/* Body */}
                          <p className="text-xs text-[#57423b] mt-1 leading-relaxed">
                            {body}
                          </p>

                          {/* Footer Action Strip */}
                          <div className="mt-3 pt-2.5 border-t border-[#f4ece9] flex items-center justify-between gap-3 flex-wrap">
                            {item.resource ? (
                              <span className="text-xs font-bold text-[#b85028] flex items-center gap-1 group-hover:underline">
                                <span>
                                  {t(
                                    'notifications:viewDetails',
                                    'View details',
                                  )}
                                </span>
                                <CaretRight
                                  size={13}
                                  weight="bold"
                                  className="transition-transform group-hover:translate-x-0.5"
                                />
                              </span>
                            ) : (
                              <span />
                            )}

                            {!item.read && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markReadMutation.mutate(item._id);
                                }}
                                className="h-7 px-2.5 rounded-md bg-[#faf2ee] hover:bg-[#f2e6e0] text-[#57423b] hover:text-[#1e1b19] border border-[#e8e1dd] text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
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
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

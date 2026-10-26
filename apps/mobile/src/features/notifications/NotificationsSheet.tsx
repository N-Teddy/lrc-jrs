import {
  type INotification,
  type NotificationLevel,
  type NotificationResource,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
  useTranslation,
  useUnreadNotificationCountQuery,
} from '@jrs/client-core';
import {
  Bell,
  Check,
  CheckCircle,
  Clock,
  Info,
  WarningCircle,
  X,
  XCircle,
} from 'phosphor-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';

interface NotificationsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToResource?: (resource: NotificationResource) => void;
}

function formatRelativeTime(dateStr: string, isFrench: boolean): string {
  try {
    const now = new Date();
    const date = new Date(dateStr);
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return isFrench ? "À l'instant" : 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}${isFrench ? ' min' : 'm'}`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}${isFrench ? ' h' : 'h'}`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 7) return `${diffDays}${isFrench ? ' j' : 'd'}`;
    return date.toLocaleDateString(isFrench ? 'fr-FR' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export const NotificationsSheet: React.FC<NotificationsSheetProps> = ({
  isOpen,
  onClose,
  onNavigateToResource,
}) => {
  const { t, i18n } = useTranslation();
  const isFrench = i18n.language?.startsWith('fr');
  const insets = useSafeAreaInsets();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data: unreadCount = 0 } = useUnreadNotificationCountQuery();
  const {
    data: notificationsData,
    isLoading,
    isRefetching,
    refetch,
  } = useNotificationsQuery({
    unreadOnly: filter === 'unread',
    limit: 40,
  });

  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();

  const items = notificationsData?.data || [];

  const handleNotificationPress = async (notification: INotification) => {
    if (!notification.read) {
      await markReadMutation.mutateAsync(notification._id);
    }

    if (notification.resource && onNavigateToResource) {
      onClose();
      onNavigateToResource(notification.resource);
    }
  };

  const getLevelConfig = (level?: NotificationLevel) => {
    switch (level) {
      case 'SUCCESS':
        return {
          icon: (
            <CheckCircle size={18} weight="fill" color={colors.secondary} />
          ),
          badgeBg: '#F0FDF4',
        };
      case 'ERROR':
        return {
          icon: <XCircle size={18} weight="fill" color={colors.error} />,
          badgeBg: '#FEF2F2',
        };
      case 'WARNING':
        return {
          icon: <WarningCircle size={18} weight="fill" color="#D97706" />,
          badgeBg: '#FFFBEB',
        };
      default:
        return {
          icon: <Info size={18} weight="fill" color={colors.primary} />,
          badgeBg: '#FFF8F5',
        };
    }
  };

  const renderItem = ({ item }: { item: INotification }) => {
    const levelConfig = getLevelConfig(item.level);

    const title = t(item.titleKey, {
      defaultValue: item.titleKey,
      ...(item.titleParams || {}),
    });

    const body = t(item.bodyKey, {
      defaultValue: item.bodyKey,
      ...(item.bodyParams || {}),
    });

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.read && styles.notificationItemUnread,
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.itemIconContainer,
            { backgroundColor: levelConfig.badgeBg },
          ]}
        >
          {levelConfig.icon}
        </View>

        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text
              style={[styles.itemTitle, !item.read && styles.itemTitleUnread]}
              numberOfLines={1}
            >
              {title}
            </Text>
            <Text style={styles.itemTime}>
              {formatRelativeTime(item.createdAt, isFrench)}
            </Text>
          </View>

          <Text style={styles.itemBody} numberOfLines={2}>
            {body}
          </Text>

          {item.resource && (
            <View style={styles.resourceTag}>
              <Text style={styles.resourceText}>
                {item.resource.entityType.toLowerCase()}
                {item.resource.subTab ? ` • ${item.resource.subTab}` : ''}
              </Text>
            </View>
          )}
        </View>

        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          {
            paddingTop:
              Platform.OS === 'android' ? Math.max(insets.top, 16) : 12,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>
              {t('notifications:centerTitle')}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>

          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.markAllReadBtn}
                onPress={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
              >
                <Check size={14} weight="bold" color={colors.primary} />
                <Text style={styles.markAllReadText}>
                  {t('notifications:markAllRead')}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} weight="bold" color={colors.onSurface} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Filter (All vs Unread) */}
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === 'all' && styles.filterTabActive,
            ]}
            onPress={() => setFilter('all')}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === 'all' && styles.filterTabTextActive,
              ]}
            >
              {t('notifications:tabAll')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === 'unread' && styles.filterTabActive,
            ]}
            onPress={() => setFilter('unread')}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === 'unread' && styles.filterTabTextActive,
              ]}
            >
              {t('notifications:tabUnread')}
              {unreadCount > 0 ? ` (${unreadCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* List Content */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.centerContainer}>
            <View style={styles.emptyIconCircle}>
              <Bell size={32} weight="duotone" color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>{t('notifications:empty')}</Text>
            <Text style={styles.emptySubtitle}>
              {t('notifications:emptyPrompt')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={() => refetch()}
                tintColor={colors.primary}
              />
            }
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markAllReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
  },
  markAllReadText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  closeBtn: {
    padding: 4,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    backgroundColor: '#FFFFFF',
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainerLow,
  },
  filterTabActive: {
    backgroundColor: colors.primaryFixed,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: colors.onPrimaryFixed,
    fontWeight: '800',
  },
  listContent: {
    paddingVertical: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EFEA',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  notificationItemUnread: {
    backgroundColor: '#FFFDF9',
  },
  itemIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  itemContent: {
    flex: 1,
    gap: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
    flex: 1,
  },
  itemTitleUnread: {
    fontWeight: '800',
    color: '#000000',
  },
  itemTime: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
  },
  itemBody: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  resourceTag: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  resourceText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onSurface,
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
    textAlign: 'center',
  },
});

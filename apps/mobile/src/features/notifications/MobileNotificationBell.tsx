import {
  useNotificationsSubscription,
  useUnreadNotificationCountQuery,
} from '@jrs/client-core';
import { Bell } from 'phosphor-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../theme/colors';

interface MobileNotificationBellProps {
  onPress: () => void;
}

export const MobileNotificationBell: React.FC<MobileNotificationBellProps> = ({
  onPress,
}) => {
  const { data: unreadCount = 0 } = useUnreadNotificationCountQuery();

  // Subscribe to real-time notification events via Socket.IO
  useNotificationsSubscription();

  const badgeText = unreadCount > 99 ? '99+' : unreadCount.toString();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityLabel={`Notifications (${unreadCount} unread)`}
    >
      <Bell
        size={22}
        weight={unreadCount > 0 ? 'fill' : 'bold'}
        color={unreadCount > 0 ? colors.primary : colors.onSurface}
      />

      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeText}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 11,
  },
});

import type { ToastItem, ToastType } from '@jrs/client-core';
import { useToast } from '@jrs/client-core';
import {
  CheckCircle,
  Info,
  WarningCircle,
  X,
  XCircle,
} from 'phosphor-react-native';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';

const ToastItemComponent: React.FC<{
  item: ToastItem;
  onDismiss: (id: string) => void;
}> = ({ item, onDismiss }) => {
  const translateY = useRef(new Animated.Value(-40)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    const duration = item.duration ?? 4000;
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -30,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => onDismiss(item.id));
    }, duration);

    return () => clearTimeout(timer);
  }, [item.id, item.duration, onDismiss, opacity, translateY]);

  const getConfig = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          icon: (
            <CheckCircle size={20} weight="fill" color={colors.secondary} />
          ),
          bgColor: '#F0FDF4',
          borderColor: '#BBF7D0',
          textColor: '#14532D',
          badgeColor: colors.secondary,
        };
      case 'error':
        return {
          icon: <XCircle size={20} weight="fill" color={colors.error} />,
          bgColor: '#FEF2F2',
          borderColor: '#FECACA',
          textColor: '#7F1D1D',
          badgeColor: colors.error,
        };
      case 'warning':
        return {
          icon: <WarningCircle size={20} weight="fill" color="#D97706" />,
          bgColor: '#FFFBEB',
          borderColor: '#FDE68A',
          textColor: '#78350F',
          badgeColor: '#D97706',
        };
      default:
        return {
          icon: <Info size={20} weight="fill" color={colors.primary} />,
          bgColor: '#FFF8F5',
          borderColor: '#EDDCD4',
          textColor: colors.onSurface,
          badgeColor: colors.primary,
        };
    }
  };

  const config = getConfig(item.type);

  return (
    <Animated.View
      style={[
        styles.toastWrapper,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View
        style={[
          styles.toastCard,
          {
            backgroundColor: config.bgColor,
            borderColor: config.borderColor,
          },
        ]}
      >
        <View style={styles.iconContainer}>{config.icon}</View>

        <View style={styles.textContainer}>
          {item.title ? (
            <Text style={[styles.title, { color: config.textColor }]}>
              {item.title}
            </Text>
          ) : null}
          <Text
            style={[
              styles.message,
              { color: config.textColor, opacity: item.title ? 0.9 : 1 },
            ]}
            numberOfLines={3}
          >
            {item.message}
          </Text>
        </View>

        {item.action && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              item.action?.onClick();
              onDismiss(item.id);
            }}
          >
            <Text style={styles.actionText}>{item.action.label}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => onDismiss(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={16} weight="bold" color="#6B7280" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export const MobileToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          top: Math.max(insets.top, 16) + 8,
        },
      ]}
      pointerEvents="box-none"
    >
      {toasts.map((toastItem) => (
        <ToastItemComponent
          key={toastItem.id}
          item={toastItem}
          onDismiss={removeToast}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 99999,
    alignItems: 'center',
    gap: 8,
  },
  toastWrapper: {
    width: '100%',
    maxWidth: 480,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
    gap: 10,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    flexDirection: 'column',
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  closeButton: {
    padding: 2,
    marginLeft: 4,
  },
});

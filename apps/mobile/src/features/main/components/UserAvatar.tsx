import type { IAuthUser, IUser } from '@jrs/shared';
import React, { useState } from 'react';
import {
  Image,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { resolveMediaUrl } from '../../../config/api.config';
import { colors } from '../../../theme/colors';

interface UserAvatarProps {
  user?: IAuthUser | IUser | null;
  avatarUrl?: string | null;
  name?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
  showOnlineDot?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  avatarUrl: explicitAvatarUrl,
  name: explicitName,
  size = 36,
  style,
  showOnlineDot = false,
}) => {
  const [hasError, setHasError] = useState(false);

  const displayName = explicitName || user?.fullName || 'Teddy Ngangman';

  const rawAvatarUrl = explicitAvatarUrl ?? user?.avatarUrl;

  // Resolve media URL or generate cartoon avatar fallback via DiceBear
  const resolvedUrl = React.useMemo(() => {
    if (rawAvatarUrl) {
      const resolved = resolveMediaUrl(rawAvatarUrl);
      if (resolved) return resolved;
    }
    const seed = encodeURIComponent(displayName.trim() || 'Member');
    return `https://api.dicebear.com/7.x/avataaars/png?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
  }, [rawAvatarUrl, displayName]);

  const initials =
    displayName
      .split(/\s+/)
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';

  const borderRadius = Math.round(size / 2);
  const dotSize = Math.max(10, Math.round(size * 0.28));

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {hasError ? (
        <View
          style={[
            styles.fallbackContainer,
            {
              width: size,
              height: size,
              borderRadius,
            },
          ]}
        >
          <Text
            style={[
              styles.fallbackInitials,
              { fontSize: Math.max(10, Math.round(size * 0.38)) },
            ]}
          >
            {initials}
          </Text>
        </View>
      ) : (
        <Image
          source={{ uri: resolvedUrl }}
          style={[
            styles.avatarImage,
            {
              width: size,
              height: size,
              borderRadius,
            },
          ]}
          resizeMode="cover"
          onError={() => setHasError(true)}
        />
      )}

      {showOnlineDot && (
        <View
          style={[
            styles.onlineDot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  fallbackContainer: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  fallbackInitials: {
    color: colors.onPrimary,
    fontWeight: '800',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: colors.surface,
  },
});

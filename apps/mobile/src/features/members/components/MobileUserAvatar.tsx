import React, { useState } from 'react';
import {
  Image,
  ImageStyle,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { colors } from '../../../theme/colors';
import { resolveAvatarUrl } from '../utils/avatar-resolver.util';

export type MobileAvatarSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface MobileUserAvatarProps {
  avatarUrl?: string | null;
  name?: string | null;
  size?: MobileAvatarSize;
  style?: StyleProp<ViewStyle>;
}

const SIZE_CONFIG: Record<
  MobileAvatarSize,
  { size: number; radius: number; fontSize: number }
> = {
  sm: { size: 36, radius: 10, fontSize: 12 },
  md: { size: 48, radius: 14, fontSize: 15 },
  lg: { size: 58, radius: 16, fontSize: 18 },
  xl: { size: 76, radius: 20, fontSize: 24 },
  '2xl': { size: 96, radius: 26, fontSize: 30 },
};

export const MobileUserAvatar: React.FC<MobileUserAvatarProps> = ({
  avatarUrl,
  name,
  size = 'md',
  style,
}) => {
  const [hasError, setHasError] = useState(false);

  const initials = name
    ? name
        .trim()
        .split(/\s+/)
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  const resolvedUrl = resolveAvatarUrl(avatarUrl);
  const showImage = Boolean(resolvedUrl) && !hasError;
  const config = SIZE_CONFIG[size] || SIZE_CONFIG.md;

  const containerStyle: ViewStyle = {
    width: config.size,
    height: config.size,
    borderRadius: config.radius,
  };

  const imageStyle: ImageStyle = {
    width: config.size,
    height: config.size,
    borderRadius: config.radius,
  };

  return (
    <View style={[styles.base, containerStyle, style]}>
      {showImage ? (
        <Image
          source={{ uri: resolvedUrl }}
          style={[styles.image, imageStyle]}
          onError={() => setHasError(true)}
          resizeMode="cover"
        />
      ) : (
        <Text style={[styles.initials, { fontSize: config.fontSize }]}>
          {initials}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryBorder,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initials: {
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
});

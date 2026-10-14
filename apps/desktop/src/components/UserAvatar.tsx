import React, { useState } from 'react';

export type UserAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface UserAvatarProps {
  avatarUrl?: string | null;
  name?: string | null;
  size?: UserAvatarSize;
  className?: string;
  alt?: string;
  fallbackText?: string;
}

const SIZE_CLASSES: Record<
  UserAvatarSize,
  { container: string; text: string }
> = {
  xs: { container: 'w-7 h-7 rounded-lg', text: 'text-[10px]' },
  sm: { container: 'w-8 h-8 rounded-lg', text: 'text-xs' },
  md: { container: 'w-9 h-9 rounded-xl', text: 'text-xs' },
  lg: { container: 'w-12 h-12 rounded-2xl', text: 'text-sm' },
  xl: { container: 'w-16 h-16 rounded-2xl', text: 'text-lg' },
  '2xl': { container: 'w-20 h-20 rounded-2xl', text: 'text-2xl' },
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatarUrl,
  name,
  size = 'md',
  className = '',
  alt,
  fallbackText,
}) => {
  const [imgError, setImgError] = useState(false);

  // Compute 2-letter initials
  const initials =
    fallbackText ||
    (name
      ? name
          .trim()
          .split(/\s+/)
          .map((part) => part[0])
          .filter(Boolean)
          .slice(0, 2)
          .join('')
          .toUpperCase()
      : '?');

  const sizeConfig = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const showImage = Boolean(avatarUrl) && !imgError;

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center overflow-hidden border border-[#e8e1dd] bg-[#faf2ee] text-[#b85028] font-bold select-none ${sizeConfig.container} ${className}`}
    >
      {showImage ? (
        <img
          src={avatarUrl!}
          alt={alt || name || 'User avatar'}
          className="w-full h-full object-cover transition-opacity duration-200"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : (
        <span className={`font-black tracking-tight ${sizeConfig.text}`}>
          {initials}
        </span>
      )}
    </div>
  );
};

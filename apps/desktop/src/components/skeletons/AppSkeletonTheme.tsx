import type React from 'react';
import { SkeletonTheme } from 'react-loading-skeleton';

interface AppSkeletonThemeProps {
  children: React.ReactNode;
}

export const AppSkeletonTheme: React.FC<AppSkeletonThemeProps> = ({
  children,
}) => {
  return (
    <SkeletonTheme
      baseColor="#f4ece9"
      highlightColor="#fdfbf9"
      borderRadius="0.5rem"
      duration={1.5}
    >
      {children}
    </SkeletonTheme>
  );
};

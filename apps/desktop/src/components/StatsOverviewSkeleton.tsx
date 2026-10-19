import type React from 'react';
import Skeleton from 'react-loading-skeleton';
import { AppSkeletonTheme } from './skeletons/AppSkeletonTheme';

export interface StatsOverviewSkeletonProps {
  count?: number;
  className?: string;
}

export const StatsOverviewSkeleton: React.FC<StatsOverviewSkeletonProps> = ({
  count = 4,
  className = 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4',
}) => {
  return (
    <AppSkeletonTheme>
      <div className={className}>
        {Array.from({ length: count }, (_, i) => i + 1).map((i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-xl border border-[#e8e1dd] shadow-xs flex flex-col justify-between gap-3 min-h-[128px]"
          >
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-2">
                <Skeleton width={110} height={13} />
                <Skeleton width={64} height={32} borderRadius={6} />
              </div>
              <Skeleton width={38} height={38} borderRadius={10} />
            </div>
            <div className="pt-2 border-t border-[#f4ece9]">
              <Skeleton width={140} height={12} />
            </div>
          </div>
        ))}
      </div>
    </AppSkeletonTheme>
  );
};

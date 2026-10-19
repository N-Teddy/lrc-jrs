import type React from 'react';
import Skeleton from 'react-loading-skeleton';
import { AppSkeletonTheme } from './AppSkeletonTheme';

export interface CardGridSkeletonProps {
  cardCount?: number;
  showPagination?: boolean;
}

export const CardGridSkeleton: React.FC<CardGridSkeletonProps> = ({
  cardCount = 8,
  showPagination = true,
}) => {
  return (
    <AppSkeletonTheme>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: cardCount }, (_, i) => (
            <div
              key={i}
              className="rounded-xl bg-white border border-[#e8e1dd] p-5 flex flex-col justify-between shadow-2xs min-h-[220px]"
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <Skeleton circle width={44} height={44} />
                    <div className="flex flex-col gap-1">
                      <Skeleton width={110} height={15} />
                      <Skeleton width={70} height={12} />
                    </div>
                  </div>
                  <Skeleton width={26} height={26} borderRadius={6} />
                </div>

                {/* Metadata Lines */}
                <div className="space-y-2 mt-4 pt-3 border-t border-[#f4ece9]">
                  <div className="flex items-center gap-2">
                    <Skeleton circle width={16} height={16} />
                    <Skeleton width={120} height={12} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton circle width={16} height={16} />
                    <Skeleton width={90} height={12} />
                  </div>
                </div>
              </div>

              {/* Card Footer Button */}
              <div className="mt-4 pt-3 border-t border-[#f4ece9]">
                <Skeleton width="100%" height={34} borderRadius={8} />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Pagination Control Skeleton */}
        {showPagination && (
          <div className="bg-white rounded-xl border border-[#e8e1dd] px-4 py-3 flex items-center justify-between">
            <Skeleton width={160} height={14} />
            <div className="flex items-center gap-1.5">
              <Skeleton width={32} height={32} borderRadius={6} />
              <Skeleton width={32} height={32} borderRadius={6} />
              <Skeleton width={32} height={32} borderRadius={6} />
              <Skeleton width={32} height={32} borderRadius={6} />
            </div>
          </div>
        )}
      </div>
    </AppSkeletonTheme>
  );
};

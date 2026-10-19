import type React from 'react';
import Skeleton from 'react-loading-skeleton';
import { AppSkeletonTheme } from './AppSkeletonTheme';

export const DriveExplorerSkeleton: React.FC = () => {
  return (
    <AppSkeletonTheme>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Column: Folders Navigation Card */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-[#e8e1dd] p-4 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between pb-3 border-b border-[#f4ece9]">
            <Skeleton width={80} height={18} />
            <Skeleton width={30} height={20} borderRadius={6} />
          </div>

          <div className="space-y-2">
            <Skeleton width="100%" height={36} borderRadius={8} />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-1.5">
                <div className="flex items-center gap-2">
                  <Skeleton width={18} height={18} borderRadius={4} />
                  <Skeleton width={100} height={14} />
                </div>
                <Skeleton width={24} height={16} borderRadius={4} />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Files Grid */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Header Bar */}
          <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-[#e8e1dd] shadow-2xs">
            <Skeleton width={140} height={16} />
            <Skeleton width={90} height={14} />
          </div>

          {/* Files Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="p-5 rounded-xl bg-white border border-[#e8e1dd] shadow-2xs flex flex-col justify-between gap-4 min-h-[170px]"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <Skeleton width={44} height={44} borderRadius={10} />
                    <Skeleton width={70} height={20} borderRadius={6} />
                  </div>
                  <div>
                    <Skeleton width="85%" height={16} />
                    <Skeleton width="60%" height={12} className="mt-1" />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#f4ece9]">
                  <Skeleton width={50} height={12} />
                  <Skeleton width={75} height={28} borderRadius={6} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppSkeletonTheme>
  );
};

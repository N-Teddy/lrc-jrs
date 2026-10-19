import type React from 'react';
import Skeleton from 'react-loading-skeleton';
import { AppSkeletonTheme } from './AppSkeletonTheme';

export const ActivityDetailSkeleton: React.FC = () => {
  return (
    <AppSkeletonTheme>
      <div className="flex flex-col gap-6 p-1">
        {/* Back navigation */}
        <div className="flex items-center gap-3">
          <Skeleton width={80} height={32} borderRadius={8} />
          <Skeleton width={180} height={16} />
        </div>

        {/* Hero Card */}
        <div className="bg-white rounded-2xl border border-[#e8e1dd] p-6 shadow-xs flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#f4ece9]">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Skeleton width={240} height={26} />
                <Skeleton width={85} height={22} borderRadius={6} />
              </div>
              <div className="flex items-center gap-4 text-xs">
                <Skeleton width={130} height={14} />
                <Skeleton width={110} height={14} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Skeleton width={110} height={36} borderRadius={8} />
              <Skeleton width={120} height={36} borderRadius={8} />
            </div>
          </div>

          {/* 4 Attendance KPI metric boxes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-[#faf2ee]/50 border border-[#e8e1dd] flex flex-col gap-1.5"
              >
                <Skeleton width={90} height={12} />
                <Skeleton width={60} height={24} />
              </div>
            ))}
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-[#e8e1dd] pb-2">
          <Skeleton width={110} height={32} borderRadius={6} />
          <Skeleton width={140} height={32} borderRadius={6} />
          <Skeleton width={100} height={32} borderRadius={6} />
        </div>

        {/* Attendees Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-[#e8e1dd] p-4 flex items-center justify-between shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <Skeleton circle width={40} height={40} />
                <div className="flex flex-col gap-1">
                  <Skeleton width={100} height={14} />
                  <Skeleton width={70} height={11} />
                </div>
              </div>
              <Skeleton width={50} height={20} borderRadius={6} />
            </div>
          ))}
        </div>
      </div>
    </AppSkeletonTheme>
  );
};

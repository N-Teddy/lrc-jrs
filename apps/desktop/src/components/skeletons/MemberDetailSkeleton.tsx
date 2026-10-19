import type React from 'react';
import Skeleton from 'react-loading-skeleton';
import { AppSkeletonTheme } from './AppSkeletonTheme';

export const MemberDetailSkeleton: React.FC = () => {
  return (
    <AppSkeletonTheme>
      <div className="flex flex-col gap-6 p-1">
        {/* Top Back Navigation Skeleton */}
        <div className="flex items-center gap-3">
          <Skeleton width={80} height={32} borderRadius={8} />
          <Skeleton width={180} height={16} />
        </div>

        {/* Member Profile Hero Banner Card */}
        <div className="bg-white rounded-2xl border border-[#e8e1dd] p-6 shadow-xs flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#f4ece9]">
            {/* Identity */}
            <div className="flex items-center gap-5">
              <Skeleton circle width={80} height={80} />
              <div className="flex flex-col gap-2">
                <Skeleton width={220} height={26} />
                <div className="flex items-center gap-2">
                  <Skeleton width={75} height={22} borderRadius={6} />
                  <Skeleton width={90} height={22} borderRadius={6} />
                  <Skeleton width={60} height={22} borderRadius={6} />
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              <Skeleton width={110} height={36} borderRadius={8} />
              <Skeleton width={130} height={36} borderRadius={8} />
              <Skeleton width={36} height={36} borderRadius={8} />
            </div>
          </div>

          {/* Quick Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-[#faf2ee]/50 border border-[#e8e1dd] flex flex-col gap-1.5"
              >
                <Skeleton width={90} height={12} />
                <Skeleton width={50} height={22} />
              </div>
            ))}
          </div>
        </div>

        {/* Tabs Bar Skeleton */}
        <div className="flex items-center gap-2 border-b border-[#e8e1dd] pb-2">
          <Skeleton width={100} height={32} borderRadius={6} />
          <Skeleton width={130} height={32} borderRadius={6} />
          <Skeleton width={120} height={32} borderRadius={6} />
          <Skeleton width={110} height={32} borderRadius={6} />
        </div>

        {/* Details Panels (2 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Info Card */}
          <div className="bg-white rounded-xl border border-[#e8e1dd] p-6 shadow-xs flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#f4ece9]">
              <Skeleton width={140} height={18} />
              <Skeleton width={20} height={20} borderRadius={4} />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center py-1">
                  <Skeleton width={110} height={13} />
                  <Skeleton width={140} height={14} />
                </div>
              ))}
            </div>
          </div>

          {/* Fellowship & System Card */}
          <div className="bg-white rounded-xl border border-[#e8e1dd] p-6 shadow-xs flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#f4ece9]">
              <Skeleton width={150} height={18} />
              <Skeleton width={20} height={20} borderRadius={4} />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center py-1">
                  <Skeleton width={110} height={13} />
                  <Skeleton width={130} height={14} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppSkeletonTheme>
  );
};

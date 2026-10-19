import type React from 'react';
import Skeleton from 'react-loading-skeleton';
import { AppSkeletonTheme } from './AppSkeletonTheme';

export const ActivityCalendarSkeleton: React.FC = () => {
  return (
    <AppSkeletonTheme>
      <div className="bg-white rounded-xl border border-[#e8e1dd] shadow-xs overflow-hidden flex flex-col">
        {/* Calendar Navigation Header */}
        <div className="p-4 border-b border-[#e8e1dd] flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#faf2ee]/30">
          <div className="flex items-center gap-3">
            <Skeleton width={160} height={24} />
            <div className="flex items-center gap-1">
              <Skeleton width={32} height={32} borderRadius={6} />
              <Skeleton width={32} height={32} borderRadius={6} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Skeleton width={90} height={32} borderRadius={6} />
            <Skeleton width={75} height={32} borderRadius={6} />
            <Skeleton width={60} height={32} borderRadius={6} />
          </div>
        </div>

        {/* Weekday Header Grid (7 Columns) */}
        <div className="grid grid-cols-7 border-b border-[#e8e1dd] bg-[#faf2ee] text-center py-2.5">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <span
              key={day}
              className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider"
            >
              {day}
            </span>
          ))}
        </div>

        {/* 35 Calendar Day Cells (5 Rows x 7 Columns) */}
        <div className="grid grid-cols-7 divide-x divide-y divide-[#f4ece9] min-h-[500px]">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="p-2 min-h-[96px] flex flex-col justify-between bg-white hover:bg-[#faf7f2]/30 transition-colors"
            >
              <div className="flex justify-end">
                <Skeleton width={20} height={14} />
              </div>
              {/* Randomly distribute a few event pills */}
              {i % 4 === 1 && (
                <div className="mt-1 space-y-1">
                  <Skeleton width="90%" height={18} borderRadius={4} />
                </div>
              )}
              {i % 5 === 2 && (
                <div className="mt-1 space-y-1">
                  <Skeleton width="85%" height={18} borderRadius={4} />
                  <Skeleton width="75%" height={18} borderRadius={4} />
                </div>
              )}
              <div />
            </div>
          ))}
        </div>
      </div>
    </AppSkeletonTheme>
  );
};

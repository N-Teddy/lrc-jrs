import type React from 'react';

export interface StatsOverviewSkeletonProps {
  count?: number;
  className?: string;
}

export const StatsOverviewSkeleton: React.FC<StatsOverviewSkeletonProps> = ({
  count = 4,
  className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse',
}) => {
  return (
    <div className={className}>
      {Array.from({ length: count }, (_, i) => i + 1).map((i) => (
        <div
          key={i}
          className="h-32 rounded-2xl bg-white border border-[#e8e1dd] p-5 flex flex-col justify-between"
        >
          <div className="h-4 w-28 bg-[#f4ece9] rounded" />
          <div className="h-8 w-16 bg-[#f4ece9] rounded" />
          <div className="h-3 w-36 bg-[#f4ece9] rounded" />
        </div>
      ))}
    </div>
  );
};

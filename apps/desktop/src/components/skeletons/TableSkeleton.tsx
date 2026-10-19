import type React from 'react';
import Skeleton from 'react-loading-skeleton';
import { AppSkeletonTheme } from './AppSkeletonTheme';

export interface TableSkeletonProps {
  columns?: string[];
  rowCount?: number;
  showPagination?: boolean;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  columns = ['Member', 'Role', 'Contact Channel', 'Actions'],
  rowCount = 8,
  showPagination = true,
}) => {
  return (
    <AppSkeletonTheme>
      <div className="bg-white rounded-xl border border-[#e8e1dd] shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#faf2ee] border-b border-[#e8e1dd] text-[#8a726a] text-[11px] font-bold uppercase tracking-wider">
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className={`py-3.5 px-4 font-bold ${
                      idx === columns.length - 1 ? 'text-right' : ''
                    }`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4ece9] text-xs">
              {Array.from({ length: rowCount }, (_, i) => (
                <tr key={i} className="hover:bg-[#faf7f2]/50 transition-colors">
                  {/* Column 1: Identity with Avatar */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <Skeleton circle width={38} height={38} />
                      <div className="flex flex-col gap-1.5">
                        <Skeleton width={140} height={14} />
                        <Skeleton width={90} height={11} />
                      </div>
                    </div>
                  </td>

                  {/* Column 2: Badge / Pill */}
                  <td className="py-3 px-4">
                    <Skeleton width={80} height={24} borderRadius={6} />
                  </td>

                  {/* Column 3: Secondary Info / Subtext */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Skeleton circle width={22} height={22} />
                      <Skeleton width={110} height={13} />
                    </div>
                  </td>

                  {/* Optional Column 4 if more columns exist */}
                  {columns.length > 4 && (
                    <td className="py-3 px-4">
                      <Skeleton width={70} height={20} borderRadius={6} />
                    </td>
                  )}

                  {/* Actions Column (right aligned) */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Skeleton width={30} height={30} borderRadius={6} />
                      <Skeleton width={30} height={30} borderRadius={6} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination Control Skeleton */}
        {showPagination && (
          <div className="bg-white border-t border-[#e8e1dd] px-4 py-3 flex items-center justify-between">
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

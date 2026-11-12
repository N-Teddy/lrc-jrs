import { ActivityType, type IActivityTypeDistribution } from '@jrs/shared';
import { SquaresFour } from '@phosphor-icons/react';
import type React from 'react';
import { getActivityTypeConfig } from '../../activities/utils/activity-ui.utils';

export const ACTIVITY_TYPE_COLORS: Record<ActivityType, string> = {
  [ActivityType.MONTHLY_MEETING]: '#b85028',
  [ActivityType.RECREATIONAL]: '#0284c7',
  [ActivityType.SERVICE]: '#486b52',
  [ActivityType.CAUSERIE]: '#e65100',
  [ActivityType.CONFERENCE]: '#7c3aed',
  [ActivityType.JPO]: '#db2777',
  [ActivityType.AG]: '#57423b',
};

interface ActivityTypeBreakdownCardProps {
  distribution: IActivityTypeDistribution[];
}

export const ActivityTypeBreakdownCard: React.FC<
  ActivityTypeBreakdownCardProps
> = ({ distribution }) => {
  const totalCount = distribution.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="bg-white rounded-2xl border border-[#e8e1dd] shadow-xs p-5 flex flex-col justify-between transition-all hover:border-[#cfc4be]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#f4ece9]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#faf2ee] text-[#b85028] flex items-center justify-center border border-[#e8e1dd]">
            <SquaresFour size={18} weight="duotone" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-[#1e1b19]">
              Types d'Activités
            </h3>
            <p className="text-[11px] text-[#8a726a]">
              Distribution sur la période
            </p>
          </div>
        </div>

        <div className="text-[11px] font-bold text-[#8a726a] bg-[#faf2ee] px-2 py-0.5 rounded border border-[#e8e1dd]">
          {totalCount} sessions
        </div>
      </div>

      {/* Categories List */}
      <div className="py-3 flex flex-col gap-2 flex-1 overflow-y-auto max-h-[260px] pr-1">
        {distribution.map((item) => {
          const cfg = getActivityTypeConfig(item.type);
          const color = ACTIVITY_TYPE_COLORS[item.type] || '#b85028';

          return (
            <div key={item.type} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] text-[#57423b]">
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-semibold truncate">{cfg.label}</span>
                </div>
                <span className="font-mono font-bold shrink-0">
                  {item.count}{' '}
                  <span className="text-[#8a726a] font-normal">
                    ({item.percentage}%)
                  </span>
                </span>
              </div>

              <div className="w-full h-1.5 bg-[#faf2ee] rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: color,
                  }}
                  className="h-full rounded-full transition-all duration-500"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="pt-2.5 border-t border-[#f4ece9] flex items-center justify-between text-[11px] text-[#8a726a]">
        <span>7 catégories officielles</span>
        <span className="font-semibold text-[#b85028]">
          Cadence communautaire
        </span>
      </div>
    </div>
  );
};

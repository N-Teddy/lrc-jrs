import { ActivityType, type IActivityTypeDistribution } from '@jrs/shared';
import { CaretDown } from '@phosphor-icons/react';
import type React from 'react';
import { getActivityTypeConfig } from '../../activities/utils/activity-ui.utils';

export const ACTIVITY_TYPE_PALETTE: Record<ActivityType, string> = {
  [ActivityType.SERVICE]: '#70C044', // Fresh Green
  [ActivityType.MONTHLY_MEETING]: '#3b82f6', // Bright Blue
  [ActivityType.CAUSERIE]: '#8b5cf6', // Violet
  [ActivityType.RECREATIONAL]: '#f59e0b', // Amber
  [ActivityType.CONFERENCE]: '#ec4899', // Pink
  [ActivityType.JPO]: '#14b8a6', // Teal
  [ActivityType.AG]: '#6366f1', // Indigo
};

interface ActivityBreakdownCardProps {
  distribution: IActivityTypeDistribution[];
  totalCount?: number;
}

export const ActivityBreakdownCard: React.FC<ActivityBreakdownCardProps> = ({
  distribution,
  totalCount = 12,
}) => {
  const activeItems = distribution.filter((d) => d.count > 0);
  const total =
    activeItems.reduce((acc, curr) => acc + curr.count, 0) || totalCount || 1;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between transition-all hover:border-slate-200">
      {/* Header with Month Selector (Matching Reference Cost Analysis) */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Types d'Activités
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <h4 className="text-2xl font-black text-slate-900">{total}</h4>
            <span className="text-xs text-slate-500 font-semibold">
              programmées
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-150 text-xs font-bold text-slate-700">
          <span>2026</span>
          <CaretDown size={12} weight="bold" className="text-slate-400" />
        </div>
      </div>

      {/* Multi-Segmented Colored Horizontal Progress Bar */}
      <div className="my-3">
        <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex items-center p-0.5 gap-0.5">
          {activeItems.length === 0 ? (
            <div className="w-full h-full rounded-full bg-slate-200" />
          ) : (
            activeItems.map((item) => {
              const color = ACTIVITY_TYPE_PALETTE[item.type] || '#70C044';
              const pct = Math.max(4, Math.round((item.count / total) * 100));
              return (
                <div
                  key={`seg-${item.type}`}
                  className="h-full rounded-sm transition-all duration-300"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: color,
                  }}
                  title={`${item.type}: ${pct}%`}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Category List with Percentages (Matching Reference Design) */}
      <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-100 text-xs max-h-[140px] overflow-y-auto">
        {activeItems.length === 0 ? (
          <div className="py-4 text-center text-slate-400 text-xs">
            Aucune activité enregistrée
          </div>
        ) : (
          activeItems.map((item) => {
            const cfg = getActivityTypeConfig(item.type);
            const color = ACTIVITY_TYPE_PALETTE[item.type] || '#70C044';
            const pct = Math.round((item.count / total) * 100);

            return (
              <div
                key={`cat-${item.type}`}
                className="flex items-center justify-between text-slate-600 hover:text-slate-900"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-semibold text-slate-700 truncate max-w-[140px]">
                    {cfg.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-bold text-slate-900 font-mono text-[11px]">
                  <span>{item.count}</span>
                  <span className="text-slate-400 w-8 text-right font-normal">
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

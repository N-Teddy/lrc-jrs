import { ActivityType, type IActivityTypeDistribution } from '@jrs/shared';
import { SquaresFour } from '@phosphor-icons/react';
import type React from 'react';
import { useState } from 'react';
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
  const [hoveredType, setHoveredType] = useState<ActivityType | null>(null);

  const totalCount = distribution.reduce((sum, item) => sum + item.count, 0);

  // SVG Geometry for Activity Donut Wheel
  const radius = 38;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;

  // Compute slices
  let accumulatedAngle = 0;
  const slices = distribution.map((item) => {
    const pct = totalCount > 0 ? (item.count / totalCount) * 100 : 0;
    const strokeDash = (pct / 100) * circumference;
    const offset = -accumulatedAngle;
    if (totalCount > 0) {
      accumulatedAngle += strokeDash;
    }
    const color = ACTIVITY_TYPE_COLORS[item.type] || '#b85028';
    const cfg = getActivityTypeConfig(item.type);
    return {
      type: item.type,
      count: item.count,
      pct: Math.round(pct),
      strokeDash,
      offset,
      color,
      label: cfg.label,
    };
  });

  const activeSlice =
    hoveredType !== null ? slices.find((s) => s.type === hoveredType) : null;

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
              Diagramme de Répartition des Activités
            </h3>
            <p className="text-[11px] text-[#8a726a]">
              Roue des 7 catégories de rassemblements
            </p>
          </div>
        </div>

        <div className="text-[11px] font-bold text-[#8a726a] bg-[#faf2ee] px-2 py-0.5 rounded border border-[#e8e1dd]">
          {totalCount} sessions
        </div>
      </div>

      {/* Visual Content: SVG Activity Donut Wheel + Category Matrix */}
      <div className="py-4 flex flex-col sm:flex-row items-center justify-around gap-5">
        {/* Visual Diagram: Donut Wheel */}
        <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#f4ece9"
              strokeWidth={strokeWidth}
            />

            {/* Slices when totalCount > 0 */}
            {totalCount > 0 ? (
              slices.map((slice) => {
                if (slice.strokeDash <= 0) return null;
                const isHovered = hoveredType === slice.type;
                return (
                  <circle
                    key={slice.type}
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                    strokeDasharray={`${slice.strokeDash} ${circumference - slice.strokeDash}`}
                    strokeDashoffset={slice.offset}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredType(slice.type)}
                    onMouseLeave={() => setHoveredType(null)}
                  />
                );
              })
            ) : (
              // Empty State Dotted Guide Wheel
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="#e8e1dd"
                strokeWidth={strokeWidth}
                strokeDasharray="4 6"
              />
            )}
          </svg>

          {/* Donut Center Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-1">
            {activeSlice ? (
              <>
                <span
                  className="text-lg font-black font-mono leading-none"
                  style={{ color: activeSlice.color }}
                >
                  {activeSlice.count}
                </span>
                <span className="text-[10px] font-bold text-[#1e1b19] truncate max-w-[80px] mt-0.5">
                  {activeSlice.label}
                </span>
              </>
            ) : (
              <>
                <span className="text-xl font-black text-[#1e1b19] font-mono leading-none">
                  {totalCount}
                </span>
                <span className="text-[10px] text-[#8a726a] font-semibold mt-0.5">
                  {totalCount <= 1 ? 'Session' : 'Sessions'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Visual Category Matrix Grid */}
        <div className="flex flex-col gap-1.5 flex-1 w-full">
          {slices.map((item) => {
            const isHovered = hoveredType === item.type;
            const hasActivity = item.count > 0;

            return (
              <div
                key={item.type}
                onMouseEnter={() => setHoveredType(item.type)}
                onMouseLeave={() => setHoveredType(null)}
                className={`px-2.5 py-1 rounded-xl transition-all flex items-center justify-between text-xs cursor-pointer border ${
                  isHovered
                    ? 'bg-[#faf2ee] border-[#b85028]/40 shadow-xs'
                    : hasActivity
                      ? 'bg-[#faf2ee]/40 border-[#e8e1dd] hover:bg-[#faf2ee]'
                      : 'border-transparent text-[#8a726a] hover:bg-[#faf2ee]/30'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span
                    className={`truncate text-[11px] ${
                      hasActivity
                        ? 'font-bold text-[#1e1b19]'
                        : 'font-medium text-[#8a726a]'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 font-mono text-[11px]">
                  {hasActivity ? (
                    <span
                      className="font-bold px-1.5 py-0.2 rounded-md"
                      style={{
                        backgroundColor: `${item.color}15`,
                        color: item.color,
                      }}
                    >
                      {item.count} ({item.pct}%)
                    </span>
                  ) : (
                    <span className="text-[#8a726a]/60">0</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Proportional Spectrum Ribbon */}
      {totalCount > 0 && (
        <div className="pt-2">
          <div className="w-full h-2 rounded-full overflow-hidden flex bg-[#faf2ee] border border-[#e8e1dd]">
            {slices
              .filter((s) => s.count > 0)
              .map((s) => (
                <div
                  key={`ribbon-${s.type}`}
                  style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                  className="h-full transition-all duration-500"
                  title={`${s.label}: ${s.count} (${s.pct}%)`}
                />
              ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pt-2.5 border-t border-[#f4ece9] flex items-center justify-between text-[11px] text-[#8a726a]">
        <span>Survoler une catégorie pour isoler sa part</span>
        <span className="font-semibold text-[#b85028]">
          Cadence communautaire
        </span>
      </div>
    </div>
  );
};

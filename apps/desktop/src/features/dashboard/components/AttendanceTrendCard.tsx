import type { IAttendanceTrendPoint } from '@jrs/shared';
import { ChartLineUp, Users } from '@phosphor-icons/react';
import type React from 'react';
import { useState } from 'react';

interface AttendanceTrendCardProps {
  trend: IAttendanceTrendPoint[];
}

export const AttendanceTrendCard: React.FC<AttendanceTrendCardProps> = ({
  trend,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const totalRecorded = trend.reduce((sum, t) => sum + t.totalPresent, 0);
  const avgTurnout =
    trend.length > 0
      ? Math.round(
          trend.reduce((sum, t) => sum + t.turnoutRate, 0) / trend.length,
        )
      : 0;

  // Compute scale
  const maxVal = Math.max(
    ...trend.map((t) =>
      Math.max(t.membersPresent, t.guestsPresent, t.totalPresent),
    ),
    10, // baseline
  );

  // SVG dimensions
  const svgWidth = 560;
  const svgHeight = 170;
  const padLeft = 40;
  const padRight = 40;
  const padTop = 30;
  const padBottom = 45;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;
  const baselineY = padTop + plotHeight;

  // Compute point coordinates
  const pointsCount = trend.length || 1;
  const memberPoints = trend.map((t, i) => {
    const x =
      pointsCount > 1
        ? padLeft + (i / (pointsCount - 1)) * plotWidth
        : padLeft + plotWidth / 2;
    const y = baselineY - (t.membersPresent / maxVal) * plotHeight;
    return { x, y, point: t };
  });

  const guestPoints = trend.map((t, i) => {
    const x =
      pointsCount > 1
        ? padLeft + (i / (pointsCount - 1)) * plotWidth
        : padLeft + plotWidth / 2;
    const y = baselineY - (t.guestsPresent / maxVal) * plotHeight;
    return { x, y, point: t };
  });

  // Smooth Bézier path helper
  const createSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const midX = p0.x + (p1.x - p0.x) / 2;
      d += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const memberCurvePath = createSmoothPath(memberPoints);
  const guestCurvePath = createSmoothPath(guestPoints);

  const memberAreaPath =
    memberPoints.length > 0
      ? `${memberCurvePath} L ${memberPoints[memberPoints.length - 1].x} ${baselineY} L ${memberPoints[0].x} ${baselineY} Z`
      : '';

  const hoveredPoint = hoveredIndex !== null ? trend[hoveredIndex] : null;

  return (
    <div className="bg-white rounded-2xl border border-[#e8e1dd] shadow-xs p-5 flex flex-col justify-between transition-all hover:border-[#cfc4be]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#f4ece9] gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#edf3ee] text-[#486b52] flex items-center justify-center border border-[#c2e9ca]">
            <ChartLineUp size={18} weight="duotone" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-[#1e1b19]">
              Diagramme d'Évolution de la Fréquentation
            </h3>
            <p className="text-[11px] text-[#8a726a]">
              Courbe d'assiduité continue • Membres & Invités
            </p>
          </div>
        </div>

        {/* Legend with Interactive indicators */}
        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#486b52]" />
            <span className="text-[#57423b] font-semibold">Membres</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1.5 rounded-sm bg-[#b85028]" />
            <span className="text-[#57423b] font-semibold">Invités</span>
          </div>
          <span className="text-[#8a726a] hidden md:inline">•</span>
          <span className="font-mono font-bold text-[#1e1b19] bg-[#faf2ee] px-2 py-0.5 rounded border border-[#e8e1dd] text-[10px] hidden md:inline">
            {totalRecorded} présences • {avgTurnout}% moy.
          </span>
        </div>
      </div>

      {/* SVG Interactive Spline Curve Chart Canvas */}
      <div className="relative py-2 flex-1 flex flex-col justify-center">
        {trend.length === 0 ? (
          <div className="my-auto py-8 text-center text-xs text-[#8a726a] flex flex-col items-center justify-center gap-1.5">
            <Users size={28} className="text-[#8a726a]/40" />
            <span>Aucune donnée d'assiduité sur cette période.</span>
          </div>
        ) : (
          <div className="w-full relative">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto overflow-visible select-none"
            >
              <defs>
                {/* Emerald Green Area Gradient */}
                <linearGradient
                  id="memberAreaGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#486b52" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#486b52" stopOpacity="0.0" />
                </linearGradient>

                {/* Terracotta Guest Area Gradient */}
                <linearGradient
                  id="guestAreaGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#b85028" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#b85028" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Reference Gridlines */}
              <line
                x1={padLeft}
                y1={padTop}
                x2={svgWidth - padRight}
                y2={padTop}
                stroke="#f4ece9"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <line
                x1={padLeft}
                y1={padTop + plotHeight / 2}
                x2={svgWidth - padRight}
                y2={padTop + plotHeight / 2}
                stroke="#f4ece9"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <line
                x1={padLeft}
                y1={baselineY}
                x2={svgWidth - padRight}
                y2={baselineY}
                stroke="#e8e1dd"
                strokeWidth="1.2"
              />

              {/* Grid Axis Labels */}
              <text
                x={padLeft - 8}
                y={padTop + 4}
                textAnchor="end"
                className="text-[9px] font-mono fill-[#8a726a]"
              >
                {maxVal}
              </text>
              <text
                x={padLeft - 8}
                y={padTop + plotHeight / 2 + 3}
                textAnchor="end"
                className="text-[9px] font-mono fill-[#8a726a]"
              >
                {Math.round(maxVal / 2)}
              </text>
              <text
                x={padLeft - 8}
                y={baselineY + 3}
                textAnchor="end"
                className="text-[9px] font-mono fill-[#8a726a]"
              >
                0
              </text>

              {/* Member Filled Wave Area */}
              <path d={memberAreaPath} fill="url(#memberAreaGradient)" />

              {/* Member Solid Curve Line */}
              <path
                d={memberCurvePath}
                fill="none"
                stroke="#486b52"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Guest Dashed Curve Line */}
              <path
                d={guestCurvePath}
                fill="none"
                stroke="#b85028"
                strokeWidth="2"
                strokeDasharray="5 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive Data Dots & Hover Hit Targets */}
              {memberPoints.map((pt, i) => {
                const isHovered = hoveredIndex === i;
                const gPt = guestPoints[i];
                const dateStr = new Date(pt.point.date).toLocaleDateString(
                  'fr-FR',
                  {
                    day: 'numeric',
                    month: 'short',
                  },
                );

                return (
                  <g
                    key={pt.point.activityId}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {/* Vertical Highlight Guideline on Hover */}
                    {isHovered && (
                      <line
                        x1={pt.x}
                        y1={padTop}
                        x2={pt.x}
                        y2={baselineY}
                        stroke="#b85028"
                        strokeWidth="1.2"
                        strokeDasharray="3 3"
                        opacity="0.6"
                      />
                    )}

                    {/* Guest Dot */}
                    <circle
                      cx={gPt.x}
                      cy={gPt.y}
                      r={isHovered ? 5.5 : 3.5}
                      fill="#ffffff"
                      stroke="#b85028"
                      strokeWidth={isHovered ? 2.5 : 2}
                      className="transition-all duration-150"
                    />

                    {/* Member Dot */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 6.5 : 4}
                      fill="#ffffff"
                      stroke="#486b52"
                      strokeWidth={isHovered ? 3 : 2.5}
                      className="transition-all duration-150"
                    />

                    {/* Date label underneath baseline */}
                    <text
                      x={pt.x}
                      y={baselineY + 16}
                      textAnchor="middle"
                      className={`text-[10px] font-bold tracking-tight transition-colors ${
                        isHovered ? 'fill-[#b85028]' : 'fill-[#8a726a]'
                      }`}
                    >
                      {dateStr}
                    </text>

                    {/* Turnout % badge text */}
                    <text
                      x={pt.x}
                      y={baselineY + 28}
                      textAnchor="middle"
                      className="text-[9px] font-mono font-semibold fill-[#486b52]"
                    >
                      {pt.point.turnoutRate}%
                    </text>

                    {/* Transparent Hit target for smooth hover */}
                    <rect
                      x={pt.x - 24}
                      y={padTop}
                      width={48}
                      height={plotHeight + 35}
                      fill="transparent"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Floating Interactive Tooltip */}
            {hoveredPoint && hoveredIndex !== null && (
              <div
                className="absolute z-20 pointer-events-none bg-[#1e1b19] text-white p-2.5 rounded-xl shadow-xl text-xs w-48 animate-in fade-in zoom-in-95 duration-150 -translate-x-1/2 -top-6"
                style={{
                  left: `${(memberPoints[hoveredIndex].x / svgWidth) * 100}%`,
                }}
              >
                <p className="font-bold text-white text-[11px] truncate leading-tight">
                  {hoveredPoint.title}
                </p>
                <div className="mt-1.5 pt-1.5 border-t border-white/20 flex flex-col gap-0.5 text-[10px]">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 text-[#a9d0b2]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#a9d0b2]" />
                      <span>Membres :</span>
                    </span>
                    <span className="font-mono font-bold">
                      {hoveredPoint.membersPresent}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 text-[#ffb59c]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ffb59c]" />
                      <span>Invités :</span>
                    </span>
                    <span className="font-mono font-bold">
                      {hoveredPoint.guestsPresent}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-white/15">
                    <span className="text-white/70">Total Présents :</span>
                    <span className="font-mono font-bold text-[#f59e0b]">
                      {hoveredPoint.totalPresent} ({hoveredPoint.turnoutRate}%)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-[#f4ece9] flex items-center justify-between text-[11px] text-[#8a726a]">
        <span>Évolution sur les 5 dernières activités</span>
        <span className="font-semibold text-[#486b52]">
          Ligne pleine = Membres • Ligne pointillée = Invités
        </span>
      </div>
    </div>
  );
};

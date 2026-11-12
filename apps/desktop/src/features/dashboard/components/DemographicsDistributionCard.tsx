import type { IDemographicsStats } from '@jrs/shared';
import { GenderIntersex } from '@phosphor-icons/react';
import type React from 'react';
import { useState } from 'react';

interface DemographicsDistributionCardProps {
  demographics: IDemographicsStats;
}

export const DemographicsDistributionCard: React.FC<
  DemographicsDistributionCardProps
> = ({ demographics }) => {
  const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null);

  const totalWithAge =
    demographics.ageBrackets.junior18to21 +
    demographics.ageBrackets.core22to25 +
    demographics.ageBrackets.senior26to30 +
    demographics.ageBrackets.mentors30Plus;

  const totalMembers = Math.max(
    totalWithAge,
    demographics.maleCount + demographics.femaleCount,
    1,
  );

  const ageGroups = [
    {
      label: '18–21 ans',
      sublabel: 'Junior',
      count: demographics.ageBrackets.junior18to21,
      color: '#b85028',
      pct:
        totalWithAge > 0
          ? Math.round(
              (demographics.ageBrackets.junior18to21 / totalWithAge) * 100,
            )
          : 0,
    },
    {
      label: '22–25 ans',
      sublabel: 'Jeune Adulte',
      count: demographics.ageBrackets.core22to25,
      color: '#486b52',
      pct:
        totalWithAge > 0
          ? Math.round(
              (demographics.ageBrackets.core22to25 / totalWithAge) * 100,
            )
          : 0,
    },
    {
      label: '26–30 ans',
      sublabel: 'Aîné JR',
      count: demographics.ageBrackets.senior26to30,
      color: '#e65100',
      pct:
        totalWithAge > 0
          ? Math.round(
              (demographics.ageBrackets.senior26to30 / totalWithAge) * 100,
            )
          : 0,
    },
    {
      label: '30+ ans',
      sublabel: 'Mentors & AP',
      count: demographics.ageBrackets.mentors30Plus,
      color: '#8a726a',
      pct:
        totalWithAge > 0
          ? Math.round(
              (demographics.ageBrackets.mentors30Plus / totalWithAge) * 100,
            )
          : 0,
    },
  ];

  // SVG Donut geometry
  const radius = 38;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;

  // Compute strokeDasharray & strokeDashoffset for each age slice
  let accumulatedAngle = 0;
  const donutSlices = ageGroups.map((g, i) => {
    const strokeDash = (g.pct / 100) * circumference;
    const offset = -accumulatedAngle;
    accumulatedAngle += strokeDash;
    return {
      ...g,
      strokeDash,
      offset,
      index: i,
    };
  });

  const activeGroup =
    activeGroupIndex !== null ? ageGroups[activeGroupIndex] : null;

  return (
    <div className="bg-white rounded-2xl border border-[#e8e1dd] shadow-xs p-5 flex flex-col justify-between transition-all hover:border-[#cfc4be]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#f4ece9]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#fff2ee] text-[#b85028] flex items-center justify-center border border-[#ffdbcf]">
            <GenderIntersex size={18} weight="duotone" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-[#1e1b19]">
              Diagramme Démographique & Tranches d'Âge
            </h3>
            <p className="text-[11px] text-[#8a726a]">
              Parité des genres & Anneau des générations
            </p>
          </div>
        </div>

        <div className="text-[11px] font-bold text-[#8a726a] bg-[#faf2ee] px-2 py-0.5 rounded border border-[#e8e1dd]">
          {totalMembers} membres
        </div>
      </div>

      {/* Visual Content: SVG Donut Diagram + Visual Gender Gauge */}
      <div className="py-4 flex flex-col gap-5">
        {/* Visual Diagram 1: Central Donut Chart */}
        <div className="flex flex-col sm:flex-row items-center justify-around gap-4">
          {/* SVG Donut Circle */}
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

              {/* Slices */}
              {donutSlices.map((slice) => {
                if (slice.strokeDash <= 0) return null;
                const isHovered = activeGroupIndex === slice.index;
                return (
                  <circle
                    key={slice.label}
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                    strokeDasharray={`${slice.strokeDash} ${circumference - slice.strokeDash}`}
                    strokeDashoffset={slice.offset}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setActiveGroupIndex(slice.index)}
                    onMouseLeave={() => setActiveGroupIndex(null)}
                  />
                );
              })}
            </svg>

            {/* Donut Center Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              {activeGroup ? (
                <>
                  <span
                    className="text-lg font-black font-mono leading-none"
                    style={{ color: activeGroup.color }}
                  >
                    {activeGroup.count}
                  </span>
                  <span className="text-[10px] font-bold text-[#1e1b19] mt-0.5">
                    {activeGroup.pct}%
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xl font-black text-[#1e1b19] font-mono leading-none">
                    {totalWithAge}
                  </span>
                  <span className="text-[10px] text-[#8a726a] font-semibold mt-0.5">
                    Jeunes Relais
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Color-Coded Age Legend Chips */}
          <div className="grid grid-cols-2 gap-2 flex-1 w-full">
            {ageGroups.map((g, i) => {
              const isHovered = activeGroupIndex === i;
              return (
                <div
                  key={g.label}
                  onMouseEnter={() => setActiveGroupIndex(i)}
                  onMouseLeave={() => setActiveGroupIndex(null)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isHovered
                      ? 'bg-[#faf2ee] border-[#b85028]/40 shadow-xs scale-102'
                      : 'bg-[#faf2ee]/40 border-[#e8e1dd] hover:bg-[#faf2ee]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: g.color }}
                    />
                    <span className="font-bold text-[11px] text-[#1e1b19] truncate">
                      {g.label}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1 text-[10px] font-mono">
                    <span className="text-[#8a726a]">{g.sublabel}</span>
                    <span className="font-bold" style={{ color: g.color }}>
                      {g.count} ({g.pct}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Visual Diagram 2: Gender Diverging Balance Bar */}
        <div className="pt-3 border-t border-[#f4ece9] flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#1e1b19]">
            <span className="flex items-center gap-1.5 text-[#0284c7]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" />
              <span>Hommes ({demographics.malePercentage}%)</span>
            </span>
            <span className="text-[11px] text-[#8a726a] font-normal">
              Parité des genres
            </span>
            <span className="flex items-center gap-1.5 text-[#db2777]">
              <span>Femmes ({demographics.femalePercentage}%)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#db2777]" />
            </span>
          </div>

          {/* Diverging Bar Gauge */}
          <div className="w-full h-3.5 bg-[#faf2ee] rounded-full overflow-hidden flex border border-[#e8e1dd] p-0.5">
            <div
              style={{ width: `${demographics.malePercentage}%` }}
              className="bg-[#0284c7] rounded-l-full transition-all duration-700"
              title={`Hommes: ${demographics.maleCount} (${demographics.malePercentage}%)`}
            />
            <div
              style={{ width: `${demographics.femalePercentage}%` }}
              className="bg-[#db2777] rounded-r-full transition-all duration-700"
              title={`Femmes: ${demographics.femaleCount} (${demographics.femalePercentage}%)`}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2.5 border-t border-[#f4ece9] flex items-center justify-between text-[11px] text-[#8a726a]">
        <span>Survoler un quartier pour isoler la tranche</span>
        <span className="font-semibold text-[#b85028]">
          Profil démographique
        </span>
      </div>
    </div>
  );
};

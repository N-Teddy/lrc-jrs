import type { IDemographicsStats } from '@jrs/shared';
import { GenderIntersex } from '@phosphor-icons/react';
import type React from 'react';

interface DemographicsDistributionCardProps {
  demographics: IDemographicsStats;
}

export const DemographicsDistributionCard: React.FC<
  DemographicsDistributionCardProps
> = ({ demographics }) => {
  const totalWithAge =
    demographics.ageBrackets.junior18to21 +
    demographics.ageBrackets.core22to25 +
    demographics.ageBrackets.senior26to30 +
    demographics.ageBrackets.mentors30Plus;

  const ageGroups = [
    {
      label: '18–21 ans (Junior)',
      count: demographics.ageBrackets.junior18to21,
      color: 'bg-[#b85028]',
    },
    {
      label: '22–25 ans (Jeune Adulte)',
      count: demographics.ageBrackets.core22to25,
      color: 'bg-[#486b52]',
    },
    {
      label: '26–30 ans (Aîné JR)',
      count: demographics.ageBrackets.senior26to30,
      color: 'bg-[#e65100]',
    },
    {
      label: '30+ ans (Mentors & AP)',
      count: demographics.ageBrackets.mentors30Plus,
      color: 'bg-[#8a726a]',
    },
  ];

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
              Démographie & Profils
            </h3>
            <p className="text-[11px] text-[#8a726a]">
              Parité Genre & Tranches d'Âge
            </p>
          </div>
        </div>

        <div className="text-[11px] font-bold text-[#8a726a] bg-[#faf2ee] px-2 py-0.5 rounded border border-[#e8e1dd]">
          JR 18–30 ans
        </div>
      </div>

      <div className="py-3 flex flex-col gap-4">
        {/* Gender Breakdown Bar */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-[#1e1b19] mb-1.5">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" />
              <span>Hommes ({demographics.malePercentage}%)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span>Femmes ({demographics.femalePercentage}%)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#db2777]" />
            </span>
          </div>

          <div className="w-full h-3 bg-[#faf2ee] rounded-full overflow-hidden flex border border-[#e8e1dd]">
            <div
              style={{ width: `${demographics.malePercentage}%` }}
              className="bg-[#0284c7] transition-all duration-500"
              title={`Hommes: ${demographics.maleCount}`}
            />
            <div
              style={{ width: `${demographics.femalePercentage}%` }}
              className="bg-[#db2777] transition-all duration-500"
              title={`Femmes: ${demographics.femaleCount}`}
            />
          </div>
        </div>

        {/* Age Brackets Distribution */}
        <div className="flex flex-col gap-2 pt-1">
          <span className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
            Répartition par Âge
          </span>

          {ageGroups.map((group) => {
            const pct =
              totalWithAge > 0
                ? Math.round((group.count / totalWithAge) * 100)
                : 0;

            return (
              <div key={group.label} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px] text-[#57423b]">
                  <span className="font-medium">{group.label}</span>
                  <span className="font-mono font-bold">
                    {group.count} ({pct}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#faf2ee] rounded-full overflow-hidden">
                  <div
                    style={{ width: `${pct}%` }}
                    className={`h-full ${group.color} rounded-full transition-all duration-500`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2.5 border-t border-[#f4ece9] flex items-center justify-between text-[11px] text-[#8a726a]">
        <span>Total membres profilés</span>
        <span className="font-bold text-[#1e1b19] font-mono">
          {demographics.maleCount + demographics.femaleCount}
        </span>
      </div>
    </div>
  );
};

import type { IAttendanceTrendPoint, IDashboardKpis } from '@jrs/shared';
import { TrendUp } from '@phosphor-icons/react';
import type React from 'react';
import { useState } from 'react';

interface DashboardHeroChartCardProps {
  trend: IAttendanceTrendPoint[];
  kpis: IDashboardKpis;
  period: 'month' | 'quarter' | 'year';
  onPeriodChange: (p: 'month' | 'quarter' | 'year') => void;
}

export const DashboardHeroChartCard: React.FC<DashboardHeroChartCardProps> = ({
  trend,
  kpis,
  period,
  onPeriodChange,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const avgAttendance = kpis.averageAttendanceRate || 0;

  // Maximum value for scale
  const maxVal = Math.max(
    ...trend.map((t) =>
      Math.max(t.membersPresent, t.guestsPresent, t.totalPresent),
    ),
    kpis.totalMembers || 30,
    10,
  );

  const hoveredPoint =
    hoveredIndex !== null && trend[hoveredIndex] ? trend[hoveredIndex] : null;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between transition-all hover:border-slate-200">
      {/* Top Header Row: Main Metric & Period Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-sans">
              {avgAttendance > 0
                ? `${avgAttendance}%`
                : `${kpis.totalMembers} Membres`}
            </h2>
            <span className="inline-flex items-center gap-0.5 text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/60">
              <TrendUp size={12} weight="bold" />
              <span>+5.3% ce mois</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Aperçu de la fréquentation & engagement de la jeunesse paroissiale
          </p>
        </div>

        {/* Right Controls: Period Filter & Legend */}
        <div className="flex flex-col sm:items-end gap-2.5">
          <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-150 text-xs font-bold">
            <button
              type="button"
              onClick={() => onPeriodChange('month')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                period === 'month'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              7j / Mois
            </button>
            <button
              type="button"
              onClick={() => onPeriodChange('quarter')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                period === 'quarter'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Trimestre
            </button>
            <button
              type="button"
              onClick={() => onPeriodChange('year')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                period === 'year'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Année 2026
            </button>
          </div>

          {/* Color Legend */}
          <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#70C044]" />
              <span>Membres JR</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Invités</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
              <span>Capacité</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart on Left (8 cols) + KPI Stack on Right (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5 items-center">
        {/* Modern Bar Chart Container (8 cols) */}
        <div className="lg:col-span-8 flex flex-col justify-between min-h-[220px]">
          {trend.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              Aucune donnée de présence pour cette période.
            </div>
          ) : (
            <div className="relative">
              {/* Floating Tooltip Card */}
              {hoveredPoint && (
                <div
                  className="absolute z-20 pointer-events-none bg-white p-3 rounded-2xl border border-slate-100 shadow-lg -top-4 transition-all duration-150 animate-in fade-in zoom-in-95"
                  style={{
                    left: `${Math.min(75, Math.max(10, ((hoveredIndex ?? 0) / (trend.length - 1 || 1)) * 80))}%`,
                  }}
                >
                  <div className="text-[10px] font-bold text-slate-400 capitalize">
                    {new Date(hoveredPoint.date).toLocaleDateString('fr-FR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </div>
                  <div className="text-xs font-black text-slate-900 mt-0.5 truncate max-w-[160px]">
                    {hoveredPoint.title}
                  </div>
                  <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex flex-col gap-0.5 text-[10px]">
                    <span className="flex items-center justify-between gap-3 text-slate-600">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#70C044]" />
                        <span>Membres:</span>
                      </span>
                      <strong className="font-extrabold text-slate-900">
                        {hoveredPoint.membersPresent}
                      </strong>
                    </span>
                    <span className="flex items-center justify-between gap-3 text-slate-600">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span>Invités:</span>
                      </span>
                      <strong className="font-extrabold text-slate-900">
                        {hoveredPoint.guestsPresent}
                      </strong>
                    </span>
                    <span className="flex items-center justify-between gap-3 text-emerald-700 font-extrabold pt-0.5">
                      <span>Taux:</span>
                      <span>{hoveredPoint.turnoutRate}%</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Bar Columns Container */}
              <div className="flex items-end justify-between gap-3 sm:gap-5 h-44 pt-4 px-2">
                {trend.map((point, index) => {
                  const memberHeightPct = Math.min(
                    100,
                    Math.round((point.membersPresent / maxVal) * 100),
                  );
                  const guestHeightPct = Math.min(
                    100,
                    Math.round((point.guestsPresent / maxVal) * 100),
                  );
                  const isHovered = hoveredIndex === index;

                  const dateLabel = new Date(point.date).toLocaleDateString(
                    'fr-FR',
                    {
                      day: 'numeric',
                      month: 'short',
                    },
                  );

                  return (
                    <div
                      key={point.activityId}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className="flex-1 flex flex-col items-center gap-2 h-full justify-end cursor-pointer group"
                    >
                      {/* Pillar Background Bar (Light Gray) with Colored Stacks */}
                      <div className="relative w-full max-w-[48px] h-36 rounded-2xl bg-slate-100/90 group-hover:bg-slate-150 transition-colors flex flex-col justify-end p-1 overflow-hidden">
                        {/* Guest Layer (Amber) */}
                        {guestHeightPct > 0 && (
                          <div
                            className="w-full rounded-t-lg bg-amber-400 transition-all duration-300"
                            style={{ height: `${guestHeightPct}%` }}
                          />
                        )}
                        {/* Member Layer (Lime/Emerald Green) */}
                        <div
                          className={`w-full rounded-b-xl transition-all duration-300 ${
                            isHovered ? 'bg-[#5ea833]' : 'bg-[#70C044]'
                          }`}
                          style={{ height: `${Math.max(8, memberHeightPct)}%` }}
                        />
                      </div>

                      {/* Date Label */}
                      <span
                        className={`text-[11px] font-bold tracking-tight transition-colors ${
                          isHovered
                            ? 'text-emerald-700 font-extrabold'
                            : 'text-slate-400'
                        }`}
                      >
                        {dateLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right KPI Stack (4 cols - Matching Total Income / Expenses / Saved Balance in Reference) */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-4 p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
          {/* Metric 1: Total Membres */}
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Membres Communauté
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h4 className="text-2xl font-black text-slate-900">
                {kpis.totalMembers}
              </h4>
              <span className="text-xs text-slate-500 font-semibold">
                inscrits
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-700">
              <TrendUp size={12} weight="bold" />
              <span>
                {kpis.activeJrCount} Jeunes Relais actifs (
                {Math.round(
                  (kpis.activeJrCount / Math.max(1, kpis.totalMembers)) * 100,
                )}
                %)
              </span>
            </div>
          </div>

          <div className="h-px bg-slate-200/80" />

          {/* Metric 2: Taux d'Assiduité */}
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Taux d'Assiduité Moyen
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h4 className="text-2xl font-black text-slate-900">
                {avgAttendance}%
              </h4>
              <span className="text-xs text-slate-500 font-semibold">
                présence
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium mt-0.5">
              Participation régulière paroissiale
            </span>
          </div>

          <div className="h-px bg-slate-200/80" />

          {/* Metric 3: Rayonnement & Invités */}
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Rayonnement & Invités
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h4 className="text-2xl font-black text-slate-900">
                {kpis.totalGuestsReached}
              </h4>
              <span className="text-xs text-slate-500 font-semibold">
                accueillis
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-700">
              <TrendUp size={12} weight="bold" />
              <span>{kpis.guestAttendanceRate}% de l'audience totale</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

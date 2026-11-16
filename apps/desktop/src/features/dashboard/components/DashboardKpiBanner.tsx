import type { IDashboardKpis } from '@jrs/shared';
import {
  CalendarBlank,
  ChartLineUp,
  Sparkle,
  Users,
} from '@phosphor-icons/react';
import type React from 'react';

interface DashboardKpiBannerProps {
  kpis: IDashboardKpis;
}

export const DashboardKpiBanner: React.FC<DashboardKpiBannerProps> = ({
  kpis,
}) => {
  // 1. Members JR ratio
  const totalMbrs = Math.max(1, kpis.totalMembers);
  const jrSharePct = Math.round((kpis.activeJrCount / totalMbrs) * 100);
  const pcSharePct = Math.max(
    0,
    Math.round((kpis.activePcCount / totalMbrs) * 100),
  );

  // 2. Attendance radial gauge constants (r = 15 => circumference ~ 94.25)
  const attendanceCircumference = 2 * Math.PI * 15;
  const clampedRate = Math.min(100, Math.max(0, kpis.averageAttendanceRate));
  const attendanceOffset =
    attendanceCircumference - (clampedRate / 100) * attendanceCircumference;

  // 3. Guest ratio radial gauge
  const guestRate = Math.min(100, Math.max(0, kpis.guestAttendanceRate));
  const guestCircumference = 2 * Math.PI * 15;
  const guestOffset =
    guestCircumference - (guestRate / 100) * guestCircumference;

  // 4. Activity status proportion
  const totalActivities =
    kpis.upcomingActivitiesCount + kpis.completedActivitiesCount;
  const completedPct =
    totalActivities > 0
      ? Math.round((kpis.completedActivitiesCount / totalActivities) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {/* 1. Community Members Card with Proportional Segment Meter */}
      <div className="bg-white rounded-2xl border border-[#e8e1dd] shadow-xs p-4 flex flex-col justify-between transition-all hover:border-[#cfc4be] hover:shadow-2xs">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
              Membres Communauté
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h4 className="text-2xl font-black text-[#1e1b19] font-mono">
                {kpis.totalMembers}
              </h4>
              <span className="text-[11px] text-[#8a726a]">inscrits</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#fff2ee] text-[#b85028] flex items-center justify-center border border-[#ffdbcf] shrink-0">
            <Users size={20} weight="duotone" />
          </div>
        </div>

        {/* Visual Diagram: Horizontal Segmented Balance Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] font-semibold text-[#57423b] mb-1">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#b85028]" />
              <span>
                {kpis.activeJrCount} JR ({jrSharePct}%)
              </span>
            </span>
            <span className="flex items-center gap-1">
              <span>
                {kpis.activePcCount} PC ({pcSharePct}%)
              </span>
              <span className="w-2 h-2 rounded-full bg-[#57423b]" />
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#faf2ee] flex overflow-hidden border border-[#e8e1dd]">
            <div
              style={{ width: `${jrSharePct}%` }}
              className="bg-[#b85028] transition-all duration-500"
              title={`Jeunes Relais: ${kpis.activeJrCount}`}
            />
            <div
              style={{ width: `${pcSharePct}%` }}
              className="bg-[#57423b] transition-all duration-500"
              title={`Personnes Contact: ${kpis.activePcCount}`}
            />
          </div>
        </div>
      </div>

      {/* 2. Turnout Rate with Radial Donut Gauge */}
      <div className="bg-white rounded-2xl border border-[#e8e1dd] shadow-xs p-4 flex flex-col justify-between transition-all hover:border-[#cfc4be] hover:shadow-2xs">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
              Taux d'Assiduité
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <h4 className="text-2xl font-black text-[#486b52] font-mono">
                {kpis.averageAttendanceRate}%
              </h4>
            </div>
            <p className="text-[11px] text-[#57423b] mt-1 font-medium">
              {kpis.averageAttendanceRate >= 75
                ? 'Excellente assiduité'
                : kpis.averageAttendanceRate >= 50
                  ? 'Participation régulière'
                  : 'Participation à dynamiser'}
            </p>
          </div>

          {/* Visual Diagram: Circular SVG Radial Ring Gauge */}
          <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="#edf3ee"
                strokeWidth="3.5"
              />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="#486b52"
                strokeWidth="3.5"
                strokeDasharray={attendanceCircumference}
                strokeDashoffset={attendanceOffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[#486b52]">
              <ChartLineUp size={16} weight="bold" />
            </div>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-[#f4ece9] flex items-center justify-between text-[11px] text-[#8a726a]">
          <span>Moyenne des séances</span>
          <span className="font-semibold text-[#486b52]">
            Régularité paroissiale
          </span>
        </div>
      </div>

      {/* 3. External Reach & Guests with Circular Reach Gauge */}
      <div className="bg-white rounded-2xl border border-[#e8e1dd] shadow-xs p-4 flex flex-col justify-between transition-all hover:border-[#cfc4be] hover:shadow-2xs">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
              Rayonnement & Invités
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <h4 className="text-2xl font-black text-[#b85028] font-mono">
                {kpis.totalGuestsReached}
              </h4>
              <span className="text-[11px] text-[#8a726a]">invités</span>
            </div>
            <p className="text-[11px] text-[#57423b] mt-1 font-medium">
              {kpis.guestAttendanceRate}% de l'audience
            </p>
          </div>

          {/* Visual Diagram: Circular Radial Outreach Gauge */}
          <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="#fff2ee"
                strokeWidth="3.5"
              />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="#b85028"
                strokeWidth="3.5"
                strokeDasharray={guestCircumference}
                strokeDashoffset={guestOffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[#b85028]">
              <Sparkle size={16} weight="fill" />
            </div>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-[#f4ece9] flex items-center justify-between text-[11px] text-[#8a726a]">
          <span>Ouverture extérieure</span>
          <span className="font-semibold text-[#b85028]">
            Évangélisation active
          </span>
        </div>
      </div>

      {/* 4. Upcoming Activities with Dial Meter */}
      <div className="bg-white rounded-2xl border border-[#e8e1dd] shadow-xs p-4 flex flex-col justify-between transition-all hover:border-[#cfc4be] hover:shadow-2xs">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
              Activités Planifiées
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <h4 className="text-2xl font-black text-[#1e1b19] font-mono">
                {kpis.upcomingActivitiesCount}
              </h4>
              <span className="text-[11px] text-[#8a726a]">à venir</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#faf2ee] text-[#57423b] flex items-center justify-center border border-[#e8e1dd] shrink-0">
            <CalendarBlank size={20} weight="duotone" />
          </div>
        </div>

        {/* Visual Diagram: Mini Progress Track for Session Pipeline */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] text-[#57423b] mb-1 font-semibold">
            <span>{kpis.completedActivitiesCount} complétées</span>
            <span>{kpis.upcomingActivitiesCount} en attente</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#faf2ee] overflow-hidden border border-[#e8e1dd]">
            <div
              style={{ width: `${completedPct}%` }}
              className="h-full bg-[#486b52] transition-all duration-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

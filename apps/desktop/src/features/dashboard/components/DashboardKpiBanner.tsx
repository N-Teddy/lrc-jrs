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
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 w-full">
      {/* 1. Community Members */}
      <div className="bg-white rounded-xl border border-[#e8e1dd] shadow-xs p-4 flex flex-col justify-between transition-all hover:border-[#cfc4be] hover:shadow-2xs">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
              Membres Communauté
            </p>
            <h4 className="text-2xl font-extrabold text-[#1e1b19] mt-1 font-mono">
              {kpis.totalMembers}
            </h4>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#fff2ee] text-[#b85028] flex items-center justify-center border border-[#ffdbcf] shrink-0">
            <Users size={20} weight="duotone" />
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-[#f4ece9] flex items-center justify-between text-[11px] text-[#57423b]">
          <span className="font-semibold text-[#b85028]">
            {kpis.activeJrCount} Jeunes JR
          </span>
          <span className="text-[#8a726a]">•</span>
          <span className="text-[#8a726a]">{kpis.activePcCount} PC actifs</span>
        </div>
      </div>

      {/* 2. Turnout Rate */}
      <div className="bg-white rounded-xl border border-[#e8e1dd] shadow-xs p-4 flex flex-col justify-between transition-all hover:border-[#cfc4be] hover:shadow-2xs">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
              Taux d'Assiduité
            </p>
            <h4 className="text-2xl font-extrabold text-[#486b52] mt-1 font-mono">
              {kpis.averageAttendanceRate}%
            </h4>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#edf3ee] text-[#486b52] flex items-center justify-center border border-[#c2e9ca] shrink-0">
            <ChartLineUp size={20} weight="duotone" />
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-[#f4ece9] flex items-center justify-between text-[11px] text-[#57423b]">
          <span className="font-semibold text-[#486b52]">Présence moyenne</span>
          <span className="text-[#8a726a]">•</span>
          <span className="text-[#8a726a]">Membres inscrits</span>
        </div>
      </div>

      {/* 3. External Reach & Guests */}
      <div className="bg-white rounded-xl border border-[#e8e1dd] shadow-xs p-4 flex flex-col justify-between transition-all hover:border-[#cfc4be] hover:shadow-2xs">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
              Rayonnement & Invités
            </p>
            <h4 className="text-2xl font-extrabold text-[#b85028] mt-1 font-mono">
              {kpis.totalGuestsReached}
            </h4>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#fff2ee] text-[#b85028] flex items-center justify-center border border-[#ffdbcf] shrink-0">
            <Sparkle size={20} weight="duotone" />
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-[#f4ece9] flex items-center justify-between text-[11px] text-[#57423b]">
          <span className="font-semibold text-[#b85028]">
            {kpis.guestAttendanceRate}% de l'audience
          </span>
          <span className="text-[#8a726a]">•</span>
          <span className="text-[#8a726a]">Visiteurs externes</span>
        </div>
      </div>

      {/* 4. Upcoming Activities */}
      <div className="bg-white rounded-xl border border-[#e8e1dd] shadow-xs p-4 flex flex-col justify-between transition-all hover:border-[#cfc4be] hover:shadow-2xs">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
              Activités Planifiées
            </p>
            <h4 className="text-2xl font-extrabold text-[#1e1b19] mt-1 font-mono">
              {kpis.upcomingActivitiesCount}
            </h4>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#f4ece9] text-[#57423b] flex items-center justify-center border border-[#e8e1dd] shrink-0">
            <CalendarBlank size={20} weight="duotone" />
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-[#f4ece9] flex items-center justify-between text-[11px] text-[#57423b]">
          <span className="font-semibold text-[#1e1b19]">
            {kpis.completedActivitiesCount} complétées
          </span>
          <span className="text-[#8a726a]">•</span>
          <span className="text-[#8a726a]">Ce trimestre</span>
        </div>
      </div>
    </div>
  );
};

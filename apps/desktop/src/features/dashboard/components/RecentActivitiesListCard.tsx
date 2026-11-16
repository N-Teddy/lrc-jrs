import type { IRecentActivitySummary } from '@jrs/shared';
import {
  CalendarCheck,
  FileText,
  HourglassMedium,
  Lock,
} from '@phosphor-icons/react';
import type React from 'react';
import { getActivityTypeConfig } from '../../activities/utils/activity-ui.utils';
import { ACTIVITY_TYPE_COLORS } from './ActivityTypeBreakdownCard';

interface RecentActivitiesListCardProps {
  activities: IRecentActivitySummary[];
  onSelectActivity?: (id: string) => void;
  onViewAll?: () => void;
}

export const RecentActivitiesListCard: React.FC<
  RecentActivitiesListCardProps
> = ({ activities, onSelectActivity, onViewAll }) => {
  return (
    <div className="bg-white rounded-2xl border border-[#e8e1dd] shadow-xs p-5 flex flex-col justify-between transition-all hover:border-[#cfc4be]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#f4ece9]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#edf3ee] text-[#486b52] flex items-center justify-center border border-[#c2e9ca]">
            <CalendarCheck size={18} weight="duotone" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-[#1e1b19]">
              Dernières Activités Réalisées
            </h3>
            <p className="text-[11px] text-[#8a726a]">
              Présences & Statut du rapport
            </p>
          </div>
        </div>

        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-[11px] font-bold text-[#b85028] hover:text-[#a44520] transition-colors cursor-pointer"
          >
            Voir tout
          </button>
        )}
      </div>

      {/* List */}
      <div className="py-3 flex flex-col gap-2.5 flex-1">
        {activities.length === 0 ? (
          <div className="my-auto py-8 text-center text-xs text-[#8a726a]">
            Aucune activité passée pour le moment.
          </div>
        ) : (
          activities.map((act) => {
            const cfg = getActivityTypeConfig(act.activityType);
            const color = ACTIVITY_TYPE_COLORS[act.activityType] || '#b85028';
            const dateStr = new Date(act.startDate).toLocaleDateString(
              'fr-FR',
              {
                day: 'numeric',
                month: 'short',
              },
            );

            return (
              <div
                key={act.id}
                onClick={() => onSelectActivity?.(act.id)}
                className="p-2.5 rounded-lg border border-[#e8e1dd] bg-[#faf2ee]/30 hover:bg-[#faf2ee] hover:border-[#cfc4be] transition-all flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    className="w-2 h-7 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />

                  <div className="flex flex-col min-w-0 flex-1">
                    <span
                      className="font-bold text-xs text-[#1e1b19] truncate leading-tight"
                      title={act.title}
                    >
                      {act.title}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#8a726a]">
                      <span className="font-medium">{dateStr}</span>
                      <span>•</span>
                      <span className="font-semibold">{cfg.label}</span>
                    </div>
                  </div>
                </div>

                {/* Turnout & Report Badges with visual attendance bar */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#486b52] font-mono">
                        {act.turnoutRate}%
                      </span>
                      <span className="text-[10px] text-[#8a726a]">
                        ({act.totalPresent})
                      </span>
                    </div>
                    {/* Visual mini-indicator bar */}
                    <div className="w-16 h-1.5 bg-[#f4ece9] rounded-full overflow-hidden mt-0.5 border border-[#e8e1dd]">
                      <div
                        style={{ width: `${Math.min(100, act.turnoutRate)}%` }}
                        className="h-full bg-[#486b52] rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1 pl-1.5 border-l border-[#e8e1dd]">
                    {act.hasReport ? (
                      <span
                        className="w-6 h-6 rounded-md bg-[#edf3ee] text-[#486b52] flex items-center justify-center border border-[#c2e9ca]"
                        title="Rapport d'activité archivé sur Google Drive"
                      >
                        <FileText size={13} weight="bold" />
                      </span>
                    ) : (
                      <span
                        className="w-6 h-6 rounded-md bg-[#ffdad4]/40 text-[#9f2f23] flex items-center justify-center border border-[#ffdad4]"
                        title="Rapport d'activité en attente de dépôt"
                      >
                        <HourglassMedium size={13} weight="bold" />
                      </span>
                    )}

                    {act.isAttendanceLocked && (
                      <span
                        className="w-6 h-6 rounded-md bg-[#faf2ee] text-[#57423b] flex items-center justify-center border border-[#e8e1dd]"
                        title="Registre de présence scellé et archivé"
                      >
                        <Lock size={12} weight="bold" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="pt-2.5 border-t border-[#f4ece9] flex items-center justify-between text-[11px] text-[#8a726a]">
        <span>Assiduité des sessions complétées</span>
        <span className="font-semibold text-[#486b52]">Membres & Invités</span>
      </div>
    </div>
  );
};

import type { IRecentActivitySummary } from '@jrs/shared';
import { CalendarCheck, CheckCircle, Clock } from '@phosphor-icons/react';
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
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between transition-all hover:border-slate-200">
      {/* Header (Matching Transaction History in Reference Image) */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/70 shrink-0">
            <CalendarCheck size={19} weight="duotone" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
              Dernières Activités Réalisées
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Historique des sessions & taux de participation
            </p>
          </div>
        </div>

        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100 px-2.5 py-1 rounded-full transition-colors cursor-pointer border border-emerald-100/50"
          >
            Voir tout
          </button>
        )}
      </div>

      {/* Activities List */}
      <div className="py-2 flex flex-col gap-2 flex-1">
        {activities.length === 0 ? (
          <div className="my-auto py-10 text-center text-xs text-slate-400">
            Aucune activité passée pour le moment.
          </div>
        ) : (
          activities.map((act) => {
            const cfg = getActivityTypeConfig(act.activityType);
            const color = ACTIVITY_TYPE_COLORS[act.activityType] || '#16a34a';
            const dateStr = new Date(act.startDate).toLocaleDateString(
              'fr-FR',
              {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              },
            );

            return (
              <div
                key={act.id}
                onClick={() => onSelectActivity?.(act.id)}
                className="p-3 rounded-2xl border border-slate-100/80 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-between gap-3 cursor-pointer group"
              >
                {/* Left: Circular Category Icon & Title */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: color }}
                  >
                    <CalendarCheck size={18} weight="bold" />
                  </div>

                  <div className="flex flex-col min-w-0 flex-1">
                    <span
                      className="font-bold text-xs text-slate-900 truncate leading-tight group-hover:text-emerald-700 transition-colors"
                      title={act.title}
                    >
                      {act.title}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-medium">
                      <span>{dateStr}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-600">
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Turnout Rate & Sealed Status Badge */}
                <div className="flex flex-col items-end shrink-0 gap-0.5">
                  <span className="text-xs font-black text-slate-900">
                    +{act.totalPresent || 0} participants
                  </span>
                  <div className="flex items-center gap-1.5">
                    {act.isAttendanceLocked ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md">
                        <CheckCircle size={10} weight="fill" />
                        <span>Scellé</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-md">
                        <Clock size={10} weight="bold" />
                        <span>En attente</span>
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-slate-400">
                      ({act.turnoutRate}%)
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

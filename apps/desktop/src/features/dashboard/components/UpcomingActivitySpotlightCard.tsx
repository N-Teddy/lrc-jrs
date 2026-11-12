import type { IUpcomingActivitySpotlight } from '@jrs/shared';
import {
  ArrowRight,
  CalendarBlank,
  Clock,
  MapPin,
  Sparkle,
} from '@phosphor-icons/react';
import type React from 'react';
import { getActivityTypeConfig } from '../../activities/utils/activity-ui.utils';
import { ACTIVITY_TYPE_COLORS } from './ActivityTypeBreakdownCard';

interface UpcomingActivitySpotlightCardProps {
  activity?: IUpcomingActivitySpotlight;
  onOpenActivity?: (activityId: string) => void;
}

export const UpcomingActivitySpotlightCard: React.FC<
  UpcomingActivitySpotlightCardProps
> = ({ activity, onOpenActivity }) => {
  if (!activity) {
    return (
      <div className="bg-white rounded-xl border border-[#e8e1dd] shadow-xs p-5 flex flex-col justify-between h-full transition-all hover:border-[#cfc4be]">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#f4ece9]">
          <div className="w-8 h-8 rounded-lg bg-[#faf2ee] text-[#8a726a] flex items-center justify-center border border-[#e8e1dd]">
            <CalendarBlank size={18} weight="duotone" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-[#1e1b19]">
              Prochaine Activité
            </h3>
            <p className="text-[11px] text-[#8a726a]">À l'agenda</p>
          </div>
        </div>

        <div className="my-auto py-8 text-center text-xs text-[#8a726a] flex flex-col items-center justify-center gap-1.5">
          <CalendarBlank size={28} className="text-[#8a726a]/40" />
          <span>Aucune activité planifiée pour le moment.</span>
        </div>

        <div className="pt-2.5 border-t border-[#f4ece9] text-[11px] text-[#8a726a] text-center italic">
          Planifiez une nouvelle session via l'onglet Activités.
        </div>
      </div>
    );
  }

  const typeConfig = getActivityTypeConfig(activity.activityType);
  const typeColor = ACTIVITY_TYPE_COLORS[activity.activityType] || '#b85028';
  const start = new Date(activity.startDate);
  const formattedDate = start.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const formattedTime = start.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-white rounded-xl border border-[#e8e1dd] shadow-xs p-5 flex flex-col justify-between h-full transition-all hover:border-[#cfc4be]">
      {/* Header with Countdown Badge */}
      <div className="flex items-center justify-between pb-3 border-b border-[#f4ece9]">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: typeColor }}
          />
          <span className="text-xs font-bold text-[#1e1b19]">
            {typeConfig.label}
          </span>
        </div>

        {activity.isToday ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ffdad4] text-[#9f2f23] text-[10px] font-extrabold animate-pulse">
            <Sparkle size={11} weight="fill" />
            <span>Aujourd'hui !</span>
          </span>
        ) : activity.daysUntil === 1 ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fff2ee] text-[#b85028] text-[10px] font-bold border border-[#ffdbcf]">
            Demain
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#faf2ee] text-[#57423b] text-[10px] font-bold border border-[#e8e1dd]">
            Dans {activity.daysUntil} jours
          </span>
        )}
      </div>

      {/* Main Activity Details */}
      <div className="py-4 flex flex-col gap-2.5">
        <h4
          className="text-base font-extrabold text-[#1e1b19] line-clamp-2 leading-snug hover:text-[#b85028] transition-colors cursor-pointer"
          onClick={() => onOpenActivity?.(activity.id)}
          title={activity.title}
        >
          {activity.title}
        </h4>

        <div className="flex flex-col gap-1.5 text-xs text-[#57423b]">
          <div className="flex items-center gap-2">
            <CalendarBlank size={14} className="text-[#8a726a] shrink-0" />
            <span className="capitalize font-medium">{formattedDate}</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock size={14} className="text-[#8a726a] shrink-0" />
            <span className="font-mono text-[11px] font-semibold text-[#1e1b19]">
              {formattedTime}
            </span>
          </div>

          {activity.locationVenue && (
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-[#8a726a] shrink-0" />
              <span className="truncate">{activity.locationVenue}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#8a726a]">
            <span>Pôle organisateur :</span>
            <span className="font-bold text-[#b85028]">
              {activity.hostTownName}
            </span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-3 border-t border-[#f4ece9]">
        <button
          type="button"
          onClick={() => onOpenActivity?.(activity.id)}
          className="w-full h-9 rounded-lg bg-[#b85028] hover:bg-[#a44520] text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Consulter le registre</span>
          <ArrowRight size={14} weight="bold" />
        </button>
      </div>
    </div>
  );
};

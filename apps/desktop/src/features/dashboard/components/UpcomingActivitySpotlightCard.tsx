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
  onCreateActivity?: () => void;
}

export const UpcomingActivitySpotlightCard: React.FC<
  UpcomingActivitySpotlightCardProps
> = ({ activity, onOpenActivity, onCreateActivity }) => {
  if (!activity) {
    return (
      <div className="bg-white rounded-2xl border border-[#e8e1dd] shadow-xs p-5 transition-all hover:border-[#cfc4be]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#faf2ee] text-[#8a726a] flex items-center justify-center border border-[#e8e1dd] shrink-0">
              <CalendarBlank size={22} weight="duotone" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-[#1e1b19]">
                  Prochaine Activité à l'Agenda
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#faf2ee] text-[#8a726a] text-[10px] font-bold border border-[#e8e1dd]">
                  Aucun événement
                </span>
              </div>
              <p className="text-xs text-[#8a726a] mt-0.5">
                Aucune session n'est encore programmée pour votre paroisse sur
                cette période.
              </p>
            </div>
          </div>
          {onCreateActivity && (
            <button
              type="button"
              onClick={onCreateActivity}
              className="h-9 px-4 rounded-xl bg-[#b85028] hover:bg-[#a44520] text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <span>+ Programmer une activité</span>
            </button>
          )}
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
    <div className="relative overflow-hidden bg-gradient-to-br from-[#fff7f5] via-white to-white rounded-2xl border border-[#ffdbcf] shadow-xs p-5 transition-all hover:border-[#ffb59c] hover:shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Activity Type Pill, Title, Details */}
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold shadow-2xs border"
              style={{
                backgroundColor: `${typeColor}15`,
                color: typeColor,
                borderColor: `${typeColor}30`,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: typeColor }}
              />
              {typeConfig.label}
            </span>

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

            <span className="text-[11px] text-[#8a726a] font-medium hidden sm:inline">
              Pôle organisateur :{' '}
              <strong className="text-[#b85028]">
                {activity.hostTownName}
              </strong>
            </span>
          </div>

          <h3
            className="text-base sm:text-lg font-extrabold text-[#1e1b19] tracking-tight hover:text-[#b85028] transition-colors cursor-pointer line-clamp-1"
            onClick={() => onOpenActivity?.(activity.id)}
            title={activity.title}
          >
            {activity.title}
          </h3>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#57423b]">
            <div className="flex items-center gap-1.5">
              <CalendarBlank size={14} className="text-[#b85028] shrink-0" />
              <span className="capitalize font-semibold">{formattedDate}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-[#8a726a] shrink-0" />
              <span className="font-mono text-[11px] font-bold text-[#1e1b19]">
                {formattedTime}
              </span>
            </div>

            {activity.locationVenue && (
              <div className="flex items-center gap-1.5 truncate max-w-xs">
                <MapPin size={14} className="text-[#8a726a] shrink-0" />
                <span className="truncate">{activity.locationVenue}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: CTA Button */}
        <div className="shrink-0 flex items-center">
          <button
            type="button"
            onClick={() => onOpenActivity?.(activity.id)}
            className="h-10 px-5 rounded-xl bg-[#b85028] hover:bg-[#a44520] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer group"
          >
            <span>Consulter le registre</span>
            <ArrowRight
              size={14}
              weight="bold"
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </button>
        </div>
      </div>
    </div>
  );
};

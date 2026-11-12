import type { IAttendanceTrendPoint } from '@jrs/shared';
import { ChartBar, Users } from '@phosphor-icons/react';
import type React from 'react';
import { useState } from 'react';

interface AttendanceTrendCardProps {
  trend: IAttendanceTrendPoint[];
}

export const AttendanceTrendCard: React.FC<AttendanceTrendCardProps> = ({
  trend,
}) => {
  const [hoveredPoint, setHoveredPoint] =
    useState<IAttendanceTrendPoint | null>(null);

  const maxAttendees = Math.max(
    ...trend.map((t) => t.totalPresent),
    20, // baseline scale
  );

  return (
    <div className="bg-white rounded-xl border border-[#e8e1dd] shadow-xs p-5 flex flex-col justify-between h-full transition-all hover:border-[#cfc4be]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#f4ece9]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#edf3ee] text-[#486b52] flex items-center justify-center border border-[#c2e9ca]">
            <ChartBar size={18} weight="duotone" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-[#1e1b19]">
              Courbe d'Assiduité & Fréquentation
            </h3>
            <p className="text-[11px] text-[#8a726a]">
              Dernières activités • Répartition Membres vs Invités
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#486b52]" />
            <span className="text-[#57423b] font-medium">Membres</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#b85028]" />
            <span className="text-[#57423b] font-medium">Invités</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="relative py-6 flex-1 flex flex-col justify-end min-h-[170px]">
        {trend.length === 0 ? (
          <div className="my-auto py-8 text-center text-xs text-[#8a726a] flex flex-col items-center justify-center gap-1.5">
            <Users size={28} className="text-[#8a726a]/40" />
            <span>Aucune donnée d'assiduité sur les événements récents.</span>
          </div>
        ) : (
          <div className="flex items-end justify-around gap-2 sm:gap-4 h-[140px] pt-4 px-2">
            {trend.map((point) => {
              const memberHeightPct = Math.min(
                100,
                Math.round((point.membersPresent / maxAttendees) * 100),
              );
              const guestHeightPct = Math.min(
                100,
                Math.round((point.guestsPresent / maxAttendees) * 100),
              );
              const dateStr = new Date(point.date).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
              });

              const isHovered = hoveredPoint?.activityId === point.activityId;

              return (
                <div
                  key={point.activityId}
                  className="flex-1 flex flex-col items-center group relative cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(point)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  {/* Floating Value Pill */}
                  <div
                    className={`text-[10px] font-mono font-bold text-[#1e1b19] mb-1 transition-all ${
                      isHovered ? 'scale-110 text-[#b85028]' : 'text-[#57423b]'
                    }`}
                  >
                    {point.totalPresent}
                  </div>

                  {/* Stacked Bar Container */}
                  <div className="w-8 sm:w-11 bg-[#faf2ee] rounded-t-md overflow-hidden flex flex-col-reverse h-[95px] border border-[#e8e1dd] transition-all group-hover:border-[#b85028]/40 group-hover:shadow-xs">
                    {/* Member Segment */}
                    <div
                      style={{ height: `${memberHeightPct}%` }}
                      className="w-full bg-[#486b52] transition-all group-hover:bg-[#3d5a45]"
                      title={`Membres : ${point.membersPresent}`}
                    />
                    {/* Guest Segment */}
                    <div
                      style={{ height: `${guestHeightPct}%` }}
                      className="w-full bg-[#b85028] transition-all group-hover:bg-[#a44520]"
                      title={`Invités : ${point.guestsPresent}`}
                    />
                  </div>

                  {/* Date label */}
                  <span className="text-[10px] font-bold text-[#8a726a] mt-2 whitespace-nowrap">
                    {dateStr}
                  </span>
                  <span className="text-[9px] text-[#486b52] font-semibold">
                    {point.turnoutRate}%
                  </span>

                  {/* Tooltip Card on Hover */}
                  {isHovered && (
                    <div className="absolute bottom-[105px] z-30 pointer-events-none bg-[#1e1b19] text-white p-2.5 rounded-lg shadow-xl text-xs w-44 animate-in fade-in zoom-in-95 duration-150">
                      <p className="font-bold text-white text-[11px] truncate leading-tight">
                        {point.title}
                      </p>
                      <div className="mt-1.5 pt-1.5 border-t border-white/20 flex flex-col gap-0.5 text-[10px]">
                        <div className="flex justify-between">
                          <span className="text-[#a9d0b2]">Membres :</span>
                          <span className="font-mono font-bold">
                            {point.membersPresent}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#ffb59c]">Invités :</span>
                          <span className="font-mono font-bold">
                            {point.guestsPresent}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold pt-1 border-t border-white/15">
                          <span>Total :</span>
                          <span className="font-mono">
                            {point.totalPresent} ({point.turnoutRate}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-2.5 border-t border-[#f4ece9] flex items-center justify-between text-[11px] text-[#8a726a]">
        <span>Fréquentation totale sur 5 activités</span>
        <span className="font-semibold text-[#486b52]">
          {trend.reduce((sum, p) => sum + p.totalPresent, 0)} présences
          enregistrées
        </span>
      </div>
    </div>
  );
};

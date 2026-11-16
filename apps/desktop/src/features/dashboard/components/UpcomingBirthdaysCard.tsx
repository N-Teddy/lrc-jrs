import type { IUpcomingBirthday } from '@jrs/shared';
import {
  Cake,
  Confetti,
  Gift,
  Sparkle,
  WhatsappLogo,
} from '@phosphor-icons/react';
import type React from 'react';
import { UserAvatar } from '../../../components/UserAvatar';

interface UpcomingBirthdaysCardProps {
  birthdays: IUpcomingBirthday[];
  onTriggerCelebration?: (celebrant: IUpcomingBirthday) => void;
}

export const UpcomingBirthdaysCard: React.FC<UpcomingBirthdaysCardProps> = ({
  birthdays,
  onTriggerCelebration,
}) => {
  const currentMonthName = new Date().toLocaleDateString('fr-FR', {
    month: 'long',
  });
  const capitalizedMonth =
    currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

  const todayCount = birthdays.filter((b) => b.isToday).length;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between transition-all hover:border-slate-200">
      {/* 1. Header with Badge */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/70 shrink-0">
            <Cake size={19} weight="duotone" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5 tracking-tight">
              <span>Anniversaires du Mois</span>
              {todayCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black animate-pulse">
                  <Sparkle size={10} weight="fill" />
                  <span>Aujourd'hui !</span>
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium capitalize">
              {capitalizedMonth} 2026 • {birthdays.length} célébrant(s)
            </p>
          </div>
        </div>

        <div className="text-xs font-black text-slate-700 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-150">
          {birthdays.length}
        </div>
      </div>

      {/* 2. Birthday Today Celebration Banner */}
      {todayCount > 0 && onTriggerCelebration && (
        <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-emerald-50 via-lime-50 to-emerald-50 border border-emerald-200/80 flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkle
              size={18}
              weight="fill"
              className="text-emerald-600 animate-spin shrink-0"
            />
            <span className="text-xs font-black text-emerald-900 truncate">
              {todayCount === 1
                ? 'Anniversaire aujourd’hui !'
                : `${todayCount} Anniversaires aujourd’hui !`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              const celebrant = birthdays.find((b) => b.isToday);
              if (celebrant && onTriggerCelebration) {
                onTriggerCelebration(celebrant);
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Confetti size={14} weight="bold" />
            <span>Fêter 🎉</span>
          </button>
        </div>
      )}

      {/* 3. Quick Celebrants Avatar Strip (Matching the Quick Payment avatar strip in Reference Image 1) */}
      {birthdays.length > 0 && (
        <div className="pt-3 pb-1">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Célébrants en vedette</span>
            <span className="text-emerald-600">{birthdays.length} membres</span>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto pb-1.5 scrollbar-none">
            {birthdays.map((b) => {
              const firstName = b.fullName.split(' ')[0];
              return (
                <button
                  key={`strip-${b.id}`}
                  type="button"
                  onClick={() => onTriggerCelebration?.(b)}
                  className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer focus:outline-none"
                  title={`${b.fullName} • ${b.birthDay} ${capitalizedMonth.slice(0, 4)}`}
                >
                  <div className="relative">
                    <UserAvatar
                      avatarUrl={b.avatarUrl}
                      name={b.fullName}
                      size="md"
                      className={`transition-transform group-hover:scale-105 ${
                        b.isToday
                          ? 'ring-2 ring-emerald-500 ring-offset-2'
                          : 'ring-1 ring-slate-200'
                      }`}
                    />
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] shadow-xs border border-white ${
                        b.isToday
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      🎂
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 group-hover:text-emerald-700 truncate max-w-[56px] text-center">
                    {firstName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Detailed Celebrants List Container */}
      <div className="py-2 flex flex-col gap-2 flex-1 overflow-y-auto max-h-[250px] pr-1">
        {birthdays.length === 0 ? (
          <div className="py-8 px-4 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2.5 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Gift size={24} weight="duotone" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-slate-700">
                Aucun anniversaire en {capitalizedMonth}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[240px]">
                Des rappels automatiques et notifications WhatsApp seront
                envoyés 7 jours avant chaque anniversaire.
              </p>
            </div>
          </div>
        ) : (
          birthdays.map((b) => {
            const whatsappUrl = b.phoneNumber
              ? `https://wa.me/${b.phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Joyeux Anniversaire ${b.fullName} ! 🎂🎉 Toute la communauté JRS te souhaite une excellente journée et de riches bénédictions ! ✨`,
                )}`
              : undefined;

            return (
              <div
                key={b.id}
                className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                  b.isToday
                    ? 'bg-emerald-50/60 border-emerald-200 ring-1 ring-emerald-500/20 shadow-xs'
                    : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50 hover:border-slate-200'
                }`}
              >
                {/* Celebrant Info */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    <UserAvatar
                      avatarUrl={b.avatarUrl}
                      name={b.fullName}
                      size="sm"
                      className={
                        b.isToday
                          ? 'border-2 border-emerald-600 bg-emerald-50 text-emerald-700'
                          : undefined
                      }
                    />
                    {b.isToday && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs border border-white">
                        <Cake size={9} weight="fill" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className="font-bold text-xs text-slate-900 truncate leading-tight"
                        title={b.fullName}
                      >
                        {b.fullName}
                      </span>
                      {b.ageTurning > 0 && (
                        <span className="text-[10px] font-extrabold text-emerald-700 shrink-0">
                          ({b.ageTurning} ans)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500 font-medium">
                      {b.isToday ? (
                        <span className="font-extrabold text-emerald-700 flex items-center gap-0.5">
                          <Sparkle size={10} weight="fill" />
                          <span>Aujourd'hui !</span>
                        </span>
                      ) : b.daysUntil > 0 ? (
                        <span className="text-slate-600 font-semibold">
                          {b.birthDay} {capitalizedMonth.slice(0, 4)} • dans{' '}
                          {b.daysUntil} j
                        </span>
                      ) : (
                        <span className="text-slate-400">
                          {b.birthDay} {capitalizedMonth.slice(0, 4)} • passé
                        </span>
                      )}
                      {b.homeTownName && (
                        <span className="text-slate-400 truncate">
                          • {b.homeTownName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {b.isToday && onTriggerCelebration && (
                    <button
                      type="button"
                      onClick={() => onTriggerCelebration(b)}
                      className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                      title="Lancer l'animation de fête"
                    >
                      <Confetti size={12} weight="bold" />
                      <span className="hidden sm:inline">Célébrer</span>
                    </button>
                  )}

                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-8 h-8 rounded-xl bg-emerald-500/10 hover:bg-[#25D366] text-[#128C7E] hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                      title={`Souhaiter joyeux anniversaire sur WhatsApp à ${b.fullName}`}
                    >
                      <WhatsappLogo size={16} weight="fill" />
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Footer prompt */}
      <div className="pt-2.5 border-t border-slate-100 text-[10px] text-slate-400 text-center font-medium">
        Les coordinateurs reçoivent des alertes automatiques 7 jours avant et le
        jour J.
      </div>
    </div>
  );
};

export const MonthlyBirthdaysCard = UpcomingBirthdaysCard;

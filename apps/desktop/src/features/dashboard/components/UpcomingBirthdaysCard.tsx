import type { IUpcomingBirthday } from '@jrs/shared';
import { Cake, Confetti, Sparkle, WhatsappLogo } from '@phosphor-icons/react';
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
    <div className="bg-white rounded-2xl border border-[#e8e1dd] shadow-xs p-5 flex flex-col justify-between transition-all hover:border-[#cfc4be]">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#f4ece9]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#fff2ee] text-[#b85028] flex items-center justify-center border border-[#ffdbcf]">
            <Cake size={18} weight="duotone" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-[#1e1b19] flex items-center gap-1.5">
              <span>Anniversaires du Mois</span>
              {todayCount > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-[#ffdad4] text-[#9f2f23] text-[10px] font-extrabold animate-pulse">
                  <Sparkle size={10} weight="fill" />
                  <span>Aujourd'hui !</span>
                </span>
              )}
            </h3>
            <p className="text-[11px] text-[#8a726a] capitalize">
              {capitalizedMonth} 2026 • {birthdays.length} célébrant(s)
            </p>
          </div>
        </div>

        <div className="text-[11px] font-bold text-[#8a726a] bg-[#faf2ee] px-2 py-0.5 rounded border border-[#e8e1dd]">
          {birthdays.length}
        </div>
      </div>

      {/* Birthday Celebrant Celebration Action Banner if someone has a birthday today */}
      {todayCount > 0 && onTriggerCelebration && (
        <div className="mt-3 p-2.5 rounded-xl bg-gradient-to-r from-[#fff2ee] to-[#ffe8e0] border border-[#ffb59c] flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkle
              size={16}
              weight="fill"
              className="text-[#b85028] animate-spin shrink-0"
            />
            <span className="text-xs font-extrabold text-[#b85028] truncate">
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
            className="px-2.5 py-1 rounded-lg bg-[#b85028] hover:bg-[#a44520] text-white text-[11px] font-bold shadow-xs transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Confetti size={13} weight="bold" />
            <span>Fêter 🎉</span>
          </button>
        </div>
      )}

      {/* Birthday List Container */}
      <div className="py-3 flex flex-col gap-2.5 flex-1 overflow-y-auto max-h-[260px] pr-1">
        {birthdays.length === 0 ? (
          <div className="py-6 px-4 text-center text-xs text-[#8a726a] flex flex-col items-center justify-center gap-2 bg-[#faf2ee]/40 rounded-xl border border-dashed border-[#e8e1dd]">
            <div className="w-10 h-10 rounded-full bg-[#fff2ee] text-[#b85028] flex items-center justify-center border border-[#ffdbcf]">
              <Cake size={20} weight="duotone" />
            </div>
            <div>
              <p className="font-bold text-[#57423b]">
                Aucun anniversaire en {capitalizedMonth}
              </p>
              <p className="text-[11px] text-[#8a726a] mt-0.5">
                Des rappels automatiques seront envoyés 7 jours avant chaque
                anniversaire.
              </p>
            </div>
          </div>
        ) : (
          birthdays.map((b) => {
            const whatsappUrl = b.phoneNumber
              ? `https://wa.me/${b.phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Joyeux Anniversaire ${b.fullName} ! 🎂🎉 Toute la communauté JRS te souhaite une excellente journée ! ✨`,
                )}`
              : undefined;

            return (
              <div
                key={b.id}
                className={`p-2.5 rounded-lg border transition-all flex items-center justify-between gap-2.5 ${
                  b.isToday
                    ? 'bg-[#fff5f2] border-[#ffb59c] ring-1 ring-[#b85028]/25 shadow-2xs'
                    : 'bg-[#faf2ee]/40 border-[#e8e1dd] hover:bg-[#faf2ee] hover:border-[#cfc4be]'
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
                          ? 'border-2 border-[#b85028] bg-[#fff2ee] text-[#b85028]'
                          : undefined
                      }
                    />
                    {b.isToday && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#b85028] text-white flex items-center justify-center shadow-xs border border-white">
                        <Cake size={9} weight="fill" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="font-bold text-xs text-[#1e1b19] truncate leading-tight"
                        title={b.fullName}
                      >
                        {b.fullName}
                      </span>
                      {b.ageTurning > 0 && (
                        <span className="text-[10px] font-bold text-[#b85028] shrink-0">
                          ({b.ageTurning} ans)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-[#8a726a] font-medium">
                      {b.isToday ? (
                        <span className="font-extrabold text-[#b85028] flex items-center gap-0.5">
                          <Sparkle size={10} weight="fill" />
                          <span>Aujourd'hui !</span>
                        </span>
                      ) : b.daysUntil > 0 ? (
                        <span>
                          {b.birthDay} {capitalizedMonth.slice(0, 4)} • dans{' '}
                          {b.daysUntil} j
                        </span>
                      ) : (
                        <span>
                          {b.birthDay} {capitalizedMonth.slice(0, 4)} • passé
                        </span>
                      )}
                      {b.homeTownName && (
                        <span className="truncate">• {b.homeTownName}</span>
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
                      className="px-2 py-1 rounded-md bg-[#b85028] hover:bg-[#a44520] text-white text-[10px] font-bold shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
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
                      className="w-7 h-7 rounded-md bg-[#25D366]/15 hover:bg-[#25D366] text-[#128C7E] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                      title={`Souhaiter joyeux anniversaire sur WhatsApp à ${b.fullName}`}
                    >
                      <WhatsappLogo size={14} weight="fill" />
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer prompt */}
      <div className="pt-2.5 border-t border-[#f4ece9] text-[10px] text-[#8a726a] text-center italic">
        Les coordinateurs reçoivent des alertes automatiques 7 jours avant et le
        jour J.
      </div>
    </div>
  );
};

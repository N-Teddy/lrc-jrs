import { ArrowRight, Sparkle } from '@phosphor-icons/react';
import type React from 'react';

interface PastoralTipCardProps {
  onOpenAction?: () => void;
}

export const PastoralTipCard: React.FC<PastoralTipCardProps> = ({
  onOpenAction,
}) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#f1f9ec] via-[#f7fcf5] to-[#edf7e8] rounded-3xl border border-emerald-100/70 shadow-sm p-5 flex flex-col justify-between transition-all hover:border-emerald-200">
      {/* Subtle Pattern Grid / Mosaic in background (matching reference design) */}
      <div className="absolute right-0 top-0 bottom-0 w-28 opacity-25 pointer-events-none flex flex-wrap gap-1 p-3">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={`mosaic-${i}`}
            className="w-3.5 h-3.5 rounded-sm bg-emerald-500"
            style={{ opacity: ((i * 7) % 10) / 10 + 0.1 }}
          />
        ))}
      </div>

      <div>
        <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
          <Sparkle size={13} weight="fill" className="text-emerald-600" />
          <span>Vigilance & Recommandations</span>
        </div>

        <h3 className="font-extrabold text-sm text-slate-900 mt-1 leading-snug max-w-[280px]">
          Optimisez la gestion de votre centre paroissial
        </h3>

        <p className="text-xs text-slate-600 mt-1 font-medium max-w-[300px] leading-relaxed">
          Pensez à sceller les présences des sessions terminées et à déposer les
          feuilles de rapport sur Google Drive.
        </p>
      </div>

      <div className="pt-3">
        <button
          type="button"
          onClick={onOpenAction}
          className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800 hover:text-emerald-900 group cursor-pointer"
        >
          <span>Consulter les alertes</span>
          <ArrowRight
            size={13}
            weight="bold"
            className="transition-transform group-hover:translate-x-1"
          />
        </button>
      </div>
    </div>
  );
};

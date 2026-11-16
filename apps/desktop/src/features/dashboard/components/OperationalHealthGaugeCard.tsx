import type { IOperationalAlerts } from '@jrs/shared';
import { CaretDown, TrendUp } from '@phosphor-icons/react';
import type React from 'react';

interface OperationalHealthGaugeCardProps {
  alerts: IOperationalAlerts;
  onOpenAlerts?: () => void;
}

export const OperationalHealthGaugeCard: React.FC<
  OperationalHealthGaugeCardProps
> = ({ alerts, onOpenAlerts }) => {
  // Score based on pending alerts: higher pending items = lower score
  const pendingTotal =
    (alerts.pendingIntakesCount || 0) +
    (alerts.unsealedAttendanceCount || 0) +
    (alerts.missingReportsCount || 0);

  // Compute a compliance score between 40% and 98%
  const score = Math.max(35, Math.min(98, 100 - pendingTotal * 2));

  // Semi-circle gauge parameters (radius = 50, center = 70, 70)
  const radius = 50;
  const strokeWidth = 14;
  const circumference = Math.PI * radius; // Half-circle perimeter
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between transition-all hover:border-slate-200">
      {/* Header (Matching Financial Health in Reference) */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Santé Opérationnelle
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <h4 className="text-2xl font-black text-slate-900">{score}%</h4>
            <span className="inline-flex items-center gap-0.5 text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/60">
              <TrendUp size={12} weight="bold" />
              <span>Conforme</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-150 text-xs font-bold text-slate-700">
          <span>30j</span>
          <CaretDown size={12} weight="bold" className="text-slate-400" />
        </div>
      </div>

      {/* Modern Semi-Circular Radial Gauge (Matching Reference Image 1) */}
      <div className="flex flex-col items-center justify-center my-1 relative">
        <svg
          viewBox="0 0 140 85"
          className="w-44 h-28 overflow-visible"
          aria-label={`Jauge de conformité: ${score}%`}
        >
          {/* Background Arc */}
          <path
            d="M 15 75 A 50 50 0 0 1 125 75"
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Foreground Animated Gauge Arc (Emerald Green Gradient) */}
          <path
            d="M 15 75 A 50 50 0 0 1 125 75"
            fill="none"
            stroke="url(#gauge-gradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />

          <defs>
            <linearGradient
              id="gauge-gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#84cc16" />
              <stop offset="50%" stopColor="#70C044" />
              <stop offset="100%" stopColor="#16a34a" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Percentage Display */}
        <div className="absolute bottom-2 flex flex-col items-center text-center">
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            {score}%
          </span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            Conformité Globale
          </span>
        </div>
      </div>

      {/* Subtext description */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
        <span>{pendingTotal} formalité(s) restante(s)</span>
        {onOpenAlerts && (
          <button
            type="button"
            onClick={onOpenAlerts}
            className="text-emerald-700 hover:text-emerald-800 font-bold cursor-pointer"
          >
            Traiter &gt;
          </button>
        )}
      </div>
    </div>
  );
};

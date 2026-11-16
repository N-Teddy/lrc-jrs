import type { IDashboardKpis } from '@jrs/shared';
import { CheckCircle, PencilSimple } from '@phosphor-icons/react';
import type React from 'react';

interface QuotaProgressCardProps {
  kpis: IDashboardKpis;
  onManageMembers?: () => void;
}

export const QuotaProgressCard: React.FC<QuotaProgressCardProps> = ({
  kpis,
  onManageMembers,
}) => {
  const targetQuota = Math.max(30, kpis.totalMembers);
  const activeCount = kpis.activeJrCount || 0;
  const pct = Math.min(100, Math.round((activeCount / targetQuota) * 100));

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between transition-all hover:border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
            Objectif Quota Jeunes Relais
          </h3>
          <p className="text-[11px] text-slate-400 font-medium">
            Capacité du centre paroissial
          </p>
        </div>

        {onManageMembers && (
          <button
            type="button"
            onClick={onManageMembers}
            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors cursor-pointer border border-slate-100"
            title="Modifier ou réassigner les quotas"
          >
            <PencilSimple size={14} weight="bold" />
          </button>
        )}
      </div>

      {/* Modern Rounded Progress Bar (Matching reference progress bar) */}
      <div className="my-3">
        <div className="w-full h-3.5 rounded-full bg-slate-100 overflow-hidden p-0.5 flex items-center">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#70C044] to-[#5ea833] transition-all duration-500 shadow-xs"
            style={{ width: `${Math.max(6, pct)}%` }}
          />
        </div>

        {/* Value bounds */}
        <div className="flex items-center justify-between mt-2 text-xs font-bold text-slate-700">
          <span className="text-emerald-700 font-black">
            {activeCount} JR désignés ({pct}%)
          </span>
          <span className="text-slate-400">Objectif: {targetQuota} JR</span>
        </div>
      </div>

      {/* Subtext info */}
      <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between pt-1 border-t border-slate-100">
        <span>
          Statut actuel du pôle :{' '}
          {pct >= 90 ? 'Quota optimal atteint' : 'Recrutement en cours'}
        </span>
        {pct >= 90 && (
          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
            <CheckCircle size={13} weight="fill" />
            <span>Conforme</span>
          </span>
        )}
      </div>
    </div>
  );
};

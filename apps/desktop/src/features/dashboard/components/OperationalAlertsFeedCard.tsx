import type { IOperationalAlerts, IRecentTransferItem } from '@jrs/shared';
import {
  ArrowsLeftRight,
  BellSimpleRinging,
  FileText,
  LockSimple,
  ShieldCheck,
} from '@phosphor-icons/react';
import type React from 'react';

interface OperationalAlertsFeedCardProps {
  alerts: IOperationalAlerts;
  transfers: IRecentTransferItem[];
  onNavigateToIntake?: () => void;
  onNavigateToTransfers?: () => void;
}

export const OperationalAlertsFeedCard: React.FC<
  OperationalAlertsFeedCardProps
> = ({ alerts, transfers, onNavigateToIntake, onNavigateToTransfers }) => {
  const hasAlerts =
    alerts.pendingIntakesCount > 0 ||
    alerts.unsealedAttendanceCount > 0 ||
    alerts.missingReportsCount > 0;

  return (
    <div className="bg-white rounded-2xl border border-[#e8e1dd] shadow-xs p-5 flex flex-col justify-between transition-all hover:border-[#cfc4be]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#f4ece9]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#fff2ee] text-[#b85028] flex items-center justify-center border border-[#ffdbcf]">
            <BellSimpleRinging size={18} weight="duotone" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-[#1e1b19]">
              Alertes & Flux Opérationnel
            </h3>
            <p className="text-[11px] text-[#8a726a]">
              Actions requises & Mobilité
            </p>
          </div>
        </div>

        {hasAlerts ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ffdad4] text-[#9f2f23] text-[10px] font-bold border border-[#ffb59c]">
            {alerts.pendingIntakesCount +
              alerts.unsealedAttendanceCount +
              alerts.missingReportsCount}{' '}
            alerte(s)
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#edf3ee] text-[#486b52] text-[10px] font-bold border border-[#c2e9ca]">
            À jour
          </span>
        )}
      </div>

      <div className="py-3 flex flex-col gap-3 flex-1">
        {/* Operational Attention Items */}
        <div className="flex flex-col gap-2">
          {/* Pending Intakes */}
          {alerts.pendingIntakesCount > 0 && (
            <div
              onClick={onNavigateToIntake}
              className="p-2.5 rounded-lg bg-[#fff5f2] border border-[#ffb59c] flex items-center justify-between gap-2.5 cursor-pointer hover:bg-[#fff2ee] transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck
                  size={16}
                  weight="fill"
                  className="text-[#b85028] shrink-0"
                />
                <span className="text-xs font-bold text-[#1e1b19] truncate">
                  Admissions en attente de validation
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-[#b85028] text-white text-[11px] font-bold shrink-0 font-mono">
                {alerts.pendingIntakesCount}
              </span>
            </div>
          )}

          {/* Unsealed Attendance */}
          {alerts.unsealedAttendanceCount > 0 && (
            <div className="p-2.5 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <LockSimple
                  size={16}
                  weight="bold"
                  className="text-[#8a726a] shrink-0"
                />
                <span className="text-xs text-[#57423b] truncate">
                  Registres de présence non scellés
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-[#f4ece9] text-[#57423b] text-[11px] font-bold shrink-0 font-mono">
                {alerts.unsealedAttendanceCount}
              </span>
            </div>
          )}

          {/* Missing Reports */}
          {alerts.missingReportsCount > 0 && (
            <div className="p-2.5 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <FileText
                  size={16}
                  weight="bold"
                  className="text-[#8a726a] shrink-0"
                />
                <span className="text-xs text-[#57423b] truncate">
                  Rapports Drive en attente de dépôt
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-[#f4ece9] text-[#57423b] text-[11px] font-bold shrink-0 font-mono">
                {alerts.missingReportsCount}
              </span>
            </div>
          )}
        </div>

        {/* Recent Transfers Sub-section */}
        <div className="pt-2 border-t border-[#f4ece9] flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
            <span>Derniers Transferts</span>
            {onNavigateToTransfers && (
              <button
                type="button"
                onClick={onNavigateToTransfers}
                className="text-[#b85028] hover:underline normal-case cursor-pointer"
              >
                Gérer
              </button>
            )}
          </div>

          {transfers.length === 0 ? (
            <p className="text-xs text-[#8a726a] italic py-1">
              Aucun transfert récent entre paroisses.
            </p>
          ) : (
            transfers.slice(0, 3).map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-2 text-xs text-[#57423b] p-1.5 rounded hover:bg-[#faf2ee] transition-colors"
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                  <ArrowsLeftRight
                    size={13}
                    className="text-[#8a726a] shrink-0"
                  />
                  <span className="font-bold text-[#1e1b19] truncate">
                    {t.memberName}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-mono shrink-0">
                  <span className="bg-[#f4ece9] px-1.5 py-0.2 rounded font-bold">
                    {t.fromTownName}
                  </span>
                  <span>→</span>
                  <span className="bg-[#fff2ee] text-[#b85028] px-1.5 py-0.2 rounded font-bold">
                    {t.toTownName}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2.5 border-t border-[#f4ece9] flex items-center justify-between text-[11px] text-[#8a726a]">
        <span>Coordination paroissiale</span>
        <span className="font-semibold text-[#b85028]">
          Vérifications actives
        </span>
      </div>
    </div>
  );
};

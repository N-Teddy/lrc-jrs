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
  const totalAlertsCount =
    alerts.pendingIntakesCount +
    alerts.unsealedAttendanceCount +
    alerts.missingReportsCount;

  // Compute operational health score (100% when 0 alerts, scales down smoothly)
  const healthScore = Math.max(
    10,
    Math.min(100, Math.round(100 - totalAlertsCount * 1.2)),
  );

  const gaugeColor =
    healthScore >= 80 ? '#486b52' : healthScore >= 50 ? '#e65100' : '#b85028';

  // Semi-circle arc geometry (radius = 36 => arc length = PI * 36 ~ 113.1)
  const arcRadius = 36;
  const arcLength = Math.PI * arcRadius;
  const arcOffset = arcLength - (healthScore / 100) * arcLength;

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
              Alertes & Santé Opérationnelle
            </h3>
            <p className="text-[11px] text-[#8a726a]">
              Actions administratives & Mobilité
            </p>
          </div>
        </div>

        {totalAlertsCount > 0 ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ffdad4] text-[#9f2f23] text-[10px] font-bold border border-[#ffb59c]">
            {totalAlertsCount} à traiter
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#edf3ee] text-[#486b52] text-[10px] font-bold border border-[#c2e9ca]">
            À jour
          </span>
        )}
      </div>

      <div className="py-3 flex flex-col gap-4 flex-1">
        {/* Visual Diagram: Semi-Circular Operational Health Meter */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-[#faf2ee]/70 via-white to-[#faf2ee]/70 border border-[#e8e1dd] flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[#8a726a] uppercase tracking-wider">
              Indice de Conformité
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span
                className="text-xl font-black font-mono leading-none"
                style={{ color: gaugeColor }}
              >
                {healthScore}%
              </span>
              <span className="text-[11px] font-semibold text-[#57423b]">
                {healthScore >= 80
                  ? 'Excellente tenue'
                  : healthScore >= 50
                    ? 'Actions recommandées'
                    : 'Vérifications requises'}
              </span>
            </div>
            <p className="text-[10px] text-[#8a726a] mt-1">
              {totalAlertsCount === 0
                ? 'Tous les registres et rapports sont archivés.'
                : `${totalAlertsCount} formalité(s) administrative(s) en attente.`}
            </p>
          </div>

          {/* SVG Semi-Circle Dial */}
          <div className="relative w-24 h-14 shrink-0 flex items-end justify-center overflow-hidden">
            <svg viewBox="0 0 100 56" className="w-24 h-14">
              {/* Background Arc */}
              <path
                d="M 14 50 A 36 36 0 0 1 86 50"
                fill="none"
                stroke="#e8e1dd"
                strokeWidth="7"
                strokeLinecap="round"
              />
              {/* Colored Gauge Fill Arc */}
              <path
                d="M 14 50 A 36 36 0 0 1 86 50"
                fill="none"
                stroke={gaugeColor}
                strokeWidth="7"
                strokeDasharray={arcLength}
                strokeDashoffset={arcOffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
          </div>
        </div>

        {/* Operational Attention Items */}
        <div className="flex flex-col gap-2">
          {/* Pending Intakes */}
          {alerts.pendingIntakesCount > 0 && (
            <div
              onClick={onNavigateToIntake}
              className="p-2.5 rounded-xl bg-[#fff5f2] border border-[#ffb59c] flex items-center justify-between gap-2.5 cursor-pointer hover:bg-[#fff2ee] transition-colors"
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
            <div className="p-2.5 rounded-xl bg-[#faf2ee] border border-[#e8e1dd] flex items-center justify-between gap-2.5">
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

          {/* Missing Drive Reports */}
          {alerts.missingReportsCount > 0 && (
            <div className="p-2.5 rounded-xl bg-[#faf2ee] border border-[#e8e1dd] flex items-center justify-between gap-2.5">
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

        {/* Recent Transfers Sub-section with Clean Town Badges */}
        <div className="pt-2 border-t border-[#f4ece9] flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
            <span>Derniers Transferts</span>
            {onNavigateToTransfers && (
              <button
                type="button"
                onClick={onNavigateToTransfers}
                className="text-[#b85028] hover:underline normal-case cursor-pointer text-xs"
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
            transfers.slice(0, 3).map((t) => {
              // Sanitize town name if it's a 24-character hex ObjectId
              const cleanFrom = /^[0-9a-fA-F]{24}$/.test(t.fromTownName)
                ? 'Paroisse origine'
                : t.fromTownName;
              const cleanTo = /^[0-9a-fA-F]{24}$/.test(t.toTownName)
                ? 'Paroisse accueil'
                : t.toTownName;

              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-2 text-xs text-[#57423b] p-1.5 rounded-lg hover:bg-[#faf2ee] transition-colors"
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
                  <div className="flex items-center gap-1 text-[10px] font-semibold shrink-0">
                    <span
                      className="bg-[#f4ece9] px-2 py-0.5 rounded-md text-[#57423b] truncate max-w-[80px]"
                      title={cleanFrom}
                    >
                      {cleanFrom}
                    </span>
                    <span className="text-[#8a726a]">→</span>
                    <span
                      className="bg-[#fff2ee] text-[#b85028] px-2 py-0.5 rounded-md font-bold truncate max-w-[80px]"
                      title={cleanTo}
                    >
                      {cleanTo}
                    </span>
                  </div>
                </div>
              );
            })
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

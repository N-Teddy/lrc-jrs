import { useTranslation } from '@jrs/client-core';
import type { IMemberStats } from '@jrs/shared';
import {
  CheckCircle,
  ClockCountdown,
  Prohibit,
  ShieldCheck,
} from '@phosphor-icons/react';
import type React from 'react';

interface AccessStatsOverviewProps {
  stats?: IMemberStats;
  totalMembersCount: number;
  activeAccountsCount: number;
  pendingSetupCount: number;
  suspendedCount: number;
  isLoading: boolean;
}

export const AccessStatsOverview: React.FC<AccessStatsOverviewProps> = ({
  stats,
  totalMembersCount,
  activeAccountsCount,
  pendingSetupCount,
  suspendedCount,
  isLoading,
}) => {
  const { t } = useTranslation(['access', 'common']);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-xl bg-white border border-[#e8e1dd] p-5 flex flex-col justify-between"
          >
            <div className="h-4 w-28 bg-[#f4ece9] rounded" />
            <div className="h-7 w-16 bg-[#f4ece9] rounded" />
          </div>
        ))}
      </div>
    );
  }

  const portalAccountsTotal =
    stats?.appAccessCount ??
    activeAccountsCount + pendingSetupCount + suspendedCount;
  const total = stats?.totalMembers ?? totalMembersCount;
  const onboardedPercent =
    total > 0 ? Math.round((portalAccountsTotal / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Portal Accounts */}
      <div className="bg-white rounded-xl border border-[#e8e1dd] p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#8a726a] uppercase tracking-wider">
            {t('access:stats.totalPortal')}
          </span>
          <div className="w-9 h-9 rounded-lg bg-[#fff2ee] border border-[#ffdbcf] text-[#b85028] flex items-center justify-center">
            <ShieldCheck size={20} weight="duotone" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#1e1b19]">
              {portalAccountsTotal}
            </span>
            <span className="text-xs font-bold text-[#8a726a]">
              / {total} {t('access:stats.totalMembers')}
            </span>
          </div>
          <div className="mt-2 w-full bg-[#faf2ee] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#b85028] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, onboardedPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Active & Verified */}
      <div className="bg-white rounded-xl border border-[#e8e1dd] p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#8a726a] uppercase tracking-wider">
            {t('access:stats.activeVerified')}
          </span>
          <div className="w-9 h-9 rounded-lg bg-[#c2e9ca] border border-[#a9d0b2] text-[#2c4e37] flex items-center justify-center">
            <CheckCircle size={20} weight="fill" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-black text-[#2c4e37]">
            {activeAccountsCount}
          </div>
          <p className="text-[11px] text-[#57423b] mt-0.5">
            {t('access:stats.permanentPassword')}
          </p>
        </div>
      </div>

      {/* 3. Awaiting Setup / Temporary Credentials */}
      <div className="bg-white rounded-xl border border-[#e8e1dd] p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#8a726a] uppercase tracking-wider">
            {t('access:stats.pendingSetup')}
          </span>
          <div className="w-9 h-9 rounded-lg bg-[#fff8e1] border border-[#ffe082] text-[#b78103] flex items-center justify-center">
            <ClockCountdown size={20} weight="duotone" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-black text-[#b78103]">
            {pendingSetupCount}
          </div>
          <p className="text-[11px] text-[#8d6e19] mt-0.5 font-medium">
            {t('access:stats.tempPasswordActive')} (48h expiry)
          </p>
        </div>
      </div>

      {/* 4. Suspended / Revoked Access */}
      <div className="bg-white rounded-xl border border-[#e8e1dd] p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#8a726a] uppercase tracking-wider">
            {t('access:stats.suspended')}
          </span>
          <div className="w-9 h-9 rounded-lg bg-[#ffdad6] border border-[#ffb4a8] text-[#ba1a1a] flex items-center justify-center">
            <Prohibit size={20} weight="bold" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-black text-[#ba1a1a]">
            {suspendedCount}
          </div>
          <p className="text-[11px] text-[#ba1a1a]/80 mt-0.5 font-medium">
            {t('access:stats.securityFreeze')}
          </p>
        </div>
      </div>
    </div>
  );
};

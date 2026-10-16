import { useTranslation } from '@jrs/client-core';
import type { IMemberStats } from '@jrs/shared';
import {
  CheckCircle,
  Sparkle,
  TreeStructure,
  UserCheck,
  Users,
} from '@phosphor-icons/react';
import type React from 'react';
import { StatsOverviewSkeleton } from '../../../components';

interface MemberStatsOverviewProps {
  stats: IMemberStats | undefined;
  isLoading: boolean;
  hubName: string;
}

export const MemberStatsOverview: React.FC<MemberStatsOverviewProps> = ({
  stats,
  isLoading,
  hubName,
}) => {
  const { t } = useTranslation();

  const totalMembers = stats?.totalMembers ?? 0;
  const activeJrCount = stats?.activeJrCount ?? 0;
  const activePcCount = stats?.activePcCount ?? 0;
  const appAccessCount = stats?.appAccessCount ?? 0;
  const offlineCount = Math.max(0, totalMembers - appAccessCount);

  const jrPercentage =
    totalMembers > 0 ? Math.round((activeJrCount / totalMembers) * 100) : 0;
  const accessPercentage =
    totalMembers > 0 ? Math.round((appAccessCount / totalMembers) * 100) : 0;
  const isPcQuotaFull = activePcCount >= 2;

  if (isLoading) {
    return (
      <StatsOverviewSkeleton className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 animate-pulse" />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* 1. Total Registered */}
      <div className="bg-white p-5 rounded-2xl border border-[#e8e1dd] shadow-xs flex flex-col justify-between gap-3 transition-shadow hover:shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-bold text-[#8a726a] uppercase tracking-wider">
              {t('members:stats.totalRegistered')}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#1e1b19] tracking-tight">
                {totalMembers}
              </span>
              <span className="text-xs font-semibold text-[#8a726a]">
                {hubName}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#fff2ee] border border-[#ffdbcf] flex items-center justify-center text-[#b85028]">
            <Users size={22} weight="duotone" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 pt-1 bg-[#faf2ee] px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#486b52]">
          <Sparkle size={14} weight="fill" />
          <span>
            {t('members:stats.joinedThisQuarter', { count: totalMembers })}
          </span>
        </div>
      </div>

      {/* 2. Youth Age Range (18–30) */}
      <div className="bg-white p-5 rounded-2xl border border-[#e8e1dd] shadow-xs flex flex-col justify-between gap-3 transition-shadow hover:shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-bold text-[#8a726a] uppercase tracking-wider">
              {t('members:stats.canonicalJrAge')}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#486b52] tracking-tight">
                {activeJrCount}
              </span>
              <span className="text-xs font-bold text-[#486b52]">
                ({jrPercentage}%)
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#c2e9ca]/40 border border-[#a9d0b2] flex items-center justify-center text-[#486b52]">
            <UserCheck size={22} weight="duotone" />
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-[#8a726a]">
          <span className="truncate">{t('members:stats.ageBracket')}</span>
          <span className="w-2 h-2 rounded-full bg-[#486b52] shrink-0" />
        </div>
      </div>

      {/* 3. Leadership Contacts */}
      <div className="bg-white p-5 rounded-2xl border border-[#e8e1dd] shadow-xs flex flex-col justify-between gap-3 transition-shadow hover:shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-bold text-[#8a726a] uppercase tracking-wider">
              {t('members:stats.leadershipContacts')}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#b85028] tracking-tight">
                {activePcCount} / 2
              </span>
              <span className="text-xs font-semibold text-[#8a726a]">
                {t('members:stats.activePcs')}
              </span>
            </div>
          </div>
          {isPcQuotaFull ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#ffdbcf] text-[#812901] text-[11px] font-bold border border-[#ffb59c]">
              {t('members:stats.fullQuota')}
            </span>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-[#faf2ee] border border-[#e8e1dd] flex items-center justify-center text-[#b85028]">
              <TreeStructure size={22} weight="duotone" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#57423b] truncate">
          <CheckCircle
            size={14}
            weight="fill"
            className="text-[#486b52] shrink-0"
          />
          <span className="truncate font-medium">
            {isPcQuotaFull
              ? t('members:modal.quotaAlert')
              : `${activePcCount} active in ${hubName}`}
          </span>
        </div>
      </div>

      {/* 4. Portal Accounts */}
      <div className="bg-white p-5 rounded-2xl border border-[#e8e1dd] shadow-xs flex flex-col justify-between gap-3 transition-shadow hover:shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-bold text-[#8a726a] uppercase tracking-wider">
              {t('members:stats.portalAccounts')}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#1e1b19] tracking-tight">
                {appAccessCount}
              </span>
              <span className="text-xs font-medium text-[#8a726a]">
                {t('members:stats.active')} · {offlineCount}{' '}
                {t('members:stats.offline')}
              </span>
            </div>
          </div>
          <span className="text-sm font-bold text-[#b85028]">
            {accessPercentage}%
          </span>
        </div>
        <div className="w-full bg-[#f4ece9] rounded-full h-2 overflow-hidden flex">
          <div
            className="bg-[#b85028] h-full transition-all duration-500"
            style={{ width: `${accessPercentage}%` }}
          />
          <div
            className="bg-[#ddc0b7] h-full transition-all duration-500"
            style={{ width: `${100 - accessPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

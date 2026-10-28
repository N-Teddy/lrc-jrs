import { useTranslation } from '@jrs/client-core';
import {
  ArrowDownLeft,
  ArrowsLeftRight,
  ArrowUpRight,
  CheckCircle,
  Sparkle,
  UserCheck,
  Users,
} from '@phosphor-icons/react';
import type React from 'react';
import { StatsOverviewSkeleton } from '../../../components';

export interface TransferMetrics {
  totalRelocations: number;
  inbound: number;
  outbound: number;
  transferredMembersCount: number;
}

interface TransferStatsOverviewProps {
  metrics: TransferMetrics;
  isLoading: boolean;
  hubName: string;
}

export const TransferStatsOverview: React.FC<TransferStatsOverviewProps> = ({
  metrics,
  isLoading,
  hubName,
}) => {
  const { t } = useTranslation(['transfers', 'common']);

  if (isLoading) {
    return (
      <StatsOverviewSkeleton className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 animate-pulse" />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* 1. Total Relocations */}
      <div className="bg-white p-5 rounded-xl border border-[#e8e1dd] shadow-xs flex flex-col justify-between gap-3 transition-shadow hover:shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-bold text-[#8a726a] uppercase tracking-wider">
              {t('transfers:stats.totalRelocations', 'Total Relocations')}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#1e1b19] tracking-tight">
                {metrics.totalRelocations}
              </span>
              <span className="text-xs font-semibold text-[#8a726a]">
                {t('transfers:stats.recorded', 'Recorded')}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#fff2ee] border border-[#ffdbcf] flex items-center justify-center text-[#b85028]">
            <ArrowsLeftRight size={22} weight="duotone" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 pt-1 bg-[#faf2ee] px-2.5 py-1.5 rounded-md text-xs font-semibold text-[#486b52]">
          <Sparkle size={14} weight="fill" />
          <span>
            {t('transfers:stats.ledgerRecord', 'Inter-Hub Ledger Record')}
          </span>
        </div>
      </div>

      {/* 2. Inbound to Current Hub */}
      <div className="bg-white p-5 rounded-xl border border-[#e8e1dd] shadow-xs flex flex-col justify-between gap-3 transition-shadow hover:shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-bold text-[#8a726a] uppercase tracking-wider">
              {t('transfers:stats.inbound', {
                hub: hubName,
                defaultValue: `Inbound to ${hubName}`,
              })}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#2c4e37] tracking-tight">
                {metrics.inbound}
              </span>
              <span className="text-xs font-bold text-[#2c4e37]">
                {t('transfers:stats.received', 'Received')}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#c2e9ca]/40 border border-[#a9d0b2] flex items-center justify-center text-[#2c4e37]">
            <ArrowDownLeft size={22} weight="duotone" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 pt-1 text-xs font-semibold text-[#2c4e37]">
          <CheckCircle size={14} weight="fill" />
          <span>
            {t('transfers:stats.arrivalsWelcomed', {
              hub: hubName,
              defaultValue: `Arrivals welcomed to ${hubName}`,
            })}
          </span>
        </div>
      </div>

      {/* 3. Outbound from Current Hub */}
      <div className="bg-white p-5 rounded-xl border border-[#e8e1dd] shadow-xs flex flex-col justify-between gap-3 transition-shadow hover:shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-bold text-[#8a726a] uppercase tracking-wider">
              {t('transfers:stats.outbound', {
                hub: hubName,
                defaultValue: `Outbound from ${hubName}`,
              })}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#812901] tracking-tight">
                {metrics.outbound}
              </span>
              <span className="text-xs font-bold text-[#812901]">
                {t('transfers:stats.relocated', 'Relocated')}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#fff8e1] border border-[#ffe082] flex items-center justify-center text-[#812901]">
            <ArrowUpRight size={22} weight="duotone" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 pt-1 text-xs font-semibold text-[#812901]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#812901]" />
          <span>
            {t(
              'transfers:stats.transitioned',
              'Transitioned to other community hubs',
            )}
          </span>
        </div>
      </div>

      {/* 4. Transferred Members */}
      <div className="bg-white p-5 rounded-xl border border-[#e8e1dd] shadow-xs flex flex-col justify-between gap-3 transition-shadow hover:shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-bold text-[#8a726a] uppercase tracking-wider">
              {t('transfers:stats.uniqueMembers', 'Unique Members')}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#57423b] tracking-tight">
                {metrics.transferredMembersCount}
              </span>
              <span className="text-xs font-semibold text-[#8a726a]">
                {t('transfers:stats.inRegistry', 'In Registry')}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] flex items-center justify-center text-[#57423b]">
            <Users size={22} weight="duotone" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 pt-1 bg-[#faf2ee] px-2.5 py-1.5 rounded-md text-xs font-semibold text-[#57423b]">
          <UserCheck size={14} weight="fill" />
          <span>
            {t(
              'transfers:stats.recordedMobility',
              'Members with recorded mobility',
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

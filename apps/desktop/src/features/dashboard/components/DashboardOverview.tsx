import { useTownContext, useTranslation } from '@jrs/client-core';
import type { IAuthUser } from '@jrs/shared';
import {
  ArrowRight,
  CalendarDots,
  CheckCircle,
  FolderOpen,
  ShieldCheck,
  Sparkle,
  Users,
} from '@phosphor-icons/react';
import type React from 'react';
import constructionComingSoonSvg from '../../../assets/illustrations/construction-coming-soon.svg';
import type { DashboardTabId } from '../hooks/use-dashboard-layout';

interface DashboardOverviewProps {
  user: IAuthUser;
  onSelectTab: (tab: DashboardTabId) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  user,
  onSelectTab,
}) => {
  const { t } = useTranslation();
  const { activeTown } = useTownContext();

  const quickNavItems: Array<{
    tab: DashboardTabId;
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
  }> = [
    {
      tab: 'members',
      label: t('dashboard:goToMembers', 'Members Directory'),
      description: t('navigation:members', 'Members'),
      icon: <Users size={20} weight="duotone" />,
      color: 'hover:border-[#b85028] hover:text-[#b85028]',
    },
    {
      tab: 'activities',
      label: t('dashboard:goToActivities', 'Activities & Calendar'),
      description: t('navigation:activities', 'Activities & Calendar'),
      icon: <CalendarDots size={20} weight="duotone" />,
      color: 'hover:border-[#486b52] hover:text-[#486b52]',
    },
    {
      tab: 'access',
      label: t('dashboard:goToIntake', 'Intake Submissions'),
      description: t('navigation:access', 'Access & Accounts'),
      icon: <ShieldCheck size={20} weight="duotone" />,
      color: 'hover:border-[#b85028] hover:text-[#b85028]',
    },
    {
      tab: 'reports',
      label: t('dashboard:goToDrive', 'Document Vault'),
      description: t('navigation:reports', 'Reports'),
      icon: <FolderOpen size={20} weight="duotone" />,
      color: 'hover:border-[#486b52] hover:text-[#486b52]',
    },
  ];

  return (
    <div className="w-full flex flex-col items-center justify-center py-6 sm:py-10 animate-in fade-in duration-300">
      {/* Top Ambient Scope Pill */}
      <div className="flex items-center gap-2.5 bg-[#faf2ee] border border-[#e8e1dd] px-4 py-1.5 rounded-full text-xs mb-4 shadow-2xs">
        <span className="w-2 h-2 rounded-full bg-[#486b52] animate-pulse" />
        <span className="font-bold text-[#1e1b19]">
          {activeTown
            ? `${activeTown.name} (${activeTown.code})`
            : t('towns:activeHub', 'Active Hub')}
        </span>
        <span className="text-[#8a726a] font-mono text-[11px]">
          #LRC-JRS-PORTAL
        </span>
      </div>

      {/* Large Vector Illustration - Seamless on warm canvas */}
      <div className="relative flex items-center justify-center my-2">
        <img
          src={constructionComingSoonSvg}
          alt={t('dashboard:comingSoonBadge', 'Still in Construction')}
          className="w-72 h-56 sm:w-96 sm:h-72 md:w-[480px] md:h-[340px] lg:w-[520px] lg:h-[360px] object-contain select-none pointer-events-none drop-shadow-sm transition-transform duration-300 hover:scale-[1.01]"
        />
      </div>

      {/* In-Development Badge */}
      <div className="inline-flex items-center gap-1.5 bg-[#ffdbcf]/60 text-[#812901] px-3.5 py-1.5 rounded-full text-xs font-bold mb-3 border border-[#ffb59c]/50 shadow-2xs">
        <Sparkle size={14} weight="fill" className="text-[#b85028]" />
        <span>{t('dashboard:comingSoonBadge', 'Still in Construction')}</span>
      </div>

      {/* Main Title */}
      <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1e1b19] tracking-tight mb-2 text-center">
        {t('dashboard:comingSoonTitle', 'Dashboard Analytics In Development')}
      </h1>

      {/* Punchy 1-Sentence Description */}
      <p className="text-xs sm:text-sm text-[#57423b] text-center max-w-lg leading-relaxed mb-8 px-4">
        {t(
          'dashboard:comingSoonDesc',
          'Community summaries, attendance trends, and key performance metrics are currently being assembled for this workspace.',
        )}
      </p>

      {/* Quick Access Navigation Buttons */}
      <div className="w-full max-w-2xl px-4 mb-8">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a726a] text-center mb-3">
          {t(
            'dashboard:quickActionsTitle',
            'Quick Navigation to Active Modules',
          )}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {quickNavItems.map((item) => (
            <button
              key={item.tab}
              type="button"
              onClick={() => onSelectTab(item.tab)}
              className={`group flex items-center justify-between p-3.5 rounded-xl bg-white border border-[#e8e1dd] text-left transition-all duration-150 shadow-2xs hover:shadow-xs cursor-pointer ${item.color}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] flex items-center justify-center text-[#57423b] group-hover:text-inherit shrink-0 transition-colors">
                  {item.icon}
                </div>
                <div className="truncate">
                  <span className="block text-xs font-bold text-[#1e1b19] group-hover:text-inherit transition-colors truncate">
                    {item.label}
                  </span>
                  <span className="block text-[11px] text-[#8a726a] truncate">
                    {item.description}
                  </span>
                </div>
              </div>
              <ArrowRight
                size={14}
                weight="bold"
                className="text-[#8a726a] group-hover:text-inherit group-hover:translate-x-0.5 transition-all shrink-0 ml-2"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Session Details */}
      <div className="flex items-center gap-2 text-xs text-[#8a726a] bg-white/70 backdrop-blur-xs px-4 py-2 rounded-lg border border-[#e8e1dd]/80 shadow-2xs">
        <CheckCircle size={15} weight="fill" className="text-[#486b52]" />
        <span>
          {t('dashboard:signedInAs', {
            name: user.fullName,
            role: user.role,
          })}
        </span>
      </div>
    </div>
  );
};

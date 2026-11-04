import { useTranslation } from '@jrs/client-core';
import type { IAuthUser } from '@jrs/shared';
import {
  ArrowRight,
  Bug,
  CalendarDots,
  FolderOpen,
  ShieldCheck,
  Sparkle,
  Users,
  Warning,
} from '@phosphor-icons/react';
import type React from 'react';
import { useState } from 'react';
import constructionComingSoonSvg from '../../../assets/illustrations/construction-coming-soon.svg';
import { AppCrashFallback } from '../../../components/AppCrashFallback';
import type { DashboardTabId } from '../hooks/use-dashboard-layout';

interface DashboardOverviewProps {
  user: IAuthUser;
  onSelectTab: (tab: DashboardTabId) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onSelectTab,
}) => {
  const { t } = useTranslation();
  const [isPreviewingError, setIsPreviewingError] = useState(false);
  const [triggerRealCrash, setTriggerRealCrash] = useState(false);

  // If testing real crash in dev mode, throw an unhandled runtime error for ErrorBoundary
  if (triggerRealCrash) {
    throw new Error(
      'DevSimulationError: Unhandled runtime error triggered to verify React ErrorBoundary.',
    );
  }

  // If previewing the error page directly
  if (isPreviewingError) {
    return (
      <AppCrashFallback
        error={
          new Error(
            'DevSimulationError: Testing the application crash error page and diagnostics.',
          )
        }
        errorInfo={{
          componentStack:
            '    at DashboardOverview (DashboardOverview.tsx:32)\n    at DashboardLayout (DashboardLayout.tsx:298)\n    at AppContent (App.tsx:144)',
        }}
        onReset={() => setIsPreviewingError(false)}
      />
    );
  }

  const quickNavItems: Array<{
    tab: DashboardTabId;
    label: string;
    icon: React.ReactNode;
    color: string;
  }> = [
    {
      tab: 'members',
      label: t('navigation:members', 'Members'),
      icon: <Users size={18} weight="duotone" />,
      color: 'hover:border-[#b85028] hover:text-[#b85028]',
    },
    {
      tab: 'activities',
      label: t('navigation:activities', 'Activities & Calendar'),
      icon: <CalendarDots size={18} weight="duotone" />,
      color: 'hover:border-[#486b52] hover:text-[#486b52]',
    },
    {
      tab: 'access',
      label: t('navigation:access', 'Intake Submissions'),
      icon: <ShieldCheck size={18} weight="duotone" />,
      color: 'hover:border-[#b85028] hover:text-[#b85028]',
    },
    {
      tab: 'reports',
      label: t('navigation:reports', 'Document Vault'),
      icon: <FolderOpen size={18} weight="duotone" />,
      color: 'hover:border-[#486b52] hover:text-[#486b52]',
    },
  ];

  return (
    <div className="w-full my-auto flex flex-col items-center justify-center animate-in fade-in duration-300 min-h-0 select-none py-1">
      {/* Large Vector Illustration - Scaled responsively to viewport */}
      <div className="relative flex items-center justify-center my-1 shrink-0">
        <img
          src={constructionComingSoonSvg}
          alt={t('dashboard:comingSoonBadge', 'Still in Construction')}
          className="h-36 sm:h-44 md:h-52 lg:h-60 max-h-[28vh] w-auto object-contain select-none pointer-events-none drop-shadow-sm transition-transform duration-300 hover:scale-[1.01]"
        />
      </div>

      {/* In-Development Badge */}
      <div className="inline-flex items-center gap-1.5 bg-[#ffdbcf]/60 text-[#812901] px-3.5 py-1 rounded-full text-xs font-bold mb-2 border border-[#ffb59c]/50 shadow-2xs shrink-0">
        <Sparkle size={13} weight="fill" className="text-[#b85028]" />
        <span>{t('dashboard:comingSoonBadge', 'Still in Construction')}</span>
      </div>

      {/* Main Title */}
      <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1e1b19] tracking-tight mb-1 text-center shrink-0">
        {t('dashboard:comingSoonTitle', 'Dashboard Analytics In Development')}
      </h1>

      {/* Short, Punchy 1-Sentence Description */}
      <p className="text-xs sm:text-sm text-[#57423b] text-center max-w-md leading-relaxed mb-4 px-4 shrink-0">
        {t(
          'dashboard:comingSoonDesc',
          'Hub analytics and community metrics are in active development.',
        )}
      </p>

      {/* Quick Access Navigation Buttons without header text */}
      <div className="w-full max-w-2xl px-4 mb-2 shrink-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {quickNavItems.map((item) => (
            <button
              key={item.tab}
              type="button"
              onClick={() => onSelectTab(item.tab)}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-xl bg-white border border-[#e8e1dd] text-left transition-all duration-150 shadow-2xs hover:shadow-xs cursor-pointer ${item.color}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] flex items-center justify-center text-[#57423b] group-hover:text-inherit shrink-0 transition-colors">
                  {item.icon}
                </div>
                <span className="text-xs font-bold text-[#1e1b19] group-hover:text-inherit transition-colors truncate">
                  {item.label}
                </span>
              </div>
              <ArrowRight
                size={12}
                weight="bold"
                className="text-[#8a726a] group-hover:text-inherit group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Dev-Only Error Page Review Section */}
      {import.meta.env.DEV && (
        <div className="mt-2.5 flex flex-col items-center gap-1 shrink-0">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setIsPreviewingError(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-semibold transition-all cursor-pointer shadow-2xs"
              title="Preview the application crash screen without unmounting state"
            >
              <Bug size={13} weight="bold" className="text-amber-700" />
              <span>Review Error Page</span>
            </button>

            <button
              type="button"
              onClick={() => setTriggerRealCrash(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-900 border border-red-300 text-[11px] font-semibold transition-all cursor-pointer shadow-2xs"
              title="Throw an actual unhandled exception to test the root ErrorBoundary"
            >
              <Warning size={13} weight="bold" className="text-red-700" />
              <span>Simulate Real Crash</span>
            </button>
          </div>
          <span className="text-[9px] text-[#8a726a] font-mono">
            Visible in development only
          </span>
        </div>
      )}
    </div>
  );
};

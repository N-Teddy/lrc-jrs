import {
  useDashboardOverviewQuery,
  useTownContext,
  useTranslation,
} from '@jrs/client-core';
import type { IAuthUser, IUpcomingBirthday } from '@jrs/shared';
import { CalendarPlus, MapPin, UserPlus } from '@phosphor-icons/react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import { AppCrashFallback } from '../../../components/AppCrashFallback';
import type { DashboardTabId } from '../hooks/use-dashboard-layout';
import { ActivityTypeBreakdownCard } from './ActivityTypeBreakdownCard';
import { AttendanceTrendCard } from './AttendanceTrendCard';
import { BirthdayCelebrationOverlay } from './BirthdayCelebrationOverlay';
import { DashboardKpiBanner } from './DashboardKpiBanner';
import { DemographicsDistributionCard } from './DemographicsDistributionCard';
import { OperationalAlertsFeedCard } from './OperationalAlertsFeedCard';
import { RecentActivitiesListCard } from './RecentActivitiesListCard';
import { UpcomingActivitySpotlightCard } from './UpcomingActivitySpotlightCard';
import { UpcomingBirthdaysCard } from './UpcomingBirthdaysCard';

interface DashboardOverviewProps {
  user: IAuthUser;
  onSelectTab: (tab: DashboardTabId) => void;
  onOpenCreateActivity?: () => void;
  onOpenRegisterMember?: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  user,
  onSelectTab,
  onOpenCreateActivity,
  onOpenRegisterMember,
}) => {
  const { t } = useTranslation(['dashboard', 'common']);
  const { activeTown } = useTownContext();

  // Period state
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  // Birthday celebration modal state
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
  const [selectedCelebrants, setSelectedCelebrants] = useState<
    IUpcomingBirthday[]
  >([]);

  // Dev error simulation state
  const [isPreviewingError, setIsPreviewingError] = useState(false);
  const [triggerRealCrash, setTriggerRealCrash] = useState(false);

  // Fetch dashboard aggregate data
  const { data, isLoading } = useDashboardOverviewQuery({
    townId: activeTown?.id || activeTown?.code,
    period,
  });

  // Check and trigger Android Birthday Celebration Screen Effect on connection
  useEffect(() => {
    if (
      !data?.hasBirthdayToday ||
      !data?.todayCelebrants ||
      data.todayCelebrants.length === 0
    ) {
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const celebrantIds = data.todayCelebrants
      .map((c) => c.id)
      .sort()
      .join('_');
    const storageKey = `jrs_birthday_celebration_${todayStr}_${celebrantIds}`;

    // Only show once per session / day automatically
    if (!sessionStorage.getItem(storageKey)) {
      sessionStorage.setItem(storageKey, 'true');
      setSelectedCelebrants(data.todayCelebrants);
      setIsCelebrationOpen(true);
    }
  }, [data]);

  // Manual trigger from birthdays card
  const handleTriggerCelebration = (celebrant: IUpcomingBirthday) => {
    setSelectedCelebrants([celebrant]);
    setIsCelebrationOpen(true);
  };

  const userFirstName = user?.fullName?.split(' ')[0] || 'Leader';

  const greeting = useMemo(() => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) {
      return t('dashboard:greetingMorning', 'Bonjour');
    }
    if (currentHour < 18) {
      return t('dashboard:greetingAfternoon', 'Bon après-midi');
    }
    return t('dashboard:greetingEvening', 'Bonsoir');
  }, [t]);

  // If testing real crash in dev mode
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
            '    at DashboardOverview (DashboardOverview.tsx)\n    at DashboardLayout (DashboardLayout.tsx)',
        }}
        onReset={() => setIsPreviewingError(false)}
      />
    );
  }

  return (
    <div className="w-full flex flex-col gap-5 animate-in fade-in duration-300 pb-12 select-none">
      {/* 1. Header Toolbar: Welcome Greeting, Town Badge, Period Selector, Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e8e1dd]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#1e1b19] tracking-tight">
              {greeting}, {userFirstName} 👋
            </h2>
            {activeTown && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-sm bg-[#fff2ee] text-[#b85028] text-xs font-bold border border-[#ffdbcf]">
                <MapPin size={12} weight="fill" />
                <span>{activeTown.name}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-[#8a726a] mt-0.5">
            Tableau de bord de coordination et métriques de la jeunesse
            paroissiale
          </p>
        </div>

        {/* Period Selector & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period Filter Buttons */}
          <div className="flex items-center bg-[#faf2ee] p-1 rounded-xl border border-[#e8e1dd] text-xs font-bold">
            <button
              type="button"
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                period === 'month'
                  ? 'bg-white text-[#b85028] shadow-xs'
                  : 'text-[#57423b] hover:text-[#1e1b19]'
              }`}
            >
              Ce mois
            </button>
            <button
              type="button"
              onClick={() => setPeriod('quarter')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                period === 'quarter'
                  ? 'bg-white text-[#b85028] shadow-xs'
                  : 'text-[#57423b] hover:text-[#1e1b19]'
              }`}
            >
              Ce trimestre
            </button>
            <button
              type="button"
              onClick={() => setPeriod('year')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                period === 'year'
                  ? 'bg-white text-[#b85028] shadow-xs'
                  : 'text-[#57423b] hover:text-[#1e1b19]'
              }`}
            >
              Année 2026
            </button>
          </div>

          {/* Quick Create Activity */}
          <button
            type="button"
            onClick={() => {
              if (onOpenCreateActivity) {
                onOpenCreateActivity();
              } else {
                onSelectTab('activities');
              }
            }}
            className="h-9 px-3.5 rounded-xl bg-[#b85028] hover:bg-[#a44520] text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <CalendarPlus size={15} weight="bold" />
            <span className="hidden sm:inline">Nouvelle Activité</span>
          </button>

          {/* Quick Register Member */}
          <button
            type="button"
            onClick={() => {
              if (onOpenRegisterMember) {
                onOpenRegisterMember();
              } else {
                onSelectTab('members');
              }
            }}
            className="h-9 px-3 rounded-xl bg-white border border-[#e8e1dd] hover:bg-[#faf2ee] text-[#57423b] font-bold text-xs shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus size={15} weight="bold" />
            <span className="hidden sm:inline">Inscrire Membre</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <Skeleton height={110} borderRadius={16} count={4} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8 flex flex-col gap-5">
              <Skeleton height={130} borderRadius={16} />
              <Skeleton height={260} borderRadius={16} />
            </div>
            <div className="lg:col-span-4 flex flex-col gap-5">
              <Skeleton height={200} borderRadius={16} />
              <Skeleton height={200} borderRadius={16} />
            </div>
          </div>
        </div>
      ) : data ? (
        <>
          {/* 2. Row 1: Executive KPI Banners (4 Columns) */}
          <DashboardKpiBanner kpis={data.kpis} />

          {/* 3. Main 2-Column Asymmetric Workspace (8 cols Left / 4 cols Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT COLUMN: Operations & Activities (8 Columns) */}
            <div className="lg:col-span-8 flex flex-col gap-5">
              {/* Prochaine Activité Hero Spotlight */}
              <UpcomingActivitySpotlightCard
                activity={data.upcomingActivity}
                onOpenActivity={() => onSelectTab('activities')}
                onCreateActivity={onOpenCreateActivity}
              />

              {/* Courbe d'Assiduité & Fréquentation */}
              <AttendanceTrendCard trend={data.attendanceTrend} />

              {/* Dernières Activités Réalisées */}
              <RecentActivitiesListCard
                activities={data.recentActivities}
                onSelectActivity={() => onSelectTab('activities')}
                onViewAll={() => onSelectTab('activities')}
              />
            </div>

            {/* RIGHT COLUMN: Community Care, Celebrations & Alerts (4 Columns) */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              {/* Anniversaires du Mois */}
              <UpcomingBirthdaysCard
                birthdays={data.upcomingBirthdays}
                onTriggerCelebration={handleTriggerCelebration}
              />

              {/* Alertes & Flux Opérationnel */}
              <OperationalAlertsFeedCard
                alerts={data.operationalAlerts}
                transfers={data.recentTransfers}
                onNavigateToIntake={() => onSelectTab('access')}
                onNavigateToTransfers={() => onSelectTab('transfers')}
              />

              {/* Démographie & Profils */}
              <DemographicsDistributionCard demographics={data.demographics} />

              {/* Types d'Activités */}
              <ActivityTypeBreakdownCard
                distribution={data.activityTypeDistribution}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="p-12 text-center text-xs text-[#8a726a] bg-white rounded-2xl border border-[#e8e1dd]">
          Impossible de charger les métriques du tableau de bord.
        </div>
      )}

      {/* Android Screen Effect Birthday Animation Overlay */}
      <BirthdayCelebrationOverlay
        celebrants={selectedCelebrants}
        isOpen={isCelebrationOpen}
        onClose={() => setIsCelebrationOpen(false)}
        isSelfCelebrant={selectedCelebrants.some((c) => c.id === user.id)}
      />

      {/* Dev Diagnostics Bar */}
      {import.meta.env.DEV && (
        <div className="mt-8 pt-4 border-t border-[#f4ece9] flex items-center justify-between text-[11px] text-[#8a726a]">
          <span>Outils de diagnostic développement :</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPreviewingError(true)}
              className="px-2.5 py-1 rounded bg-[#faf2ee] hover:bg-[#f4ece9] text-[#57423b] font-medium transition-colors cursor-pointer border border-[#e8e1dd]"
            >
              Aperçu Page d'Erreur
            </button>
            <button
              type="button"
              onClick={() => setTriggerRealCrash(true)}
              className="px-2.5 py-1 rounded bg-[#ffdad4]/60 hover:bg-[#ffdad4] text-[#9f2f23] font-medium transition-colors cursor-pointer border border-[#ffdad4]"
            >
              Simuler Crash Réel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

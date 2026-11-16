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
import { ActivityBreakdownCard } from './ActivityBreakdownCard';
import { BirthdayCelebrationOverlay } from './BirthdayCelebrationOverlay';
import { DashboardHeroChartCard } from './DashboardHeroChartCard';
import { GoalsTrackerCard } from './GoalsTrackerCard';
import { OperationalHealthGaugeCard } from './OperationalHealthGaugeCard';
import { ParishPassCard } from './ParishPassCard';
import { PastoralTipCard } from './PastoralTipCard';
import { QuotaProgressCard } from './QuotaProgressCard';
import { RecentActivitiesListCard } from './RecentActivitiesListCard';
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

  // Check and trigger Birthday Celebration Screen Effect on connection if today
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
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300 pb-12 select-none">
      {/* 1. Top Header Bar (Matching the clean command bar in Reference Image 1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {greeting}, {userFirstName} 👋
            </h2>
            {activeTown && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black border border-emerald-100/70">
                <MapPin size={13} weight="fill" className="text-emerald-600" />
                <span>{activeTown.name}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Tableau de bord de coordination pastorale et indicateurs de la
            jeunesse
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
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
            className="h-10 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <CalendarPlus size={16} weight="bold" />
            <span>Nouvelle Activité</span>
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
            className="h-10 px-4 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-extrabold text-xs shadow-2xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <UserPlus size={16} weight="bold" className="text-slate-600" />
            <span>Inscrire Membre</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <Skeleton height={260} borderRadius={24} />
            <div className="grid grid-cols-2 gap-5">
              <Skeleton height={140} borderRadius={24} />
              <Skeleton height={140} borderRadius={24} />
            </div>
            <div className="grid grid-cols-3 gap-5">
              <Skeleton height={180} borderRadius={24} />
              <Skeleton height={180} borderRadius={24} />
              <Skeleton height={180} borderRadius={24} />
            </div>
          </div>
          <div className="lg:col-span-4 flex flex-col gap-6">
            <Skeleton height={240} borderRadius={24} />
            <Skeleton height={280} borderRadius={24} />
            <Skeleton height={220} borderRadius={24} />
          </div>
        </div>
      ) : data ? (
        /* 2. Main 2-Column Asymmetric Workspace (8 cols Left / 4 cols Right) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ========================================================= */}
          {/* LEFT COLUMN: Operations, Charts & Analytics (8 Columns)   */}
          {/* ========================================================= */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* A. Hero Performance Chart & Executive KPI Suite (Balance overview equivalent) */}
            <DashboardHeroChartCard
              trend={data.attendanceTrend}
              kpis={data.kpis}
              period={period}
              onPeriodChange={setPeriod}
            />

            {/* B. Middle Row: Operational Limits & Pastoral Tip Banner (Spending limit & Tips equivalent) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <QuotaProgressCard
                kpis={data.kpis}
                onManageMembers={() => onSelectTab('members')}
              />
              <PastoralTipCard onOpenAction={() => onSelectTab('activities')} />
            </div>

            {/* C. Bottom Analytics Triad (Cost analysis, Health gauge & Goals equivalent) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Breakdown by Activity Type */}
              <ActivityBreakdownCard
                distribution={data.activityTypeDistribution}
                totalCount={
                  data.kpis.upcomingActivitiesCount +
                  data.kpis.completedActivitiesCount
                }
              />

              {/* Card 2: Operational Health Semi-Circular Radial Gauge */}
              <OperationalHealthGaugeCard
                alerts={data.operationalAlerts}
                onOpenAlerts={() => onSelectTab('access')}
              />

              {/* Card 3: Key Initiatives & Goals Tracker */}
              <GoalsTrackerCard onAddGoal={() => onSelectTab('activities')} />
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT RAIL: Parish Pass, Birthdays & Recent Events (4 Cols) */}
          {/* ========================================================= */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* D. Digital Parish Pass Card (Matching the green credit card in Image 1) */}
            <ParishPassCard
              user={user}
              activeTownName={activeTown?.name || 'Douala'}
              activeTownCode={activeTown?.code || 'DLA'}
              totalMembers={data.kpis.totalMembers}
              onOpenAttendance={() => onSelectTab('activities')}
              onOpenRegisterMember={
                onOpenRegisterMember || (() => onSelectTab('members'))
              }
              onOpenLockRegister={() => onSelectTab('activities')}
              onOpenDrive={() => onSelectTab('reports')}
              onOpenBroadcastModal={() => {
                const whatsappUrl = 'https://chat.whatsapp.com';
                window.open(whatsappUrl, '_blank');
              }}
            />

            {/* E. Dedicated "Anniversaires du Mois" Card (User's specific key request) */}
            <UpcomingBirthdaysCard
              birthdays={data.upcomingBirthdays}
              onTriggerCelebration={handleTriggerCelebration}
            />

            {/* F. Recent Activities / Session History (Matching Transaction History in Image 1) */}
            <RecentActivitiesListCard
              activities={data.recentActivities}
              onSelectActivity={() => onSelectTab('activities')}
              onViewAll={() => onSelectTab('activities')}
            />
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-100 shadow-sm">
          Impossible de charger les métriques du tableau de bord.
        </div>
      )}

      {/* Birthday Celebration Confetti & Card Overlay */}
      <BirthdayCelebrationOverlay
        celebrants={selectedCelebrants}
        isOpen={isCelebrationOpen}
        onClose={() => setIsCelebrationOpen(false)}
        isSelfCelebrant={selectedCelebrants.some((c) => c.id === user.id)}
      />

      {/* Dev Diagnostics Bar */}
      {import.meta.env.DEV && (
        <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Outils de diagnostic développement :</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPreviewingError(true)}
              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-colors cursor-pointer border border-slate-200"
            >
              Aperçu Page d'Erreur
            </button>
            <button
              type="button"
              onClick={() => setTriggerRealCrash(true)}
              className="px-2.5 py-1 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold transition-colors cursor-pointer border border-red-200"
            >
              Simuler Crash Réel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

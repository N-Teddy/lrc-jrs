import {
  queryKeys,
  useQueryClient,
  useTownContext,
  useTranslation,
  useWebSocket,
} from '@jrs/client-core';
import type { IAuthUser, NotificationResource } from '@jrs/shared';
import { ArrowUUpLeft, Bug, Buildings } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import type React from 'react';
import { useState } from 'react';
import { AppCrashFallback } from '../../../components';
import { APP_VERSION } from '../../../constants/version';
import { ActivitiesFeature } from '../../activities';
import { ChangePasswordModal } from '../../auth';
import { DriveExplorerFeature } from '../../drive';
import { type MemberSubTab, MembersFeature } from '../../members';
import { NotificationsFeature } from '../../notifications';
import { TransfersFeature } from '../../transfers';
import { useDashboardLayout } from '../hooks/use-dashboard-layout';
import { DashboardOverview } from './DashboardOverview';
import { Header } from './Header';
import { HubSwitcherPopover } from './HubSwitcherPopover';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  user: IAuthUser;
  onSwitchRegion: () => void;
  hasMultiTownAccess: boolean;
  hasUpdate?: boolean;
  onOpenWhatsNew?: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  user,
  onSwitchRegion,
  hasUpdate,
  onOpenWhatsNew,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const {
    activeTown,
    availableTowns,
    isViewingHomeTown,
    setActiveTownId,
    canWrite,
  } = useTownContext();

  const { status: socketStatus } = useWebSocket();

  const {
    isSidebarCollapsed,
    toggleSidebar,
    activeTab,
    setActiveTab,
    isHubSwitcherOpen,
    openHubSwitcher,
    closeHubSwitcher,
    isChangePasswordOpen,
    openChangePassword,
    closeChangePassword,
  } = useDashboardLayout();

  // Resource Navigation Deep-link States
  const [memberSubTab, setMemberSubTab] = useState<MemberSubTab>('directory');
  const [showDevErrorPreview, setShowDevErrorPreview] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [activitySubTab, setActivitySubTab] = useState<
    | 'schedule'
    | 'overview'
    | 'attendance'
    | 'report'
    | 'history'
    | 'audit-log'
    | undefined
  >(undefined);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(
    null,
  );

  const tabTitle =
    activeTab === 'dashboard'
      ? t('dashboard:overview')
      : t(`navigation:${activeTab}`);

  const [navNonce, setNavNonce] = useState(0);

  const handleNavigateToResource = (resource: NotificationResource) => {
    setNavNonce((n) => n + 1);
    // 1. Auto-switch town context if townId differs and user has access
    if (resource.townId && resource.townId !== activeTown?.id) {
      const townTarget = availableTowns.find(
        (t) =>
          t.id === resource.townId ||
          t.code?.toLowerCase() === resource.townId?.toLowerCase(),
      );
      if (townTarget) {
        void setActiveTownId(townTarget.id);
      }
    }

    // 2. Route to entity screen and specific sub-tabs
    switch (resource.entityType) {
      case 'ACTIVITY':
      case 'ATTENDANCE':
        setSelectedActivityId(resource.entityId || null);
        if (
          resource.subTab === 'attendance' ||
          resource.entityType === 'ATTENDANCE'
        ) {
          setActivitySubTab('attendance');
        } else if (
          resource.subTab === 'audit-log' ||
          resource.subTab === 'history'
        ) {
          setActivitySubTab('history');
        } else if (resource.subTab === 'report') {
          setActivitySubTab('report');
        } else {
          setActivitySubTab('overview');
        }
        setActiveTab('activities');
        break;

      case 'MEMBER':
        setSelectedMemberId(resource.entityId || null);
        if (resource.subTab === 'access') {
          setMemberSubTab('access');
        } else {
          setMemberSubTab('directory');
        }
        setActiveTab('members');
        break;

      case 'INTAKE':
        setSelectedMemberId(null);
        setMemberSubTab('reviews');
        setActiveTab('members');
        queryClient.invalidateQueries({
          queryKey: queryKeys.registrationLinks.all,
        });
        break;

      case 'TOWN_TRANSFER':
        setActiveTab('transfers');
        break;

      case 'ACCESS':
        setMemberSubTab('access');
        setActiveTab('access');
        break;

      case 'REPORT':
        if (resource.entityId) {
          setSelectedActivityId(resource.entityId);
          setActivitySubTab('report');
          setActiveTab('activities');
        } else {
          setActiveTab('reports');
        }
        break;

      case 'DRIVE_FILE':
        setActiveTab('reports');
        break;

      default:
        setActiveTab('dashboard');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#fff8f5] text-[#1e1b19]">
      {/* 1. Left Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenHubSwitcher={openHubSwitcher}
      />

      {/* 2. Top Header */}
      <Header
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={toggleSidebar}
        onOpenChangePassword={openChangePassword}
        onNavigateToResource={handleNavigateToResource}
        onOpenNotificationsPage={() => setActiveTab('notifications')}
        title={tabTitle}
        hasUpdate={hasUpdate}
        onOpenWhatsNew={onOpenWhatsNew}
      />

      {/* 3. Main Workspace Area */}
      <main
        className={`pt-16 min-h-screen transition-all duration-200 ${
          isSidebarCollapsed ? 'pl-[72px]' : 'pl-[260px]'
        } ${
          activeTab === 'dashboard'
            ? 'h-screen overflow-hidden flex flex-col pb-11'
            : 'pb-14'
        }`}
      >
        <div
          className={`max-w-[1536px] mx-auto w-full ${
            activeTab === 'dashboard'
              ? 'px-6 py-2 flex-1 flex flex-col justify-center min-h-0'
              : 'p-6 sm:p-8'
          }`}
        >
          {/* External Town Ambient Notification */}
          {!isViewingHomeTown && activeTown && (
            <div className="mb-4 px-5 py-3 rounded-xl bg-[#fff8e1] border-2 border-[#ffe082] shadow-xs flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-[#ffecb3] border border-[#ffd54f] flex items-center justify-center text-[#b78103] shrink-0">
                  <Buildings size={22} weight="duotone" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-[#7a5500] uppercase tracking-wider">
                      External Hub: {activeTown.name} ({activeTown.code})
                    </span>
                    {!canWrite ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#ffe082] text-[#6d4c00]">
                        Read-Only View
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#c2e9ca] text-[#2c4e37]">
                        Write Access Enabled
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#8d6e19] mt-0.5 font-medium">
                    You are browsing data for <strong>{activeTown.name}</strong>
                    .
                    {!canWrite && ' You do not have write access in this town.'}
                  </p>
                </div>
              </div>

              {user.homeTownId && (
                <button
                  type="button"
                  onClick={() => setActiveTownId(user.homeTownId)}
                  className="px-4 py-2 rounded-md bg-white hover:bg-[#fff9c4] text-[#7a5500] border border-[#ffd54f] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowUUpLeft size={16} weight="bold" />
                  <span>Return to My Hub</span>
                </button>
              )}
            </div>
          )}

          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.15,
              ease: 'easeOut',
            }}
            className={`w-full ${
              activeTab === 'dashboard'
                ? 'flex-1 flex flex-col justify-center items-center min-h-0 h-full'
                : ''
            }`}
          >
            {activeTab === 'members' ? (
              <MembersFeature
                key={`members-${selectedMemberId || 'all'}-${navNonce}`}
                initialSubTab={memberSubTab}
                initialMemberId={selectedMemberId}
              />
            ) : activeTab === 'activities' ? (
              <ActivitiesFeature
                key={`activities-${selectedActivityId || 'all'}-${navNonce}`}
                initialSubTab={activitySubTab}
                initialActivityId={selectedActivityId}
              />
            ) : activeTab === 'access' ? (
              <MembersFeature
                initialSubTab="access"
                initialMemberId={selectedMemberId}
              />
            ) : activeTab === 'reports' ? (
              <DriveExplorerFeature />
            ) : activeTab === 'transfers' ? (
              <TransfersFeature />
            ) : activeTab === 'notifications' ? (
              <NotificationsFeature
                onNavigateToResource={handleNavigateToResource}
              />
            ) : (
              <DashboardOverview user={user} onSelectTab={setActiveTab} />
            )}
          </motion.div>
        </div>
      </main>

      {/* 4. Global Stationary Operations Footer (Style 1 - Tech & System Status) */}
      <footer
        className={`fixed bottom-0 right-0 h-11 z-20 border-t border-[#e8e1dd] bg-white/80 backdrop-blur-md px-6 sm:px-8 transition-all duration-200 select-none flex items-center ${
          isSidebarCollapsed ? 'left-[72px]' : 'left-[260px]'
        }`}
      >
        <div className="w-full max-w-[1536px] mx-auto flex items-center justify-between gap-4 text-xs text-[#8a726a]">
          {/* Left: Operational status with pulsing beacon connected to WebSocket */}
          <div className="flex items-center gap-2.5 shrink-0">
            {socketStatus === 'connected' ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#486b52] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#486b52]" />
                </span>
                <span className="font-semibold text-[#1e1b19]">
                  {t('dashboard:footer.operational', 'All Systems Operational')}
                </span>
              </>
            ) : socketStatus === 'connecting' ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d97706] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#d97706]" />
                </span>
                <span className="font-semibold text-[#8d6e19]">
                  {t('dashboard:footer.connecting', 'Connecting Systems...')}
                </span>
              </>
            ) : (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8a726a]" />
                </span>
                <span className="font-semibold text-[#8a726a]">
                  {t('dashboard:footer.offline', 'Systems Offline')}
                </span>
              </>
            )}
          </div>

          {/* Center: Legal Copyright */}
          <div className="text-center font-medium text-[#57423b] truncate hidden md:block">
            {t('dashboard:footer.allRightsReserved', {
              year: new Date().getFullYear(),
            })}
          </div>

          {/* Right: Build & Edition Metadata + Dev Review Link */}
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#8a726a] shrink-0">
            {import.meta.env.DEV && (
              <button
                type="button"
                onClick={() => setShowDevErrorPreview(true)}
                className="px-2 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-sans text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 mr-1"
                title="Developer Only: Preview Crash & Error Screen"
              >
                <Bug size={12} weight="bold" />
                <span>DEV: Review Error Page</span>
              </button>
            )}
            <span className="px-2 py-0.5 rounded-md bg-[#faf2ee] border border-[#e8e1dd] text-[#57423b] font-bold">
              v{APP_VERSION}
            </span>
            <span>{t('dashboard:footer.build')}</span>
            <span className="text-[#8a726a]/60">•</span>
            <span>{t('dashboard:footer.desktopEdition')}</span>
          </div>
        </div>
      </footer>

      {/* 4. Active Hub Switcher Popover */}
      <HubSwitcherPopover
        isOpen={isHubSwitcherOpen}
        onClose={closeHubSwitcher}
        onOpenMapView={onSwitchRegion}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      {/* 5. In-App Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={closeChangePassword}
      />

      {/* 6. Dev-Only Error Page Preview Overlay */}
      {showDevErrorPreview && (
        <div className="fixed inset-0 z-50 bg-[#fff8f5] overflow-y-auto">
          <AppCrashFallback
            error={
              new Error(
                'DevSimulationError: Testing the application crash error page and diagnostics.',
              )
            }
            errorInfo={{
              componentStack:
                '    at DashboardLayout (DashboardLayout.tsx:372)\n    at AppContent (App.tsx:144)',
            }}
            onReset={() => setShowDevErrorPreview(false)}
          />
        </div>
      )}
    </div>
  );
};

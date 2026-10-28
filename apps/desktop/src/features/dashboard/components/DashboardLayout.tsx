import { useTownContext, useTranslation } from '@jrs/client-core';
import type { IAuthUser, NotificationResource } from '@jrs/shared';
import {
  ArrowUUpLeft,
  Buildings,
  CheckCircle,
  Sparkle,
  SquaresFour,
} from '@phosphor-icons/react';
import { motion } from 'motion/react';
import type React from 'react';
import { useState } from 'react';
import { APP_VERSION } from '../../../constants/version';
import { ActivitiesFeature } from '../../activities';
import { ChangePasswordModal } from '../../auth';
import { DriveExplorerFeature } from '../../drive';
import { type MemberSubTab, MembersFeature } from '../../members';
import { NotificationsFeature } from '../../notifications';
import { TransfersFeature } from '../../transfers';
import { useDashboardLayout } from '../hooks/use-dashboard-layout';
import { Header } from './Header';
import { HubSwitcherPopover } from './HubSwitcherPopover';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  user: IAuthUser;
  onSwitchRegion: () => void;
  hasMultiTownAccess: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  user,
  onSwitchRegion,
}) => {
  const { t } = useTranslation();
  const {
    activeTown,
    availableTowns,
    isViewingHomeTown,
    setActiveTownId,
    canWrite,
  } = useTownContext();

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
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [activitySubTab, setActivitySubTab] = useState<
    'overview' | 'attendance' | 'report' | 'history' | 'audit-log' | undefined
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
      case 'INTAKE':
        setSelectedMemberId(resource.entityId || null);
        if (resource.subTab === 'reviews' || resource.entityType === 'INTAKE') {
          setMemberSubTab('reviews');
        } else if (resource.subTab === 'access') {
          setMemberSubTab('access');
        } else {
          setMemberSubTab('directory');
        }
        setActiveTab('members');
        break;

      case 'TOWN_TRANSFER':
        setActiveTab('transfers');
        break;

      case 'ACCESS':
        setMemberSubTab('access');
        setActiveTab('access');
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
      />

      {/* 3. Main Workspace Area */}
      <main
        className={`pt-16 pb-14 min-h-screen transition-all duration-200 ${
          isSidebarCollapsed ? 'pl-[72px]' : 'pl-[260px]'
        }`}
      >
        <div className="p-6 sm:p-8 max-w-[1536px] mx-auto w-full">
          {/* External Town Ambient Notification */}
          {!isViewingHomeTown && activeTown && (
            <div className="mb-6 px-5 py-4 rounded-xl bg-[#fff8e1] border-2 border-[#ffe082] shadow-xs flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-lg bg-[#ffecb3] border border-[#ffd54f] flex items-center justify-center text-[#b78103] shrink-0">
                  <Buildings size={24} weight="duotone" />
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
            className="w-full"
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
              /* Pristine Minimalist Workspace Card */
              <div className="relative w-full min-h-[560px] rounded-xl bg-white border border-[#e8e1dd] shadow-xs flex flex-col justify-between p-8 sm:p-12 overflow-hidden">
                {/* Background Subtle Hub Grid Pattern */}
                <div className="absolute inset-0 pointer-events-none opacity-40">
                  <svg
                    className="w-full h-full text-[#e8e1dd]"
                    width="100%"
                    height="100%"
                  >
                    <defs>
                      <pattern
                        id="sanctuary-grid"
                        width="40"
                        height="40"
                        patternUnits="userSpaceOnUse"
                      >
                        <circle cx="2" cy="2" r="1.2" fill="currentColor" />
                      </pattern>
                    </defs>
                    <rect
                      width="100%"
                      height="100%"
                      fill="url(#sanctuary-grid)"
                    />
                  </svg>
                </div>

                {/* Top Baseline Metadata */}
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5 bg-[#faf2ee] border border-[#e8e1dd] px-3.5 py-1.5 rounded-full text-xs">
                    <span className="w-2 h-2 rounded-full bg-[#486b52] animate-pulse" />
                    <span className="font-bold text-[#1e1b19]">
                      {activeTown
                        ? `${activeTown.name} ${t('towns:hub')} (${activeTown.code})`
                        : t('towns:activeHub')}
                    </span>
                    <span className="text-[#8a726a] font-mono text-[11px]">
                      #LRC-JRS-PORTAL
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold text-[#8a726a]">
                    <span>SANCTUARY CANVAS</span>
                    <span className="px-2 py-0.5 rounded-md bg-[#faf2ee] border border-[#e8e1dd] text-[#1e1b19] font-mono text-[11px]">
                      {t('common:ready')}
                    </span>
                  </div>
                </div>

                {/* Central Pristine Workspace Focus */}
                <div className="relative z-10 my-auto py-12 flex flex-col items-center text-center max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-xl bg-[#faf2ee] border border-[#e8e1dd] flex items-center justify-center text-[#b85028] mb-5 shadow-xs">
                    <SquaresFour size={32} weight="fill" />
                  </div>

                  <div className="inline-flex items-center gap-1.5 bg-[#ffdbcf]/50 text-[#812901] px-3 py-1 rounded-full text-xs font-bold mb-3 border border-[#ffb59c]/50">
                    <Sparkle size={14} weight="fill" />
                    <span>{t('dashboard:reservedWorkspace')}</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-[#1e1b19] tracking-tight mb-2">
                    {t('dashboard:pristineTitle')}
                  </h2>

                  <p className="text-xs sm:text-sm text-[#57423b] leading-relaxed">
                    {t('dashboard:pristineDesc', {
                      hub: activeTown
                        ? activeTown.name
                        : t('dashboard:assigned'),
                    })}
                  </p>
                </div>

                {/* Bottom Footer Specs */}
                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#e8e1dd]">
                  <div className="flex items-center gap-4 text-xs text-[#8a726a]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#b85028]" />
                      <span>Terracotta</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#486b52]" />
                      <span>Sage Olive</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-[#57423b] font-medium">
                    <CheckCircle
                      size={16}
                      weight="fill"
                      className="text-[#486b52]"
                    />
                    <span>
                      {t('dashboard:signedInAs', {
                        name: user.fullName,
                        role: user.role,
                      })}
                    </span>
                  </div>
                </div>
              </div>
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
          {/* Left: Operational status with pulsing beacon */}
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#486b52] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#486b52]" />
            </span>
            <span className="font-semibold text-[#1e1b19]">
              {t('dashboard:footer.operational')}
            </span>
            <span className="text-[#8a726a]/60">•</span>
            <span className="text-[#57423b]">
              {t('dashboard:footer.gateway')}
            </span>
          </div>

          {/* Center: Legal Copyright */}
          <div className="text-center font-medium text-[#57423b] truncate hidden md:block">
            {t('dashboard:footer.allRightsReserved', {
              year: new Date().getFullYear(),
            })}
          </div>

          {/* Right: Build & Edition Metadata */}
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#8a726a] shrink-0">
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
    </div>
  );
};

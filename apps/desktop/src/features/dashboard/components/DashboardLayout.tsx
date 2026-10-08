import { useTownContext } from '@jrs/client-core';
import type { IAuthUser } from '@jrs/shared';
import { CheckCircle, Sparkle, SquaresFour } from '@phosphor-icons/react';
import type React from 'react';
import { ChangePasswordModal } from '../../auth';
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
  const { activeTown } = useTownContext();

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
    currentTabTitle,
  } = useDashboardLayout();

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
        title={currentTabTitle}
      />

      {/* 3. Main Workspace Area */}
      <main
        className={`pt-16 min-h-screen transition-all duration-200 ${
          isSidebarCollapsed ? 'pl-[72px]' : 'pl-[260px]'
        }`}
      >
        <div className="p-6 sm:p-10 max-w-6xl mx-auto w-full">
          {/* Pristine Minimalist Workspace Card */}
          <div className="relative w-full min-h-[560px] rounded-3xl bg-white border border-[#e8e1dd] shadow-xs flex flex-col justify-between p-8 sm:p-12 overflow-hidden">
            {/* Background Subtle Sanctuary Grid Pattern */}
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
                <rect width="100%" height="100%" fill="url(#sanctuary-grid)" />
              </svg>
            </div>

            {/* Top Baseline Metadata */}
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 bg-[#faf2ee] border border-[#e8e1dd] px-3.5 py-1.5 rounded-full text-xs">
                <span className="w-2 h-2 rounded-full bg-[#486b52] animate-pulse" />
                <span className="font-bold text-[#1e1b19]">
                  {activeTown
                    ? `${activeTown.name} Hub (${activeTown.code})`
                    : 'Active Hub'}
                </span>
                <span className="text-[#8a726a] font-mono text-[11px]">
                  #LRC-JRS-PORTAL
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-[#8a726a]">
                <span>SANCTUARY CANVAS</span>
                <span className="px-2 py-0.5 rounded-md bg-[#faf2ee] border border-[#e8e1dd] text-[#1e1b19] font-mono text-[11px]">
                  READY
                </span>
              </div>
            </div>

            {/* Central Pristine Workspace Focus */}
            <div className="relative z-10 my-auto py-12 flex flex-col items-center text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-[#faf2ee] border border-[#e8e1dd] flex items-center justify-center text-[#b85028] mb-5 shadow-xs">
                <SquaresFour size={32} weight="fill" />
              </div>

              <div className="inline-flex items-center gap-1.5 bg-[#ffdbcf]/50 text-[#812901] px-3 py-1 rounded-full text-xs font-bold mb-3 border border-[#ffb59c]/50">
                <Sparkle size={14} weight="fill" />
                <span>Reserved Workspace Initialized</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-[#1e1b19] tracking-tight mb-2">
                Pristine Fellowship Workspace
              </h2>

              <p className="text-xs sm:text-sm text-[#57423b] leading-relaxed">
                The application shell for{' '}
                <strong className="text-[#1e1b19] font-semibold">
                  {activeTown ? activeTown.name : 'your assigned'} Hub
                </strong>{' '}
                is active. This core viewport serves as the dedicated space for
                youth registries, activities, and fellowship notes.
              </p>
            </div>

            {/* Bottom Footer Specs */}
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#e8e1dd]">
              <div className="flex items-center gap-4 text-xs text-[#8a726a]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#b85028]" />
                  <span>Terracotta Accent</span>
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
                  Signed in as {user.fullName} ({user.role})
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

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

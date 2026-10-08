import { useState } from 'react';

export type DashboardTabId =
  | 'dashboard'
  | 'members'
  | 'activities'
  | 'transfers'
  | 'access'
  | 'reports';

const TAB_TITLES: Record<DashboardTabId, string> = {
  dashboard: 'Dashboard Overview',
  members: 'Members & Directory',
  activities: 'Activities & Calendar',
  transfers: 'Town Transfers',
  access: 'Access & Accounts',
  reports: 'Reports & Analytics',
};

export function useDashboardLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTabId>('dashboard');
  const [isHubSwitcherOpen, setIsHubSwitcherOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarCollapsed((prev) => !prev);
  const openHubSwitcher = () => setIsHubSwitcherOpen(true);
  const closeHubSwitcher = () => setIsHubSwitcherOpen(false);
  const openChangePassword = () => setIsChangePasswordOpen(true);
  const closeChangePassword = () => setIsChangePasswordOpen(false);

  return {
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
    currentTabTitle: TAB_TITLES[activeTab],
  };
}

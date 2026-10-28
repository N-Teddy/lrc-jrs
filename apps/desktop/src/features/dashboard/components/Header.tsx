import type { NotificationResource } from '@jrs/client-core';
import { useAuth, useTownContext, useTranslation } from '@jrs/client-core';
import {
  CaretDown,
  Key,
  MagnifyingGlass,
  SidebarSimple,
  SignOut,
  Sparkle,
} from '@phosphor-icons/react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  LanguageToggle,
  NotificationBell,
  UserAvatar,
} from '../../../components';
import { formatDashboardDate } from '../utils/dashboard.utils';

interface HeaderProps {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenChangePassword: () => void;
  onNavigateToResource?: (resource: NotificationResource) => void;
  onOpenNotificationsPage?: () => void;
  title?: string;
  hasUpdate?: boolean;
  onOpenWhatsNew?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isSidebarCollapsed,
  onToggleSidebar,
  onOpenChangePassword,
  onNavigateToResource,
  onOpenNotificationsPage,
  title = 'Dashboard Overview',
  hasUpdate = false,
  onOpenWhatsNew,
}) => {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const { activeTown } = useTownContext();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!isProfileMenuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileMenuOpen]);

  const todayFormatted = formatDashboardDate(new Date(), i18n.language);

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-[#e8e1dd] z-20 flex items-center justify-between px-6 transition-all duration-200 gap-4 ${
        isSidebarCollapsed ? 'left-[72px]' : 'left-[260px]'
      }`}
    >
      {/* 1. Left: Breadcrumbs / Title */}
      <div className="flex items-center gap-3 shrink-0">
        {isSidebarCollapsed && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-1.5 rounded-md text-[#8a726a] hover:bg-[#faf2ee] hover:text-[#1e1b19] transition cursor-pointer"
            title={t('navigation:expandSidebar')}
          >
            <SidebarSimple size={18} weight="bold" />
          </button>
        )}

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-[11px] text-[#8a726a]">
            <span>{t('common:portal')}</span>
            <span>›</span>
            <span className="font-semibold text-[#b85028]">
              {activeTown ? activeTown.name : 'Cameroon'}
            </span>
            <span>›</span>
            <span className="text-[#1e1b19] font-medium">{title}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-base font-bold text-[#1e1b19] tracking-tight">
              {title}
            </h1>
            <span className="text-[11px] text-[#8a726a] hidden lg:inline">
              • {todayFormatted}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Middle: Large Centered Search Bar */}
      <div className="flex-1 flex justify-center max-w-xl mx-auto px-2">
        <div className="relative flex items-center w-full max-w-lg">
          <MagnifyingGlass
            size={18}
            className="absolute left-3.5 text-[#8a726a]"
            weight="bold"
          />
          <input
            type="text"
            placeholder={t('dashboard:searchPlaceholder')}
            className="w-full h-10 pl-10 pr-12 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] text-xs text-[#1e1b19] placeholder:text-[#8a726a] outline-none transition focus:bg-white focus:border-[#b85028]"
          />
          <kbd className="absolute right-3 px-1.5 py-0.5 rounded bg-white text-[10px] font-mono text-[#8a726a] border border-[#e8e1dd] shadow-2xs pointer-events-none">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* 3. Right: Notification Bell, Language Switcher & User Profile Button */}
      <div className="flex items-center gap-3 shrink-0">
        <NotificationBell
          onNavigateToResource={onNavigateToResource}
          onOpenNotificationsPage={onOpenNotificationsPage}
        />
        <LanguageToggle size="md" />

        <div ref={profileMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="h-10 flex items-center gap-2.5 px-3 rounded-lg border border-[#e8e1dd] bg-white hover:bg-[#faf2ee] transition cursor-pointer relative"
          >
            <div className="relative">
              <UserAvatar
                avatarUrl={user?.avatarUrl}
                name={user?.fullName}
                size="sm"
              />
              {hasUpdate && (
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#b85028] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#b85028] ring-2 ring-white" />
                </span>
              )}
            </div>

            {/* User Name & Role always visible */}
            <div className="flex flex-col text-left leading-tight">
              <span className="text-xs font-bold text-[#1e1b19]">
                {user?.fullName || 'User'}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block px-1.5 py-0.2 rounded bg-[#edf3ee] text-[#486b52] font-bold text-[10px]">
                  {user?.role}
                </span>
                <span className="text-[10px] text-[#8a726a] font-medium">
                  {activeTown?.code || ''}
                </span>
              </div>
            </div>

            <CaretDown
              size={12}
              weight="bold"
              className="text-[#8a726a] ml-1"
            />
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 top-12 z-40 w-64 rounded-xl bg-white border border-[#e8e1dd] shadow-xl p-2 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 px-2 py-2 border-b border-[#e8e1dd] mb-1">
                <UserAvatar
                  avatarUrl={user?.avatarUrl}
                  name={user?.fullName}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[#1e1b19] truncate">
                    {user?.fullName}
                  </p>
                  <p className="text-[11px] text-[#8a726a] truncate">
                    {user?.phoneNumber || user?.email}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="px-2 py-0.5 rounded bg-[#edf3ee] text-[#486b52] text-[10px] font-bold">
                      {t('dashboard:accessRole', { role: user?.role })}
                    </span>
                    {activeTown && (
                      <span className="text-[10px] text-[#8a726a] truncate">
                        {t('dashboard:hubPrefix', { name: activeTown.name })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* What's New & Release Updates */}
              <button
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  onOpenWhatsNew?.();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium text-[#57423b] hover:bg-[#faf2ee] hover:text-[#1e1b19] transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Sparkle size={15} weight="bold" className="text-[#b85028]" />
                  <span>{t('dashboard:whatsNew', "What's New")}</span>
                </div>
                {hasUpdate && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#b85028] text-white text-[10px] font-bold shadow-2xs animate-pulse">
                    {t('dashboard:updateBadge', 'Update')}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  onOpenChangePassword();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-[#57423b] hover:bg-[#faf2ee] hover:text-[#1e1b19] transition cursor-pointer"
              >
                <Key size={15} weight="bold" />
                <span>{t('dashboard:changePassword')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  signOut();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold text-[#ba1a1a] hover:bg-[#ffdad6] transition cursor-pointer"
              >
                <SignOut size={15} weight="bold" />
                <span>{t('common:logOut')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

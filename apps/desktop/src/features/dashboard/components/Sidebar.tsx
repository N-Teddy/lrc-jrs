import { useAuth, useTownContext, useTranslation } from '@jrs/client-core';
import {
  ArrowsLeftRight,
  CalendarBlank,
  ChartBar,
  MapPin,
  SidebarSimple,
  SignOut,
  SquaresFour,
  Users,
  Warning,
  X,
} from '@phosphor-icons/react';
import { motion } from 'motion/react';
import type React from 'react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import appIcon from '../../../assets/app-icon.jpg';
import type { DashboardTabId } from '../hooks/use-dashboard-layout';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeTab: DashboardTabId;
  onSelectTab: (tab: DashboardTabId) => void;
  onOpenHubSwitcher: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  activeTab,
  onSelectTab,
  onOpenHubSwitcher,
}) => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { activeTown } = useTownContext();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const [indicatorStyle, setIndicatorStyle] = useState<{
    top: number;
    height: number;
    opacity: number;
  }>({
    top: 0,
    height: 0,
    opacity: 0,
  });
  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Record<string, HTMLElement | null>>({});

  const navItems: {
    id: DashboardTabId;
    label: string;
    icon: React.ElementType;
    requiresAdmin?: boolean;
  }[] = [
    {
      id: 'dashboard',
      label: t('navigation:dashboard'),
      icon: SquaresFour,
    },
    {
      id: 'members',
      label: t('navigation:members'),
      icon: Users,
    },
    {
      id: 'activities',
      label: t('navigation:activities'),
      icon: CalendarBlank,
    },
    {
      id: 'transfers',
      label: t('navigation:transfers'),
      icon: ArrowsLeftRight,
      requiresAdmin: true,
    },
    {
      id: 'reports',
      label: t('navigation:reports'),
      icon: ChartBar,
    },
  ];

  // Filter items based on user role (AP and PC have administrative rights)
  const isPrivileged = user?.role === 'AP' || user?.role === 'PC';
  const visibleNavItems = navItems.filter(
    (item) => !item.requiresAdmin || isPrivileged,
  );

  // Measure active nav item position for fluid sliding indicator
  const updatePosition = useCallback(() => {
    const activeElement = itemRefs.current[activeTab];
    const navElement = navRef.current;
    if (activeElement && navElement) {
      const navRect = navElement.getBoundingClientRect();
      const btnRect = activeElement.getBoundingClientRect();
      const top = btnRect.top - navRect.top + navElement.scrollTop;
      setIndicatorStyle({
        top,
        height: btnRect.height,
        opacity: 1,
      });
    } else {
      setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
    }
  }, [activeTab]);

  useLayoutEffect(() => {
    updatePosition();
  }, [updatePosition]);

  useEffect(() => {
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [updatePosition]);

  useEffect(() => {
    // Re-check resting position after sidebar collapse/expand animation completes (200ms)
    const delay = isCollapsed ? 220 : 220;
    const timer = setTimeout(updatePosition, delay);
    return () => clearTimeout(timer);
  }, [isCollapsed, updatePosition]);

  return (
    <>
      <aside
        className={`fixed left-0 top-0 h-screen z-30 flex flex-col justify-between border-r border-[#e8e1dd] bg-white transition-all duration-200 select-none ${
          isCollapsed ? 'w-[72px]' : 'w-[260px]'
        }`}
      >
        {/* Top Section */}
        <div className="flex flex-col">
          {/* Brand Header */}
          <div
            className={`h-16 flex items-center border-b border-[#e8e1dd] ${
              isCollapsed ? 'justify-center px-2' : 'justify-between px-5'
            }`}
          >
            <div className="flex items-center gap-3">
              <img
                src={appIcon}
                alt="JRS"
                className="w-8 h-8 rounded-lg object-cover shadow-2xs shrink-0 border border-[#e8e1dd]"
              />
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm text-[#1e1b19] leading-tight truncate">
                    {t('common:appName')}
                  </span>
                  <span className="text-[11px] text-[#8a726a] font-medium leading-tight">
                    {t('common:fellowshipName')}
                  </span>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="p-1.5 rounded-md text-[#8a726a] hover:bg-[#faf2ee] hover:text-[#1e1b19] transition cursor-pointer"
                title={t('navigation:collapseSidebar')}
              >
                <SidebarSimple size={18} weight="bold" />
              </button>
            )}
          </div>

          {/* Active Hub Scope Card */}
          <div className="p-3 border-b border-[#e8e1dd]/60">
            {isCollapsed ? (
              <div className="relative group flex justify-center">
                <button
                  type="button"
                  onClick={onOpenHubSwitcher}
                  className="w-11 h-11 rounded-md bg-[#faf2ee] border border-[#e8e1dd] flex items-center justify-center text-[#b85028] hover:bg-[#ffdbcf] transition cursor-pointer"
                >
                  <MapPin size={20} weight="fill" />
                </button>
                <div className="absolute left-[78px] top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
                  <div className="bg-[#1e1b19] text-white text-xs px-3 py-1.5 rounded-md shadow-lg whitespace-nowrap">
                    {activeTown
                      ? `${activeTown.name} ${t('towns:hub')} (${activeTown.code})`
                      : t('towns:activeHub')}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-[#e8e1dd] bg-[#faf2ee] p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-white border border-[#e8e1dd] text-[#b85028] flex items-center justify-center shrink-0">
                    <MapPin size={15} weight="fill" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-[#1e1b19] truncate">
                      {activeTown
                        ? `${activeTown.name} ${t('towns:hub')}`
                        : t('towns:regionalHub')}
                    </span>
                    <span className="text-[10px] text-[#8a726a] font-mono">
                      {activeTown
                        ? `${t('towns:code')}: ${activeTown.code}`
                        : 'Cameroon'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenHubSwitcher}
                  className="px-2.5 py-1 rounded-md bg-white text-[#b85028] text-[11px] font-bold border border-[#e8e1dd] hover:bg-[#ffdbcf] transition cursor-pointer shrink-0"
                >
                  {t('common:switch')} ▾
                </button>
              </div>
            )}
          </div>

          {/* Navigation Items with Fluid Sliding Merged Active Tab & Concave Curve Scoops */}
          <nav
            ref={navRef}
            className={`relative pt-3 pb-4 space-y-1.5 ${
              isCollapsed ? 'px-0' : 'pl-3 pr-0'
            }`}
          >
            {/* Sliding Indicator with Seamless Sanctuary Fill and Inverted Border Radius Scoops */}
            <motion.div
              className={`absolute z-10 pointer-events-none ${
                isCollapsed ? 'left-2' : 'left-3'
              } right-[-2px]`}
              initial={false}
              animate={{
                y: indicatorStyle.top,
                height: indicatorStyle.height,
                opacity: indicatorStyle.opacity,
              }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 34,
                mass: 0.8,
              }}
              style={{
                top: 0,
              }}
            >
              {/* Active tab background fill & left rounded edge */}
              <div className="absolute inset-0 bg-[#fff8f5] rounded-l-xl border-l border-[#e8e1dd]" />

              {/* Top horizontal border: stops 16px before the right edge where scoop curves up */}
              <div className="absolute top-0 left-3 right-4 h-px bg-[#e8e1dd]" />

              {/* Bottom horizontal border: stops 16px before the right edge where scoop curves down */}
              <div className="absolute bottom-0 left-3 right-4 h-px bg-[#e8e1dd]" />

              {/* Right overlap fill: guarantees 0px gap merging with #fff8f5 canvas */}
              <div className="absolute top-0 bottom-0 right-0 w-4 bg-[#fff8f5]" />

              {/* Top Concave Inverted Curve Scoop */}
              <div className="absolute -top-4 right-0 w-[18px] h-4 overflow-hidden pointer-events-none">
                <svg
                  width="18"
                  height="16"
                  viewBox="0 0 18 16"
                  fill="none"
                  className="w-full h-full"
                >
                  <path
                    d="M 18 0 V 16 H 0 C 8.8366 16, 16 8.8366, 16 0 Z"
                    fill="#fff8f5"
                  />
                  <path
                    d="M 0 16 C 8.8366 16, 16 8.8366, 16 0"
                    stroke="#e8e1dd"
                    strokeWidth="1"
                    fill="none"
                  />
                </svg>
              </div>

              {/* Bottom Concave Inverted Curve Scoop */}
              <div className="absolute -bottom-4 right-0 w-[18px] h-4 overflow-hidden pointer-events-none">
                <svg
                  width="18"
                  height="16"
                  viewBox="0 0 18 16"
                  fill="none"
                  className="w-full h-full"
                >
                  <path
                    d="M 0 0 H 18 V 16 H 16 C 16 7.1634, 8.8366 0, 0 0 Z"
                    fill="#fff8f5"
                  />
                  <path
                    d="M 0 0 C 8.8366 0, 16 7.1634, 16 16"
                    stroke="#e8e1dd"
                    strokeWidth="1"
                    fill="none"
                  />
                </svg>
              </div>
            </motion.div>

            {!isCollapsed && (
              <div className="px-5 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8a726a]">
                {t('navigation:workspaceNavigation')}
              </div>
            )}

            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              if (isCollapsed) {
                return (
                  <div
                    key={item.id}
                    className="relative group flex justify-center py-0.5"
                  >
                    <motion.button
                      ref={(el) => {
                        itemRefs.current[item.id] = el;
                      }}
                      type="button"
                      onClick={() => onSelectTab(item.id)}
                      whileTap={{ scale: 0.94 }}
                      className={`relative z-20 w-11 h-11 flex items-center justify-center transition-colors duration-200 cursor-pointer ${
                        isActive
                          ? 'text-[#b85028]'
                          : 'rounded-lg text-[#57423b] hover:bg-[#faf2ee] hover:text-[#1e1b19]'
                      }`}
                    >
                      <motion.span
                        animate={{ scale: isActive ? 1.12 : 1 }}
                        transition={{
                          type: 'spring',
                          stiffness: 500,
                          damping: 25,
                        }}
                        className="flex items-center justify-center"
                      >
                        <Icon
                          size={21}
                          weight={isActive ? 'fill' : 'bold'}
                          className={`transition-colors duration-200 ${
                            isActive ? 'text-[#b85028]' : 'text-[#8a726a]'
                          }`}
                        />
                      </motion.span>
                    </motion.button>

                    <div className="absolute left-[78px] top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
                      <div className="bg-[#1e1b19] text-white text-xs px-3 py-1.5 rounded-md shadow-lg whitespace-nowrap flex items-center gap-1.5">
                        <span>{item.label}</span>
                        {isActive && (
                          <span className="text-[10px] bg-[#b85028] text-white px-1.5 py-0.5 rounded">
                            {t('common:active')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <motion.button
                  key={item.id}
                  ref={(el) => {
                    itemRefs.current[item.id] = el;
                  }}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  whileTap={{ scale: 0.98 }}
                  className={`relative z-20 flex items-center gap-3.5 pl-6 pr-4 h-11 text-[13px] transition-colors duration-200 cursor-pointer ${
                    isActive
                      ? 'w-full text-[#b85028] font-bold'
                      : 'w-[calc(100%-12px)] rounded-lg font-medium text-[#57423b] hover:bg-[#faf2ee] hover:text-[#1e1b19]'
                  }`}
                >
                  <motion.span
                    animate={{ scale: isActive ? 1.08 : 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="shrink-0 flex items-center justify-center"
                  >
                    <Icon
                      size={20}
                      weight={isActive ? 'fill' : 'bold'}
                      className={`transition-colors duration-200 ${
                        isActive ? 'text-[#b85028]' : 'text-[#8a726a]'
                      }`}
                    />
                  </motion.span>
                  <span className="truncate">{item.label}</span>
                </motion.button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Footer Section */}
        <div className="p-3 border-t border-[#e8e1dd] flex flex-col gap-2.5">
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={onToggleCollapse}
                className="w-11 h-9 rounded-md bg-[#faf2ee] text-[#57423b] hover:bg-white hover:text-[#1e1b19] transition flex items-center justify-center cursor-pointer"
                title={t('navigation:expandSidebar')}
              >
                <SidebarSimple size={17} weight="bold" />
              </button>

              {/* Red Log Out Button for Collapsed Mode */}
              <div className="relative group w-full flex justify-center">
                <button
                  type="button"
                  onClick={() => setIsLogoutModalOpen(true)}
                  className="w-11 h-11 rounded-md bg-[#ffdad6] text-[#ba1a1a] hover:bg-[#ffb4a8] transition flex items-center justify-center cursor-pointer shadow-xs"
                  title={t('common:logOut')}
                >
                  <SignOut size={20} weight="bold" />
                </button>
                <div className="absolute left-[78px] bottom-0 hidden group-hover:flex items-center z-50 pointer-events-none">
                  <div className="bg-[#1e1b19] text-white text-xs px-3 py-1.5 rounded-md shadow-lg whitespace-nowrap">
                    {t('common:logOut')}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Red Log Out Button with Icon and Name (User name pill removed per backlog) */
            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-3.5 rounded-md bg-[#ffdad6] text-[#ba1a1a] hover:bg-[#ffb4a8] font-bold text-xs transition cursor-pointer shadow-xs"
            >
              <SignOut size={17} weight="bold" />
              <span>{t('common:logOut')}</span>
            </button>
          )}
        </div>
      </aside>

      {/* Logout Confirmation Warning Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#23201e]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-md my-auto bg-white rounded-xl border border-[#e8e1dd] shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 flex items-start justify-between border-b border-[#f4ece9] bg-[#faf8f6]/50 rounded-t-xl">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-[#ffdad6] border border-[#ffb4a8] text-[#ba1a1a] flex items-center justify-center shrink-0 shadow-xs">
                  <Warning size={22} weight="fill" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-base font-bold text-[#1e1b19]">
                    {t('common:logOut')}
                  </h3>
                  <p className="text-xs text-[#8a726a]">
                    Confirm account session termination
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="w-8 h-8 rounded-md bg-[#faf2ee] hover:bg-[#f4ece9] flex items-center justify-center text-[#8a726a] hover:text-[#1e1b19] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex flex-col gap-3">
              <p className="text-xs text-[#57423b] leading-relaxed">
                Are you sure you want to log out of your session? You will need
                your login credentials to sign back in.
              </p>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 bg-[#faf2ee] border-t border-[#e8e1dd] flex items-center justify-end gap-2.5 rounded-b-xl">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="px-4 py-2 rounded-md bg-white border border-[#e8e1dd] text-xs font-bold text-[#57423b] hover:bg-[#f4ece9] transition-colors cursor-pointer"
              >
                {t('common:cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogoutModalOpen(false);
                  signOut();
                }}
                className="px-4 py-2 rounded-md bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold shadow-xs active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
              >
                <SignOut size={15} weight="bold" />
                <span>{t('common:logOut')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

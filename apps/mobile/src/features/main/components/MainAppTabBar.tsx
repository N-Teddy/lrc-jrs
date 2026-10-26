import {
  useAuth,
  usePendingReviewsQuery,
  useTownContext,
  useTranslation,
} from '@jrs/client-core';
import type { NotificationResource } from '@jrs/shared';
import {
  CalendarCheck,
  FileText,
  House,
  List,
  Users,
} from 'phosphor-react-native';
import React, { useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { colors } from '../../../theme/colors';
import {
  MobileNotificationBell,
  NotificationsSheet,
} from '../../notifications';
import { HomeScreen } from './HomeScreen';
import { NavigationSidebar, type SidebarPanel } from './NavigationSidebar';
import { ToastNotification, type ToastState } from './ToastNotification';
import { UserAvatar } from './UserAvatar';

interface MainAppTabBarProps {
  onSwitchTown?: () => void;
  hasMultiTownAccess?: boolean;
}

export const MainAppTabBar: React.FC<MainAppTabBarProps> = ({
  onSwitchTown,
  hasMultiTownAccess = false,
}) => {
  const { user, signOut } = useAuth();
  const { activeTown, availableTowns, setActiveTownId } = useTownContext();
  const { i18n } = useTranslation();
  const isFrench = i18n.language?.startsWith('fr');
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 12);

  const { data: pendingReviews } = usePendingReviewsQuery(activeTown?.id);
  const pendingReviewsCount = pendingReviews?.length ?? 3;

  // Navigation State
  const [activeTab, setActiveTab] = useState<
    'home' | 'members' | 'activities' | 'reports'
  >('home');

  // Notifications Modal State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Sidebar Drawer State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarInitialPanel, setSidebarInitialPanel] =
    useState<SidebarPanel>('root');

  // Toast Notification State
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'info',
  });

  const showToast = (message: string, type: 'info' | 'success' = 'info') => {
    setToast({ visible: true, message, type });
  };

  const handleDismissToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  const openSidebar = (panel: SidebarPanel = 'root') => {
    setSidebarInitialPanel(panel);
    setIsSidebarOpen(true);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const toggleLanguage = () => {
    const nextLang = isFrench ? 'en' : 'fr';
    i18n.changeLanguage(nextLang);
    showToast(
      nextLang === 'fr'
        ? 'Langue modifiée: Français'
        : 'Language updated: English',
      'success',
    );
  };

  const navigateToTab = (
    tab: 'home' | 'members' | 'activities' | 'reports',
  ) => {
    setActiveTab(tab);
  };

  const handleSelectTownFromSidebar = async (townId: string) => {
    await setActiveTownId(townId);
  };

  const handleNavigateToResource = (resource: NotificationResource) => {
    // 1. Switch town context if needed and available
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

    // 2. Navigate to appropriate tab/screen
    switch (resource.entityType) {
      case 'ACTIVITY':
      case 'ATTENDANCE':
        setActiveTab('activities');
        break;
      case 'MEMBER':
      case 'INTAKE':
        setActiveTab('members');
        break;
      case 'TOWN_TRANSFER':
        openSidebar('town-switcher');
        break;
      default:
        setActiveTab('home');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Floating In-App Toast Notification */}
      <ToastNotification toast={toast} onDismiss={handleDismissToast} />

      {/* Sticky 56px Top Bar */}
      <View style={styles.topHeader}>
        {/* Left Hamburger Button */}
        <TouchableOpacity
          style={styles.hamburgerBtn}
          onPress={() => openSidebar('root')}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Open navigation menu"
        >
          <List size={22} weight="bold" color={colors.onSurface} />
        </TouchableOpacity>

        {/* Center Pill: LRC JRS / Regional Hub Branding */}
        <View style={styles.centerPill}>
          <TouchableOpacity
            style={styles.centerPillBtn}
            onPress={() => openSidebar('town-switcher')}
            activeOpacity={0.8}
          >
            <Text style={styles.centerPillPrimary}>LRC JRS</Text>
            <View style={styles.centerPillDivider} />
            <Text style={styles.centerPillSecondary}>
              {activeTown?.name || 'Réseau'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Right Actions: Notification Bell + User Profile Avatar */}
        <View style={styles.rightActions}>
          <MobileNotificationBell
            onPress={() => setIsNotificationsOpen(true)}
          />
          <TouchableOpacity
            style={styles.profileAvatarBtn}
            onPress={() => openSidebar('root')}
            activeOpacity={0.8}
            accessibilityLabel="Open profile and settings"
          >
            <UserAvatar user={user} size={36} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <HomeScreen
            user={user}
            activeTown={activeTown}
            onOpenDrawer={openSidebar}
            onNavigateToMembers={() => setActiveTab('members')}
            onNavigateToActivities={() => setActiveTab('activities')}
            onNavigateToReports={() => setActiveTab('reports')}
            onShowToast={showToast}
            isFrench={isFrench}
          />
        )}

        {/* TAB 2: MEMBERS */}
        {activeTab === 'members' && <View style={styles.tabViewContainer} />}

        {/* TAB 3: ACTIVITIES */}
        {activeTab === 'activities' && <View style={styles.tabViewContainer} />}

        {/* TAB 4: REPORTS */}
        {activeTab === 'reports' && <View style={styles.tabViewContainer} />}
      </View>

      {/* Raised Bottom Tab Bar (4 Tabs: Home, Members, Activities, Reports) */}
      <View
        style={[
          styles.bottomTabBar,
          {
            paddingBottom: bottomInset,
            paddingTop: 8,
            height: 64 + bottomInset,
          },
        ]}
      >
        {/* TAB 1: HOME */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigateToTab('home')}
          activeOpacity={0.7}
        >
          <House
            size={22}
            weight={activeTab === 'home' ? 'fill' : 'regular'}
            color={activeTab === 'home' ? colors.primary : colors.textMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'home' && styles.tabLabelActive,
            ]}
          >
            {isFrench ? 'Accueil' : 'Home'}
          </Text>
        </TouchableOpacity>

        {/* TAB 2: MEMBERS */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigateToTab('members')}
          activeOpacity={0.7}
        >
          <Users
            size={22}
            weight={activeTab === 'members' ? 'fill' : 'regular'}
            color={activeTab === 'members' ? colors.primary : colors.textMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'members' && styles.tabLabelActive,
            ]}
          >
            {isFrench ? 'Membres' : 'Members'}
          </Text>
        </TouchableOpacity>

        {/* TAB 3: ACTIVITIES */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigateToTab('activities')}
          activeOpacity={0.7}
        >
          <CalendarCheck
            size={22}
            weight={activeTab === 'activities' ? 'fill' : 'regular'}
            color={
              activeTab === 'activities' ? colors.primary : colors.textMuted
            }
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'activities' && styles.tabLabelActive,
            ]}
          >
            {isFrench ? 'Activités' : 'Activities'}
          </Text>
        </TouchableOpacity>

        {/* TAB 4: REPORTS */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigateToTab('reports')}
          activeOpacity={0.7}
        >
          <FileText
            size={22}
            weight={activeTab === 'reports' ? 'fill' : 'regular'}
            color={activeTab === 'reports' ? colors.primary : colors.textMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'reports' && styles.tabLabelActive,
            ]}
          >
            {isFrench ? 'Rapports' : 'Reports'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sliding Navigation Sidebar */}
      <NavigationSidebar
        isOpen={isSidebarOpen}
        initialPanel={sidebarInitialPanel}
        user={user}
        activeTown={activeTown}
        availableTowns={availableTowns}
        pendingReviewsCount={pendingReviewsCount}
        onClose={closeSidebar}
        onSelectTown={handleSelectTownFromSidebar}
        onOpenMap={hasMultiTownAccess ? onSwitchTown : undefined}
        onSignOut={signOut}
        onToggleLanguage={toggleLanguage}
        onNavigateToReviews={() => {
          setActiveTab('home');
          showToast(
            isFrench
              ? `${pendingReviewsCount} candidatures en attente de révision`
              : `${pendingReviewsCount} intake applications in review queue`,
            'info',
          );
        }}
        onNavigateToStats={() => setActiveTab('reports')}
        onShowToast={showToast}
        isFrench={isFrench}
      />

      {/* Notifications Bottom Sheet / Modal */}
      <NotificationsSheet
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigateToResource={handleNavigateToResource}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  topHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  hamburgerBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPill: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  centerPillPrimary: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.2,
  },
  centerPillDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.outline,
  },
  centerPillSecondary: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  profileAvatarBtn: {
    padding: 2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mainContent: {
    flex: 1,
  },
  tabViewContainer: {
    flex: 1,
  },
  bottomTabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabLabelActive: {
    fontWeight: '800',
    color: colors.primary,
  },
});

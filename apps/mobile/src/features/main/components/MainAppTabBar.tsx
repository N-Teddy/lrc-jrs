import { useAuth, useTownContext, useTranslation } from '@jrs/client-core';
import {
  CalendarCheck,
  CaretRight,
  Gear,
  Globe,
  House,
  List,
  MapPin,
  MapTrifold,
  SignOut,
  UserCheck,
  Users,
  X,
} from 'phosphor-react-native';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../theme/colors';

interface MainAppTabBarProps {
  onSwitchTown?: () => void;
  hasMultiTownAccess?: boolean;
}

export const MainAppTabBar: React.FC<MainAppTabBarProps> = ({
  onSwitchTown,
  hasMultiTownAccess = false,
}) => {
  const { user, signOut } = useAuth();
  const { activeTown } = useTownContext();
  const { t, i18n } = useTranslation();
  const isFrench = i18n.language?.startsWith('fr');

  const { width: windowWidth } = useWindowDimensions();
  const sidebarWidth = Math.round(windowWidth * 0.8);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-sidebarWidth)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'home' | 'members' | 'activities' | 'settings'
  >('home');

  const openSidebar = () => {
    setIsSidebarOpen(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0.5,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSidebar = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -sidebarWidth,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsSidebarOpen(false);
    });
  };

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const toggleLanguage = () => {
    const nextLang = isFrench ? 'en' : 'fr';
    i18n.changeLanguage(nextLang);
  };

  const navigateTab = (tab: 'home' | 'members' | 'activities' | 'settings') => {
    setActiveTab(tab);
    closeSidebar();
  };

  const initials =
    user?.fullName
      ?.split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Main Tab Content Area (No global header - each screen controls its header) */}
      <View style={styles.content}>
        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <View style={styles.homeContainer}>
            {/* Dedicated Home Header with Hamburger Button, Greeting & Avatar */}
            <View style={styles.homeHeader}>
              <View style={styles.homeHeaderLeft}>
                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={openSidebar}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  activeOpacity={0.7}
                  accessibilityLabel="Open sidebar menu"
                >
                  <List size={26} weight="bold" color={colors.text} />
                </TouchableOpacity>

                <View style={styles.greetingContainer}>
                  <Text style={styles.greetingText}>
                    {isFrench ? 'Bienvenue,' : 'Welcome,'}
                  </Text>
                  <Text style={styles.userNameText} numberOfLines={1}>
                    {user?.fullName || 'User'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.profileButton}
                onPress={openSidebar}
                activeOpacity={0.8}
              >
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Clean Home Content */}
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Active Hub Card */}
              {activeTown && (
                <View style={styles.cleanHubCard}>
                  <View style={styles.cleanHubHeader}>
                    <View style={styles.cleanHubBadge}>
                      <MapPin size={16} weight="fill" color={colors.primary} />
                      <Text style={styles.cleanHubTownName}>
                        {activeTown.name}
                      </Text>
                    </View>
                    <View style={styles.statusDotRow}>
                      <View style={styles.statusDot} />
                      <Text style={styles.statusText}>
                        {isFrench ? 'Connecté' : 'Active'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.cleanHubSubtitle}>
                    {isFrench
                      ? `Espace de communion de ${activeTown.name} (${activeTown.code})`
                      : `${activeTown.name} (${activeTown.code}) Fellowship Workspace`}
                  </Text>

                  {hasMultiTownAccess && onSwitchTown && (
                    <TouchableOpacity
                      style={styles.switchTownButton}
                      onPress={onSwitchTown}
                      activeOpacity={0.8}
                    >
                      <MapTrifold
                        size={15}
                        weight="bold"
                        color={colors.primary}
                      />
                      <Text style={styles.switchTownButtonText}>
                        {isFrench
                          ? 'Changer de Ville (Carte)'
                          : 'Switch Town (Map)'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Fellowship Inspiration / Scripture Quote */}
              <View style={styles.quoteCard}>
                <Text style={styles.quoteVerse}>
                  {isFrench
                    ? '« Car là où deux ou trois sont assemblés en mon nom, je suis au milieu d’eux. »'
                    : '“For where two or three are gathered together in my name, there am I in the midst of them.”'}
                </Text>
                <Text style={styles.quoteReference}>
                  {isFrench ? 'Matthieu 18:20' : 'Matthew 18:20'}
                </Text>
              </View>

              {/* Quick Navigation Cards */}
              <Text style={styles.quickNavSectionTitle}>
                {isFrench ? 'Accès Rapide' : 'Quick Access'}
              </Text>

              <View style={styles.quickGrid}>
                <TouchableOpacity
                  style={styles.quickCard}
                  onPress={() => setActiveTab('members')}
                  activeOpacity={0.8}
                >
                  <View style={styles.quickIconCircle}>
                    <Users size={24} weight="fill" color={colors.primary} />
                  </View>
                  <Text style={styles.quickCardTitle}>
                    {isFrench ? 'Membres' : 'Members'}
                  </Text>
                  <Text style={styles.quickCardDesc}>
                    {isFrench
                      ? 'Registre de communion'
                      : 'Directory & registry'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickCard}
                  onPress={() => setActiveTab('activities')}
                  activeOpacity={0.8}
                >
                  <View style={styles.quickIconCircle}>
                    <CalendarCheck
                      size={24}
                      weight="fill"
                      color={colors.primary}
                    />
                  </View>
                  <Text style={styles.quickCardTitle}>
                    {isFrench ? 'Activités' : 'Activities'}
                  </Text>
                  <Text style={styles.quickCardDesc}>
                    {isFrench ? 'Cultes & programmes' : 'Events & calendar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}

        {/* TAB 2: MEMBERS (Members comes BEFORE Activities!) */}
        {activeTab === 'members' && (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconCircle}>
                <Users size={28} weight="fill" color={colors.primary} />
              </View>
              <Text style={styles.sectionTitle}>
                {isFrench ? 'Registre des Membres' : 'Members Directory'}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {activeTown
                  ? `${activeTown.name} Hub • ${user?.role || 'MEMBER'}`
                  : 'Fellowship Members'}
              </Text>
            </View>

            <View style={styles.placeholderCard}>
              <UserCheck size={40} weight="duotone" color={colors.primary} />
              <Text style={styles.placeholderTitle}>
                {isFrench ? 'Membres JR' : 'JR Members'}
              </Text>
              <Text style={styles.placeholderSubtitle}>
                {isFrench
                  ? `Les membres enregistrés pour le hub de ${activeTown?.name || 'votre région'} seront affichés ici.`
                  : `Registered fellowship members for ${activeTown?.name || 'your region'} will appear here.`}
              </Text>
            </View>
          </ScrollView>
        )}

        {/* TAB 3: ACTIVITIES */}
        {activeTab === 'activities' && (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconCircle}>
                <CalendarCheck size={28} weight="fill" color={colors.primary} />
              </View>
              <Text style={styles.sectionTitle}>
                {isFrench ? 'Activités & Cultes' : 'Activities & Programs'}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {activeTown
                  ? `${activeTown.name} Hub • ${isFrench ? 'Calendrier' : 'Schedule'}`
                  : 'Fellowship Activities'}
              </Text>
            </View>

            <View style={styles.placeholderCard}>
              <CalendarCheck
                size={40}
                weight="duotone"
                color={colors.primary}
              />
              <Text style={styles.placeholderTitle}>
                {isFrench ? 'Programme des Activités' : 'Activity Schedule'}
              </Text>
              <Text style={styles.placeholderSubtitle}>
                {isFrench
                  ? `Les réunions de prière, cultes de jeunesse et événements pour ${activeTown?.name || 'votre hub'} seront listés ici.`
                  : `Prayer meetings, youth services, and events for ${activeTown?.name || 'your hub'} will appear here.`}
              </Text>
            </View>
          </ScrollView>
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === 'settings' && (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconCircle}>
                <Gear size={28} weight="fill" color={colors.primary} />
              </View>
              <Text style={styles.sectionTitle}>
                {isFrench ? 'Paramètres & Profil' : 'Settings & Profile'}
              </Text>
              <Text style={styles.sectionSubtitle}>{user?.fullName}</Text>
            </View>

            <View style={styles.settingsGroup}>
              {/* Language Switch */}
              <TouchableOpacity
                style={styles.settingsRow}
                onPress={toggleLanguage}
                activeOpacity={0.7}
              >
                <View style={styles.settingsRowLeft}>
                  <Globe size={20} color={colors.text} weight="bold" />
                  <Text style={styles.settingsRowLabel}>
                    {isFrench ? 'Langue de l’application' : 'App Language'}
                  </Text>
                </View>
                <View style={styles.settingsRowRight}>
                  <Text style={styles.settingsBadgeText}>
                    {isFrench ? 'Français' : 'English'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Hub Switcher (if multi-town access) */}
              {hasMultiTownAccess && onSwitchTown && (
                <TouchableOpacity
                  style={styles.settingsRow}
                  onPress={onSwitchTown}
                  activeOpacity={0.7}
                >
                  <View style={styles.settingsRowLeft}>
                    <MapTrifold
                      size={20}
                      color={colors.primary}
                      weight="bold"
                    />
                    <Text style={styles.settingsRowLabel}>
                      {isFrench
                        ? 'Changer de Ville (Carte)'
                        : 'Change Town (Map)'}
                    </Text>
                  </View>
                  <View style={styles.settingsRowRight}>
                    <Text style={styles.settingsBadgePrimary}>
                      {activeTown?.name || 'Cameroun'}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* Logout Button */}
            <TouchableOpacity
              style={[
                styles.logoutButton,
                isLoggingOut && styles.logoutButtonDisabled,
              ]}
              onPress={handleSignOut}
              disabled={isLoggingOut}
              activeOpacity={0.85}
            >
              {isLoggingOut ? (
                <ActivityIndicator color="#BA1A1A" size="small" />
              ) : (
                <View style={styles.logoutButtonContent}>
                  <SignOut size={20} weight="bold" color={colors.error} />
                  <Text style={styles.logoutButtonText}>
                    {isFrench ? 'Se déconnecter' : 'Log Out'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* Bottom Tab Bar (Members comes BEFORE Activities!) */}
      <View style={styles.tabBar}>
        {/* TAB 1: HOME */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('home')}
        >
          <House
            size={24}
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

        {/* TAB 2: MEMBERS (comes before activities) */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('members')}
        >
          <Users
            size={24}
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
          onPress={() => setActiveTab('activities')}
        >
          <CalendarCheck
            size={24}
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

        {/* TAB 4: SETTINGS */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('settings')}
        >
          <Gear
            size={24}
            weight={activeTab === 'settings' ? 'fill' : 'regular'}
            color={activeTab === 'settings' ? colors.primary : colors.textMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'settings' && styles.tabLabelActive,
            ]}
          >
            {isFrench ? 'Paramètres' : 'Settings'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* SIDEBAR DRAWER MODAL (Slides in from Left to Right, 80% Width, Strictly NO Rounded Edges) */}
      <Modal
        visible={isSidebarOpen}
        transparent
        animationType="none"
        onRequestClose={closeSidebar}
        statusBarTranslucent
      >
        <View style={styles.modalRoot}>
          {/* Backdrop */}
          <TouchableWithoutFeedback onPress={closeSidebar}>
            <Animated.View
              style={[styles.modalBackdrop, { opacity: fadeAnim }]}
            />
          </TouchableWithoutFeedback>

          {/* Left-to-Right Drawer Container */}
          <Animated.View
            style={[
              styles.sidebarContainer,
              {
                width: sidebarWidth,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <SafeAreaView
              style={styles.sidebarSafeArea}
              edges={['top', 'bottom', 'left']}
            >
              {/* Sidebar Header */}
              <View style={styles.sidebarHeader}>
                <View style={styles.sidebarBrand}>
                  <Text style={styles.sidebarBrandTitle}>LRC Fellowship</Text>
                  <Text style={styles.sidebarBrandSub}>
                    {activeTown ? activeTown.name : 'Cameroon'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.sidebarCloseButton}
                  onPress={closeSidebar}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <X size={22} weight="bold" color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Sidebar User Profile Section */}
              <View style={styles.sidebarProfileBox}>
                <View style={styles.sidebarAvatarCircle}>
                  <Text style={styles.sidebarAvatarInitials}>{initials}</Text>
                </View>
                <View style={styles.sidebarUserInfo}>
                  <Text style={styles.sidebarUserName} numberOfLines={1}>
                    {user?.fullName || 'User'}
                  </Text>
                  <Text style={styles.sidebarUserIdentifier} numberOfLines={1}>
                    {user?.email || user?.phoneNumber || ''}
                  </Text>
                  <View style={styles.sidebarRoleBadge}>
                    <Text style={styles.sidebarRoleBadgeText}>
                      {user?.role || 'MEMBER'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Sidebar Navigation Items */}
              <ScrollView
                style={styles.sidebarNavScroll}
                contentContainerStyle={styles.sidebarNavContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.sidebarSectionLabel}>
                  {isFrench ? 'NAVIGATION' : 'NAVIGATION'}
                </Text>

                {/* Home */}
                <TouchableOpacity
                  style={[
                    styles.sidebarNavItem,
                    activeTab === 'home' && styles.sidebarNavItemActive,
                  ]}
                  onPress={() => navigateTab('home')}
                >
                  <House
                    size={20}
                    weight={activeTab === 'home' ? 'fill' : 'bold'}
                    color={
                      activeTab === 'home'
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.sidebarNavText,
                      activeTab === 'home' && styles.sidebarNavTextActive,
                    ]}
                  >
                    {isFrench ? 'Accueil' : 'Home'}
                  </Text>
                  <CaretRight size={16} color={colors.textMuted} />
                </TouchableOpacity>

                {/* Members */}
                <TouchableOpacity
                  style={[
                    styles.sidebarNavItem,
                    activeTab === 'members' && styles.sidebarNavItemActive,
                  ]}
                  onPress={() => navigateTab('members')}
                >
                  <Users
                    size={20}
                    weight={activeTab === 'members' ? 'fill' : 'bold'}
                    color={
                      activeTab === 'members'
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.sidebarNavText,
                      activeTab === 'members' && styles.sidebarNavTextActive,
                    ]}
                  >
                    {isFrench ? 'Membres' : 'Members'}
                  </Text>
                  <CaretRight size={16} color={colors.textMuted} />
                </TouchableOpacity>

                {/* Activities */}
                <TouchableOpacity
                  style={[
                    styles.sidebarNavItem,
                    activeTab === 'activities' && styles.sidebarNavItemActive,
                  ]}
                  onPress={() => navigateTab('activities')}
                >
                  <CalendarCheck
                    size={20}
                    weight={activeTab === 'activities' ? 'fill' : 'bold'}
                    color={
                      activeTab === 'activities'
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.sidebarNavText,
                      activeTab === 'activities' && styles.sidebarNavTextActive,
                    ]}
                  >
                    {isFrench ? 'Activités' : 'Activities'}
                  </Text>
                  <CaretRight size={16} color={colors.textMuted} />
                </TouchableOpacity>

                {/* Settings */}
                <TouchableOpacity
                  style={[
                    styles.sidebarNavItem,
                    activeTab === 'settings' && styles.sidebarNavItemActive,
                  ]}
                  onPress={() => navigateTab('settings')}
                >
                  <Gear
                    size={20}
                    weight={activeTab === 'settings' ? 'fill' : 'bold'}
                    color={
                      activeTab === 'settings'
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.sidebarNavText,
                      activeTab === 'settings' && styles.sidebarNavTextActive,
                    ]}
                  >
                    {isFrench ? 'Paramètres' : 'Settings'}
                  </Text>
                  <CaretRight size={16} color={colors.textMuted} />
                </TouchableOpacity>

                {/* Fellowship Town / Hub Options */}
                {hasMultiTownAccess && onSwitchTown && (
                  <>
                    <Text style={styles.sidebarSectionLabel}>
                      {isFrench ? 'CENTRE DE COMMUNION' : 'FELLOWSHIP HUB'}
                    </Text>
                    <TouchableOpacity
                      style={styles.sidebarNavItem}
                      onPress={() => {
                        closeSidebar();
                        onSwitchTown();
                      }}
                    >
                      <MapTrifold
                        size={20}
                        weight="bold"
                        color={colors.primary}
                      />
                      <Text style={styles.sidebarNavText}>
                        {isFrench
                          ? 'Changer de Ville (Carte)'
                          : 'Switch Town (Map)'}
                      </Text>
                      <CaretRight size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </>
                )}

                {/* Preferences */}
                <Text style={styles.sidebarSectionLabel}>
                  {isFrench ? 'PRÉFÉRENCES' : 'PREFERENCES'}
                </Text>
                <TouchableOpacity
                  style={styles.sidebarNavItem}
                  onPress={toggleLanguage}
                >
                  <Globe size={20} weight="bold" color={colors.textSecondary} />
                  <Text style={styles.sidebarNavText}>
                    {isFrench ? 'Langue: Français' : 'Language: English'}
                  </Text>
                  <View style={styles.langPill}>
                    <Text style={styles.langPillText}>
                      {isFrench ? 'EN' : 'FR'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </ScrollView>

              {/* Sidebar Footer with Sign Out */}
              <View style={styles.sidebarFooter}>
                <TouchableOpacity
                  style={[
                    styles.sidebarLogoutButton,
                    isLoggingOut && styles.logoutButtonDisabled,
                  ]}
                  onPress={handleSignOut}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <ActivityIndicator color="#BA1A1A" size="small" />
                  ) : (
                    <>
                      <SignOut size={20} weight="bold" color={colors.error} />
                      <Text style={styles.sidebarLogoutText}>
                        {isFrench ? 'Se déconnecter' : 'Sign Out'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  homeContainer: {
    flex: 1,
  },
  homeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  homeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingContainer: {
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  userNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    maxWidth: 180,
  },
  profileButton: {
    padding: 2,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 28,
  },
  cleanHubCard: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cleanHubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cleanHubBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cleanHubTownName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  cleanHubSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  switchTownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  switchTownButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  quoteCard: {
    backgroundColor: '#FBF9F7',
    borderColor: '#EBE5DF',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  quoteVerse: {
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.text,
    lineHeight: 20,
    textAlign: 'center',
  },
  quoteReference: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'right',
    marginTop: 8,
  },
  quickNavSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quickCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  quickIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  quickCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  quickCardDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionHeader: {
    alignItems: 'center',
    marginVertical: 16,
  },
  sectionIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  placeholderCard: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  placeholderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  placeholderSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  settingsGroup: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 18,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingsRowLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  settingsRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    backgroundColor: colors.inputBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  settingsBadgePrimary: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  logoutButton: {
    width: '100%',
    height: 50,
    backgroundColor: colors.errorLight,
    borderColor: 'rgba(186, 26, 26, 0.3)',
    borderWidth: 1.2,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutButtonText: {
    color: colors.errorDark,
    fontSize: 14,
    fontWeight: '800',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingTop: 8,
    paddingBottom: 14,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  /* Sidebar Drawer Styles - Strictly NO rounded edges (borderRadius: 0) */
  modalRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
  },
  sidebarContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  sidebarSafeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EAE6',
    borderRadius: 0,
  },
  sidebarBrand: {
    gap: 2,
  },
  sidebarBrandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
  },
  sidebarBrandSub: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  sidebarCloseButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 0,
  },
  sidebarProfileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EAE6',
    backgroundColor: '#FCFAF8',
    borderRadius: 0,
  },
  sidebarAvatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidebarAvatarInitials: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
  },
  sidebarUserInfo: {
    flex: 1,
    gap: 3,
  },
  sidebarUserName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  sidebarUserIdentifier: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sidebarRoleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0EAE6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 0,
    marginTop: 4,
  },
  sidebarRoleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.5,
  },
  sidebarNavScroll: {
    flex: 1,
  },
  sidebarNavContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 4,
  },
  sidebarSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginTop: 14,
    marginBottom: 8,
    marginHorizontal: 8,
  },
  sidebarNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 0,
  },
  sidebarNavItemActive: {
    backgroundColor: colors.primaryLight,
    borderRadius: 0,
  },
  sidebarNavText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  sidebarNavTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  langPill: {
    backgroundColor: colors.inputBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 0,
  },
  langPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  sidebarFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0EAE6',
    borderRadius: 0,
  },
  sidebarLogoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.25)',
    borderRadius: 0,
  },
  sidebarLogoutText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.errorDark,
  },
});

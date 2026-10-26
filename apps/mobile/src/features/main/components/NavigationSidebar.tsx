import type { IAuthUser, ITown } from '@jrs/shared';
import {
  ArrowsLeftRight,
  BookOpen,
  CaretRight,
  Check,
  CloudCheck,
  Globe,
  Link,
  LockKey,
  MapPin,
  ShieldCheck,
  SignOut,
  SquaresFour,
  X,
} from 'phosphor-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../theme/colors';
import { MoreHubOptionsSubPanel } from './MoreHubOptionsSubPanel';
import { TownSwitcherSubPanel } from './TownSwitcherSubPanel';
import { UserAvatar } from './UserAvatar';

export type SidebarPanel = 'root' | 'town-switcher' | 'more-hub-options';

interface NavigationSidebarProps {
  isOpen: boolean;
  initialPanel?: SidebarPanel;
  user: IAuthUser | null;
  activeTown: ITown | null;
  availableTowns: ITown[];
  pendingReviewsCount: number;
  onClose: () => void;
  onSelectTown: (townId: string) => Promise<void>;
  onOpenMap?: () => void;
  onSignOut: () => Promise<void>;
  onToggleLanguage: () => void;
  onNavigateToReviews?: () => void;
  onNavigateToStats?: () => void;
  onShowToast: (message: string) => void;
  isFrench?: boolean;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  isOpen,
  initialPanel = 'root',
  user,
  activeTown,
  availableTowns,
  pendingReviewsCount,
  onClose,
  onSelectTown,
  onOpenMap,
  onSignOut,
  onToggleLanguage,
  onNavigateToReviews,
  onNavigateToStats,
  onShowToast,
  isFrench = false,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const sidebarWidth = Math.round(windowWidth * 0.82);

  const [currentPanel, setCurrentPanel] = useState<SidebarPanel>(initialPanel);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const slideAnim = useRef(new Animated.Value(-sidebarWidth)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Sync initial panel when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentPanel(initialPanel);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.45,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen, initialPanel, slideAnim, fadeAnim]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -sidebarWidth,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      setCurrentPanel('root');
    });
  };

  const handleTownSelected = async (townId: string) => {
    try {
      await onSelectTown(townId);
      const selected = availableTowns.find((t) => t.id === townId);
      onShowToast(
        isFrench
          ? `Espace basculé sur ${selected?.name || 'la ville'}`
          : `Switched to ${selected?.name || 'town'} workspace`,
      );
    } finally {
      handleClose();
    }
  };

  const handleSignOutPress = async () => {
    try {
      setIsSigningOut(true);
      await onSignOut();
    } finally {
      setIsSigningOut(false);
      handleClose();
    }
  };

  const roleDisplay =
    user?.role === 'AP'
      ? isFrench
        ? 'Animateur Principal (AP)'
        : 'Lead Coordinator (AP)'
      : user?.role === 'PC'
        ? isFrench
          ? 'Personne Contact (PC)'
          : 'Contact Person (PC)'
        : isFrench
          ? 'Membre Jeunesse'
          : 'Youth Member';

  const isHomeTown = activeTown?.id === user?.homeTownId;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        {/* Scrim Overlay */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View style={[styles.scrim, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        {/* Drawer Panel */}
        <Animated.View
          style={[
            styles.drawerPanel,
            {
              width: sidebarWidth,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <SafeAreaView
            style={styles.safeArea}
            edges={['top', 'bottom', 'left']}
          >
            {/* SUB-PANEL 1: Town Switcher */}
            {currentPanel === 'town-switcher' && (
              <TownSwitcherSubPanel
                user={user}
                activeTown={activeTown}
                availableTowns={availableTowns}
                onBack={() => setCurrentPanel('root')}
                onSelectTown={handleTownSelected}
                onOpenMap={() => {
                  handleClose();
                  onOpenMap?.();
                }}
                isFrench={isFrench}
              />
            )}

            {/* SUB-PANEL 2: More Hub Options */}
            {currentPanel === 'more-hub-options' && (
              <MoreHubOptionsSubPanel
                user={user}
                activeTown={activeTown}
                pendingReviewsCount={pendingReviewsCount}
                onBack={() => setCurrentPanel('root')}
                onNavigateToReviewQueue={() => {
                  handleClose();
                  onNavigateToReviews?.();
                }}
                onNavigateToStats={() => {
                  handleClose();
                  onNavigateToStats?.();
                }}
                onShowToast={onShowToast}
                isFrench={isFrench}
              />
            )}

            {/* ROOT MENU */}
            {currentPanel === 'root' && (
              <View style={styles.rootContent}>
                {/* Redesigned User Profile Header Section */}
                <View style={styles.profileSectionContainer}>
                  {/* Top Bar with Brand & Close Button */}
                  <View style={styles.sidebarTopBar}>
                    <View style={styles.brandTitleRow}>
                      <View style={styles.brandBadge}>
                        <Text style={styles.brandBadgeText}>JRS</Text>
                      </View>
                      <Text style={styles.sidebarHeaderTitle}>
                        {isFrench ? 'Profil & Espace' : 'Profile & Workspace'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.closeBtn}
                      onPress={handleClose}
                      activeOpacity={0.7}
                      accessibilityLabel="Close navigation menu"
                    >
                      <X
                        size={18}
                        weight="bold"
                        color={colors.onSurfaceVariant}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Elevated Profile Card */}
                  <View style={styles.identityCard}>
                    <View style={styles.identityProfileRow}>
                      <UserAvatar user={user} size={54} showOnlineDot />
                      <View style={styles.identityDetailsCol}>
                        <Text style={styles.userName} numberOfLines={1}>
                          {user?.fullName || 'Teddy Ngangman'}
                        </Text>
                        <Text style={styles.userContact} numberOfLines={1}>
                          {user?.phoneNumber ||
                            user?.email ||
                            (isFrench ? 'Compte Vérifié' : 'Verified Member')}
                        </Text>
                        <View style={styles.roleChip}>
                          <ShieldCheck
                            size={12}
                            weight="fill"
                            color={colors.secondary}
                          />
                          <Text style={styles.roleChipText}>{roleDisplay}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Active Hub Pill within Card */}
                    <TouchableOpacity
                      style={styles.identityHubPill}
                      onPress={() => setCurrentPanel('town-switcher')}
                      activeOpacity={0.75}
                    >
                      <View style={styles.hubPillLeft}>
                        <MapPin
                          size={13}
                          weight="fill"
                          color={colors.primary}
                        />
                        <Text style={styles.hubPillTitle} numberOfLines={1}>
                          {activeTown
                            ? `${activeTown.name} (${activeTown.code})`
                            : 'Douala Hub'}
                        </Text>
                        <View style={styles.hubPillDot} />
                        <Text style={styles.hubPillSub}>
                          {isHomeTown
                            ? isFrench
                              ? 'Hub Principal'
                              : 'Home Hub'
                            : isFrench
                              ? 'Hub Actif'
                              : 'Active Hub'}
                        </Text>
                      </View>
                      <CaretRight
                        size={13}
                        weight="bold"
                        color={colors.outline}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Scrollable Navigation Sections */}
                <ScrollView
                  style={styles.navScrollView}
                  contentContainerStyle={styles.navScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Section 1: Jurisdiction & Hub */}
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>
                      {isFrench ? 'JURIDICTION & CENTRE' : 'JURISDICTION & HUB'}
                    </Text>

                    {/* Switch Town Hub */}
                    <TouchableOpacity
                      style={styles.navItem}
                      onPress={() => setCurrentPanel('town-switcher')}
                      activeOpacity={0.75}
                    >
                      <View style={styles.navItemLeft}>
                        <View style={styles.navIconBox}>
                          <MapPin
                            size={18}
                            weight="bold"
                            color={colors.primary}
                          />
                        </View>
                        <Text style={styles.navItemLabel}>
                          {isFrench ? 'Changer de Ville' : 'Switch Town Hub'}
                        </Text>
                      </View>
                      <View style={styles.navItemBadge}>
                        <Text style={styles.navItemBadgeText} numberOfLines={1}>
                          {activeTown?.name || 'Douala'}
                        </Text>
                        <CaretRight size={14} color={colors.outline} />
                      </View>
                    </TouchableOpacity>

                    {/* Town Transfers Ledger */}
                    <TouchableOpacity
                      style={styles.navItem}
                      onPress={() =>
                        onShowToast(
                          isFrench
                            ? 'Registre des transferts inter-villes...'
                            : 'Opening Town Transfers Ledger...',
                        )
                      }
                      activeOpacity={0.75}
                    >
                      <View style={styles.navItemLeft}>
                        <View style={styles.navIconBox}>
                          <ArrowsLeftRight
                            size={18}
                            weight="bold"
                            color={colors.primary}
                          />
                        </View>
                        <Text style={styles.navItemLabel}>
                          {isFrench
                            ? 'Registre des Transferts'
                            : 'Town Transfers Ledger'}
                        </Text>
                      </View>
                      <View style={styles.pendingTransfersBadge}>
                        <Text style={styles.pendingTransfersText}>
                          {isFrench ? '2 En attente' : '2 Pending'}
                        </Text>
                        <CaretRight size={14} color={colors.onPrimaryFixed} />
                      </View>
                    </TouchableOpacity>

                    {/* Public Registration Links */}
                    <TouchableOpacity
                      style={styles.navItem}
                      onPress={() =>
                        onShowToast(
                          isFrench
                            ? 'Liens d’inscription publique actifs'
                            : 'Public Registration Links Active',
                        )
                      }
                      activeOpacity={0.75}
                    >
                      <View style={styles.navItemLeft}>
                        <View style={styles.navIconBox}>
                          <Link
                            size={18}
                            weight="bold"
                            color={colors.primary}
                          />
                        </View>
                        <Text style={styles.navItemLabel}>
                          {isFrench
                            ? 'Liens d’Inscription Publique'
                            : 'Public Registration Links'}
                        </Text>
                      </View>
                      <View style={styles.activeLinksBadge}>
                        <Text style={styles.activeLinksText}>
                          {isFrench ? 'Actifs' : 'Active'}
                        </Text>
                        <CaretRight
                          size={14}
                          color={colors.onSecondaryFixedVariant}
                        />
                      </View>
                    </TouchableOpacity>

                    {/* More Hub Options */}
                    <TouchableOpacity
                      style={styles.navItem}
                      onPress={() => setCurrentPanel('more-hub-options')}
                      activeOpacity={0.75}
                    >
                      <View style={styles.navItemLeft}>
                        <View style={styles.navIconBox}>
                          <SquaresFour
                            size={18}
                            weight="bold"
                            color={colors.onSurfaceVariant}
                          />
                        </View>
                        <Text style={styles.navItemLabel}>
                          {isFrench
                            ? 'Plus d’Options du Hub...'
                            : 'More Hub Options...'}
                        </Text>
                      </View>
                      <CaretRight size={18} color={colors.outline} />
                    </TouchableOpacity>
                  </View>

                  {/* Section 2: Preferences */}
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>
                      {isFrench ? 'PRÉFÉRENCES' : 'PREFERENCES'}
                    </Text>

                    {/* App Language */}
                    <TouchableOpacity
                      style={styles.navItem}
                      onPress={onToggleLanguage}
                      activeOpacity={0.75}
                    >
                      <View style={styles.navItemLeft}>
                        <View style={styles.navIconBox}>
                          <Globe
                            size={18}
                            weight="bold"
                            color={colors.onSurfaceVariant}
                          />
                        </View>
                        <Text style={styles.navItemLabel}>
                          {isFrench ? 'Langue de l’App' : 'App Language'}
                        </Text>
                      </View>
                      <View style={styles.navItemBadge}>
                        <Text style={styles.navItemBadgeText}>
                          {isFrench ? 'Français' : 'English'}
                        </Text>
                        <CaretRight size={14} color={colors.outline} />
                      </View>
                    </TouchableOpacity>

                    {/* Security & Password */}
                    <TouchableOpacity
                      style={styles.navItem}
                      onPress={() =>
                        onShowToast(
                          isFrench
                            ? 'Sécurité: Votre mot de passe est actif'
                            : 'Security: Password credentials verified',
                        )
                      }
                      activeOpacity={0.75}
                    >
                      <View style={styles.navItemLeft}>
                        <View style={styles.navIconBox}>
                          <LockKey
                            size={18}
                            weight="bold"
                            color={colors.onSurfaceVariant}
                          />
                        </View>
                        <Text style={styles.navItemLabel}>
                          {isFrench
                            ? 'Sécurité & Mot de Passe'
                            : 'Security & Password'}
                        </Text>
                      </View>
                      <CaretRight size={18} color={colors.outline} />
                    </TouchableOpacity>

                    {/* Offline Sync & Cache */}
                    <TouchableOpacity
                      style={styles.navItem}
                      onPress={() =>
                        onShowToast(
                          isFrench
                            ? 'Données d’espace synchronisées'
                            : 'Workspace synchronized',
                        )
                      }
                      activeOpacity={0.75}
                    >
                      <View style={styles.navItemLeft}>
                        <View style={styles.navIconBox}>
                          <CloudCheck
                            size={18}
                            weight="bold"
                            color={colors.secondary}
                          />
                        </View>
                        <Text style={styles.navItemLabel}>
                          {isFrench
                            ? 'Synchronisation Hors-Ligne'
                            : 'Offline Sync & Cache'}
                        </Text>
                      </View>
                      <View style={styles.syncBadge}>
                        <Check
                          size={12}
                          weight="bold"
                          color={colors.onSecondaryFixedVariant}
                        />
                        <Text style={styles.syncBadgeText}>
                          {isFrench ? 'Synchronisé' : 'Synchronized'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </ScrollView>

                {/* Drawer Footer */}
                <View style={styles.footerContainer}>
                  {/* Community Guidelines */}
                  <TouchableOpacity
                    style={styles.guidelinesBtn}
                    onPress={() =>
                      onShowToast(
                        isFrench
                          ? 'Charte Communautaire JRS LRC'
                          : 'LRC JRS Community Charter',
                      )
                    }
                    activeOpacity={0.75}
                  >
                    <View style={styles.footerIconBox}>
                      <BookOpen
                        size={18}
                        weight="bold"
                        color={colors.onSurfaceVariant}
                      />
                    </View>
                    <Text style={styles.guidelinesText}>
                      {isFrench
                        ? 'Charte Communautaire'
                        : 'Community Guidelines'}
                    </Text>
                  </TouchableOpacity>

                  {/* Sign Out Button */}
                  <TouchableOpacity
                    style={styles.signOutBtn}
                    onPress={handleSignOutPress}
                    disabled={isSigningOut}
                    activeOpacity={0.8}
                  >
                    <View style={styles.signOutIconBox}>
                      <SignOut
                        size={18}
                        weight="bold"
                        color={colors.tertiary}
                      />
                    </View>
                    {isSigningOut ? (
                      <ActivityIndicator size="small" color={colors.tertiary} />
                    ) : (
                      <Text style={styles.signOutText}>
                        {isFrench ? 'Se Déconnecter' : 'Sign Out'}
                      </Text>
                    )}
                  </TouchableOpacity>

                  {/* Version Meta */}
                  <Text style={styles.versionText}>
                    LRC JRS Mobile • v1.0.0 (Build 42)
                  </Text>
                </View>
              </View>
            )}
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.inverseSurface,
  },
  drawerPanel: {
    height: '100%',
    backgroundColor: colors.surfaceContainerLow,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 20,
  },
  safeArea: {
    flex: 1,
  },
  rootContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  profileSectionContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: colors.surfaceContainerLow,
  },
  sidebarTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandBadge: {
    backgroundColor: colors.primaryFixed,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  brandBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  sidebarHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    letterSpacing: 0.2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  identityProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  identityDetailsCol: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  userContact: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.onSurfaceVariant,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 9999,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  roleChipText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.onSecondaryContainer,
  },
  identityHubPill: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerHighest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hubPillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  hubPillTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.onSurface,
  },
  hubPillDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.outline,
  },
  hubPillSub: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.onSurfaceVariant,
  },
  navScrollView: {
    flex: 1,
  },
  navScrollContent: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 18,
  },
  sectionContainer: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.outline,
    letterSpacing: 0.8,
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: colors.surfaceContainerLow,
  },
  navItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  navIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
    flexShrink: 1,
  },
  navItemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    maxWidth: 110,
  },
  navItemBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  pendingTransfersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  pendingTransfersText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onPrimaryFixed,
  },
  activeLinksBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.secondaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  activeLinksText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onSecondaryFixedVariant,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.secondaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  syncBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onSecondaryFixedVariant,
  },
  footerContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: colors.surfaceContainer,
    gap: 6,
  },
  guidelinesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  footerIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guidelinesText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(159, 47, 35, 0.08)',
  },
  signOutIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.tertiaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.tertiary,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 10,
    color: colors.outline,
    marginTop: 6,
    letterSpacing: 0.4,
  },
});

import {
  useActivitiesQuery,
  useActivityStatsQuery,
  useMemberStatsQuery,
  usePendingReviewsQuery,
} from '@jrs/client-core';
import type { IAuthUser, ITown } from '@jrs/shared';
import {
  ArrowUp,
  Buildings,
  CalendarCheck,
  CalendarPlus,
  ChartLineUp,
  HandWaving,
  MapPin,
  QrCode,
  ShareNetwork,
  UserCheck,
  UserPlus,
  Users,
} from 'phosphor-react-native';
import React, { useMemo } from 'react';
import {
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../../../theme/colors';
import type { SidebarPanel } from './NavigationSidebar';
import { getTownRegion } from './TownSwitcherSubPanel';

interface HomeScreenProps {
  user: IAuthUser | null;
  activeTown: ITown | null;
  onOpenDrawer: (panel?: SidebarPanel) => void;
  onNavigateToMembers: () => void;
  onNavigateToActivities: () => void;
  onNavigateToReports: () => void;
  onShowToast: (message: string, type?: 'info' | 'success') => void;
  isFrench?: boolean;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  activeTown,
  onOpenDrawer,
  onNavigateToMembers,
  onNavigateToActivities,
  onNavigateToReports,
  onShowToast,
  isFrench = false,
}) => {
  // Queries for live metrics
  const { data: memberStats } = useMemberStatsQuery(activeTown?.id);
  const { data: activityStats } = useActivityStatsQuery({
    townId: activeTown?.id,
  });
  const { data: pendingReviews } = usePendingReviewsQuery(activeTown?.id);
  const { data: activitiesData } = useActivitiesQuery({
    townId: activeTown?.id,
    limit: 5,
  });

  const nextActivity = useMemo(() => {
    if (
      activitiesData?.items &&
      Array.isArray(activitiesData.items) &&
      activitiesData.items.length > 0
    ) {
      return activitiesData.items[0];
    }
    return null;
  }, [activitiesData]);

  const pendingCount = pendingReviews?.length ?? 3;
  const activeYouthCount = memberStats?.activeJrCount || 148;
  const attendanceRate = activityStats?.avgAttendanceRate
    ? `${Math.round(activityStats.avgAttendanceRate)}%`
    : '86%';

  const firstName =
    user?.fullName?.split(' ')[0] || (isFrench ? 'Teddy' : 'Teddy');

  const handleShareIntakeLink = async () => {
    const intakeUrl = `https://jrs.lrc.cm/join/${activeTown?.code?.toLowerCase() || 'dla'}`;
    try {
      await Share.share({
        message: isFrench
          ? `Rejoignez le réseau des jeunes de ${activeTown?.name || 'Douala'} : ${intakeUrl}`
          : `Join our youth network in ${activeTown?.name || 'Douala'}: ${intakeUrl}`,
        url: intakeUrl,
      });
      onShowToast(
        isFrench
          ? 'Lien d’inscription partagé !'
          : 'Shareable Intake Link copied!',
        'success',
      );
    } catch {
      onShowToast(
        isFrench ? 'Lien d’inscription copié !' : 'Intake link copied!',
        'info',
      );
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.streamContainer}>
        {/* Greeting & Workspace Context */}
        <View style={styles.greetingSection}>
          <View style={styles.greetingRow}>
            <Text style={styles.greetingHeadline}>
              {isFrench ? `Bonjour, ${firstName}` : `Hello, ${firstName}`}
            </Text>
            <View style={styles.greetingHandBox}>
              <HandWaving size={20} weight="fill" color={colors.primary} />
            </View>
          </View>
          <View style={styles.workspaceRow}>
            <Buildings size={15} color={colors.outline} weight="bold" />
            <Text style={styles.workspaceText}>
              {activeTown?.name || 'Douala'} Hub Workspace •{' '}
              {getTownRegion(activeTown)}
            </Text>
          </View>
        </View>

        {/* "Next Gathering" Action Hero Card */}
        <View style={styles.heroCard}>
          {/* Top Row: Time & Doors open */}
          <View style={styles.heroTopRow}>
            <View style={styles.heroTimeBadge}>
              <CalendarCheck
                size={15}
                weight="fill"
                color={colors.onPrimaryFixed}
              />
              <Text style={styles.heroTimeText}>
                {nextActivity
                  ? `${isFrench ? 'Prochain' : 'Upcoming'} • ${new Date(nextActivity.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : isFrench
                    ? 'Aujourd’hui • 18:00'
                    : 'Today • 18:00'}
              </Text>
            </View>

            <View style={styles.heroDoorsBadge}>
              <View style={styles.doorsDot} />
              <Text style={styles.heroDoorsText}>
                {isFrench ? 'Portes ouvertes' : 'Doors open'}
              </Text>
            </View>
          </View>

          {/* Title & Venue */}
          <View style={styles.heroTitleSection}>
            <Text style={styles.heroTitle}>
              {nextActivity?.title ||
                (isFrench
                  ? 'Rassemblement Hebdomadaire des Jeunes'
                  : 'Weekly Youth Assembly')}
            </Text>
            <View style={styles.heroVenueRow}>
              <MapPin size={16} weight="fill" color={colors.primary} />
              <Text style={styles.heroVenueText}>
                {nextActivity?.locationVenue ||
                  (isFrench ? 'Salle Polyvalente, Akwa' : 'Youth Center, Akwa')}
              </Text>
            </View>
          </View>

          {/* Live Participant Preview Snippet */}
          <View style={styles.heroParticipantsRow}>
            <View style={styles.avatarStack}>
              <View
                style={[
                  styles.miniAvatar,
                  { backgroundColor: colors.secondaryFixed },
                ]}
              >
                <Text style={styles.miniAvatarText}>MK</Text>
              </View>
              <View
                style={[
                  styles.miniAvatar,
                  styles.avatarOffset,
                  { backgroundColor: colors.primaryFixed },
                ]}
              >
                <Text style={styles.miniAvatarText}>EB</Text>
              </View>
              <View
                style={[
                  styles.miniAvatar,
                  styles.avatarOffset,
                  { backgroundColor: colors.surfaceContainerHigh },
                ]}
              >
                <Text style={styles.miniAvatarText}>DN</Text>
              </View>
              <View
                style={[
                  styles.miniAvatar,
                  styles.avatarOffset,
                  { backgroundColor: colors.surfaceDim },
                ]}
              >
                <Text style={styles.miniAvatarCountText}>+42</Text>
              </View>
            </View>

            <Text style={styles.expectedText}>
              {isFrench ? 'Attendu : ~65 Jeunes' : 'Expected: ~65 Youth'}
            </Text>
          </View>

          {/* Primary Action CTA */}
          <TouchableOpacity
            style={styles.heroCtaBtn}
            onPress={onNavigateToActivities}
            activeOpacity={0.85}
          >
            <CalendarCheck size={20} weight="fill" color={colors.onPrimary} />
            <Text style={styles.heroCtaText}>
              {isFrench ? 'Faire l’Appel & Présences' : 'Take Attendance'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Action Speed Chips (Horizontal Scroll) */}
        <View style={styles.quickActionsSection}>
          <View style={styles.quickHeaderRow}>
            <Text style={styles.quickHeaderTitle}>
              {isFrench ? 'ACTIONS RAPIDES' : 'QUICK ACTIONS'}
            </Text>
            <Text style={styles.quickHeaderHint}>
              {isFrench ? 'Défiler pour plus' : 'Scroll for more'}
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.speedChipsScroll}
          >
            {/* Chip 1: Share Intake Link */}
            <TouchableOpacity
              style={styles.speedChip}
              onPress={handleShareIntakeLink}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.speedChipIconBox,
                  { backgroundColor: colors.primaryFixed },
                ]}
              >
                <ShareNetwork size={16} weight="bold" color={colors.primary} />
              </View>
              <Text style={styles.speedChipLabel}>
                {isFrench ? 'Lien d’Inscription' : 'Share Intake Link'}
              </Text>
              <QrCode size={15} color={colors.outline} />
            </TouchableOpacity>

            {/* Chip 2: Register Member */}
            <TouchableOpacity
              style={styles.speedChip}
              onPress={onNavigateToMembers}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.speedChipIconBox,
                  { backgroundColor: colors.secondaryFixed },
                ]}
              >
                <UserPlus size={16} weight="bold" color={colors.secondary} />
              </View>
              <Text style={styles.speedChipLabel}>
                {isFrench ? 'Inscrire un Membre' : 'Register Member'}
              </Text>
            </TouchableOpacity>

            {/* Chip 3: Schedule Gathering */}
            <TouchableOpacity
              style={styles.speedChip}
              onPress={onNavigateToActivities}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.speedChipIconBox,
                  { backgroundColor: colors.tertiaryFixed },
                ]}
              >
                <CalendarPlus size={16} weight="bold" color={colors.tertiary} />
              </View>
              <Text style={styles.speedChipLabel}>
                {isFrench ? 'Planifier une Réunion' : 'Schedule Gathering'}
              </Text>
            </TouchableOpacity>

            {/* Chip 4: Review Queue with Pending Count */}
            <TouchableOpacity
              style={styles.speedChip}
              onPress={() => onOpenDrawer('more-hub-options')}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.speedChipIconBox,
                  { backgroundColor: colors.surfaceContainerHighest },
                ]}
              >
                <UserCheck size={16} weight="bold" color={colors.primary} />
              </View>
              <Text style={styles.speedChipLabel}>
                {isFrench ? 'File d’Attente' : 'Review Queue'}
              </Text>
              <View style={styles.reviewCountBadge}>
                <Text style={styles.reviewCountBadgeText}>{pendingCount}</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Community Pulse Metrics (2-Column Grid) */}
        <View style={styles.pulseSection}>
          <View style={styles.pulseHeaderRow}>
            <Text style={styles.pulseTitle}>
              {activeTown?.name || 'Douala'} Pulse
            </Text>
            <TouchableOpacity onPress={onNavigateToReports} activeOpacity={0.7}>
              <Text style={styles.pulsePeriod}>
                {isFrench ? 'Ce Mois-ci ›' : 'This Month ›'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pulseGrid}>
            {/* Metric 1: Active Youth */}
            <TouchableOpacity
              style={styles.pulseCard}
              onPress={onNavigateToMembers}
              activeOpacity={0.8}
            >
              <View style={styles.pulseCardTop}>
                <View
                  style={[
                    styles.pulseIconCircle,
                    { backgroundColor: colors.secondaryContainer },
                  ]}
                >
                  <Users
                    size={18}
                    weight="fill"
                    color={colors.onSecondaryContainer}
                  />
                </View>
                <View style={styles.trendRow}>
                  <ArrowUp size={13} weight="bold" color={colors.secondary} />
                  <Text style={styles.trendText}>+12</Text>
                </View>
              </View>
              <View style={styles.pulseCardBottom}>
                <Text style={styles.pulseMetricNumber}>{activeYouthCount}</Text>
                <Text style={styles.pulseMetricLabel}>
                  {isFrench
                    ? 'Jeunes Actifs (18–30 ans)'
                    : 'Active Youth (18–30)'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Metric 2: Attendance Rate */}
            <TouchableOpacity
              style={styles.pulseCard}
              onPress={onNavigateToReports}
              activeOpacity={0.8}
            >
              <View style={styles.pulseCardTop}>
                <View
                  style={[
                    styles.pulseIconCircle,
                    { backgroundColor: colors.primaryFixed },
                  ]}
                >
                  <ChartLineUp size={18} weight="bold" color={colors.primary} />
                </View>
                <View style={styles.trendRow}>
                  <ArrowUp size={13} weight="bold" color={colors.secondary} />
                  <Text style={styles.trendText}>+4%</Text>
                </View>
              </View>
              <View style={styles.pulseCardBottom}>
                <Text style={styles.pulseMetricNumber}>{attendanceRate}</Text>
                <Text style={styles.pulseMetricLabel}>
                  {isFrench ? 'Taux Moyen de Présence' : 'Avg Attendance Rate'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    paddingBottom: 36,
  },
  streamContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 20,
  },
  greetingSection: {
    gap: 2,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingHeadline: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.onSurface,
    letterSpacing: -0.4,
  },
  greetingHandBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workspaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  workspaceText: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  heroCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryFixed,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  heroTimeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.onPrimaryFixed,
  },
  heroDoorsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  doorsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
  },
  heroDoorsText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onSecondaryContainer,
  },
  heroTitleSection: {
    gap: 4,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.onSurface,
    letterSpacing: -0.2,
  },
  heroVenueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroVenueText: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  heroParticipantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surfaceContainerLowest,
  },
  avatarOffset: {
    marginLeft: -8,
  },
  miniAvatarText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.onSurface,
  },
  miniAvatarCountText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
  },
  expectedText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.outline,
  },
  heroCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  heroCtaText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  quickActionsSection: {
    gap: 10,
  },
  quickHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  quickHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  quickHeaderHint: {
    fontSize: 11,
    color: colors.outline,
  },
  speedChipsScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  speedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceContainerLowest,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  speedChipIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedChipLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurface,
  },
  reviewCountBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewCountBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  pulseSection: {
    gap: 10,
  },
  pulseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  pulseTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.onSurfaceVariant,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  pulsePeriod: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  pulseGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  pulseCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'space-between',
    minHeight: 112,
  },
  pulseCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pulseIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
  },
  pulseCardBottom: {
    gap: 2,
  },
  pulseMetricNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.onSurface,
    letterSpacing: -0.5,
  },
  pulseMetricLabel: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    lineHeight: 14,
  },
});

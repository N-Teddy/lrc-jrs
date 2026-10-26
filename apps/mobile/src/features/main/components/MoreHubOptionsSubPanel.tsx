import type { IAuthUser, ITown } from '@jrs/shared';
import {
  ArrowsClockwise,
  CaretLeft,
  CaretRight,
  ChartLineUp,
  Info,
  ShieldCheck,
  TrendUp,
  UserCheck,
} from 'phosphor-react-native';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../../../theme/colors';

interface MoreHubOptionsSubPanelProps {
  user: IAuthUser | null;
  activeTown: ITown | null;
  pendingReviewsCount: number;
  onBack: () => void;
  onNavigateToReviewQueue: () => void;
  onNavigateToStats: () => void;
  onShowToast: (message: string) => void;
  isFrench?: boolean;
}

export const MoreHubOptionsSubPanel: React.FC<MoreHubOptionsSubPanelProps> = ({
  user,
  activeTown,
  pendingReviewsCount,
  onBack,
  onNavigateToReviewQueue,
  onNavigateToStats,
  onShowToast,
  isFrench = false,
}) => {
  const isAP = user?.role === 'AP';
  const hubName = activeTown?.name || 'Douala';

  return (
    <View style={styles.container}>
      {/* Subheader */}
      <View style={styles.subHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <CaretLeft size={20} weight="bold" color={colors.onSurfaceVariant} />
          <Text style={styles.backButtonText}>
            {isFrench ? 'Menu' : 'Menu'}
          </Text>
        </TouchableOpacity>

        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>
            {hubName} {isFrench ? 'Gouvernance' : 'Governance'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Context Card */}
        <View style={styles.contextCard}>
          <Text style={styles.contextTag}>
            {isFrench ? 'SECTEUR OPÉRATIONNEL' : 'OPERATIONAL SECTOR'}
          </Text>
          <Text style={styles.contextDescription}>
            {isFrench
              ? `Administration avancée, sécurité opérationnelle et supervision juridictionnelle pour le centre ${hubName}.`
              : `Advanced administration, youth safety oversight, and jurisdictional governance for the ${hubName} Hub.`}
          </Text>
        </View>

        {/* Tools & Capabilities */}
        <View style={styles.toolsStack}>
          {/* Card 1: PC Leadership Transition */}
          <TouchableOpacity
            style={styles.toolCard}
            onPress={() =>
              onShowToast(
                isFrench
                  ? 'Ouverture de la transition de coordination...'
                  : 'Opening PC leadership handover console...',
              )
            }
            activeOpacity={0.75}
          >
            <View style={styles.toolLeft}>
              <View
                style={[
                  styles.toolIconCircle,
                  { backgroundColor: colors.primaryFixed },
                ]}
              >
                <ArrowsClockwise
                  size={20}
                  weight="bold"
                  color={colors.onPrimaryFixed}
                />
              </View>
              <View style={styles.toolTexts}>
                <Text style={styles.toolTitle}>
                  {isFrench
                    ? 'Transition de Coordination PC'
                    : 'PC Leadership Transition'}
                </Text>
                <Text style={styles.toolSubtitle} numberOfLines={1}>
                  {isFrench
                    ? 'Transférer l’autorité ou réassigner le coordinateur'
                    : 'Transfer coordinator authority or reassign active town PC'}
                </Text>
              </View>
            </View>
            <CaretRight size={18} color={colors.outline} />
          </TouchableOpacity>

          {/* Card 2: Jurisdiction & Scope Matrix */}
          <TouchableOpacity
            style={styles.toolCard}
            onPress={() =>
              onShowToast(
                isFrench
                  ? `Matrice: Droits ${isAP ? 'AP Global' : 'PC Local'}`
                  : `Matrix: ${isAP ? 'AP Global Access' : 'Local PC Access'}`,
              )
            }
            activeOpacity={0.75}
          >
            <View style={styles.toolLeft}>
              <View
                style={[
                  styles.toolIconCircle,
                  { backgroundColor: colors.secondaryFixed },
                ]}
              >
                <ShieldCheck
                  size={20}
                  weight="bold"
                  color={colors.onSecondaryFixed}
                />
              </View>
              <View style={styles.toolTexts}>
                <Text style={styles.toolTitle}>
                  {isFrench
                    ? 'Matrice de Juridiction'
                    : 'Jurisdiction & Scope Matrix'}
                </Text>
                <Text style={styles.toolSubtitle} numberOfLines={1}>
                  {isFrench
                    ? 'Règles d’accès en lecture et écriture des hubs'
                    : 'View authorized read and write town hub access rules'}
                </Text>
              </View>
            </View>
            <View style={styles.apScopePill}>
              <Text style={styles.apScopeText}>
                {isAP ? 'AP Global' : 'PC Hub'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Card 3: Hub Statistics & Exports */}
          <TouchableOpacity
            style={styles.toolCard}
            onPress={onNavigateToStats}
            activeOpacity={0.75}
          >
            <View style={styles.toolLeft}>
              <View
                style={[
                  styles.toolIconCircle,
                  { backgroundColor: colors.surfaceContainerHighest },
                ]}
              >
                <ChartLineUp size={20} weight="bold" color={colors.primary} />
              </View>
              <View style={styles.toolTexts}>
                <Text style={styles.toolTitle}>
                  {isFrench
                    ? 'Statistiques & Rapports'
                    : 'Hub Statistics & Exports'}
                </Text>
                <Text style={styles.toolSubtitle} numberOfLines={1}>
                  {isFrench
                    ? 'Totaux membres, présences et rapports mensuels'
                    : 'Summary totals of youth members, PCs, and attendance'}
                </Text>
              </View>
            </View>
            <CaretRight size={18} color={colors.outline} />
          </TouchableOpacity>

          {/* Card 4: Public Intake Reviews */}
          <TouchableOpacity
            style={styles.toolCard}
            onPress={onNavigateToReviewQueue}
            activeOpacity={0.75}
          >
            <View style={styles.toolLeft}>
              <View
                style={[
                  styles.toolIconCircle,
                  { backgroundColor: colors.tertiaryFixed },
                ]}
              >
                <UserCheck size={20} weight="bold" color={colors.tertiary} />
              </View>
              <View style={styles.toolTexts}>
                <Text style={styles.toolTitle}>
                  {isFrench
                    ? 'Validation des Inscriptions'
                    : 'Public Intake Reviews'}
                </Text>
                <Text style={styles.toolSubtitle} numberOfLines={1}>
                  {isFrench
                    ? 'Examiner les demandes des jeunes du portail'
                    : 'Approve or reject member applications from portal'}
                </Text>
              </View>
            </View>
            {pendingReviewsCount > 0 ? (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>
                  {pendingReviewsCount} {isFrench ? 'En attente' : 'Pending'}
                </Text>
              </View>
            ) : (
              <CaretRight size={18} color={colors.outline} />
            )}
          </TouchableOpacity>
        </View>

        {/* Operational Community Snapshot */}
        <View style={styles.participationCard}>
          <View style={styles.participationHeader}>
            <Text style={styles.participationTitle}>
              {isFrench
                ? 'Participation Hebdomadaire'
                : 'Weekly Youth Participation'}
            </Text>
            <View style={styles.participationTrend}>
              <TrendUp size={14} weight="bold" color={colors.secondary} />
              <Text style={styles.participationTrendText}>+14%</Text>
            </View>
          </View>

          {/* Mini Bar Chart */}
          <View style={styles.barChartContainer}>
            <View style={styles.barCol}>
              <View
                style={[
                  styles.barFill,
                  { height: 16, backgroundColor: colors.secondaryFixedDim },
                ]}
              />
              <Text style={styles.barLabel}>{isFrench ? 'L' : 'M'}</Text>
            </View>
            <View style={styles.barCol}>
              <View
                style={[
                  styles.barFill,
                  { height: 28, backgroundColor: colors.secondaryFixedDim },
                ]}
              />
              <Text style={styles.barLabel}>{isFrench ? 'M' : 'T'}</Text>
            </View>
            <View style={styles.barCol}>
              <View
                style={[
                  styles.barFill,
                  { height: 42, backgroundColor: colors.secondary },
                ]}
              />
              <Text style={[styles.barLabel, styles.barLabelActive]}>
                {isFrench ? 'M' : 'W'}
              </Text>
            </View>
            <View style={styles.barCol}>
              <View
                style={[
                  styles.barFill,
                  { height: 24, backgroundColor: colors.secondaryFixedDim },
                ]}
              />
              <Text style={styles.barLabel}>{isFrench ? 'J' : 'T'}</Text>
            </View>
            <View style={styles.barCol}>
              <View
                style={[
                  styles.barFill,
                  { height: 48, backgroundColor: colors.secondary },
                ]}
              />
              <Text style={[styles.barLabel, styles.barLabelActive]}>
                {isFrench ? 'V' : 'F'}
              </Text>
            </View>
            <View style={styles.barCol}>
              <View
                style={[
                  styles.barFill,
                  { height: 38, backgroundColor: colors.primaryContainer },
                ]}
              />
              <Text style={styles.barLabel}>{isFrench ? 'S' : 'S'}</Text>
            </View>
          </View>
        </View>

        {/* Informational Guardrail */}
        <View style={styles.guardrailCard}>
          <Info size={18} weight="fill" color={colors.onSecondaryContainer} />
          <Text style={styles.guardrailText}>
            {isFrench
              ? 'Les transitions de coordination et modifications juridictionnelles requièrent la validation explicite des Animateurs Principaux (AP).'
              : 'Leadership transitions and jurisdiction alterations require explicit confirmation from regional Area Project (AP) administrators.'}
          </Text>
        </View>

        {/* Console Session Footer */}
        <View style={styles.sessionFooter}>
          <View style={styles.sessionLeft}>
            <View style={styles.sessionGreenDot} />
            <Text style={styles.sessionText}>
              {isFrench
                ? 'Console Hub Sécurisée #04'
                : 'Secured Hub Console #04'}
            </Text>
          </View>
          <Text style={styles.sessionVersion}>v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
  },
  badgeContainer: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  contextCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  contextTag: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  contextDescription: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
  },
  toolsStack: {
    gap: 10,
    marginBottom: 18,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toolLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  toolIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolTexts: {
    flex: 1,
    minWidth: 0,
  },
  toolTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 2,
  },
  toolSubtitle: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  apScopePill: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  apScopeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
  },
  pendingBadge: {
    backgroundColor: colors.tertiaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onTertiaryContainer,
  },
  participationCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  participationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  participationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurface,
  },
  participationTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  participationTrendText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
  },
  barChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 8,
  },
  barCol: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  barFill: {
    width: 22,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.outline,
  },
  barLabelActive: {
    color: colors.onSurface,
    fontWeight: '800',
  },
  guardrailCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(67, 102, 77, 0.1)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  guardrailText: {
    flex: 1,
    fontSize: 12,
    color: colors.onSecondaryContainer,
    lineHeight: 16,
  },
  sessionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sessionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionGreenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.secondary,
  },
  sessionText: {
    fontSize: 11,
    color: colors.outline,
  },
  sessionVersion: {
    fontSize: 11,
    color: colors.outline,
  },
});

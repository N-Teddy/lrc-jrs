import { useActivityStatsQuery, useMemberStatsQuery } from '@jrs/client-core';
import type { ITown } from '@jrs/shared';
import {
  CalendarCheck,
  ChartBar,
  ChartLineUp,
  DownloadSimple,
  FilePdf,
  FileText,
  TrendUp,
  Users,
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

interface ReportsScreenProps {
  activeTown: ITown | null;
  onShowToast: (message: string, type?: 'info' | 'success') => void;
  isFrench?: boolean;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  activeTown,
  onShowToast,
  isFrench = false,
}) => {
  const { data: memberStats } = useMemberStatsQuery(activeTown?.id);
  const { data: activityStats } = useActivityStatsQuery({
    townId: activeTown?.id,
  });

  const totalMembers = memberStats?.totalMembers || 154;
  const activeJrCount = memberStats?.activeJrCount || 148;
  const activePcCount = memberStats?.activePcCount || 3;
  const avgAttendance = activityStats?.avgAttendanceRate
    ? `${Math.round(activityStats.avgAttendanceRate)}%`
    : '86%';
  const completedActivities = activityStats?.completedCount || 24;

  const handleExport = (reportName: string) => {
    onShowToast(
      isFrench
        ? `Génération du rapport: ${reportName}...`
        : `Generating export: ${reportName}...`,
      'info',
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Title & Hub Overview */}
      <View style={styles.headerBox}>
        <View style={styles.headerIconCircle}>
          <ChartLineUp size={24} weight="bold" color={colors.primary} />
        </View>
        <View style={styles.headerTexts}>
          <Text style={styles.headerTitle}>
            {isFrench ? 'Rapports & Statistiques' : 'Reports & Analytics'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {activeTown?.name || 'Douala'} Hub •{' '}
            {isFrench ? 'Région du Littoral' : 'Littoral Region'}
          </Text>
        </View>
      </View>

      {/* Primary KPI 4-Card Grid */}
      <View style={styles.kpiGrid}>
        {/* KPI 1 */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiTop}>
            <Users size={18} weight="fill" color={colors.secondary} />
            <View style={styles.kpiTrend}>
              <TrendUp size={12} weight="bold" color={colors.secondary} />
              <Text style={styles.kpiTrendText}>+8%</Text>
            </View>
          </View>
          <Text style={styles.kpiValue}>{totalMembers}</Text>
          <Text style={styles.kpiLabel}>
            {isFrench ? 'Total Membres' : 'Total Registered'}
          </Text>
        </View>

        {/* KPI 2 */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiTop}>
            <CalendarCheck size={18} weight="fill" color={colors.primary} />
            <View style={styles.kpiTrend}>
              <TrendUp size={12} weight="bold" color={colors.secondary} />
              <Text style={styles.kpiTrendText}>+4%</Text>
            </View>
          </View>
          <Text style={styles.kpiValue}>{avgAttendance}</Text>
          <Text style={styles.kpiLabel}>
            {isFrench ? 'Taux de Présence' : 'Avg Attendance'}
          </Text>
        </View>

        {/* KPI 3 */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiTop}>
            <ChartBar size={18} weight="fill" color={colors.primary} />
            <Text style={styles.kpiNeutral}>Term 2</Text>
          </View>
          <Text style={styles.kpiValue}>{completedActivities}</Text>
          <Text style={styles.kpiLabel}>
            {isFrench ? 'Rencontres Tenues' : 'Gatherings Held'}
          </Text>
        </View>

        {/* KPI 4 */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiTop}>
            <Users size={18} weight="fill" color={colors.secondary} />
            <Text style={styles.kpiNeutral}>Active</Text>
          </View>
          <Text style={styles.kpiValue}>{activePcCount}</Text>
          <Text style={styles.kpiLabel}>
            {isFrench ? 'Personnes Contact (PC)' : 'Contact Persons (PC)'}
          </Text>
        </View>
      </View>

      {/* Engagement Snapshot Card */}
      <View style={styles.snapshotCard}>
        <View style={styles.snapshotHeader}>
          <Text style={styles.snapshotTitle}>
            {isFrench
              ? 'Progression Mensuelle d’Engagement'
              : 'Monthly Engagement Progression'}
          </Text>
          <View style={styles.snapshotTag}>
            <Text style={styles.snapshotTagText}>+14% vs T1</Text>
          </View>
        </View>

        {/* Progress Bar 1: Youth Under 25 */}
        <View style={styles.progressBarSection}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>
              {isFrench ? 'Jeunes Actifs (18–25 ans)' : 'Active Youth (18–25)'}
            </Text>
            <Text style={styles.progressValue}>
              {Math.round(activeJrCount * 0.72)} / {activeJrCount}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '72%' }]} />
          </View>
        </View>

        {/* Progress Bar 2: App Access Activation */}
        <View style={styles.progressBarSection}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>
              {isFrench ? 'Accès Mobile Activé' : 'Mobile App Adoption'}
            </Text>
            <Text style={styles.progressValue}>88%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: '88%', backgroundColor: colors.secondary },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Export & Document Downloads */}
      <View style={styles.exportSection}>
        <Text style={styles.exportSectionTitle}>
          {isFrench ? 'DOCUMENTS & EXPORTS' : 'REPORTS & EXPORTS'}
        </Text>

        <View style={styles.exportStack}>
          {/* Export Item 1 */}
          <TouchableOpacity
            style={styles.exportItem}
            onPress={() => handleExport('Registre Mensuel PDF')}
            activeOpacity={0.8}
          >
            <View style={styles.exportLeft}>
              <View
                style={[
                  styles.exportIconBox,
                  { backgroundColor: colors.tertiaryFixed },
                ]}
              >
                <FilePdf size={20} weight="bold" color={colors.tertiary} />
              </View>
              <View style={styles.exportTexts}>
                <Text style={styles.exportTitle}>
                  {isFrench
                    ? 'Registre Mensuel des Membres'
                    : 'Monthly Member Registry'}
                </Text>
                <Text style={styles.exportSub}>PDF • 1.4 MB • Term 2</Text>
              </View>
            </View>
            <DownloadSimple size={18} weight="bold" color={colors.primary} />
          </TouchableOpacity>

          {/* Export Item 2 */}
          <TouchableOpacity
            style={styles.exportItem}
            onPress={() => handleExport('Feuille de Présence CSV')}
            activeOpacity={0.8}
          >
            <View style={styles.exportLeft}>
              <View
                style={[
                  styles.exportIconBox,
                  { backgroundColor: colors.secondaryFixed },
                ]}
              >
                <FileText size={20} weight="bold" color={colors.secondary} />
              </View>
              <View style={styles.exportTexts}>
                <Text style={styles.exportTitle}>
                  {isFrench
                    ? 'Feuille de Présence Détaillée'
                    : 'Attendance Roll Ledger'}
                </Text>
                <Text style={styles.exportSub}>CSV • 340 KB • Weekly</Text>
              </View>
            </View>
            <DownloadSimple size={18} weight="bold" color={colors.primary} />
          </TouchableOpacity>
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
    padding: 16,
    paddingBottom: 36,
    gap: 18,
  },
  headerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surfaceContainerLowest,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTexts: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.onSurface,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'space-between',
    minHeight: 104,
  },
  kpiTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  kpiTrendText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
  },
  kpiNeutral: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.outline,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.onSurface,
    letterSpacing: -0.5,
    marginTop: 6,
  },
  kpiLabel: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  snapshotCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  snapshotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  snapshotTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurface,
    flex: 1,
  },
  snapshotTag: {
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  snapshotTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onSecondaryContainer,
  },
  progressBarSection: {
    gap: 6,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.onSurface,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceContainerHigh,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  exportSection: {
    gap: 10,
  },
  exportSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  exportStack: {
    gap: 10,
  },
  exportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exportLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  exportIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportTexts: {
    flex: 1,
  },
  exportTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onSurface,
  },
  exportSub: {
    fontSize: 11,
    color: colors.outline,
    marginTop: 2,
  },
});

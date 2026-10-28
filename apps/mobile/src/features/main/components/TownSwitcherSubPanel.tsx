import type { IAuthUser, ITown } from '@jrs/shared';
import {
  ArrowRight,
  ArrowsLeftRight,
  CaretLeft,
  Check,
  MagnifyingGlass,
  MapTrifold,
  X,
} from 'phosphor-react-native';
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../../../theme/colors';

export function getTownRegion(town?: ITown | null): string {
  if (!town) return 'Cameroun';
  const c = town.code.toUpperCase();
  if (c === 'DLA') return 'Littoral Region';
  if (c === 'YDE') return 'Centre Region';
  if (c === 'BAF') return 'West Region';
  if (c === 'BDA') return 'North-West Region';
  if (c === 'BUE') return 'South-West Region';
  return 'Cameroun';
}

interface TownSwitcherSubPanelProps {
  user: IAuthUser | null;
  activeTown: ITown | null;
  availableTowns: ITown[];
  onBack: () => void;
  onSelectTown: (townId: string) => void;
  onOpenMap?: () => void;
  isFrench?: boolean;
}

export const TownSwitcherSubPanel: React.FC<TownSwitcherSubPanelProps> = ({
  user,
  activeTown,
  availableTowns,
  onBack,
  onSelectTown,
  onOpenMap,
  isFrench = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTowns = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return availableTowns;
    return availableTowns.filter((t) => {
      const region = getTownRegion(t).toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        region.includes(q)
      );
    });
  }, [availableTowns, searchQuery]);

  return (
    <View style={styles.container}>
      {/* Interactive Navigation Subheader */}
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

        <View style={styles.networkBadge}>
          <Text style={styles.networkBadgeText}>
            {isFrench ? 'Réseau Cameroun' : 'Cameroon Network'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search & Geographic Action Zone */}
        <View style={styles.searchSection}>
          <View style={styles.searchInputContainer}>
            <MagnifyingGlass
              size={18}
              color={colors.outline}
              weight="bold"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={
                isFrench
                  ? 'Rechercher ville ou code...'
                  : 'Search town name or code...'
              }
              placeholderTextColor={colors.outline}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearSearchBtn}
                onPress={() => setSearchQuery('')}
              >
                <X size={14} weight="bold" color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            )}
          </View>

          {/* Regional Map Trigger Button */}
          {onOpenMap && (
            <TouchableOpacity
              style={styles.mapTriggerBtn}
              onPress={onOpenMap}
              activeOpacity={0.8}
            >
              <View style={styles.mapTriggerLeft}>
                <View style={styles.mapIconCircle}>
                  <MapTrifold
                    size={18}
                    weight="bold"
                    color={colors.secondary}
                  />
                </View>
                <Text style={styles.mapTriggerText}>
                  {isFrench ? 'Ouvrir la Carte Régionale' : 'Open Regional Map'}
                </Text>
              </View>
              <ArrowRight
                size={18}
                weight="bold"
                color={colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Regional Hubs List */}
        <View style={styles.listSection}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.listSectionTitle}>
              {isFrench
                ? 'CENTRES RÉGIONAUX (CAMEROUN)'
                : 'REGIONAL HUBS (CAMEROON)'}
            </Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {filteredTowns.length} {isFrench ? 'Centres' : 'Hubs'}
              </Text>
            </View>
          </View>

          <View style={styles.townsStack}>
            {filteredTowns.map((town) => {
              const isMatch = (targetIdOrCode?: string | null) => {
                if (!targetIdOrCode) return false;
                const normalized = targetIdOrCode.toUpperCase();
                return (
                  town.id === targetIdOrCode ||
                  (town.code && town.code.toUpperCase() === normalized)
                );
              };

              const isHomeTown = isMatch(user?.homeTownId);
              // Active if matches activeTown OR on initial login fallback to user's homeTown
              const isActive = activeTown
                ? isMatch(activeTown.id) || isMatch(activeTown.code)
                : isHomeTown;
              const isAP = user?.role === 'AP';
              const canWrite = isAP || isHomeTown;

              let badgeText = isFrench ? 'Lecture seule' : 'Read-Only';
              let badgeBg = colors.surfaceContainerHigh;
              let badgeColor = colors.onSurfaceVariant;

              if (isHomeTown) {
                badgeText = isFrench ? 'Hub Principal' : 'Home Hub';
                badgeBg = colors.secondaryContainer;
                badgeColor = colors.onSecondaryContainer;
              } else if (canWrite) {
                badgeText = isFrench ? 'Autorisé' : 'Authorized';
                badgeBg = colors.primaryFixed;
                badgeColor = colors.onPrimaryFixedVariant;
              }

              const pcCount = town.activePcCount ?? 1;

              return (
                <TouchableOpacity
                  key={town.id}
                  style={[styles.townCard, isActive && styles.townCardActive]}
                  onPress={() => onSelectTown(town.id)}
                  activeOpacity={0.75}
                >
                  {/* Radio Indicator */}
                  <View
                    style={[
                      styles.radioIndicator,
                      isActive && styles.radioIndicatorActive,
                    ]}
                  >
                    {isActive ? (
                      <Check size={14} weight="bold" color={colors.onPrimary} />
                    ) : null}
                  </View>

                  {/* Hub Info */}
                  <View style={styles.townMeta}>
                    <Text
                      style={[
                        styles.townName,
                        isActive && styles.townNameActive,
                      ]}
                      numberOfLines={1}
                    >
                      {town.name} ({town.code})
                    </Text>
                    <Text style={styles.townDetails} numberOfLines={1}>
                      {getTownRegion(town)} • {pcCount}{' '}
                      {isFrench ? 'PC Actif(s)' : 'Active PC(s)'}
                    </Text>
                  </View>

                  {/* Access Tag */}
                  <View
                    style={[styles.accessBadge, { backgroundColor: badgeBg }]}
                  >
                    <Text
                      style={[styles.accessBadgeText, { color: badgeColor }]}
                    >
                      {badgeText}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Immediate Switch Callout Box */}
        <View style={styles.calloutCard}>
          <View style={styles.calloutIconCircle}>
            <ArrowsLeftRight size={20} weight="bold" color={colors.primary} />
          </View>
          <View style={styles.calloutTextContainer}>
            <Text style={styles.calloutTitle}>
              {isFrench
                ? 'Changement Immédiat d’Espace'
                : 'Immediate Workspace Switch'}
            </Text>
            <Text style={styles.calloutBody}>
              {isFrench
                ? 'Touchez un centre pour basculer votre espace de travail instantanément.'
                : 'Tap any hub to switch your workspace context immediately.'}
            </Text>
          </View>
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
  networkBadge: {
    backgroundColor: 'rgba(67, 102, 77, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  networkBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  searchSection: {
    gap: 10,
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.onSurface,
    paddingVertical: 0,
  },
  clearSearchBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mapIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(67, 102, 77, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapTriggerText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onSurface,
  },
  listSection: {
    marginBottom: 16,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  listSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.outline,
    letterSpacing: 0.8,
  },
  countBadge: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
  },
  townsStack: {
    gap: 10,
  },
  townCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  townCardActive: {
    backgroundColor: colors.surfaceContainerHigh,
    borderColor: colors.primary,
  },
  radioIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioIndicatorActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  townMeta: {
    flex: 1,
    minWidth: 0,
  },
  townName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 2,
  },
  townNameActive: {
    color: colors.primaryDark,
  },
  townDetails: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  accessBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  accessBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  calloutCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 16,
    padding: 14,
    marginTop: 8,
  },
  calloutIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(184, 80, 40, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calloutTextContainer: {
    flex: 1,
  },
  calloutTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 2,
  },
  calloutBody: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    lineHeight: 16,
  },
});

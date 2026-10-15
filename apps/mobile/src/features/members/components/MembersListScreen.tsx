import { useMembersQuery, useTownContext } from '@jrs/client-core';
import { Funnel, MagnifyingGlass, Plus, Users, X } from 'phosphor-react-native';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../../../theme/colors';
import { MemberCard } from './MemberCard';
import { MemberFilterSheet, type MemberFilters } from './MemberFilterSheet';

interface MembersListScreenProps {
  onViewMember: (memberId: string) => void;
  onAddMember: () => void;
}

export const MembersListScreen: React.FC<MembersListScreenProps> = ({
  onViewMember,
  onAddMember,
}) => {
  const { activeTown } = useTownContext();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [filters, setFilters] = useState<MemberFilters>({});

  // Query members for the current active town
  const {
    data: membersData,
    isLoading,
    isRefetching,
    refetch,
  } = useMembersQuery({
    townId: activeTown?.id,
    limit: 100,
  });

  const allMembers = membersData?.items || [];

  // Filter members client-side for ultra-fast instant search & filter response
  const filteredMembers = useMemo(() => {
    return allMembers.filter((m) => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = m.fullName.toLowerCase().includes(query);
        const phoneMatch = m.phoneNumber?.toLowerCase().includes(query);
        const emailMatch = m.email?.toLowerCase().includes(query);
        if (!nameMatch && !phoneMatch && !emailMatch) {
          return false;
        }
      }

      // 2. Role Filter
      if (filters.role && filters.role !== 'ALL') {
        if (m.role !== filters.role) return false;
      }

      // 3. Gender Filter
      if (filters.gender && filters.gender !== 'ALL') {
        if (m.gender !== filters.gender) return false;
      }

      // 4. App Access Filter
      if (
        filters.hasAppAccess !== undefined &&
        filters.hasAppAccess !== 'ALL'
      ) {
        const hasAccess = Boolean(m.account?.hasAppAccess);
        if (hasAccess !== filters.hasAppAccess) return false;
      }

      return true;
    });
  }, [allMembers, searchQuery, filters]);

  const hasActiveFilters = Boolean(
    filters.role || filters.gender || filters.hasAppAccess !== undefined,
  );

  return (
    <View style={styles.container}>
      {/* Page Title Row (NO menu button, NO active town in header) */}
      <View style={styles.titleRow}>
        <Text style={styles.pageTitle}>Members</Text>

        {/* Opposite side: Search and Filter action icons */}
        <View style={styles.actionIconsRow}>
          <TouchableOpacity
            style={[styles.iconButton, isSearchOpen && styles.iconButtonActive]}
            onPress={() => {
              if (isSearchOpen) {
                setSearchQuery('');
              }
              setIsSearchOpen(!isSearchOpen);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Search members"
          >
            {isSearchOpen ? (
              <X size={20} weight="bold" color={colors.primary} />
            ) : (
              <MagnifyingGlass
                size={20}
                weight="bold"
                color={searchQuery ? colors.primary : colors.text}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.iconButton,
              hasActiveFilters && styles.iconButtonBadgeActive,
            ]}
            onPress={() => setIsFilterSheetOpen(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Filter members"
          >
            <Funnel
              size={20}
              weight={hasActiveFilters ? 'fill' : 'bold'}
              color={hasActiveFilters ? colors.primary : colors.text}
            />
            {hasActiveFilters && <View style={styles.filterActiveDot} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Expandable Search Input (only appears when search icon is tapped) */}
      {isSearchOpen && (
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <MagnifyingGlass size={18} weight="bold" color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, phone, or email..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {Boolean(searchQuery) && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={16} weight="bold" color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Members Counter & Status Bar */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {filteredMembers.length}{' '}
          {filteredMembers.length === 1 ? 'member' : 'members'}
          {searchQuery || hasActiveFilters ? ' found' : ''}
        </Text>

        {hasActiveFilters && (
          <TouchableOpacity
            onPress={() => setFilters({})}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={styles.clearFiltersText}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Loading State */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading members...</Text>
        </View>
      ) : (
        /* Members List */
        <FlatList
          data={filteredMembers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MemberCard member={item} onPress={() => onViewMember(item.id)} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Users size={36} weight="duotone" color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No Members Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || hasActiveFilters
                  ? 'No members match your current search or filter criteria.'
                  : 'No fellowship members registered in this hub yet.'}
              </Text>
              {hasActiveFilters && (
                <TouchableOpacity
                  style={styles.emptyActionButton}
                  onPress={() => {
                    setSearchQuery('');
                    setFilters({});
                  }}
                >
                  <Text style={styles.emptyActionText}>Reset Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Floating Action Button (FAB) to Add Member */}
      <TouchableOpacity
        style={styles.fab}
        onPress={onAddMember}
        activeOpacity={0.85}
        accessibilityLabel="Register new member"
      >
        <Plus size={24} weight="bold" color="#FFFFFF" />
      </TouchableOpacity>

      {/* Filter Bottom Sheet */}
      <MemberFilterSheet
        visible={isFilterSheetOpen}
        filters={filters}
        onClose={() => setIsFilterSheetOpen(false)}
        onApply={(newFilters) => setFilters(newFilters)}
        onReset={() => setFilters({})}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.6,
  },
  actionIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconButtonActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryBorder,
  },
  iconButtonBadgeActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  filterActiveDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  searchBarContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: colors.inputBg,
    borderColor: colors.primary,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    height: '100%',
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 84, // Space for FAB
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyActionButton: {
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    borderWidth: 1,
  },
  emptyActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});

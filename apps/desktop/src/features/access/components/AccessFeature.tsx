import {
  useAuth,
  useMemberStatsQuery,
  useMembersQuery,
  useTownContext,
  useTownsQuery,
  useTranslation,
  useUpdateMemberAccessMutation,
} from '@jrs/client-core';
import type { IUpdateMemberAccessDto, IUser, UserRole } from '@jrs/shared';
import type React from 'react';
import { useMemo, useState } from 'react';
import { ManageAccessModal } from '../../members/components/ManageAccessModal';
import { MemberDetailPage } from '../../members/components/MemberDetailPage';
import {
  AccessFilterToolbar,
  type AccountStateFilter,
} from './AccessFilterToolbar';
import { AccessStatsOverview } from './AccessStatsOverview';
import { AccountsDirectoryTable } from './AccountsDirectoryTable';
import { BatchInviteModal } from './BatchInviteModal';
import { TownScopeModal } from './TownScopeModal';

export const AccessFeature: React.FC = () => {
  const { t } = useTranslation(['access', 'common']);
  const { user } = useAuth();
  const { activeTownId } = useTownContext();

  // Navigation State
  const [selectedMemberDetailId, setSelectedMemberDetailId] = useState<
    string | null
  >(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [selectedTownId, setSelectedTownId] = useState<string | null>(
    activeTownId || null,
  );
  const [stateFilter, setStateFilter] = useState<AccountStateFilter>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modals State
  const [accessMember, setAccessMember] = useState<IUser | null>(null);
  const [scopeMember, setScopeMember] = useState<IUser | null>(null);
  const [isBatchInviteOpen, setIsBatchInviteOpen] = useState(false);

  // Towns Query
  const { data: townsData } = useTownsQuery();
  const availableTowns = useMemo(() => townsData ?? [], [townsData]);

  // Members Query (Only members with platform app access)
  const queryParams = {
    townId: selectedTownId || undefined,
    role: roleFilter !== 'ALL' ? (roleFilter as UserRole) : undefined,
    search: search.trim() ? search.trim() : undefined,
    hasAppAccess: true,
    page,
    limit: 50, // Fetch up to 50 items so state filters can filter locally
  };

  const { data: membersResponse, isLoading: isMembersLoading } =
    useMembersQuery(queryParams);
  const { data: statsData, isLoading: isStatsLoading } = useMemberStatsQuery(
    selectedTownId || undefined,
  );

  // Offline members for batch onboarding (fetched on demand when modal opens)
  const { data: offlineMembersResponse } = useMembersQuery(
    {
      townId: selectedTownId || undefined,
      hasAppAccess: false,
      limit: 100,
    },
    { enabled: isBatchInviteOpen },
  );

  const rawMembers = membersResponse?.items ?? [];
  const offlineMembers = offlineMembersResponse?.items ?? [];

  // Local filter by Account Status (within members having app access)
  const filteredMembers = useMemo(() => {
    return rawMembers.filter((m) => {
      const hasAppAccess = m.account?.hasAppAccess ?? false;
      if (!hasAppAccess) return false;

      const isRevoked = m.account?.isAccessRevoked ?? false;
      const isTemp = m.isTemporaryPassword ?? false;

      if (stateFilter === 'ACTIVE') {
        return !isRevoked && !isTemp;
      }
      if (stateFilter === 'PENDING') {
        return !isRevoked && isTemp;
      }
      if (stateFilter === 'REVOKED') {
        return isRevoked;
      }
      return true;
    });
  }, [rawMembers, stateFilter]);

  // Paginated slice
  const paginatedMembers = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return filteredMembers.slice(startIndex, startIndex + limit);
  }, [filteredMembers, page]);

  // Calculate situational KPI counts from loaded members
  const { activeCount, pendingCount, suspendedCount } = useMemo(() => {
    let active = 0;
    let pending = 0;
    let suspended = 0;
    for (const m of rawMembers) {
      if (m.account?.hasAppAccess) {
        if (m.account.isAccessRevoked) {
          suspended += 1;
        } else if (m.isTemporaryPassword) {
          pending += 1;
        } else {
          active += 1;
        }
      }
    }
    return {
      activeCount: active,
      pendingCount: pending,
      suspendedCount: suspended,
    };
  }, [rawMembers]);

  // Mutations
  const updateAccessMutation = useUpdateMemberAccessMutation();

  const handleUpdateAccess = async (
    memberId: string,
    dto: IUpdateMemberAccessDto,
  ) => {
    await updateAccessMutation.mutateAsync({ id: memberId, dto });
  };

  const handleSaveScopes = async (
    memberId: string,
    allowedTownIds: string[],
  ) => {
    await updateAccessMutation.mutateAsync({
      id: memberId,
      dto: { allowedReadTownIds: allowedTownIds },
    });
  };

  const handleBatchInvite = async (
    memberIds: string[],
    channel: 'whatsapp' | 'email',
  ) => {
    for (const id of memberIds) {
      await updateAccessMutation.mutateAsync({
        id,
        dto: { hasAppAccess: true, channel },
      });
    }
  };

  const isCurrentUserAp = user?.role === 'AP';
  const isPrivileged = user?.role === 'AP' || user?.role === 'PC';

  // If viewing member profile in detail
  if (selectedMemberDetailId) {
    return (
      <MemberDetailPage
        memberId={selectedMemberDetailId}
        onBack={() => setSelectedMemberDetailId(null)}
        onEdit={() => {}}
        onManageAccess={(m) => setAccessMember(m)}
        isCurrentUserAp={isCurrentUserAp}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* 1. Header Hero Title Strip */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl sm:text-2xl font-black text-[#1e1b19] tracking-tight">
          {t('access:title') || 'Access & Accounts Command Center'}
        </h1>
        <p className="text-xs sm:text-sm text-[#8a726a]">
          {t('access:subtitle') ||
            'Manage member platform onboarding, temporary passwords, security freezes, and hub jurisdictions'}
        </p>
      </div>

      {/* 2. Top Security & KPI Cards */}
      <AccessStatsOverview
        stats={statsData}
        totalMembersCount={membersResponse?.total ?? rawMembers.length}
        activeAccountsCount={activeCount}
        pendingSetupCount={pendingCount}
        suspendedCount={suspendedCount}
        isLoading={isStatsLoading}
      />

      {/* 3. Filters Toolbar */}
      <AccessFilterToolbar
        search={search}
        onSearchChange={setSearch}
        selectedTownId={selectedTownId}
        onTownChange={(tId) => {
          setSelectedTownId(tId);
          setPage(1);
        }}
        availableTowns={availableTowns}
        stateFilter={stateFilter}
        onStateFilterChange={(st) => {
          setStateFilter(st);
          setPage(1);
        }}
        roleFilter={roleFilter}
        onRoleFilterChange={(rf) => {
          setRoleFilter(rf);
          setPage(1);
        }}
        onOpenBatchInvite={() => setIsBatchInviteOpen(true)}
        isPrivileged={isPrivileged}
      />

      {/* 4. Accounts Directory View */}
      <AccountsDirectoryTable
        members={paginatedMembers}
        isLoading={isMembersLoading}
        total={filteredMembers.length}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onOpenManageAccess={(m) => setAccessMember(m)}
        onOpenScopeModal={(m) => setScopeMember(m)}
        onViewMemberDetail={(id) => setSelectedMemberDetailId(id)}
        availableTowns={availableTowns}
        isCurrentUserAp={isCurrentUserAp}
      />

      {/* 5. Modals */}
      {/* Individual Access Modal */}
      <ManageAccessModal
        isOpen={Boolean(accessMember)}
        onClose={() => setAccessMember(null)}
        member={accessMember}
        onUpdateAccess={handleUpdateAccess}
      />

      {/* Cross-Hub Scope Modal */}
      <TownScopeModal
        isOpen={Boolean(scopeMember)}
        onClose={() => setScopeMember(null)}
        member={scopeMember}
        availableTowns={availableTowns}
        onSaveScopes={handleSaveScopes}
      />

      {/* Batch Onboard Invite Modal */}
      <BatchInviteModal
        isOpen={isBatchInviteOpen}
        onClose={() => setIsBatchInviteOpen(false)}
        offlineMembers={offlineMembers}
        onBatchInvite={handleBatchInvite}
      />
    </div>
  );
};

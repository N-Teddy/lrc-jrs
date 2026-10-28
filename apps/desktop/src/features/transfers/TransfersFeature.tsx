import {
  useAuth,
  useDeleteMemberMutation,
  useMembersQuery,
  useTownContext,
  useTownsQuery,
  useTranslation,
  useUpdateMemberAccessMutation,
  useUpdateMemberMutation,
} from '@jrs/client-core';
import type { IUpdateMemberDto, IUser } from '@jrs/shared';
import type React from 'react';
import { useMemo, useState } from 'react';
import {
  DeleteMemberDialog,
  EditMemberModal,
  ManageAccessModal,
  MemberDetailPage,
} from '../members';
import { InitiateTransferModal } from './components/InitiateTransferModal';
import { TransferCardGridView } from './components/TransferCardGridView';
import {
  type DirectionFilter,
  TransferFilterToolbar,
  type TransferViewMode,
} from './components/TransferFilterToolbar';
import {
  type TransferMetrics,
  TransferStatsOverview,
} from './components/TransferStatsOverview';
import { TransferTableView } from './components/TransferTableView';
import type { IFlattenedTransferRecord } from './utils/transfer-ui.utils';

export const TransfersFeature: React.FC = () => {
  const { t } = useTranslation(['transfers', 'common']);
  const { user } = useAuth();
  const { activeTown, canWrite } = useTownContext();
  const { data: towns = [] } = useTownsQuery();

  // Load all members to aggregate transfer history records
  const { data: membersResponse, isLoading: isMembersLoading } =
    useMembersQuery({
      limit: 500,
    });

  const members: IUser[] = useMemo(() => {
    return membersResponse?.items || [];
  }, [membersResponse]);

  // Lookup map for towns by ID
  const townsMap = useMemo(() => {
    return new Map(towns.map((t) => [t.id, t]));
  }, [towns]);

  // Navigation State
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Filter & View State
  const [search, setSearch] = useState('');
  const [townFilter, setTownFilter] = useState('ALL');
  const [directionFilter, setDirectionFilter] =
    useState<DirectionFilter>('ALL');
  const [viewMode, setViewMode] = useState<TransferViewMode>('table');
  const [page, setPage] = useState(1);
  const limit = viewMode === 'grid' ? 12 : 10;

  // Modals State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<IUser | null>(null);
  const [accessMember, setAccessMember] = useState<IUser | null>(null);
  const [deletingMember, setDeletingMember] = useState<IUser | null>(null);

  const updateMemberMutation = useUpdateMemberMutation();
  const updateAccessMutation = useUpdateMemberAccessMutation();
  const deleteMemberMutation = useDeleteMemberMutation();

  const isCurrentUserAp = user?.role === 'AP';
  const activeTownId = activeTown?.id;

  // Aggregate all transfer records across members
  const allTransfers: IFlattenedTransferRecord[] = useMemo(() => {
    const list: IFlattenedTransferRecord[] = [];
    for (const m of members) {
      if (m.transferHistory && m.transferHistory.length > 0) {
        m.transferHistory.forEach((t, idx) => {
          list.push({
            ...t,
            id: `${m.id}-${t.transferredAt || idx}-${idx}`,
            memberId: m.id,
            memberName: m.fullName,
            memberAvatar: m.avatarUrl,
            memberPhone: m.phoneNumber,
            memberRole: m.role,
            memberIsJr: m.isJr,
            memberCurrentTownId: m.homeTownId,
          });
        });
      }
    }
    // Sort descending by transferredAt
    return list.sort((a, b) => {
      const dateA = a.transferredAt ? new Date(a.transferredAt).getTime() : 0;
      const dateB = b.transferredAt ? new Date(b.transferredAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [members]);

  // Filter transfers by town, direction, and search
  const filteredTransfers = useMemo(() => {
    return allTransfers.filter((t) => {
      // 1. Town filter
      if (townFilter !== 'ALL') {
        if (t.fromTownId !== townFilter && t.toTownId !== townFilter) {
          return false;
        }
      }

      // 2. Direction filter relative to activeTown
      if (activeTownId) {
        if (directionFilter === 'INBOUND' && t.toTownId !== activeTownId) {
          return false;
        }
        if (directionFilter === 'OUTBOUND' && t.fromTownId !== activeTownId) {
          return false;
        }
      }

      // 3. Search query
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = t.memberName.toLowerCase().includes(query);
        const matchesAuthor = t.transferredBy.toLowerCase().includes(query);
        const matchesReason = t.reason?.toLowerCase().includes(query) ?? false;
        const matchesPhone = t.memberPhone.includes(query);
        const fromName = townsMap.get(t.fromTownId)?.name.toLowerCase() || '';
        const toName = townsMap.get(t.toTownId)?.name.toLowerCase() || '';
        if (
          !matchesName &&
          !matchesAuthor &&
          !matchesReason &&
          !matchesPhone &&
          !fromName.includes(query) &&
          !toName.includes(query)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    allTransfers,
    townFilter,
    directionFilter,
    activeTownId,
    search,
    townsMap,
  ]);

  // Pagination slice
  const paginatedTransfers = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return filteredTransfers.slice(startIndex, startIndex + limit);
  }, [filteredTransfers, page, limit]);

  // Aggregate Metrics
  const metrics: TransferMetrics = useMemo(() => {
    let inboundCount = 0;
    let outboundCount = 0;
    const uniqueMembers = new Set<string>();

    for (const t of allTransfers) {
      uniqueMembers.add(t.memberId);
      if (activeTownId) {
        if (t.toTownId === activeTownId) inboundCount++;
        if (t.fromTownId === activeTownId) outboundCount++;
      }
    }

    return {
      totalRelocations: allTransfers.length,
      inbound: inboundCount,
      outbound: outboundCount,
      transferredMembersCount: uniqueMembers.size,
    };
  }, [allTransfers, activeTownId]);

  // Eligible members for transfer (defaults to active town if specified)
  const eligibleMembersForTransfer = useMemo(() => {
    return members.filter((m) => {
      if (!activeTownId) return true;
      return m.homeTownId === activeTownId;
    });
  }, [members, activeTownId]);

  const townSelectOptions = useMemo(() => {
    return [
      {
        value: 'ALL',
        label: t('transfers:filters.allHubs', 'All Town Hubs'),
      },
      ...towns.map((tw) => ({
        value: tw.id,
        label: `${tw.name} (${tw.code})`,
      })),
    ];
  }, [towns, t]);

  // If a single member detail page is selected
  if (selectedMemberId) {
    return (
      <div className="w-full flex flex-col gap-6">
        <MemberDetailPage
          memberId={selectedMemberId}
          initialTab="transfers"
          onBack={() => setSelectedMemberId(null)}
          onEdit={(m) => setEditingMember(m)}
          onManageAccess={(m) => setAccessMember(m)}
          onDelete={isCurrentUserAp ? (m) => setDeletingMember(m) : undefined}
          isCurrentUserAp={isCurrentUserAp}
        />

        <EditMemberModal
          isOpen={Boolean(editingMember)}
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSubmit={async (id: string, dto: IUpdateMemberDto | FormData) => {
            await updateMemberMutation.mutateAsync({ id, dto });
          }}
          isSubmitting={updateMemberMutation.isPending}
        />

        <ManageAccessModal
          isOpen={Boolean(accessMember)}
          member={accessMember}
          onClose={() => setAccessMember(null)}
          onUpdateAccess={async (id, dto) => {
            await updateAccessMutation.mutateAsync({ id, dto });
          }}
        />

        <DeleteMemberDialog
          isOpen={Boolean(deletingMember)}
          member={deletingMember}
          onClose={() => setDeletingMember(null)}
          onConfirmDelete={async (id: string) => {
            await deleteMemberMutation.mutateAsync(id);
            if (selectedMemberId === id) {
              setSelectedMemberId(null);
            }
          }}
          isDeleting={deleteMemberMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* 1. Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold text-[#1e1b19] tracking-tight">
            {t('transfers:title', 'Town Transfers')}
          </h1>
          <p className="text-xs text-[#8a726a]">
            {t(
              'transfers:description',
              'Official registry of member relocations, administrative jurisdictions, and inter-city transitions across Cameroon.',
            )}
          </p>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <TransferStatsOverview
        metrics={metrics}
        isLoading={isMembersLoading}
        hubName={activeTown ? activeTown.name : 'Hub'}
      />

      {/* 3. Filter Toolbar */}
      <TransferFilterToolbar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        townFilter={townFilter}
        onTownFilterChange={(val) => {
          setTownFilter(val);
          setPage(1);
        }}
        directionFilter={directionFilter}
        onDirectionFilterChange={(dir) => {
          setDirectionFilter(dir);
          setPage(1);
        }}
        townOptions={townSelectOptions}
        viewMode={viewMode}
        onViewModeChange={(mode) => {
          setViewMode(mode);
          setPage(1);
        }}
        onOpenTransferModal={() => setIsTransferModalOpen(true)}
        canWrite={canWrite}
        hubName={activeTown?.name}
      />

      {/* 4. Directory View (Table or Grid) */}
      {viewMode === 'table' ? (
        <TransferTableView
          transfers={paginatedTransfers}
          isLoading={isMembersLoading}
          total={filteredTransfers.length}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onViewMember={(id) => setSelectedMemberId(id)}
          activeTownId={activeTownId}
          townsMap={townsMap}
        />
      ) : (
        <TransferCardGridView
          transfers={paginatedTransfers}
          isLoading={isMembersLoading}
          total={filteredTransfers.length}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onViewMember={(id) => setSelectedMemberId(id)}
          activeTownId={activeTownId}
          townsMap={townsMap}
        />
      )}

      {/* 5. Initiate Transfer Modal */}
      <InitiateTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        eligibleMembers={eligibleMembersForTransfer}
        towns={towns}
        activeTown={activeTown}
      />
    </div>
  );
};

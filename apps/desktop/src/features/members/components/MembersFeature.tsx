import {
  useAuth,
  useCreateMemberMutation,
  useDeleteMemberMutation,
  useMemberStatsQuery,
  useMembersQuery,
  useTownContext,
  useTranslation,
  useUpdateMemberAccessMutation,
  useUpdateMemberMutation,
} from '@jrs/client-core';
import type {
  ICreateMemberDto,
  IUpdateMemberDto,
  IUser,
  UserRole,
} from '@jrs/shared';
import type React from 'react';
import { useState } from 'react';
import { DeleteMemberDialog } from './DeleteMemberDialog';
import { EditMemberModal } from './EditMemberModal';
import { ManageAccessModal } from './ManageAccessModal';
import { MemberCardGridView } from './MemberCardGridView';
import { MemberDetailPage } from './MemberDetailPage';
import { MemberFilterToolbar, type ViewMode } from './MemberFilterToolbar';
import { MemberStatsOverview } from './MemberStatsOverview';
import { MemberTableView } from './MemberTableView';
import { RegisterMemberModal } from './RegisterMemberModal';

export const MembersFeature: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { activeTown, activeTownId } = useTownContext();

  // Navigation State
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Filter & View State
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [isJrOnly, setIsJrOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [page, setPage] = useState(1);
  const limit = viewMode === 'grid' ? 12 : 10;

  // Modals State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<IUser | null>(null);
  const [accessMember, setAccessMember] = useState<IUser | null>(null);
  const [deletingMember, setDeletingMember] = useState<IUser | null>(null);

  // Queries
  const { data: stats, isLoading: isStatsLoading } = useMemberStatsQuery(
    activeTownId || undefined,
  );

  const queryParams = {
    townId: activeTownId || undefined,
    role: roleFilter !== 'all' ? (roleFilter as UserRole) : undefined,

    isJr: isJrOnly ? true : undefined,
    search: search.trim() ? search.trim() : undefined,
    page,
    limit,
  };

  const { data: membersData, isLoading: isMembersLoading } =
    useMembersQuery(queryParams);

  // Mutations
  const createMemberMutation = useCreateMemberMutation();
  const updateMemberMutation = useUpdateMemberMutation();
  const updateAccessMutation = useUpdateMemberAccessMutation();
  const deleteMemberMutation = useDeleteMemberMutation();

  const isCurrentUserAp = user?.role === 'AP';

  const handleCreateMember = async (dto: ICreateMemberDto | FormData) => {
    if (typeof FormData !== 'undefined' && dto instanceof FormData) {
      if (activeTownId && !dto.has('homeTownId')) {
        dto.append('homeTownId', activeTownId);
      }
      await createMemberMutation.mutateAsync(dto);
    } else {
      await createMemberMutation.mutateAsync({
        ...(dto as ICreateMemberDto),
        homeTownId: activeTownId || undefined,
      });
    }
  };

  const handleUpdateMember = async (
    id: string,
    dto: IUpdateMemberDto | FormData,
  ) => {
    await updateMemberMutation.mutateAsync({ id, dto });
  };

  const handleConfirmDelete = async (id: string) => {
    await deleteMemberMutation.mutateAsync(id);
    if (selectedMemberId === id) {
      setSelectedMemberId(null);
    }
  };

  // If viewing a single member detail page
  if (selectedMemberId) {
    return (
      <div className="w-full flex flex-col gap-6">
        <MemberDetailPage
          memberId={selectedMemberId}
          onBack={() => setSelectedMemberId(null)}
          onEdit={(m) => setEditingMember(m)}
          onManageAccess={(m) => setAccessMember(m)}
          onDelete={isCurrentUserAp ? (m) => setDeletingMember(m) : undefined}
          isCurrentUserAp={isCurrentUserAp}
        />

        {/* Modals available from detail page as well */}
        <EditMemberModal
          isOpen={Boolean(editingMember)}
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSubmit={handleUpdateMember}
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
          onConfirmDelete={handleConfirmDelete}
          isDeleting={deleteMemberMutation.isPending}
        />
      </div>
    );
  }

  const members = membersData?.items ?? [];
  const total = membersData?.total ?? members.length;

  return (
    <div className="w-full flex flex-col gap-6">
      {/* 1. Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold text-[#1e1b19] tracking-tight">
            {t('members:title')}
          </h1>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <MemberStatsOverview
        stats={stats}
        isLoading={isStatsLoading}
        hubName={activeTown ? activeTown.name : 'Hub'}
      />

      {/* 3. Filter Toolbar */}
      <MemberFilterToolbar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        roleFilter={roleFilter}
        onRoleFilterChange={(role) => {
          setRoleFilter(role);
          setPage(1);
        }}
        isJrOnly={isJrOnly}
        onToggleJrOnly={() => {
          setIsJrOnly(!isJrOnly);
          setPage(1);
        }}
        viewMode={viewMode}
        onViewModeChange={(mode) => {
          setViewMode(mode);
          setPage(1);
        }}
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
      />

      {/* 4. Directory View (Table or Grid) */}
      {viewMode === 'table' ? (
        <MemberTableView
          members={members}
          isLoading={isMembersLoading}
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onViewMember={(id) => setSelectedMemberId(id)}
          onEditMember={(m) => setEditingMember(m)}
          onManageAccess={(m) => setAccessMember(m)}
          onDeleteMember={
            isCurrentUserAp ? (m) => setDeletingMember(m) : undefined
          }
          isCurrentUserAp={isCurrentUserAp}
        />
      ) : (
        <MemberCardGridView
          members={members}
          isLoading={isMembersLoading}
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onViewMember={(id) => setSelectedMemberId(id)}
          onEditMember={(m) => setEditingMember(m)}
          onManageAccess={(m) => setAccessMember(m)}
          onDeleteMember={
            isCurrentUserAp ? (m) => setDeletingMember(m) : undefined
          }
          isCurrentUserAp={isCurrentUserAp}
        />
      )}

      {/* 5. Modals */}
      <RegisterMemberModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSubmit={handleCreateMember}
        activeTownName={activeTown ? activeTown.name : 'Hub'}
        activeTownCode={activeTown ? activeTown.code : 'HUB'}
        activePcCount={stats?.activePcCount ?? 0}
        isSubmitting={createMemberMutation.isPending}
      />

      <EditMemberModal
        isOpen={Boolean(editingMember)}
        member={editingMember}
        onClose={() => setEditingMember(null)}
        onSubmit={handleUpdateMember}
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
        onConfirmDelete={handleConfirmDelete}
        isDeleting={deleteMemberMutation.isPending}
      />
    </div>
  );
};

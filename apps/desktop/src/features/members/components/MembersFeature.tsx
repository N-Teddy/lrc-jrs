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
import { ShieldCheck, Users } from '@phosphor-icons/react';
import type React from 'react';
import { useState } from 'react';
import { AccessFeature } from '../../access';
import { DeleteMemberDialog } from './DeleteMemberDialog';
import { EditMemberModal } from './EditMemberModal';
import { ManageAccessModal } from './ManageAccessModal';
import { MemberCardGridView } from './MemberCardGridView';
import { MemberDetailPage } from './MemberDetailPage';
import { MemberFilterToolbar, type ViewMode } from './MemberFilterToolbar';
import { MemberStatsOverview } from './MemberStatsOverview';
import { MemberTableView } from './MemberTableView';
import { RegisterMemberModal } from './RegisterMemberModal';

interface MembersFeatureProps {
  initialSubTab?: 'directory' | 'access';
}

export const MembersFeature: React.FC<MembersFeatureProps> = ({
  initialSubTab = 'directory',
}) => {
  const { t } = useTranslation(['members', 'access', 'common']);
  const { user } = useAuth();
  const { activeTown, activeTownId } = useTownContext();

  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'access'>(
    initialSubTab,
  );

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

  const members = membersData?.items ?? [];
  const total = membersData?.total ?? members.length;

  return (
    <div className="w-full flex flex-col gap-6">
      {selectedMemberId ? (
        <MemberDetailPage
          memberId={selectedMemberId}
          onBack={() => setSelectedMemberId(null)}
          onEdit={(m) => setEditingMember(m)}
          onManageAccess={(m) => setAccessMember(m)}
          onDelete={isCurrentUserAp ? (m) => setDeletingMember(m) : undefined}
          isCurrentUserAp={isCurrentUserAp}
        />
      ) : (
        <>
          {/* 1. Header & Subtab Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#f4ece9]">
            <div className="flex flex-col gap-0.5">
              <h1 className="text-xl sm:text-2xl font-bold text-[#1e1b19] tracking-tight">
                {activeSubTab === 'directory'
                  ? t('members:title')
                  : t('access:title') || 'Access & Accounts Command Center'}
              </h1>
              <p className="text-xs text-[#8a726a]">
                {activeSubTab === 'directory'
                  ? 'Directory roster, demographic profiles, and status records'
                  : t('access:subtitle') ||
                    'Manage member platform onboarding, temporary passwords, security freezes, and hub jurisdictions'}
              </p>
            </div>

            {/* Subtab Switcher */}
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] self-start sm:self-auto shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveSubTab('directory')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'directory'
                    ? 'bg-white text-[#b85028] shadow-xs border border-[#e8e1dd]'
                    : 'text-[#8a726a] hover:text-[#57423b] hover:bg-[#f4ece9] border border-transparent'
                }`}
              >
                <Users
                  size={16}
                  weight={activeSubTab === 'directory' ? 'fill' : 'regular'}
                />
                <span>Fellowship Directory</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('access')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'access'
                    ? 'bg-white text-[#b85028] shadow-xs border border-[#e8e1dd]'
                    : 'text-[#8a726a] hover:text-[#57423b] hover:bg-[#f4ece9] border border-transparent'
                }`}
              >
                <ShieldCheck
                  size={16}
                  weight={activeSubTab === 'access' ? 'fill' : 'regular'}
                />
                <span>Access & Accounts</span>
              </button>
            </div>
          </div>

          {activeSubTab === 'directory' ? (
            <>
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
            </>
          ) : (
            <AccessFeature showHeader={false} />
          )}
        </>
      )}

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

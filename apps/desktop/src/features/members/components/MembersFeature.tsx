import {
  useAuth,
  useCreateMemberMutation,
  useDeleteMemberMutation,
  useMemberStatsQuery,
  useMembersQuery,
  usePendingReviewsQuery,
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
import {
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Users,
} from '@phosphor-icons/react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { AccessFeature } from '../../access';
import { DeleteMemberDialog } from './DeleteMemberDialog';
import { EditMemberModal } from './EditMemberModal';
import { IntakeLinksModal } from './IntakeLinksModal';
import { IntakeReviewsTab } from './IntakeReviewsTab';
import { ManageAccessModal } from './ManageAccessModal';
import { MemberCardGridView } from './MemberCardGridView';
import { MemberDetailPage } from './MemberDetailPage';
import { MemberFilterToolbar, type ViewMode } from './MemberFilterToolbar';
import { MemberStatsOverview } from './MemberStatsOverview';
import { MemberTableView } from './MemberTableView';
import { PendingIntakeReviewsModal } from './PendingIntakeReviewsModal';
import { RegisterMemberModal } from './RegisterMemberModal';

export type MemberSubTab = 'directory' | 'access' | 'reviews';

export interface MembersFeatureProps {
  initialSubTab?: MemberSubTab;
  initialMemberId?: string | null;
}

export const MembersFeature: React.FC<MembersFeatureProps> = ({
  initialSubTab = 'directory',
  initialMemberId,
}) => {
  const { t } = useTranslation(['members', 'access', 'common']);
  const { user } = useAuth();
  const { activeTown, activeTownId } = useTownContext();

  const [activeSubTab, setActiveSubTab] = useState<MemberSubTab>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Navigation State
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(
    initialMemberId || null,
  );

  useEffect(() => {
    if (initialMemberId !== undefined) {
      setSelectedMemberId(initialMemberId);
    }
  }, [initialMemberId]);

  // Filter & View State
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [isJrOnly, setIsJrOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [page, setPage] = useState(1);
  const limit = viewMode === 'grid' ? 12 : 10;

  // Modals State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isIntakeLinksModalOpen, setIsIntakeLinksModalOpen] = useState(false);
  const [isPendingReviewsModalOpen, setIsPendingReviewsModalOpen] =
    useState(false);
  const [editingMember, setEditingMember] = useState<IUser | null>(null);
  const [accessMember, setAccessMember] = useState<IUser | null>(null);
  const [deletingMember, setDeletingMember] = useState<IUser | null>(null);

  // Queries
  const { data: stats, isLoading: isStatsLoading } = useMemberStatsQuery(
    activeTownId || undefined,
  );

  const { data: pendingReviews = [] } = usePendingReviewsQuery(
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
                  : activeSubTab === 'access'
                    ? t('access:title') || 'Access & Accounts Command Center'
                    : t('members:intakeReviewsTitle') ||
                      'Intake Registration Reviews'}
              </h1>
              <p className="text-xs text-[#8a726a]">
                {activeSubTab === 'directory'
                  ? 'Directory roster, demographic profiles, and status records'
                  : activeSubTab === 'access'
                    ? t('access:subtitle') ||
                      'Manage member platform onboarding, temporary passwords, security freezes, and hub jurisdictions'
                    : `Review and approve prospective members registered through invitation links for ${
                        activeTown ? activeTown.name : 'this Hub'
                      }`}
              </p>
            </div>

            {/* Subtab Switcher */}
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] self-start sm:self-auto shadow-2xs flex-wrap">
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

              <button
                type="button"
                onClick={() => setActiveSubTab('reviews')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'reviews'
                    ? 'bg-white text-[#b85028] shadow-xs border border-[#e8e1dd]'
                    : 'text-[#8a726a] hover:text-[#57423b] hover:bg-[#f4ece9] border border-transparent'
                }`}
              >
                <UserCheck
                  size={16}
                  weight={activeSubTab === 'reviews' ? 'fill' : 'regular'}
                />
                <span>Intake Registration Review</span>
                {pendingReviews.length > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      activeSubTab === 'reviews'
                        ? 'bg-[#b85028] text-white'
                        : 'bg-[#ffdad6] text-[#ba1a1a]'
                    }`}
                  >
                    {pendingReviews.length}
                  </span>
                )}
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

              {/* Review Queue Alert Banner */}
              {pendingReviews.length > 0 && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-[#fff2ee] via-white to-white border border-[#ffdbcf] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#b85028] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <ShieldCheck size={22} weight="fill" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1e1b19] flex items-center gap-2">
                        <span>
                          {pendingReviews.length} Intake Registration
                          {pendingReviews.length > 1 ? 's' : ''} Awaiting Review
                        </span>
                        <span className="w-2 h-2 rounded-full bg-[#b85028] animate-ping" />
                      </h4>
                      <p className="text-[11px] text-[#8a726a]">
                        Prospective members submitted their info via public
                        invitation link. Review and accept into directory.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('reviews')}
                    className="px-4 py-2 rounded-lg bg-[#b85028] hover:bg-[#a44520] text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <span>Review Submissions ({pendingReviews.length})</span>
                    <ArrowRight size={14} weight="bold" />
                  </button>
                </div>
              )}

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
                onOpenIntakeLinksModal={() => setIsIntakeLinksModalOpen(true)}
                pendingReviewsCount={pendingReviews.length}
                onOpenPendingReviewsModal={() => setActiveSubTab('reviews')}
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
          ) : activeSubTab === 'access' ? (
            <AccessFeature showHeader={false} />
          ) : (
            <IntakeReviewsTab
              activeTownId={activeTownId || undefined}
              activeTownName={activeTown ? activeTown.name : 'Hub'}
              onOpenIntakeLinksModal={() => setIsIntakeLinksModalOpen(true)}
            />
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

      <IntakeLinksModal
        isOpen={isIntakeLinksModalOpen}
        onClose={() => setIsIntakeLinksModalOpen(false)}
        activeTownId={activeTownId || undefined}
        activeTownName={activeTown ? activeTown.name : 'Hub'}
        activeTownCode={activeTown ? activeTown.code : 'HUB'}
      />

      <PendingIntakeReviewsModal
        isOpen={isPendingReviewsModalOpen}
        onClose={() => setIsPendingReviewsModalOpen(false)}
        activeTownId={activeTownId || undefined}
        activeTownName={activeTown ? activeTown.name : 'Hub'}
      />
    </div>
  );
};

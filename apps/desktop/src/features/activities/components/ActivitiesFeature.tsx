import {
  useActivitiesQuery,
  useActivityStatsQuery,
  useAuth,
  useCreateActivityMutation,
  useDeleteActivityMutation,
  useTownContext,
  useTownsQuery,
  useTranslation,
  useUpdateActivityMutation,
} from '@jrs/client-core';
import { ActivityStatus, ActivityType, type IActivity } from '@jrs/shared';
import type React from 'react';
import { useState } from 'react';
import { ActivityAttendanceRoster } from './ActivityAttendanceRoster';
import { ActivityAuditLogView } from './ActivityAuditLogView';
import { ActivityCalendarView } from './ActivityCalendarView';
import { ActivityCardGridView } from './ActivityCardGridView';
import {
  ActivityFilterToolbar,
  type ActivityViewMode,
} from './ActivityFilterToolbar';
import { ActivityFormModal } from './ActivityFormModal';
import { ActivityStatsOverview } from './ActivityStatsOverview';
import { ActivityTableView } from './ActivityTableView';
import { DeleteActivityDialog } from './DeleteActivityDialog';

type ActivitySubView = 'list' | 'attendance' | 'audit-log';

export const ActivitiesFeature: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { activeTown, activeTownId } = useTownContext();

  // Navigation State
  const [subView, setSubView] = useState<ActivitySubView>('list');
  const [selectedActivity, setSelectedActivity] = useState<IActivity | null>(
    null,
  );

  // Filter & View State
  const [search, setSearch] = useState('');
  const [year, setYear] = useState<number | undefined>(2026);
  const [month, setMonth] = useState<number | undefined>(undefined);
  const [activityTypeFilter, setActivityTypeFilter] = useState<
    ActivityType | 'all'
  >('all');
  const [statusFilter, setStatusFilter] = useState<ActivityStatus | 'all'>(
    'all',
  );
  const [viewMode, setViewMode] = useState<ActivityViewMode>('table');
  const [page, setPage] = useState(1);
  const limit = viewMode === 'grid' ? 12 : 10;

  // Modals State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<IActivity | null>(
    null,
  );
  const [deletingActivity, setDeletingActivity] = useState<IActivity | null>(
    null,
  );

  const { data: townsData } = useTownsQuery();
  const towns = townsData || [];

  const effectiveTownId = activeTownId || undefined;

  const { data: statsData, isLoading: isStatsLoading } = useActivityStatsQuery({
    townId: effectiveTownId,
    year,
    month,
  });

  const calendarActiveMonth = month ?? new Date().getMonth() + 1;
  const calendarActiveYear = year ?? new Date().getFullYear();

  const queryParams = {
    townId: effectiveTownId,
    year: viewMode === 'calendar' ? calendarActiveYear : year,
    month: viewMode === 'calendar' ? calendarActiveMonth : month,
    activityType: activityTypeFilter !== 'all' ? activityTypeFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    search: search.trim() ? search.trim() : undefined,
    page: viewMode === 'calendar' ? 1 : page,
    limit: viewMode === 'calendar' ? 100 : limit,
  };

  const { data: activitiesData, isLoading: isActivitiesLoading } =
    useActivitiesQuery(queryParams);

  // Mutations
  const createActivityMutation = useCreateActivityMutation();
  const updateActivityMutation = useUpdateActivityMutation();
  const deleteActivityMutation = useDeleteActivityMutation();

  const isPrivileged = user?.role === 'AP' || user?.role === 'PC';

  // Navigation Handlers
  const handleTrackAttendance = (activity: IActivity) => {
    setSelectedActivity(activity);
    setSubView('attendance');
  };

  const handleViewHistory = (activity: IActivity) => {
    setSelectedActivity(activity);
    setSubView('audit-log');
  };

  const handleEditActivity = (activity: IActivity) => {
    setEditingActivity(activity);
    setIsFormModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    setEditingActivity(null);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (formData: any) => {
    if (editingActivity) {
      await updateActivityMutation.mutateAsync({
        id: editingActivity.id,
        dto: formData,
      });
      // If we are currently in audit-log view or attendance view, update selectedActivity
      if (selectedActivity?.id === editingActivity.id) {
        setSelectedActivity({ ...selectedActivity, ...formData });
      }
    } else {
      await createActivityMutation.mutateAsync({
        ...formData,
        townId: formData.townId || activeTownId,
      });
    }
  };

  const handleConfirmDelete = async (id: string) => {
    await deleteActivityMutation.mutateAsync(id);
    if (selectedActivity?.id === id) {
      setSelectedActivity(null);
      setSubView('list');
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setYear(2026);
    setMonth(undefined);
    setActivityTypeFilter('all');
    setStatusFilter('all');
    setPage(1);
  };

  // 1. Attendance Roster View
  if (subView === 'attendance' && selectedActivity) {
    return (
      <ActivityAttendanceRoster
        activity={selectedActivity}
        onBack={() => setSubView('list')}
      />
    );
  }

  // 2. Audit History View
  if (subView === 'audit-log' && selectedActivity) {
    return (
      <ActivityAuditLogView
        activity={selectedActivity}
        onBack={() => setSubView('list')}
        onEditActivity={handleEditActivity}
      />
    );
  }

  // 3. Main Activities Hub View
  const hubName = activeTown?.name || 'Cameroon';
  const activities = activitiesData?.items || [];
  const total = activitiesData?.total || 0;

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Page Header Strip matching mockups */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold text-[#1e1b19] tracking-tight">
            {t('activities:title')}
          </h1>
        </div>
      </section>

      {/* KPI Overview Metrics */}
      <ActivityStatsOverview
        stats={statsData}
        isLoading={isStatsLoading}
        hubName={hubName}
      />

      {/* Filter & Navigation Toolbar */}
      <ActivityFilterToolbar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        year={year}
        onYearChange={(v) => {
          setYear(v);
          setPage(1);
        }}
        month={month}
        onMonthChange={(v) => {
          setMonth(v);
          setPage(1);
        }}
        activityType={activityTypeFilter}
        onActivityTypeChange={(v) => {
          setActivityTypeFilter(v);
          setPage(1);
        }}
        status={statusFilter}
        onStatusChange={(v) => {
          setStatusFilter(v);
          setPage(1);
        }}
        viewMode={viewMode}
        onViewModeChange={(mode) => {
          setViewMode(mode);
          setPage(1);
        }}
        onOpenCreateModal={handleOpenCreateModal}
        onClearFilters={handleClearFilters}
      />

      {/* Multi-View Content */}
      {viewMode === 'table' ? (
        <ActivityTableView
          activities={activities}
          isLoading={isActivitiesLoading}
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onTrackAttendance={handleTrackAttendance}
          onEditActivity={handleEditActivity}
          onViewHistory={handleViewHistory}
          onDeleteActivity={(act) => setDeletingActivity(act)}
          isPrivileged={isPrivileged}
        />
      ) : viewMode === 'grid' ? (
        <ActivityCardGridView
          activities={activities}
          isLoading={isActivitiesLoading}
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onTrackAttendance={handleTrackAttendance}
          onEditActivity={handleEditActivity}
          onViewHistory={handleViewHistory}
          onDeleteActivity={(act) => setDeletingActivity(act)}
          isPrivileged={isPrivileged}
        />
      ) : (
        <ActivityCalendarView
          activities={activities}
          isLoading={isActivitiesLoading}
          selectedYear={calendarActiveYear}
          selectedMonth={calendarActiveMonth}
          onMonthChange={(newYear, newMonth) => {
            setYear(newYear);
            setMonth(newMonth);
          }}
          onTrackAttendance={handleTrackAttendance}
          onEditActivity={handleEditActivity}
        />
      )}

      {/* Modals */}
      <ActivityFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        initialActivity={editingActivity}
        towns={towns}
        activeTownId={activeTownId || undefined}
        onSubmit={handleFormSubmit}
        isSubmitting={
          createActivityMutation.isPending || updateActivityMutation.isPending
        }
      />

      <DeleteActivityDialog
        isOpen={Boolean(deletingActivity)}
        onClose={() => setDeletingActivity(null)}
        activity={deletingActivity}
        onConfirmDelete={handleConfirmDelete}
        isDeleting={deleteActivityMutation.isPending}
      />
    </div>
  );
};

import {
  toast,
  useActivitiesQuery,
  useActivityDetailQuery,
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
import { Bell, CalendarBlank, CircleNotch } from '@phosphor-icons/react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { ComingSoonModal } from '../../../components';
import { ActivityAttendanceRoster } from './ActivityAttendanceRoster';
import { ActivityAuditLogView } from './ActivityAuditLogView';
import { ActivityCalendarView } from './ActivityCalendarView';
import { ActivityCardGridView } from './ActivityCardGridView';
import { ActivityDetailPage } from './ActivityDetailPage';
import {
  ActivityFilterToolbar,
  type ActivityViewMode,
} from './ActivityFilterToolbar';
import { ActivityFormModal } from './ActivityFormModal';
import { ActivityRemindersTab } from './ActivityRemindersTab';
import { ActivityReminderTemplatesModal } from './ActivityReminderTemplatesModal';
import { ActivityStatsOverview } from './ActivityStatsOverview';
import { ActivityTableView } from './ActivityTableView';
import { DeleteActivityDialog } from './DeleteActivityDialog';

export type ActivityMainTab = 'schedule' | 'reminders';
type ActivitySubView = 'list' | 'details' | 'attendance' | 'audit-log';

export interface ActivitiesFeatureProps {
  initialActivityId?: string | null;
  initialSubTab?:
    | 'schedule'
    | 'reminders'
    | 'overview'
    | 'preparation'
    | 'checklist'
    | 'attendance'
    | 'report'
    | 'history'
    | 'audit-log';
}

export const ActivitiesFeature: React.FC<ActivitiesFeatureProps> = ({
  initialActivityId,
  initialSubTab,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { activeTown, activeTownId } = useTownContext();

  const appEnv = import.meta.env.VITE_APP_ENV;
  const isProd =
    appEnv === 'production' ||
    (appEnv !== 'development' &&
      (import.meta.env.PROD || import.meta.env.MODE === 'production'));

  // Navigation State
  const [activeTab, setActiveTab] = useState<ActivityMainTab>(
    initialSubTab === 'reminders' && !isProd ? 'reminders' : 'schedule',
  );
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
  const [isReminderTemplatesModalOpen, setIsReminderTemplatesModalOpen] =
    useState(false);
  const [isComingSoonModalOpen, setIsComingSoonModalOpen] = useState(false);
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

  // Directly fetch activity by ID when navigated from a notification or deep link
  const { data: directActivity, isLoading: isDirectActivityLoading } =
    useActivityDetailQuery(initialActivityId || '');

  useEffect(() => {
    if (initialSubTab === 'reminders' && !initialActivityId) {
      if (isProd) {
        setIsComingSoonModalOpen(true);
        setActiveTab('schedule');
      } else {
        setActiveTab('reminders');
      }
      setSubView('list');
      setSelectedActivity(null);
    } else if (initialSubTab === 'schedule' && !initialActivityId) {
      setActiveTab('schedule');
      setSubView('list');
      setSelectedActivity(null);
    }
  }, [initialSubTab, initialActivityId, isProd]);

  useEffect(() => {
    if (!initialActivityId) return;

    const targetActivity =
      directActivity ||
      activitiesData?.items?.find((a) => a.id === initialActivityId);

    if (targetActivity) {
      setSelectedActivity(targetActivity);
      if (initialSubTab === 'attendance') {
        setSubView('attendance');
      } else if (initialSubTab === 'audit-log' || initialSubTab === 'history') {
        setSubView('audit-log');
      } else {
        setSubView('details');
      }
    }
  }, [initialActivityId, directActivity, activitiesData, initialSubTab]);

  // Mutations
  const createActivityMutation = useCreateActivityMutation();
  const updateActivityMutation = useUpdateActivityMutation();
  const deleteActivityMutation = useDeleteActivityMutation();

  const isPrivileged = user?.role === 'AP' || user?.role === 'PC';

  // Navigation Handlers
  const handleViewDetails = (activity: IActivity) => {
    setSelectedActivity(activity);
    setSubView('details');
  };

  const handleViewPreparation = (activity: IActivity) => {
    setSelectedActivity(activity);
    setSubView('details');
  };

  const handleTrackAttendance = (activity: IActivity) => {
    setSelectedActivity(activity);
    setSubView('attendance');
  };

  const handleViewHistory = (activity: IActivity) => {
    setSelectedActivity(activity);
    setSubView('audit-log');
  };

  const handleEditActivity = (activity: IActivity) => {
    if (activity.status === ActivityStatus.COMPLETED) {
      return;
    }
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
      toast.success(
        t('activities:activityUpdatedSuccess', {
          defaultValue: 'Activity updated successfully',
        }),
      );
      // If we are currently in audit-log view or attendance view, update selectedActivity
      if (selectedActivity?.id === editingActivity.id) {
        setSelectedActivity({ ...selectedActivity, ...formData });
      }
    } else {
      const { status: _status, changeReason: _cr, ...createPayload } = formData;
      await createActivityMutation.mutateAsync({
        ...createPayload,
        townId: createPayload.townId || activeTownId,
      });
      toast.success(
        t('activities:activityCreatedSuccess', {
          defaultValue: 'Activity created successfully',
        }),
      );
    }
  };

  const handleConfirmDelete = async (id: string) => {
    await deleteActivityMutation.mutateAsync(id);
    toast.success(
      t('activities:activityDeletedSuccess', {
        defaultValue: 'Activity deleted successfully',
      }),
    );
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

  const activities = activitiesData?.items || [];
  const total = activitiesData?.total || 0;

  const currentActivity = selectedActivity
    ? activities.find((a) => a.id === selectedActivity.id) || selectedActivity
    : null;

  const hubName = activeTown?.name || 'Cameroon';

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* 0. Direct Activity Loading State (when opening from notification) */}
      {initialActivityId && isDirectActivityLoading && !currentActivity ? (
        <div className="w-full min-h-[420px] rounded-2xl bg-white border border-[#e8e1dd] p-12 flex flex-col items-center justify-center gap-3 shadow-xs">
          <CircleNotch size={32} className="animate-spin text-[#b85028]" />
          <p className="text-xs font-bold text-[#57423b]">
            {t('common:loading') || 'Loading activity details...'}
          </p>
        </div>
      ) : subView === 'details' && currentActivity ? (
        /* 1. Activity Detail Screen View (with tabs) */
        <ActivityDetailPage
          activity={currentActivity}
          onBack={() => {
            setSelectedActivity(null);
            setSubView('list');
          }}
          onTrackAttendance={handleTrackAttendance}
          onEditActivity={handleEditActivity}
          onDeleteActivity={(act) => setDeletingActivity(act)}
          isPrivileged={isPrivileged}
          initialTab={
            initialSubTab === 'history'
              ? 'history'
              : initialSubTab === 'attendance'
                ? 'attendance'
                : initialSubTab === 'report'
                  ? 'report'
                  : initialSubTab === 'preparation' ||
                      initialSubTab === 'checklist'
                    ? 'preparation'
                    : 'overview'
          }
        />
      ) : subView === 'attendance' && selectedActivity ? (
        /* 2. Attendance Roster View */
        <ActivityAttendanceRoster
          activity={selectedActivity}
          onBack={() => setSubView('details')}
        />
      ) : subView === 'audit-log' && selectedActivity ? (
        /* 3. Audit History View */
        <ActivityAuditLogView
          activity={selectedActivity}
          onBack={() => setSubView('details')}
          onEditActivity={handleEditActivity}
        />
      ) : (
        /* 4. Main Activities Hub View */
        <>
          {/* 1. Header & Subtab Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#f4ece9]">
            <div className="flex flex-col gap-0.5">
              <h1 className="text-xl sm:text-2xl font-bold text-[#1e1b19] tracking-tight">
                {activeTab === 'schedule'
                  ? t('activities:title', 'Activities Management')
                  : t(
                      'activities:reminders.tabTitle',
                      'Reminders & Guidelines',
                    )}
              </h1>
              <p className="text-xs text-[#8a726a]">
                {activeTab === 'schedule'
                  ? t(
                      'activities:subtitle',
                      'Schedule, track, and monitor church gatherings and reports',
                    )
                  : t(
                      'activities:reminders.tabSubtitle',
                      'Milestone broadcast automation, preparation checklists, and leadership directives per activity type',
                    )}
              </p>
            </div>

            {/* Subtab Switcher matching MembersFeature */}
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] self-start sm:self-auto shadow-2xs flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTab('schedule')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'schedule'
                    ? 'bg-white text-[#b85028] shadow-xs border border-[#e8e1dd]'
                    : 'text-[#8a726a] hover:text-[#57423b] hover:bg-[#f4ece9] border border-transparent'
                }`}
              >
                <CalendarBlank
                  size={16}
                  weight={activeTab === 'schedule' ? 'fill' : 'regular'}
                />
                <span>
                  {t('activities:views.schedule', 'Activities Schedule')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isProd) {
                    setIsComingSoonModalOpen(true);
                  } else {
                    setActiveTab('reminders');
                  }
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'reminders'
                    ? 'bg-white text-[#b85028] shadow-xs border border-[#e8e1dd]'
                    : 'text-[#8a726a] hover:text-[#57423b] hover:bg-[#f4ece9] border border-transparent'
                }`}
              >
                <Bell
                  size={16}
                  weight={activeTab === 'reminders' ? 'fill' : 'regular'}
                />
                <span>
                  {t('activities:reminders.tabTitle', 'Reminders & Guidelines')}
                </span>
              </button>
            </div>
          </div>

          {activeTab === 'schedule' ? (
            <>
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
                  onViewDetails={handleViewDetails}
                  onViewPreparation={handleViewPreparation}
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
                  onViewDetails={handleViewDetails}
                  onViewPreparation={handleViewPreparation}
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
                  onViewDetails={handleViewDetails}
                  onEditActivity={handleEditActivity}
                />
              )}
            </>
          ) : (
            /* Reminders & Guidelines Full Tab View */
            <ActivityRemindersTab
              onNavigateToActivity={(activityId) => {
                const targetAct = activities.find((a) => a.id === activityId);
                if (targetAct) {
                  setSelectedActivity(targetAct);
                  setSubView('details');
                }
              }}
              isPrivileged={isPrivileged}
            />
          )}
        </>
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

      {/* Activity Reminder Guidelines & Templates Modal */}
      <ActivityReminderTemplatesModal
        isOpen={isReminderTemplatesModalOpen}
        onClose={() => setIsReminderTemplatesModalOpen(false)}
      />

      {/* Coming Soon Modal for Reminders & Guidelines on PROD */}
      <ComingSoonModal
        isOpen={isComingSoonModalOpen}
        onClose={() => setIsComingSoonModalOpen(false)}
        featureName={t(
          'activities:reminders.tabTitle',
          'Reminders & Automated Guidelines',
        )}
      />
    </div>
  );
};

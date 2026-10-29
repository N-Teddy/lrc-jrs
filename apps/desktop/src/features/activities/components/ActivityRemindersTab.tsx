import {
  useActivitiesQuery,
  useActivityReminderTemplatesQuery,
  useToast,
  useTownContext,
  useTranslation,
  useTriggerDailyMilestonesMutation,
  useTriggerMonthlyDigestMutation,
  useUpdateActivityReminderTemplateMutation,
} from '@jrs/client-core';
import { ActivityStatus, ActivityType, type IChecklistItem } from '@jrs/shared';
import {
  ArrowRight,
  Bell,
  CalendarCheck,
  Check,
  ClockCountdown,
  Lightning,
  ListChecks,
  PaperPlaneRight,
  Plus,
  Sparkle,
  Trash,
} from '@phosphor-icons/react';
import type React from 'react';
import { useEffect, useState } from 'react';
import {
  formatActivityDate,
  getActivityTypeConfig,
} from '../utils/activity-ui.utils';

export interface ActivityRemindersTabProps {
  onNavigateToActivity?: (activityId: string) => void;
  isPrivileged?: boolean;
}

const ALL_ACTIVITY_TYPES: ActivityType[] = [
  ActivityType.MONTHLY_MEETING,
  ActivityType.SERVICE,
  ActivityType.CAUSERIE,
  ActivityType.CONFERENCE,
  ActivityType.RECREATIONAL,
  ActivityType.AG,
  ActivityType.JPO,
];

export const ActivityRemindersTab: React.FC<ActivityRemindersTabProps> = ({
  onNavigateToActivity,
  isPrivileged = true,
}) => {
  const { t } = useTranslation(['activities', 'common', 'errors']);
  const { addToast } = useToast();
  const { activeTownId } = useTownContext();

  const [selectedType, setSelectedType] = useState<ActivityType>(
    ActivityType.MONTHLY_MEETING,
  );

  // Queries & Mutations
  const { data: allTemplates } = useActivityReminderTemplatesQuery();
  const updateTemplateMutation = useUpdateActivityReminderTemplateMutation();
  const triggerDailyMutation = useTriggerDailyMilestonesMutation();
  const triggerMonthlyMutation = useTriggerMonthlyDigestMutation();

  // Query upcoming scheduled activities for this hub
  const { data: activitiesData, isLoading: isActivitiesLoading } =
    useActivitiesQuery({
      townId: activeTownId || undefined,
      status: ActivityStatus.SCHEDULED,
      limit: 10,
    });

  const upcomingActivities = (activitiesData?.items || []).filter(
    (act) => act.status === ActivityStatus.SCHEDULED,
  );

  // Active Template Local Form State
  const activeTemplate = allTemplates?.find(
    (item) => item.activityType === selectedType,
  );

  const [items, setItems] = useState<IChecklistItem[]>([]);
  const [instructionsFr, setInstructionsFr] = useState('');
  const [instructionsEn, setInstructionsEn] = useState('');

  useEffect(() => {
    if (activeTemplate) {
      setItems(activeTemplate.items || []);
      setInstructionsFr(activeTemplate.customInstructionsFr || '');
      setInstructionsEn(activeTemplate.customInstructionsEn || '');
    } else {
      setItems([]);
      setInstructionsFr('');
      setInstructionsEn('');
    }
  }, [activeTemplate]);

  const handleAddItem = () => {
    const newItem: IChecklistItem = {
      id: `item-${Date.now()}`,
      labelKey: `task_${Date.now()}`,
      labelFr: 'Nouvelle étape de préparation',
      labelEn: 'New preparation step',
      isRequired: true,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleUpdateItem = (
    index: number,
    field: keyof IChecklistItem,
    value: any,
  ) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      await updateTemplateMutation.mutateAsync({
        type: selectedType,
        dto: {
          items,
          customInstructionsFr: instructionsFr.trim() || undefined,
          customInstructionsEn: instructionsEn.trim() || undefined,
        },
      });

      const typeConfig = getActivityTypeConfig(selectedType, t);
      addToast({
        type: 'success',
        title: t('activities:reminders.saveTemplate', 'Save Guidelines'),
        message: t('activities:reminders.templateSavedSuccess', {
          type: typeConfig.label,
          defaultValue: `Checklist guidelines for ${typeConfig.label} updated successfully!`,
        }),
      });
    } catch {
      addToast({
        type: 'error',
        title: t('common:error', 'Error'),
        message: t(
          'errors:ERR_INTERNAL_SERVER',
          'Failed to update reminder template.',
        ),
      });
    }
  };

  const handleTriggerDaily = async () => {
    try {
      const res = await triggerDailyMutation.mutateAsync();
      addToast({
        type: 'success',
        title: t(
          'activities:reminders.triggerDailyButton',
          'Trigger Daily Milestones',
        ),
        message: t('activities:reminders.milestoneTriggerSuccess', {
          reminders14d: res.reminders14d,
          reminders7d: res.reminders7d,
          reportWarnings: res.reportWarnings,
          defaultValue: `Milestone check complete! Dispatched ${res.reminders14d} 14-day reminders, ${res.reminders7d} 7-day reminders, and ${res.reportWarnings} report warnings.`,
        }),
      });
    } catch {
      addToast({
        type: 'error',
        title: t('common:error', 'Error'),
        message: t(
          'errors:ERR_INTERNAL_SERVER',
          'Failed to run daily milestones.',
        ),
      });
    }
  };

  const handleTriggerMonthly = async () => {
    try {
      const res = await triggerMonthlyMutation.mutateAsync();
      addToast({
        type: 'success',
        title: t(
          'activities:reminders.triggerMonthlyButton',
          'Trigger Monthly Digest',
        ),
        message: t('activities:reminders.monthlyDigestSuccess', {
          townsProcessed: res.townsProcessed,
          defaultValue: `Monthly activities digest dispatched across ${res.townsProcessed} hubs.`,
        }),
      });
    } catch {
      addToast({
        type: 'error',
        title: t('common:error', 'Error'),
        message: t(
          'errors:ERR_INTERNAL_SERVER',
          'Failed to dispatch monthly digest.',
        ),
      });
    }
  };

  const activeConfig = getActivityTypeConfig(selectedType, t);
  const ActiveIcon = activeConfig.icon;

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-150">
      {/* 1. Header Hero Card with Active Cron Status & Action Triggers */}
      <section className="bg-gradient-to-r from-white via-white to-[#faf2ee] rounded-lg border border-[#e8e1dd] p-5 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-[#fff2ee] border border-[#ffdbcf] flex items-center justify-center text-[#b85028] shadow-2xs shrink-0">
            <Bell size={24} weight="duotone" />
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-[#1e1b19] tracking-tight">
                {t(
                  'activities:reminders.tabTitle',
                  'Reminders & Guidelines Command Center',
                )}
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#edf3ee] border border-[#c2e9ca] text-[#486b52] text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#486b52] animate-pulse" />
                Active Cron Automation
              </span>
            </div>
            <p className="text-xs text-[#8a726a] max-w-2xl leading-relaxed mt-0.5">
              {t(
                'activities:reminders.tabSubtitle',
                'Milestone broadcast automation, preparation checklists, and leadership directives per activity type.',
              )}
            </p>
          </div>
        </div>

        {/* Quick Action Triggers for Leadership */}
        {isPrivileged && (
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={handleTriggerDaily}
              disabled={triggerDailyMutation.isPending}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-white hover:bg-[#faf2ee] text-[#57423b] border border-[#e8e1dd] hover:border-[#b85028]/40 rounded-md text-xs font-semibold shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <Lightning size={15} weight="fill" className="text-[#b85028]" />
              <span>
                {triggerDailyMutation.isPending
                  ? t('activities:reminders.runningCheck', 'Running...')
                  : t(
                      'activities:reminders.triggerDailyButton',
                      'Trigger Daily Milestones',
                    )}
              </span>
            </button>

            <button
              type="button"
              onClick={handleTriggerMonthly}
              disabled={triggerMonthlyMutation.isPending}
              className="inline-flex items-center gap-1.5 h-9 px-4 bg-[#b85028] hover:bg-[#a44520] text-white rounded-md text-xs font-semibold shadow-2xs active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
            >
              <PaperPlaneRight size={15} weight="bold" />
              <span>
                {triggerMonthlyMutation.isPending
                  ? t('common:loading', 'Sending...')
                  : t(
                      'activities:reminders.triggerMonthlyButton',
                      'Trigger Monthly Digest',
                    )}
              </span>
            </button>
          </div>
        )}
      </section>

      {/* 2. Upcoming Gatherings Preparation Status Monitor */}
      <section className="bg-white rounded-lg border border-[#e8e1dd] shadow-2xs overflow-hidden">
        <div className="p-4 bg-[#faf6f4] border-b border-[#f2ebe7] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ClockCountdown
              size={20}
              weight="duotone"
              className="text-[#b85028]"
            />
            <div className="flex flex-col">
              <h3 className="text-sm font-bold text-[#1e1b19]">
                {t(
                  'activities:reminders.activeUpcomingTitle',
                  'Upcoming Gatherings Preparation Status',
                )}
              </h3>
              <p className="text-[11px] text-[#8a726a]">
                {t(
                  'activities:reminders.activeUpcomingDesc',
                  'Review automated milestone dispatches and operational checklists for upcoming events in this hub',
                )}
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-[#8a726a] px-2.5 py-1 bg-white border border-[#e8e1dd] rounded-md">
            {upcomingActivities.length}{' '}
            {t('activities:table.activity', 'Scheduled Gatherings')}
          </span>
        </div>

        {isActivitiesLoading ? (
          <div className="p-8 text-center text-xs text-[#8a726a]">
            {t('common:loading', 'Loading activities...')}
          </div>
        ) : upcomingActivities.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-[#8a726a]">
            <CalendarCheck
              size={32}
              weight="light"
              className="text-[#8a726a]/50"
            />
            <p className="text-xs font-medium">
              {t(
                'activities:reminders.noUpcomingActivities',
                'No upcoming activities scheduled for this hub.',
              )}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#f2ebe7]">
            {upcomingActivities.slice(0, 5).map((activity) => {
              const typeCfg = getActivityTypeConfig(activity.activityType, t);
              const Icon = typeCfg.icon;

              const actDate = new Date(activity.startDate);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const daysDiff = Math.ceil(
                (actDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
              );

              const d14Sent = activity.remindersSent?.includes('2_WEEKS');
              const d7Sent = activity.remindersSent?.includes('1_WEEK');

              const monthLabel = actDate
                .toLocaleString('default', {
                  month: 'short',
                })
                .toUpperCase();
              const dayLabel = actDate.getDate();

              return (
                <div
                  key={activity.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#faf6f4]/60 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Compact Date Box */}
                    <div className="w-12 h-12 rounded-md bg-[#faf2ee] border border-[#e8e1dd] flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-[#b85028] leading-tight">
                        {monthLabel}
                      </span>
                      <span className="text-sm font-extrabold text-[#1e1b19] leading-tight">
                        {dayLabel}
                      </span>
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#1e1b19] truncate">
                          {activity.title}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${typeCfg.badgeBg} ${typeCfg.badgeBorder} ${typeCfg.badgeText}`}
                        >
                          <Icon size={12} weight="bold" />
                          <span>{typeCfg.label}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[#8a726a] mt-0.5">
                        <span>{formatActivityDate(activity.startDate)}</span>
                        {activity.town?.name && (
                          <>
                            <span>•</span>
                            <span className="truncate">
                              {activity.town.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                    {/* Countdown Badge */}
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                        daysDiff <= 7
                          ? 'bg-[#b85028]/10 text-[#b85028] border-[#b85028]/20'
                          : daysDiff <= 14
                            ? 'bg-[#d97706]/10 text-[#8d6e19] border-[#d97706]/20'
                            : 'bg-[#faf2ee] text-[#57423b] border-[#e8e1dd]'
                      }`}
                    >
                      {daysDiff === 0
                        ? t('activities:reminders.today', 'Today')
                        : daysDiff < 0
                          ? t('activities:reminders.overdue', 'Past Due')
                          : t('activities:reminders.daysRemaining', {
                              count: daysDiff,
                              defaultValue: `${daysDiff} days left`,
                            })}
                    </span>

                    {/* Milestone Badges */}
                    <div className="flex items-center gap-1.5">
                      <span
                        title="D-14 (2-Weeks Advance WhatsApp & In-App Notice)"
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          d14Sent
                            ? 'bg-[#edf3ee] text-[#486b52] border-[#c2e9ca]'
                            : 'bg-[#faf6f4] text-[#8a726a] border-[#e8e1dd]'
                        }`}
                      >
                        {d14Sent
                          ? t('activities:reminders.d14Pill', 'D-14 Sent')
                          : 'D-14 Pending'}
                      </span>

                      <span
                        title="D-7 (1-Week Final Checklist & WhatsApp Call)"
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          d7Sent
                            ? 'bg-[#edf3ee] text-[#486b52] border-[#c2e9ca]'
                            : 'bg-[#faf6f4] text-[#8a726a] border-[#e8e1dd]'
                        }`}
                      >
                        {d7Sent
                          ? t('activities:reminders.d7Pill', 'D-7 Sent')
                          : 'D-7 Pending'}
                      </span>
                    </div>

                    {/* Open Activity Preparation Tab Link */}
                    {onNavigateToActivity && (
                      <button
                        type="button"
                        onClick={() => onNavigateToActivity(activity.id)}
                        className="inline-flex items-center gap-1.5 h-8 px-3 bg-white hover:bg-[#faf2ee] text-[#57423b] hover:text-[#b85028] border border-[#e8e1dd] hover:border-[#b85028]/40 rounded-md text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                      >
                        <ListChecks size={15} weight="bold" />
                        <span className="hidden md:inline">
                          {t(
                            'activities:reminders.openChecklist',
                            'Checklist & Milestones',
                          )}
                        </span>
                        <ArrowRight size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. Guidelines & Standardized Preparation Checklist Template Editor */}
      <section className="bg-white rounded-lg border border-[#e8e1dd] shadow-2xs overflow-hidden flex flex-col">
        {/* Section Header */}
        <div className="p-4 bg-[#faf6f4] border-b border-[#f2ebe7] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ListChecks size={20} weight="duotone" className="text-[#b85028]" />
            <div className="flex flex-col">
              <h3 className="text-sm font-bold text-[#1e1b19]">
                {t(
                  'activities:reminders.templatesEditorTitle',
                  'Checklist & Guidelines Template Editor',
                )}
              </h3>
              <p className="text-[11px] text-[#8a726a]">
                {t(
                  'activities:reminders.templatesEditorDesc',
                  'Configure standardized operational checklists and leadership directives automatically attached to each activity type',
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Activity Type Switcher Ribbon */}
        <div className="p-2.5 border-b border-[#f2ebe7] bg-[#fdfbf9] overflow-x-auto flex items-center gap-1.5 scrollbar-thin">
          {ALL_ACTIVITY_TYPES.map((type) => {
            const config = getActivityTypeConfig(type, t);
            const Icon = config.icon;
            const isSelected = selectedType === type;

            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-[#b85028] text-white shadow-2xs'
                    : 'bg-white text-[#57423b] hover:bg-[#faf2ee] border border-[#e8e1dd]'
                }`}
              >
                <Icon size={14} weight={isSelected ? 'fill' : 'regular'} />
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>

        {/* Template Form Content */}
        <div className="p-5 flex flex-col gap-6">
          {/* Active Type Header Box */}
          <div
            className={`p-3.5 rounded-lg border flex items-center justify-between gap-4 ${activeConfig.badgeBg} ${activeConfig.badgeBorder}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-md bg-white flex items-center justify-center border shadow-2xs ${activeConfig.badgeBorder} ${activeConfig.badgeText}`}
              >
                <ActiveIcon size={20} weight="duotone" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#1e1b19]">
                  {activeConfig.label}
                </span>
                <span className="text-xs text-[#8a726a]">
                  {t(
                    'activities:reminders.leadershipGuidelinesNotice',
                    `Administrative guidance established by Apostles for ${activeConfig.label}`,
                    { type: activeConfig.label },
                  )}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1.5 h-8 px-3 bg-white hover:bg-[#faf2ee] text-[#b85028] border border-[#e8e1dd] hover:border-[#b85028]/40 rounded-md text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <Plus size={14} weight="bold" />
              <span>
                {t('activities:reminders.addItem', 'Add Checklist Item')}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Checklist Items */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#8a726a]">
                  {t(
                    'activities:reminders.checklistTitle',
                    'Preparation Checklist',
                  )}{' '}
                  ({items.length})
                </h4>
              </div>

              {items.length === 0 ? (
                <div className="p-8 border border-dashed border-[#e8e1dd] rounded-lg text-center flex flex-col items-center justify-center gap-2">
                  <ListChecks size={28} className="text-[#8a726a]/50" />
                  <p className="text-xs text-[#8a726a]">
                    No checklist items defined yet for this activity type.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-bold text-[#b85028] hover:underline cursor-pointer"
                  >
                    + Add first task
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3.5 rounded-lg border border-[#e8e1dd] bg-[#faf6f4]/50 flex flex-col gap-2.5 hover:border-[#b85028]/30 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="w-5 h-5 rounded-md bg-white border border-[#e8e1dd] flex items-center justify-center text-[10px] font-bold text-[#8a726a]">
                          {idx + 1}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateItem(
                                idx,
                                'isRequired',
                                !item.isRequired,
                              )
                            }
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold cursor-pointer transition-colors border ${
                              item.isRequired
                                ? 'bg-[#b85028]/10 text-[#b85028] border-[#b85028]/30'
                                : 'bg-white text-[#8a726a] border-[#e8e1dd]'
                            }`}
                          >
                            {item.isRequired
                              ? t(
                                  'activities:reminders.requiredBadge',
                                  'Required',
                                )
                              : t(
                                  'activities:reminders.optionalBadge',
                                  'Optional',
                                )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="w-7 h-7 rounded-md hover:bg-white text-[#8a726a] hover:text-[#b85028] flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <label className="flex flex-col gap-1 text-[10px] font-bold text-[#8a726a]">
                          <span>
                            {t(
                              'activities:reminders.itemLabelFr',
                              'French Label',
                            )}
                          </span>
                          <input
                            type="text"
                            value={item.labelFr || ''}
                            onChange={(e) =>
                              handleUpdateItem(idx, 'labelFr', e.target.value)
                            }
                            placeholder="ex: Réserver la salle et la sonorisation"
                            className="h-8 px-2.5 rounded-md border border-[#e8e1dd] bg-white text-xs text-[#1e1b19] font-normal focus:outline-none focus:border-[#b85028]"
                          />
                        </label>

                        <label className="flex flex-col gap-1 text-[10px] font-bold text-[#8a726a]">
                          <span>
                            {t(
                              'activities:reminders.itemLabelEn',
                              'English Label',
                            )}
                          </span>
                          <input
                            type="text"
                            value={item.labelEn || ''}
                            onChange={(e) =>
                              handleUpdateItem(idx, 'labelEn', e.target.value)
                            }
                            placeholder="ex: Confirm venue and sound equipment"
                            className="h-8 px-2.5 rounded-md border border-[#e8e1dd] bg-white text-xs text-[#1e1b19] font-normal focus:outline-none focus:border-[#b85028]"
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right 5 Cols: Leadership Directives */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#8a726a]">
                {t(
                  'activities:reminders.leadershipGuidelinesTitle',
                  'Leadership Directives & Instructions',
                )}
              </h4>

              <label className="flex flex-col gap-1.5 text-xs font-bold text-[#57423b]">
                <span>
                  {t(
                    'activities:reminders.instructionsFr',
                    'Directives Pastorales (Français)',
                  )}
                </span>
                <textarea
                  rows={4}
                  value={instructionsFr}
                  onChange={(e) => setInstructionsFr(e.target.value)}
                  placeholder="Instructions pastorales envoyées aux coordinateurs de centre..."
                  className="p-3 rounded-md border border-[#e8e1dd] bg-white text-xs text-[#1e1b19] font-normal focus:outline-none focus:border-[#b85028] resize-none leading-relaxed"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-xs font-bold text-[#57423b]">
                <span>
                  {t(
                    'activities:reminders.instructionsEn',
                    'Leadership Directives (English)',
                  )}
                </span>
                <textarea
                  rows={4}
                  value={instructionsEn}
                  onChange={(e) => setInstructionsEn(e.target.value)}
                  placeholder="Pastoral directives sent to town coordinators..."
                  className="p-3 rounded-md border border-[#e8e1dd] bg-white text-xs text-[#1e1b19] font-normal focus:outline-none focus:border-[#b85028] resize-none leading-relaxed"
                />
              </label>

              {/* Informational Alert Box */}
              <div className="p-3 rounded-md bg-[#faf2ee] border border-[#e8e1dd] text-[11px] text-[#57423b] flex items-start gap-2">
                <Sparkle
                  size={16}
                  weight="fill"
                  className="text-[#b85028] shrink-0 mt-0.5"
                />
                <span>
                  These checklist steps and directives are automatically bundled
                  into automated D-14 / D-7 WhatsApp broadcasts and
                  notifications dispatched to town coordinators.
                </span>
              </div>
            </div>
          </div>

          {/* Action Footer Bar */}
          <div className="pt-4 border-t border-[#f2ebe7] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={updateTemplateMutation.isPending}
              className="inline-flex items-center gap-2 h-9 px-5 bg-[#b85028] hover:bg-[#a44520] text-white rounded-md text-xs font-semibold shadow-2xs active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
            >
              <Check size={16} weight="bold" />
              <span>
                {updateTemplateMutation.isPending
                  ? t('activities:reminders.savingTemplate', 'Saving...')
                  : t('activities:reminders.saveTemplate', 'Save Guidelines')}
              </span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

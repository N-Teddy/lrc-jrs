import {
  useActivityReminderTemplateQuery,
  useToast,
  useTranslation,
  useTriggerDailyMilestonesMutation,
} from '@jrs/client-core';
import type { IActivity } from '@jrs/shared';
import {
  ArrowClockwise,
  Bell,
  Buildings,
  Check,
  CheckCircle,
  Clock,
  FileText,
  Lightning,
  ListChecks,
  PencilSimple,
  Sparkle,
  Warning,
  WarningCircle,
} from '@phosphor-icons/react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  formatActivityDate,
  getActivityTypeConfig,
} from '../utils/activity-ui.utils';

interface ActivityPreparationTabProps {
  activity: IActivity;
  isPrivileged: boolean;
  onOpenTemplatesModal?: () => void;
}

export const ActivityPreparationTab: React.FC<ActivityPreparationTabProps> = ({
  activity,
  isPrivileged,
  onOpenTemplatesModal,
}) => {
  const { t, i18n } = useTranslation(['activities', 'common', 'errors']);
  const currentLang = i18n.language?.startsWith('fr') ? 'fr' : 'en';
  const { addToast } = useToast();

  const typeConfig = getActivityTypeConfig(activity.activityType, t);

  // Template Query for this Activity Type
  const { data: template, isLoading: isTemplateLoading } =
    useActivityReminderTemplateQuery(activity.activityType);

  // Milestone Trigger Mutation
  const triggerMilestonesMutation = useTriggerDailyMilestonesMutation();

  // Local Storage checklist completion persistence per activity instance
  const storageKey = `lrc_activity_checklist_${activity.id}`;
  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(completedIds));
    } catch {
      // ignore storage quota errors
    }
  }, [completedIds, storageKey]);

  const toggleItem = (itemId: string) => {
    setCompletedIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  const handleResetChecklist = () => {
    setCompletedIds([]);
  };

  // Milestone Calculations
  const now = new Date();
  const startDate = new Date(activity.startDate);
  const endDate = new Date(activity.endDate);

  const d14Date = new Date(startDate.getTime() - 14 * 24 * 60 * 60 * 1000);
  const d7Date = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);

  const remindersSent = activity.remindersSent || [];
  const is14Sent = remindersSent.includes('2_WEEKS');
  const is7Sent = remindersSent.includes('1_WEEK');
  const isReportWarningSent = remindersSent.includes('REPORT_UPLOAD_WARNING');
  const hasReport = Boolean(
    activity.report?.fileId ||
      (activity.reports && activity.reports.length > 0),
  );

  // Checklist Calculations
  const items = template?.items || [];
  const completedCount = items.filter((item) =>
    completedIds.includes(item.id),
  ).length;
  const totalCount = items.length;
  const percentComplete =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const requiredItems = useMemo(
    () => items.filter((i) => i.isRequired),
    [items],
  );
  const completedRequiredCount = requiredItems.filter((i) =>
    completedIds.includes(i.id),
  ).length;
  const allRequiredDone =
    requiredItems.length > 0 && completedRequiredCount === requiredItems.length;

  const customInstructions =
    currentLang === 'en'
      ? template?.customInstructionsEn || template?.customInstructionsFr
      : template?.customInstructionsFr || template?.customInstructionsEn;

  const handleRunMilestoneCheck = async () => {
    try {
      const res = await triggerMilestonesMutation.mutateAsync();
      addToast({
        type: 'success',
        title: t('activities:reminders.runMilestoneCheck', 'Milestone Check'),
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
          'Failed to trigger milestone check.',
        ),
      });
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* 1. Header & Milestone Status Timeline Card */}
      <div className="bg-white rounded-lg border border-[#e8e1dd] shadow-2xs p-5 md:p-6 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f2ebe7] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] flex items-center justify-center text-[#b85028] shadow-2xs">
              <Bell size={22} weight="duotone" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-base font-bold text-[#1e1b19]">
                {t(
                  'activities:reminders.milestonesTitle',
                  'Automated Milestones & Notification Timeline',
                )}
              </h2>
              <p className="text-xs text-[#8a726a]">
                {t(
                  'activities:reminders.milestonesDesc',
                  'WhatsApp and in-app automated broadcasts dispatched to town coordinators and participating hubs',
                )}
              </p>
            </div>
          </div>

          {/* Leadership Quick Trigger Action */}
          {isPrivileged && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {onOpenTemplatesModal && (
                <button
                  type="button"
                  onClick={onOpenTemplatesModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e8e1dd] hover:border-[#b85028]/40 bg-[#faf2ee] hover:bg-white text-[#57423b] hover:text-[#b85028] text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  <PencilSimple size={14} weight="bold" />
                  <span>
                    {t(
                      'activities:reminders.customizeTemplate',
                      'Edit Guidelines',
                    )}
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={handleRunMilestoneCheck}
                disabled={triggerMilestonesMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#b85028] hover:bg-[#a04522] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                title={t(
                  'activities:reminders.runMilestoneCheck',
                  'Run Milestone Check',
                )}
              >
                {triggerMilestonesMutation.isPending ? (
                  <ArrowClockwise
                    size={14}
                    weight="bold"
                    className="animate-spin"
                  />
                ) : (
                  <Lightning size={14} weight="fill" />
                )}
                <span>
                  {triggerMilestonesMutation.isPending
                    ? t('activities:reminders.runningCheck', 'Running check...')
                    : t(
                        'activities:reminders.runMilestoneCheck',
                        'Run Milestone Check',
                      )}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Milestone Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step 1: D-14 Milestone */}
          <div
            className={`p-4 rounded-lg border flex flex-col justify-between gap-3 transition-all ${
              is14Sent
                ? 'bg-[#f4f8f5] border-[#c2e9ca]'
                : now >= d14Date && now < startDate
                  ? 'bg-[#fffaf7] border-[#ffd8cb]'
                  : 'bg-[#faf8f7] border-[#e8e1dd]'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    is14Sent
                      ? 'bg-[#486b52] text-white'
                      : 'bg-[#e8e1dd] text-[#57423b]'
                  }`}
                >
                  {is14Sent ? <Check size={14} weight="bold" /> : '14d'}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-[#1e1b19]">
                    {t(
                      'activities:reminders.d14Title',
                      '14-Day Advance Notice (D-14)',
                    )}
                  </span>
                  <span className="text-[11px] text-[#8a726a]">
                    {formatActivityDate(d14Date)}
                  </span>
                </div>
              </div>

              {is14Sent ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#edf3ee] text-[#486b52] border border-[#c2e9ca]">
                  <CheckCircle size={11} weight="fill" />
                  <span>
                    {t('activities:reminders.sentBadge', 'Dispatched')}
                  </span>
                </span>
              ) : now >= d14Date && now < startDate ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fff0eb] text-[#b85028] border border-[#ffd8cb]">
                  <WarningCircle size={11} weight="fill" />
                  <span>{t('activities:reminders.overdueBadge', 'Due')}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white text-[#8a726a] border border-[#e8e1dd]">
                  <Clock size={11} weight="bold" />
                  <span>
                    {t('activities:reminders.pendingBadge', 'Upcoming')}
                  </span>
                </span>
              )}
            </div>

            <p className="text-[11px] text-[#57423b] leading-relaxed">
              {t(
                'activities:reminders.d14Desc',
                'Dispatches WhatsApp checklist to host coordinator & notification to participating hubs',
              )}
            </p>
          </div>

          {/* Step 2: D-7 Milestone */}
          <div
            className={`p-4 rounded-lg border flex flex-col justify-between gap-3 transition-all ${
              is7Sent
                ? 'bg-[#f4f8f5] border-[#c2e9ca]'
                : now >= d7Date && now < startDate
                  ? 'bg-[#fffaf7] border-[#ffd8cb]'
                  : 'bg-[#faf8f7] border-[#e8e1dd]'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    is7Sent
                      ? 'bg-[#486b52] text-white'
                      : 'bg-[#e8e1dd] text-[#57423b]'
                  }`}
                >
                  {is7Sent ? <Check size={14} weight="bold" /> : '7d'}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-[#1e1b19]">
                    {t(
                      'activities:reminders.d7Title',
                      '7-Day Final Call (D-7)',
                    )}
                  </span>
                  <span className="text-[11px] text-[#8a726a]">
                    {formatActivityDate(d7Date)}
                  </span>
                </div>
              </div>

              {is7Sent ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#edf3ee] text-[#486b52] border border-[#c2e9ca]">
                  <CheckCircle size={11} weight="fill" />
                  <span>
                    {t('activities:reminders.sentBadge', 'Dispatched')}
                  </span>
                </span>
              ) : now >= d7Date && now < startDate ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fff0eb] text-[#b85028] border border-[#ffd8cb]">
                  <WarningCircle size={11} weight="fill" />
                  <span>{t('activities:reminders.overdueBadge', 'Due')}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white text-[#8a726a] border border-[#e8e1dd]">
                  <Clock size={11} weight="bold" />
                  <span>
                    {t('activities:reminders.pendingBadge', 'Upcoming')}
                  </span>
                </span>
              )}
            </div>

            <p className="text-[11px] text-[#57423b] leading-relaxed">
              {t(
                'activities:reminders.d7Desc',
                'Sends final preparation verification checklist & logistical check',
              )}
            </p>
          </div>

          {/* Step 3: Post-Activity Report Follow-up */}
          <div
            className={`p-4 rounded-lg border flex flex-col justify-between gap-3 transition-all ${
              hasReport
                ? 'bg-[#f4f8f5] border-[#c2e9ca]'
                : isReportWarningSent
                  ? 'bg-[#fff5f5] border-[#ffd8cb]'
                  : 'bg-[#faf8f7] border-[#e8e1dd]'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    hasReport
                      ? 'bg-[#486b52] text-white'
                      : isReportWarningSent
                        ? 'bg-[#ba1a1a] text-white'
                        : 'bg-[#e8e1dd] text-[#57423b]'
                  }`}
                >
                  <FileText size={14} weight="bold" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-[#1e1b19]">
                    {t(
                      'activities:reminders.reportWarningTitle',
                      'Post-Activity Report Warning',
                    )}
                  </span>
                  <span className="text-[11px] text-[#8a726a]">
                    {formatActivityDate(endDate)}
                  </span>
                </div>
              </div>

              {hasReport ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#edf3ee] text-[#486b52] border border-[#c2e9ca]">
                  <CheckCircle size={11} weight="fill" />
                  <span>
                    {t(
                      'activities:reminders.reportFiledBadge',
                      'Report Uploaded',
                    )}
                  </span>
                </span>
              ) : isReportWarningSent ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fff0eb] text-[#ba1a1a] border border-[#ffd8cb]">
                  <Warning size={11} weight="fill" />
                  <span>
                    {t(
                      'activities:reminders.warningSentBadge',
                      'Warning Dispatched',
                    )}
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white text-[#8a726a] border border-[#e8e1dd]">
                  <Clock size={11} weight="bold" />
                  <span>
                    {t('activities:reminders.pendingBadge', 'Pending')}
                  </span>
                </span>
              )}
            </div>

            <p className="text-[11px] text-[#57423b] leading-relaxed">
              {t(
                'activities:reminders.reportWarningDesc',
                'Notifies coordinators if an activity report has not been filed within 30 days',
              )}
            </p>
          </div>
        </div>

        {/* Participating Hubs Inter-Town Notice */}
        {(activity.includedTownIds?.length ?? 0) > 0 && (
          <div className="p-3.5 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white border border-[#e8e1dd] flex items-center justify-center text-[#b85028] shrink-0">
                <Buildings size={16} weight="bold" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#1e1b19]">
                  {t(
                    'activities:reminders.interTownTitle',
                    'Inter-Hub Broadcast List',
                  )}
                </span>
                <span className="text-[11px] text-[#8a726a]">
                  {t(
                    'activities:reminders.interTownDesc',
                    'Participating town coordinators who receive synchronized activity alerts',
                  )}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {activity.includedTowns && activity.includedTowns.length > 0 ? (
                activity.includedTowns.map((town) => (
                  <span
                    key={town.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-[#e8e1dd] text-xs font-semibold text-[#57423b]"
                  >
                    <Buildings
                      size={12}
                      weight="duotone"
                      className="text-[#b85028]"
                    />
                    <span>{town.name}</span>
                  </span>
                ))
              ) : (
                <span className="text-xs text-[#8a726a] font-medium">
                  {activity.includedTownIds?.length} hubs participating
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Interactive Preparation Checklist Card */}
      <div className="bg-white rounded-lg border border-[#e8e1dd] shadow-2xs p-5 md:p-6 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f2ebe7] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#edf3ee] border border-[#c2e9ca] flex items-center justify-center text-[#486b52] shadow-2xs">
              <ListChecks size={22} weight="bold" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#1e1b19]">
                  {t(
                    'activities:reminders.checklistTitle',
                    'Preparation Checklist',
                  )}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#faf2ee] text-[#b85028] border border-[#e8e1dd]">
                  {typeConfig.label}
                </span>
              </div>
              <p className="text-xs text-[#8a726a]">
                {t('activities:reminders.checklistDesc', {
                  type: typeConfig.label,
                  defaultValue: `Standard operational steps recommended for this ${typeConfig.label} gathering`,
                })}
              </p>
            </div>
          </div>

          {/* Progress Pill & Reset */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-[#1e1b19]">
                {t('activities:reminders.completedCount', {
                  completed: completedCount,
                  total: totalCount,
                  defaultValue: `${completedCount} of ${totalCount} completed`,
                })}
              </span>
              <span className="text-[10px] text-[#8a726a]">
                {allRequiredDone ? (
                  <span className="text-[#486b52] font-semibold flex items-center gap-1">
                    <CheckCircle size={11} weight="fill" />
                    {t(
                      'activities:reminders.allRequiredDone',
                      'All required preparation tasks completed!',
                    )}
                  </span>
                ) : (
                  <span>
                    {t('activities:reminders.requiredRemaining', {
                      count: requiredItems.length - completedRequiredCount,
                      defaultValue: `${requiredItems.length - completedRequiredCount} required tasks remaining`,
                    })}
                  </span>
                )}
              </span>
            </div>

            {completedCount > 0 && (
              <button
                type="button"
                onClick={handleResetChecklist}
                className="p-1.5 rounded-md hover:bg-[#faf2ee] text-[#8a726a] hover:text-[#ba1a1a] transition-colors cursor-pointer"
                title={t(
                  'activities:reminders.resetChecklist',
                  'Reset Progress',
                )}
              >
                <ArrowClockwise size={14} weight="bold" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#f2ebe7] rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              allRequiredDone ? 'bg-[#486b52]' : 'bg-[#b85028]'
            }`}
            style={{ width: `${percentComplete}%` }}
          />
        </div>

        {/* Checklist Items List */}
        {isTemplateLoading ? (
          <div className="py-8 flex items-center justify-center">
            <ArrowClockwise
              size={20}
              weight="bold"
              className="animate-spin text-[#8a726a]"
            />
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#8a726a]">
            {t(
              'activities:reminders.noCustomInstructions',
              'Standard preparation protocol applies. No special leadership directives set.',
            )}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-[#f2ebe7]">
            {items.map((item, index) => {
              const isChecked = completedIds.includes(item.id);
              const label =
                currentLang === 'en'
                  ? item.labelEn || item.labelFr
                  : item.labelFr || item.labelEn;

              return (
                <div
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`py-3.5 px-3 rounded-lg flex items-start gap-3.5 cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-[#f8fbf9]/60 hover:bg-[#f8fbf9]'
                      : 'hover:bg-[#faf2ee]/40'
                  }`}
                >
                  {/* Checkbox Box */}
                  <div
                    aria-hidden="true"
                    className={`w-5 h-5 rounded-md mt-0.5 flex items-center justify-center shrink-0 transition-all border ${
                      isChecked
                        ? 'bg-[#486b52] border-[#486b52] text-white'
                        : 'bg-white border-[#d8ccc6] hover:border-[#b85028]'
                    }`}
                  >
                    {isChecked && <Check size={12} weight="bold" />}
                  </div>

                  {/* Task Content */}
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <span
                      className={`text-xs select-none transition-all ${
                        isChecked
                          ? 'line-through text-[#8a726a]'
                          : 'text-[#1e1b19] font-medium'
                      }`}
                    >
                      <span className="font-bold text-[#b85028] mr-2">
                        {index + 1}.
                      </span>
                      {label}
                    </span>

                    {item.isRequired ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#fff0eb] text-[#b85028] border border-[#ffd8cb] shrink-0 self-start sm:self-auto">
                        {t('activities:reminders.requiredBadge', 'Required')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#f2ebe7] text-[#8a726a] border border-[#e8e1dd] shrink-0 self-start sm:self-auto">
                        {t('activities:reminders.optionalBadge', 'Optional')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 3. Leadership Directives / Custom Instructions Alert Box */}
        {customInstructions && (
          <div className="p-4 rounded-lg bg-[#fffaf5] border border-[#f3dfcf] flex items-start gap-3 mt-1 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-[#b85028]/10 text-[#b85028] flex items-center justify-center shrink-0 mt-0.5">
              <Sparkle size={18} weight="fill" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-[#1e1b19]">
                {t(
                  'activities:reminders.leadershipGuidelinesTitle',
                  'Leadership Guidelines & Directives',
                )}
              </span>
              <p className="text-xs text-[#57423b] leading-relaxed italic">
                "{customInstructions}"
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import {
  useActivityReminderTemplatesQuery,
  useToast,
  useTranslation,
  useTriggerDailyMilestonesMutation,
  useTriggerMonthlyDigestMutation,
  useUpdateActivityReminderTemplateMutation,
} from '@jrs/client-core';
import { ActivityType, type IChecklistItem } from '@jrs/shared';
import {
  ArrowClockwise,
  Bell,
  Check,
  Lightning,
  PaperPlaneRight,
  Plus,
  Sparkle,
  Trash,
  X,
} from '@phosphor-icons/react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { getActivityTypeConfig } from '../utils/activity-ui.utils';

interface ActivityReminderTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: ActivityType;
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

export const ActivityReminderTemplatesModal: React.FC<
  ActivityReminderTemplatesModalProps
> = ({ isOpen, onClose, initialType = ActivityType.MONTHLY_MEETING }) => {
  const { t } = useTranslation();
  const { addToast } = useToast();

  const [selectedType, setSelectedType] = useState<ActivityType>(initialType);

  // Queries & Mutations
  const { data: allTemplates } = useActivityReminderTemplatesQuery();
  const updateTemplateMutation = useUpdateActivityReminderTemplateMutation();
  const triggerDailyMutation = useTriggerDailyMilestonesMutation();
  const triggerMonthlyMutation = useTriggerMonthlyDigestMutation();

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

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl border border-[#e8e1dd] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#f2ebe7] flex items-center justify-between gap-4 bg-[#faf6f4]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#e8e1dd] flex items-center justify-center text-[#b85028] shadow-2xs shrink-0">
              <Bell size={22} weight="duotone" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-base font-bold text-[#1e1b19]">
                {t(
                  'activities:reminders.modalTitle',
                  'Activity Reminder Guidelines & Templates',
                )}
              </h2>
              <p className="text-xs text-[#8a726a]">
                {t(
                  'activities:reminders.modalSubtitle',
                  'Manage standardized preparation checklists and leadership directives for each activity type',
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white text-[#8a726a] hover:text-[#1e1b19] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Activity Type Selector Tabs */}
        <div className="p-3 border-b border-[#f2ebe7] bg-white overflow-x-auto flex items-center gap-1.5 scrollbar-thin">
          {ALL_ACTIVITY_TYPES.map((type) => {
            const config = getActivityTypeConfig(type, t);
            const Icon = config.icon;
            const isSelected = selectedType === type;

            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-[#b85028] text-white shadow-xs'
                    : 'bg-[#faf2ee] text-[#57423b] hover:bg-[#f2ebe7] border border-[#e8e1dd]'
                }`}
              >
                <Icon size={14} weight="bold" />
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 flex flex-col gap-6">
          {/* Section 1: Checklist Items */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 border-b border-[#f2ebe7] pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#1e1b19] uppercase tracking-wider">
                  {t(
                    'activities:reminders.checklistTitle',
                    'Preparation Checklist',
                  )}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#faf2ee] text-[#b85028] border border-[#e8e1dd]">
                  {items.length} {items.length === 1 ? 'task' : 'tasks'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#edf3ee] hover:bg-[#e1ece2] text-[#486b52] border border-[#c2e9ca] text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus size={13} weight="bold" />
                <span>
                  {t('activities:reminders.addItem', 'Add Checklist Item')}
                </span>
              </button>
            </div>

            {items.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#8a726a] bg-[#faf8f7] rounded-lg border border-dashed border-[#e8e1dd]">
                No checklist steps defined for this activity type yet.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {items.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3 rounded-lg border border-[#e8e1dd] bg-[#faf8f7] flex flex-col sm:flex-row items-start sm:items-center gap-3 transition-colors"
                  >
                    <span className="w-6 h-6 rounded-md bg-white border border-[#e8e1dd] text-[#b85028] font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>

                    {/* Inputs for FR and EN */}
                    <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="flex flex-col gap-0.5">
                        <label
                          htmlFor={`modal-item-fr-${item.id || idx}`}
                          className="text-[10px] font-bold text-[#8a726a] uppercase"
                        >
                          FR
                        </label>
                        <input
                          id={`modal-item-fr-${item.id || idx}`}
                          type="text"
                          value={item.labelFr}
                          onChange={(e) =>
                            handleUpdateItem(idx, 'labelFr', e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 rounded-md border border-[#e8e1dd] bg-white text-xs text-[#1e1b19] focus:outline-none focus:border-[#b85028]"
                          placeholder="Intitulé de la tâche (Français)"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label
                          htmlFor={`modal-item-en-${item.id || idx}`}
                          className="text-[10px] font-bold text-[#8a726a] uppercase"
                        >
                          EN
                        </label>
                        <input
                          id={`modal-item-en-${item.id || idx}`}
                          type="text"
                          value={item.labelEn}
                          onChange={(e) =>
                            handleUpdateItem(idx, 'labelEn', e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 rounded-md border border-[#e8e1dd] bg-white text-xs text-[#1e1b19] focus:outline-none focus:border-[#b85028]"
                          placeholder="Task label (English)"
                        />
                      </div>
                    </div>

                    {/* Required Toggle & Delete */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateItem(idx, 'isRequired', !item.isRequired)
                        }
                        className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                          item.isRequired
                            ? 'bg-[#fff0eb] text-[#b85028] border-[#ffd8cb]'
                            : 'bg-white text-[#8a726a] border-[#e8e1dd]'
                        }`}
                      >
                        {item.isRequired
                          ? t('activities:reminders.requiredBadge', 'Required')
                          : t('activities:reminders.optionalBadge', 'Optional')}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 rounded-md hover:bg-[#fff0eb] text-[#8a726a] hover:text-[#ba1a1a] transition-colors cursor-pointer"
                        title="Delete Step"
                      >
                        <Trash size={15} weight="bold" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Leadership Custom Directives */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-[#f2ebe7] pb-2">
              <Sparkle size={16} weight="fill" className="text-[#b85028]" />
              <span className="text-xs font-bold text-[#1e1b19] uppercase tracking-wider">
                {t(
                  'activities:reminders.leadershipGuidelinesTitle',
                  'Leadership Guidelines & Directives',
                )}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="modal-instructions-fr"
                  className="text-xs font-bold text-[#57423b]"
                >
                  {t(
                    'activities:reminders.instructionsFr',
                    'Directives de Direction (Français)',
                  )}
                </label>
                <textarea
                  id="modal-instructions-fr"
                  value={instructionsFr}
                  onChange={(e) => setInstructionsFr(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 rounded-lg border border-[#e8e1dd] bg-white text-xs text-[#1e1b19] focus:outline-none focus:border-[#b85028]"
                  placeholder="Conseils pastoraux, recommandations logistiques ou rappels aux responsables..."
                />
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="modal-instructions-en"
                  className="text-xs font-bold text-[#57423b]"
                >
                  {t(
                    'activities:reminders.instructionsEn',
                    'Leadership Guidelines (English)',
                  )}
                </label>
                <textarea
                  id="modal-instructions-en"
                  value={instructionsEn}
                  onChange={(e) => setInstructionsEn(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 rounded-lg border border-[#e8e1dd] bg-white text-xs text-[#1e1b19] focus:outline-none focus:border-[#b85028]"
                  placeholder="Pastoral advice, logistics reminders, or specific guidelines..."
                />
              </div>
            </div>
          </div>

          {/* Section 3: Manual Broadcast Controls */}
          <div className="p-4 rounded-xl bg-[#faf6f4] border border-[#e8e1dd] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-[#e8e1dd] flex items-center justify-center text-[#b85028] shadow-2xs shrink-0">
                <Lightning size={16} weight="fill" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#1e1b19]">
                  {t(
                    'activities:reminders.runMilestoneCheck',
                    'Run Milestone Check',
                  )}
                </span>
                <span className="text-[11px] text-[#8a726a]">
                  Test milestone cron jobs immediately to send pending WhatsApp
                  & in-app reminders
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleTriggerDaily}
                disabled={triggerDailyMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#faf2ee] border border-[#e8e1dd] hover:border-[#b85028]/40 text-xs font-bold text-[#57423b] hover:text-[#b85028] transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {triggerDailyMutation.isPending ? (
                  <ArrowClockwise
                    size={13}
                    weight="bold"
                    className="animate-spin"
                  />
                ) : (
                  <Bell size={13} weight="bold" />
                )}
                <span>
                  {t(
                    'activities:reminders.triggerDailyButton',
                    'Trigger Daily Milestones',
                  )}
                </span>
              </button>

              <button
                type="button"
                onClick={handleTriggerMonthly}
                disabled={triggerMonthlyMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#faf2ee] border border-[#e8e1dd] hover:border-[#b85028]/40 text-xs font-bold text-[#57423b] hover:text-[#b85028] transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {triggerMonthlyMutation.isPending ? (
                  <ArrowClockwise
                    size={13}
                    weight="bold"
                    className="animate-spin"
                  />
                ) : (
                  <PaperPlaneRight size={13} weight="bold" />
                )}
                <span>
                  {t(
                    'activities:reminders.triggerMonthlyButton',
                    'Trigger Monthly Digest',
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#f2ebe7] bg-white flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#e8e1dd] hover:bg-[#faf2ee] text-xs font-bold text-[#57423b] transition-colors cursor-pointer"
          >
            {t('common:cancel', 'Cancel')}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={updateTemplateMutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#b85028] hover:bg-[#a04522] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {updateTemplateMutation.isPending ? (
              <ArrowClockwise
                size={14}
                weight="bold"
                className="animate-spin"
              />
            ) : (
              <Check size={14} weight="bold" />
            )}
            <span>
              {updateTemplateMutation.isPending
                ? t('activities:reminders.savingTemplate', 'Saving...')
                : t('activities:reminders.saveTemplate', 'Save Guidelines')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

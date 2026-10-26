import { useTranslation } from '@jrs/client-core';
import {
  ActivityStatus,
  ActivityType,
  type IActivity,
  type ITown,
} from '@jrs/shared';
import {
  CalendarBlank,
  CalendarPlus,
  Clock,
  Info,
  MapPin,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  CustomSelect,
  DateTimePicker,
  type SelectOption,
} from '../../../components';

interface ActivityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialActivity?: IActivity | null;
  towns: ITown[];
  activeTownId?: string;
  onSubmit: (data: {
    title: string;
    activityType: ActivityType;
    startDate: string;
    endDate?: string;
    townId: string;
    notes?: string;
    status?: ActivityStatus;
    changeReason?: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

// Convert ISO string to format suitable for DateTimePicker: YYYY-MM-DDTHH:mm
function toDateTimeLocalString(isoString?: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}

export const ActivityFormModal: React.FC<ActivityFormModalProps> = ({
  isOpen,
  onClose,
  initialActivity,
  towns,
  activeTownId,
  onSubmit,
  isSubmitting,
}) => {
  const { t } = useTranslation();
  const isEditing = Boolean(initialActivity);
  const isCompleted = initialActivity?.status === ActivityStatus.COMPLETED;

  const [title, setTitle] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>(
    ActivityType.MONTHLY_MEETING,
  );
  const [townId, setTownId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Auto-determine activity status based on date/time schedule
  const computedStatus = useMemo<ActivityStatus>(() => {
    if (!startDate) return ActivityStatus.SCHEDULED;
    const now = new Date();
    const s = new Date(startDate);
    const e = endDate ? new Date(endDate) : s;
    if (now < s) return ActivityStatus.SCHEDULED;
    if (now >= s && now <= e) return ActivityStatus.IN_PROGRESS;
    return ActivityStatus.COMPLETED;
  }, [startDate, endDate]);

  // Populate or reset form fields
  useEffect(() => {
    if (initialActivity) {
      setTitle(initialActivity.title || '');
      setActivityType(
        initialActivity.activityType || ActivityType.MONTHLY_MEETING,
      );
      setTownId(initialActivity.townId || activeTownId || '');
      setStartDate(toDateTimeLocalString(initialActivity.startDate));
      setEndDate(toDateTimeLocalString(initialActivity.endDate));
      setNotes(initialActivity.notes || '');
      setChangeReason('');
    } else {
      setTitle('');
      setActivityType(ActivityType.MONTHLY_MEETING);
      setTownId(activeTownId || (towns[0]?.id ?? ''));
      // Default to today at 09:00
      const now = new Date();
      now.setHours(9, 0, 0, 0);
      setStartDate(toDateTimeLocalString(now.toISOString()));
      const later = new Date(now);
      later.setHours(12, 0, 0, 0);
      setEndDate(toDateTimeLocalString(later.toISOString()));
      setNotes('');
      setChangeReason('');
    }
    setError(null);
  }, [initialActivity, activeTownId, towns]);

  const isDirty = useMemo(() => {
    if (!isEditing || !initialActivity) return true;
    if (title.trim() !== (initialActivity.title || '')) return true;
    if (activityType !== initialActivity.activityType) return true;
    if (townId !== (initialActivity.townId || '')) return true;
    if (startDate !== toDateTimeLocalString(initialActivity.startDate))
      return true;
    if (endDate !== toDateTimeLocalString(initialActivity.endDate)) return true;
    if (notes.trim() !== (initialActivity.notes || '')) return true;
    if (changeReason.trim() !== '') return true;
    return false;
  }, [
    isEditing,
    initialActivity,
    title,
    activityType,
    townId,
    startDate,
    endDate,
    notes,
    changeReason,
  ]);

  const activityTypeOptions: SelectOption<ActivityType>[] = [
    {
      value: ActivityType.MONTHLY_MEETING,
      label: t('activities:types.MONTHLY_MEETING'),
    },
    {
      value: ActivityType.SERVICE,
      label: t('activities:types.SERVICE'),
    },
    {
      value: ActivityType.CONFERENCE,
      label: t('activities:types.CONFERENCE'),
    },
    {
      value: ActivityType.RECREATIONAL,
      label: t('activities:types.RECREATIONAL'),
    },
    {
      value: ActivityType.CAUSERIE,
      label: t('activities:types.CAUSERIE'),
    },
    {
      value: ActivityType.JPO,
      label: t('activities:types.JPO'),
    },
    {
      value: ActivityType.AG,
      label: t('activities:types.AG'),
    },
  ];

  const townOptions: SelectOption<string>[] = towns.map((t) => ({
    value: t.id,
    label: `${t.name} (${t.code})`,
  }));

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isCompleted) {
      setError('Completed activities cannot be modified.');
      return;
    }

    if (!title.trim()) {
      setError('Activity title is required.');
      return;
    }

    if (!townId) {
      setError('Please select a fellowship town.');
      return;
    }

    if (!startDate) {
      setError('Start date and time are required.');
      return;
    }

    const startIso = new Date(startDate).toISOString();
    const endIso = endDate ? new Date(endDate).toISOString() : undefined;

    if (endIso && new Date(endIso) < new Date(startIso)) {
      setError('End date/time cannot be before start date/time.');
      return;
    }

    if (isEditing && !changeReason.trim()) {
      setError(
        'Please provide a documented reason for this update or reschedule.',
      );
      return;
    }

    try {
      await onSubmit({
        title: title.trim(),
        activityType,
        townId,
        startDate: startIso,
        endDate: endIso,
        notes: notes.trim() || undefined,
        status: computedStatus,
        changeReason: isEditing ? changeReason.trim() : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save activity. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#23201e]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-xl border border-[#e8e1dd] shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 flex items-start justify-between border-b border-[#f4ece9] bg-[#faf8f6]/50">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#fff2ee] border border-[#ffdbcf] flex items-center justify-center text-[#b85028] shrink-0 shadow-xs">
              <CalendarPlus size={22} weight="duotone" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#1e1b19]">
                  {isEditing
                    ? t('activities:editActivity')
                    : t('activities:createActivity')}
                </h2>
                {isEditing && (
                  <span className="px-2 py-0.5 rounded-full bg-[#faf2ee] border border-[#e8e1dd] text-[10px] font-mono font-bold text-[#8a726a]">
                    #{initialActivity?.id.slice(-6).toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8a726a]">
                {isEditing
                  ? 'Update gathering details, schedule, or notes'
                  : 'Define meeting details, hub, and schedule for fellowship members'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-md bg-[#faf2ee] text-[#8a726a] hover:text-[#1e1b19] hover:bg-[#f4ece9] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto p-7 flex flex-col gap-6 text-xs text-[#1e1b19]"
        >
          {isCompleted && (
            <div className="p-3.5 bg-[#ffdad6] border border-[#ffb4a8] rounded-xl text-[#ba1a1a] flex items-center gap-2.5 font-semibold">
              <WarningCircle size={20} weight="fill" className="shrink-0" />
              <span>
                This activity has already taken place and is marked as
                Completed. Completed activities cannot be modified.
              </span>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-[#ffdad6] border border-[#ffb4a8] rounded-lg text-[#ba1a1a] flex items-center gap-2 font-semibold">
              <WarningCircle size={18} weight="fill" className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Activity Core Details */}
          <div className="flex flex-col gap-4">
            {/* Title */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="activity-title-input"
                  className="font-bold text-[#1e1b19]"
                >
                  Activity Title <span className="text-[#b85028]">*</span>
                </label>
                <span className="text-[11px] text-[#8a726a]">
                  {title.length} / 80 characters
                </span>
              </div>
              <input
                id="activity-title-input"
                type="text"
                maxLength={80}
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Monthly Fellowship & Youth Choir Rehearsal"
                className="w-full h-10 px-3.5 bg-[#faf2ee] focus:bg-white text-xs text-[#1e1b19] rounded-md border border-[#e8e1dd] focus:border-[#b85028] outline-none transition-all font-medium"
              />
            </div>

            {/* Category & Town Hub (2 Columns Layout) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="activity-category"
                  className="font-bold text-[#1e1b19]"
                >
                  Official Activity Category{' '}
                  <span className="text-[#b85028]">*</span>
                </label>
                <CustomSelect<ActivityType>
                  id="activity-category"
                  value={activityType}
                  onChange={setActivityType}
                  options={activityTypeOptions}
                  variant="form"
                  size="md"
                  className="w-full"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="activity-town"
                  className="font-bold text-[#1e1b19] flex items-center gap-1.5"
                >
                  <MapPin size={14} weight="fill" className="text-[#486b52]" />
                  <span>Fellowship Town Hub</span>
                  <span className="text-[#b85028]">*</span>
                </label>
                <CustomSelect<string>
                  id="activity-town"
                  value={townId}
                  onChange={setTownId}
                  options={townOptions}
                  variant="form"
                  size="md"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* SECTION: Schedule & Timing */}
          <div className="flex flex-col gap-3 pt-3 border-t border-[#f4ece9]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#b85028]" />
              <span className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
                Schedule & Timing
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="activity-start-date"
                  className="font-bold text-[#1e1b19] flex items-center gap-1.5 text-xs"
                >
                  <CalendarBlank
                    size={14}
                    weight="bold"
                    className="text-[#b85028]"
                  />
                  <span>Start Date & Time</span>
                  <span className="text-[#b85028]">*</span>
                </label>
                <DateTimePicker
                  id="activity-start-date"
                  value={startDate}
                  onChange={setStartDate}
                  placeholder="Select start date & time"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="activity-end-date"
                  className="font-bold text-[#1e1b19] flex items-center gap-1.5 text-xs"
                >
                  <Clock size={14} weight="bold" className="text-[#8a726a]" />
                  <span>End Date & Time</span>
                  <span className="text-[#8a726a] font-normal">(Optional)</span>
                </label>
                <DateTimePicker
                  id="activity-end-date"
                  value={endDate}
                  onChange={setEndDate}
                  placeholder="Select end date & time"
                />
              </div>
            </div>

            {/* Auto-Determined Status Badge */}
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#faf2ee] border border-[#e8e1dd] text-xs">
              <div className="flex items-center gap-2">
                <Clock size={16} weight="bold" className="text-[#b85028]" />
                <span className="text-[#57423b] font-medium">
                  Status (Auto-calculated by schedule):
                </span>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  computedStatus === ActivityStatus.SCHEDULED
                    ? 'bg-[#e2f0d9] text-[#276a3c] border-[#b6deb2]'
                    : computedStatus === ActivityStatus.IN_PROGRESS
                      ? 'bg-[#ffeed9] text-[#934c00] border-[#ffd099]'
                      : 'bg-[#faf2ee] text-[#57423b] border-[#e8e1dd]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    computedStatus === ActivityStatus.SCHEDULED
                      ? 'bg-[#276a3c]'
                      : computedStatus === ActivityStatus.IN_PROGRESS
                        ? 'bg-[#934c00] animate-pulse'
                        : 'bg-[#57423b]'
                  }`}
                />
                <span>{t(`activities:statuses.${computedStatus}`)}</span>
              </span>
            </div>
          </div>

          {/* SECTION: Program Notes & Notes */}
          <div className="flex flex-col gap-3 pt-3 border-t border-[#f4ece9]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#b85028]" />
              <span className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
                Transfer Notes & Directives
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="activity-notes-input"
                className="font-bold text-[#1e1b19]"
              >
                Notes & Agenda{' '}
                <span className="text-[#8a726a] font-normal">(Optional)</span>
              </label>
              <textarea
                id="activity-notes-input"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Meeting reflections, choir rehearsal agenda, items to bring..."
                className="w-full p-3.5 rounded-md bg-[#faf2ee] focus:bg-white text-xs border border-[#e8e1dd] focus:border-[#b85028] outline-none transition-all font-medium resize-none"
              />
            </div>
          </div>

          {/* SECTION: Audit & Revision Reason (Required if Editing) */}
          {isEditing && (
            <div className="flex flex-col gap-2 p-4 bg-[#faf2ee] rounded-xl border border-[#e8e1dd]">
              <label
                htmlFor="activity-change-reason-input"
                className="flex items-center gap-1.5 text-xs font-bold text-[#b85028]"
              >
                <Info size={16} weight="bold" />
                <span>Documented Change Reason (Audit Log) *</span>
              </label>
              <p className="text-[11px] text-[#8a726a]">
                Required by Inter-Hub audit standards. State why the dates,
                status, or scope were altered.
              </p>
              <input
                id="activity-change-reason-input"
                type="text"
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                placeholder="e.g. Rescheduled due to diocesan retreat."
                className="w-full h-10 px-3.5 rounded-md bg-white border border-[#e8e1dd] focus:border-[#b85028] text-xs outline-none transition-all font-medium mt-1"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#f4ece9]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-md border border-[#e8e1dd] text-xs font-bold text-[#57423b] hover:bg-[#faf2ee] transition-colors cursor-pointer"
            >
              {t('common:cancel')}
            </button>

            <button
              type="submit"
              disabled={isSubmitting || isCompleted || (isEditing && !isDirty)}
              title={
                isCompleted
                  ? 'Completed activities cannot be modified'
                  : isEditing && !isDirty
                    ? 'No changes detected'
                    : undefined
              }
              className="px-5 py-2 rounded-md bg-[#b85028] hover:bg-[#a44520] text-white font-bold text-xs shadow-xs active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <span>
                  {isEditing ? 'Save & Reschedule' : 'Schedule Activity'}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

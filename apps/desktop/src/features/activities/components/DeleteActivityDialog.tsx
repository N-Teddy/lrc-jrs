import { useTranslation } from '@jrs/client-core';
import type { IActivity } from '@jrs/shared';
import { CalendarBlank, Trash, Warning, X } from '@phosphor-icons/react';
import type React from 'react';

interface DeleteActivityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activity: IActivity | null;
  onConfirmDelete: (id: string) => Promise<void>;
  isDeleting: boolean;
}

export const DeleteActivityDialog: React.FC<DeleteActivityDialogProps> = ({
  isOpen,
  onClose,
  activity,
  onConfirmDelete,
  isDeleting,
}) => {
  const { t } = useTranslation();

  if (!isOpen || !activity) return null;

  const handleDelete = async () => {
    await onConfirmDelete(activity.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#23201e]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md my-auto bg-white rounded-xl border border-[#e8e1dd] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 flex items-start justify-between border-b border-[#f4ece9] bg-[#faf8f6]/50 rounded-t-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#ffdad6] border border-[#ffb4a8] text-[#ba1a1a] flex items-center justify-center shrink-0 shadow-xs">
              <Warning size={22} weight="fill" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-base font-bold text-[#1e1b19]">
                {t('activities:deleteConfirmTitle')}
              </h3>
              <p className="text-xs text-[#8a726a]">
                {t(
                  'activities:deleteSubtext',
                  'Permanent removal of activity record',
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-md bg-[#faf2ee] hover:bg-[#f4ece9] flex items-center justify-center text-[#8a726a] hover:text-[#1e1b19] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4">
          <p className="text-xs text-[#57423b] leading-relaxed">
            {t('activities:deleteConfirmMessage')}
          </p>

          {/* Activity Info Card */}
          <div className="p-3.5 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] flex flex-col gap-1.5">
            <span className="font-bold text-xs text-[#1e1b19]">
              {activity.title}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-[#8a726a]">
              <CalendarBlank
                size={14}
                weight="bold"
                className="text-[#b85028]"
              />
              <span>
                {new Date(activity.startDate).toLocaleDateString(undefined, {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#faf2ee] border-t border-[#e8e1dd] flex items-center justify-end gap-2.5 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-md bg-white border border-[#e8e1dd] text-xs font-bold text-[#57423b] hover:bg-[#f4ece9] transition-colors cursor-pointer"
          >
            {t('common:cancel')}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 rounded-md bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold shadow-xs active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            {isDeleting ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Trash size={15} weight="bold" />
            )}
            <span>{t('activities:deleteActivity', 'Delete Activity')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import { useTownContext, useTranslation } from '@jrs/client-core';
import { ActivityStatus, type IActivity } from '@jrs/shared';
import {
  ClockCounterClockwise,
  DotsThreeVertical,
  Eye,
  PencilSimple,
  Trash,
} from '@phosphor-icons/react';
import type React from 'react';

export interface ActivityActionMenuProps {
  activity: IActivity;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onViewDetails: (activity: IActivity) => void;
  onEditActivity: (activity: IActivity) => void;
  onViewHistory: (activity: IActivity) => void;
  onDeleteActivity?: (activity: IActivity) => void;
  isPrivileged: boolean;
  align?: 'right' | 'left';
  openUpwards?: boolean;
}

export const ActivityActionMenu: React.FC<ActivityActionMenuProps> = ({
  activity,
  isOpen,
  onToggle,
  onClose,
  onViewDetails,
  onEditActivity,
  onViewHistory,
  onDeleteActivity,
  isPrivileged,
  align = 'right',
  openUpwards = false,
}) => {
  const { t } = useTranslation();
  const { canWrite } = useTownContext();
  const historyCount = activity.changeHistory?.length || 0;
  const isCompleted = activity.status === ActivityStatus.COMPLETED;

  return (
    <div className="relative inline-flex items-center justify-end shrink-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-6 h-6 rounded-md hover:bg-[#faf2ee] text-[#8a726a] hover:text-[#1e1b19] flex items-center justify-center transition-colors cursor-pointer"
        aria-label="Activity Actions"
      >
        <DotsThreeVertical size={16} weight="bold" />
      </button>

      {isOpen && (
        <div
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} ${
            openUpwards ? 'bottom-full mb-1.5' : 'top-full mt-1'
          } w-44 bg-white rounded-xl border border-[#e8e1dd] shadow-xl py-1 z-40 flex flex-col animate-in fade-in zoom-in-95 duration-100`}
          onMouseLeave={onClose}
        >
          {/* Activity Details Action */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onViewDetails(activity);
            }}
            className="w-full px-3 py-1.5 text-left text-xs text-[#1e1b19] hover:bg-[#faf2ee] flex items-center gap-2 font-medium cursor-pointer"
          >
            <Eye size={14} weight="bold" className="text-[#b85028]" />
            <span>{t('activities:card.details', 'Details')}</span>
          </button>

          {canWrite && !isCompleted && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEditActivity(activity);
              }}
              className="w-full px-3 py-1.5 text-left text-xs text-[#1e1b19] hover:bg-[#faf2ee] flex items-center gap-2 font-medium cursor-pointer"
            >
              <PencilSimple size={14} weight="bold" />
              <span>{t('activities:card.edit')} / Reschedule</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onClose();
              onViewHistory(activity);
            }}
            className="w-full px-3 py-1.5 text-left text-xs text-[#1e1b19] hover:bg-[#faf2ee] flex items-center gap-2 font-medium cursor-pointer"
          >
            <ClockCounterClockwise size={14} weight="bold" />
            <span>
              {t('activities:card.viewHistory', {
                count: historyCount,
              })}
            </span>
          </button>

          {canWrite && isPrivileged && onDeleteActivity && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onDeleteActivity(activity);
              }}
              className="w-full px-3 py-1.5 text-left text-xs text-[#ba1a1a] hover:bg-[#ffdad6] flex items-center gap-2 font-semibold cursor-pointer border-t border-[#f4ece9] mt-0.5"
            >
              <Trash size={14} weight="bold" />
              <span>{t('activities:actions.delete')}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

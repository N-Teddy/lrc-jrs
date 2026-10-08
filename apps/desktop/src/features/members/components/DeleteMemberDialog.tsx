import { useTranslation } from '@jrs/client-core';
import type { IUser } from '@jrs/shared';
import { Trash } from '@phosphor-icons/react';
import type React from 'react';

interface DeleteMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  member: IUser | null;
  onConfirmDelete: (id: string) => Promise<void>;
  isDeleting: boolean;
}

export const DeleteMemberDialog: React.FC<DeleteMemberDialogProps> = ({
  isOpen,
  onClose,
  member,
  onConfirmDelete,
  isDeleting,
}) => {
  const { t } = useTranslation();

  if (!isOpen || !member) return null;

  const handleConfirm = async () => {
    await onConfirmDelete(member.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#23201e]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-[440px] my-auto bg-white rounded-3xl border border-[#e8e1dd] shadow-2xl flex flex-col overflow-hidden">
        <div className="p-6 flex flex-col gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#ffdad6] border border-[#ffb4a8] flex items-center justify-center text-[#ba1a1a]">
            <Trash size={24} weight="duotone" />
          </div>

          <div>
            <h3 className="text-base font-bold text-[#1e1b19]">
              {t('members:table.deactivateMember')} {member.fullName}
            </h3>
            <p className="text-xs text-[#57423b] mt-1.5 leading-relaxed">
              {t('members:accessModal.deactivateConfirmation', {
                name: member.fullName,
              })}
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#f4ece9]">
            <button
              type="button"
              disabled={isDeleting}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#e8e1dd] text-xs font-bold text-[#57423b] hover:bg-[#faf2ee] transition-colors cursor-pointer"
            >
              {t('common:cancel')}
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleConfirm}
              className="px-5 py-2.5 bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-xl text-xs font-bold shadow-xs active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              <Trash size={16} weight="bold" />
              <span>
                {isDeleting ? 'Deactivating...' : t('common:confirm')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

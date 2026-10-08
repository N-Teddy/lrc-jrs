import { useTranslation } from '@jrs/client-core';
import type { IUpdateMemberAccessDto, IUser } from '@jrs/shared';
import {
  CheckCircle,
  Key,
  LockKey,
  PaperPlaneTilt,
  Prohibit,
  Warning,
  X,
} from '@phosphor-icons/react';
import type React from 'react';
import { useState } from 'react';
import { formatCameroonPhone } from '../utils/member-ui.utils';

interface ManageAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: IUser | null;
  onUpdateAccess: (id: string, dto: IUpdateMemberAccessDto) => Promise<any>;
}

export const ManageAccessModal: React.FC<ManageAccessModalProps> = ({
  isOpen,
  onClose,
  member,
  onUpdateAccess,
}) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !member) return null;

  const hasAppAccess = member.account?.hasAppAccess ?? false;
  const isRevoked = member.account?.isAccessRevoked ?? false;
  const isActive = hasAppAccess && !isRevoked;

  const handleResendCredentials = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await onUpdateAccess(member.id, { resendInvite: true });
      setSuccessMsg(t('members:accessModal.resendSuccess'));
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to resend credentials.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const nextRevoked = !isRevoked;
      await onUpdateAccess(member.id, {
        isAccessRevoked: nextRevoked,
      });
      setSuccessMsg(
        nextRevoked
          ? 'Account access has been suspended.'
          : 'Account successfully reactivated.',
      );
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to toggle account access.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#23201e]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-[500px] my-auto bg-white rounded-3xl border border-[#e8e1dd] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 flex items-start justify-between border-b border-[#f4ece9]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#fff2ee] border border-[#ffdbcf] flex items-center justify-center text-[#b85028] shrink-0">
              <Key size={24} weight="duotone" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-base font-bold text-[#1e1b19]">
                {t('members:accessModal.title')}
              </h2>
              <p className="text-xs text-[#8a726a]">
                {t('members:accessModal.subtitle', { name: member.fullName })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#faf2ee] hover:bg-[#f4ece9] flex items-center justify-center text-[#8a726a] hover:text-[#1e1b19] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col gap-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-[#ffdad6] border border-[#ffb4a8] text-[#ba1a1a] text-xs font-semibold flex items-center gap-2">
              <Warning size={18} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-[#c2e9ca] border border-[#a9d0b2] text-[#2c4e37] text-xs font-semibold flex items-center gap-2">
              <CheckCircle size={18} weight="fill" className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Account Status Card */}
          <div className="p-4 rounded-2xl bg-[#faf2ee] border border-[#e8e1dd] flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#e8e1dd]">
              <span className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
                Account Status
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  isActive
                    ? 'bg-[#c2e9ca] text-[#2c4e37]'
                    : 'bg-[#ffdad6] text-[#ba1a1a]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isActive ? 'bg-[#486b52]' : 'bg-[#ba1a1a]'
                  }`}
                />
                {isActive
                  ? 'Active'
                  : isRevoked
                    ? 'Suspended'
                    : 'No App Access'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#8a726a] text-[11px] block">
                  Login Identifier (Phone)
                </span>
                <span className="font-mono font-bold text-[#1e1b19]">
                  {formatCameroonPhone(member.phoneNumber)}
                </span>
              </div>
              <div>
                <span className="text-[#8a726a] text-[11px] block">
                  Registered Email
                </span>
                <span className="font-medium text-[#1e1b19] truncate block">
                  {member.email || 'None'}
                </span>
              </div>
            </div>
          </div>

          {/* Action 1: Resend Temporary Password */}
          <div className="p-4 rounded-2xl bg-white border border-[#e8e1dd] flex flex-col gap-3 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#faf2ee] border border-[#e8e1dd] flex items-center justify-center text-[#b85028] shrink-0">
                <LockKey size={20} weight="duotone" />
              </div>
              <div className="flex flex-col">
                <h4 className="text-xs font-bold text-[#1e1b19]">
                  {t('members:accessModal.resendTempPassword')}
                </h4>
                <p className="text-[11px] text-[#57423b] mt-0.5 leading-relaxed">
                  {t('members:accessModal.resendDesc')}
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleResendCredentials}
              className="w-full py-2.5 px-4 rounded-xl bg-[#b85028] hover:bg-[#a44520] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <PaperPlaneTilt size={16} weight="bold" />
              <span>
                {isSubmitting
                  ? t('members:accessModal.resending')
                  : t('members:accessModal.resendAction')}
              </span>
            </button>
          </div>

          {/* Action 2: Suspend / Reactivate */}
          <div className="p-4 rounded-2xl bg-white border border-[#e8e1dd] flex flex-col gap-3 shadow-2xs">
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                  !isRevoked
                    ? 'bg-[#ffdad6] text-[#ba1a1a] border-[#ffb4a8]'
                    : 'bg-[#c2e9ca] text-[#2c4e37] border-[#a9d0b2]'
                }`}
              >
                <Prohibit size={20} weight="bold" />
              </div>
              <div className="flex flex-col">
                <h4 className="text-xs font-bold text-[#1e1b19]">
                  {t('members:accessModal.suspendTitle')}
                </h4>
                <p className="text-[11px] text-[#57423b] mt-0.5 leading-relaxed">
                  {t('members:accessModal.suspendDesc')}
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleToggleActive}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border ${
                !isRevoked
                  ? 'bg-white hover:bg-[#ffdad6] text-[#ba1a1a] border-[#ffb4a8]'
                  : 'bg-[#486b52] hover:bg-[#3d5b45] text-white border-[#486b52]'
              }`}
            >
              <span>
                {!isRevoked
                  ? t('members:accessModal.suspendAction')
                  : t('members:accessModal.reactivateAction')}
              </span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#faf2ee] border-t border-[#e8e1dd] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-[#e8e1dd] text-xs font-bold text-[#57423b] hover:bg-[#f4ece9] transition-colors cursor-pointer"
          >
            {t('common:close')}
          </button>
        </div>
      </div>
    </div>
  );
};

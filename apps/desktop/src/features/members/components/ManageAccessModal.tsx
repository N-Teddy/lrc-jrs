import { useTranslation } from '@jrs/client-core';
import type { IUpdateMemberAccessDto, IUser } from '@jrs/shared';
import {
  ChatCircleText,
  CheckCircle,
  EnvelopeSimple,
  Key,
  LockKey,
  PaperPlaneTilt,
  Prohibit,
  Warning,
  X,
} from '@phosphor-icons/react';
import React, { useEffect, useState } from 'react';
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
  const { t } = useTranslation(['members', 'access', 'common']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [inviteChannel, setInviteChannel] = useState<'whatsapp' | 'email'>(
    'email',
  );

  // Update default channel when member changes
  useEffect(() => {
    if (member) {
      setInviteChannel(member.isWhatsappVerified ? 'whatsapp' : 'email');
    }
  }, [member]);

  if (!isOpen || !member) return null;

  const hasAppAccess = member.account?.hasAppAccess ?? false;
  const isRevoked = member.account?.isAccessRevoked ?? false;
  const isActive = hasAppAccess && !isRevoked;
  const isTemporaryPassword = member.isTemporaryPassword ?? false;

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

  const handleInviteToApp = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await onUpdateAccess(member.id, {
        hasAppAccess: true,
        channel: inviteChannel,
      });
      setSuccessMsg('Invitation sent successfully.');
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to send invitation.',
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
      <div className="relative w-full max-w-[560px] my-auto bg-white rounded-xl border border-[#e8e1dd] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 flex items-start justify-between border-b border-[#f4ece9]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-[#fff2ee] border border-[#ffdbcf] flex items-center justify-center text-[#b85028] shrink-0">
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
            className="w-8 h-8 rounded-md bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd] flex items-center justify-center text-[#8a726a] hover:text-[#1e1b19] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col gap-4">
          {errorMsg && (
            <div className="p-3.5 rounded-lg bg-[#ffdad6] border border-[#ffb4a8] text-[#ba1a1a] text-xs font-semibold flex items-center gap-2">
              <Warning size={18} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-lg bg-[#c2e9ca] border border-[#a9d0b2] text-[#2c4e37] text-xs font-semibold flex items-center gap-2">
              <CheckCircle size={18} weight="fill" className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Account Status Card */}
          <div className="p-4 rounded-xl bg-[#faf2ee] border border-[#e8e1dd] flex flex-col gap-3">
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

          {!hasAppAccess ? (
            <div className="p-4 rounded-xl bg-white border border-[#e8e1dd] flex flex-col gap-3 shadow-2xs">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] flex items-center justify-center text-[#b85028] shrink-0">
                  <PaperPlaneTilt size={20} weight="duotone" />
                </div>
                <div className="flex flex-col">
                  <h4 className="text-xs font-bold text-[#1e1b19]">
                    Invite to App
                  </h4>
                  <p className="text-[11px] text-[#57423b] mt-0.5 leading-relaxed">
                    Grant this member access to the application and send them
                    login credentials.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() =>
                    member.isWhatsappVerified && setInviteChannel('whatsapp')
                  }
                  disabled={!member.isWhatsappVerified}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all border ${
                    inviteChannel === 'whatsapp'
                      ? 'bg-[#c2e9ca] text-[#2c4e37] border-[#a9d0b2]'
                      : 'bg-[#faf2ee] text-[#8a726a] border-[#e8e1dd] opacity-60'
                  }`}
                >
                  <ChatCircleText size={16} weight="fill" />
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => member.email && setInviteChannel('email')}
                  disabled={!member.email}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all border ${
                    inviteChannel === 'email'
                      ? 'bg-[#fff2ee] text-[#b85028] border-[#ffdbcf]'
                      : 'bg-[#faf2ee] text-[#8a726a] border-[#e8e1dd] opacity-60'
                  }`}
                >
                  <EnvelopeSimple size={16} weight="fill" />
                  Email
                </button>
              </div>

              <button
                type="button"
                disabled={
                  isSubmitting || (!member.isWhatsappVerified && !member.email)
                }
                onClick={handleInviteToApp}
                className="w-full mt-2 py-2 px-4 rounded-md bg-[#b85028] hover:bg-[#a44520] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <PaperPlaneTilt size={16} weight="bold" />
                <span>{isSubmitting ? 'Sending...' : 'Send Invitation'}</span>
              </button>
            </div>
          ) : (
            <>
              {/* Action 1: Resend Temporary Password (Only if temp password is still active) */}
              {isTemporaryPassword && (
                <div className="p-4 rounded-xl bg-white border border-[#e8e1dd] flex flex-col gap-3 shadow-2xs">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] flex items-center justify-center text-[#b85028] shrink-0">
                      <LockKey size={20} weight="duotone" />
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-xs font-bold text-[#1e1b19]">
                        {t(
                          'members:accessModal.resendTempPassword',
                          'Generate & Resend Temporary Password',
                        )}
                      </h4>
                      <p className="text-[11px] text-[#57423b] mt-0.5 leading-relaxed">
                        {t(
                          'members:accessModal.resendDesc',
                          "Generates a fresh single-use password valid for 48 hours and sends it immediately to the member's WhatsApp and Email address.",
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleResendCredentials}
                    className="w-full py-2 px-4 rounded-md bg-[#b85028] hover:bg-[#a44520] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <PaperPlaneTilt size={16} weight="bold" />
                    <span>
                      {isSubmitting
                        ? t(
                            'members:accessModal.resending',
                            'Dispatching credentials...',
                          )
                        : t(
                            'members:accessModal.resendAction',
                            'Resend Temporary Password',
                          )}
                    </span>
                  </button>
                </div>
              )}

              {/* Action 2: Suspend / Reactivate */}
              <div className="p-4 rounded-xl bg-white border border-[#e8e1dd] flex flex-col gap-3 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                      !isRevoked
                        ? 'bg-[#ffdad6] text-[#ba1a1a] border-[#ffb4a8]'
                        : 'bg-[#c2e9ca] text-[#2c4e37] border-[#a9d0b2]'
                    }`}
                  >
                    <Prohibit size={20} weight="bold" />
                  </div>
                  <div className="flex flex-col">
                    <h4 className="text-xs font-bold text-[#1e1b19]">
                      {t(
                        'members:accessModal.suspendTitle',
                        'Account Suspension & Status',
                      )}
                    </h4>
                    <p className="text-[11px] text-[#57423b] mt-0.5 leading-relaxed">
                      {t(
                        'members:accessModal.suspendDesc',
                        'Temporarily lock portal access without deleting the registry profile.',
                      )}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleToggleActive}
                  className={`w-full py-2 px-4 rounded-md text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border ${
                    !isRevoked
                      ? 'bg-white hover:bg-[#ffdad6] text-[#ba1a1a] border-[#ffb4a8]'
                      : 'bg-[#486b52] hover:bg-[#3d5b45] text-white border-[#486b52]'
                  }`}
                >
                  <span>
                    {!isRevoked
                      ? t('members:accessModal.suspendAction', 'Suspend Access')
                      : t(
                          'members:accessModal.reactivateAction',
                          'Reactivate Access',
                        )}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#faf2ee] border-t border-[#e8e1dd] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-white border border-[#e8e1dd] text-xs font-bold text-[#57423b] hover:bg-[#f4ece9] transition-colors cursor-pointer"
          >
            {t('common:close', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
};

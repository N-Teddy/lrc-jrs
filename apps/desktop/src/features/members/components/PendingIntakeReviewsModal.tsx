import {
  usePendingReviewsQuery,
  useReviewMemberMutation,
  useTownContext,
  useTranslation,
} from '@jrs/client-core';
import { calculateAge, type IUser } from '@jrs/shared';
import {
  Calendar,
  CheckCircle,
  Clock,
  PencilSimple,
  Phone,
  ShieldCheck,
  Warning,
  X,
  XCircle,
} from '@phosphor-icons/react';
import type React from 'react';
import { useState } from 'react';
import { UserAvatar } from '../../../components';
import { formatCameroonPhone } from '../utils/member-ui.utils';
import { EditApproveIntakeModal } from './EditApproveIntakeModal';

interface PendingIntakeReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTownId?: string;
  activeTownName: string;
}

export const PendingIntakeReviewsModal: React.FC<
  PendingIntakeReviewsModalProps
> = ({ isOpen, onClose, activeTownId, activeTownName }) => {
  const { t } = useTranslation();
  const { availableTowns = [] } = useTownContext();

  // Action State
  const [approvingMember, setApprovingMember] = useState<IUser | null>(null);
  const [rejectingMember, setRejectingMember] = useState<IUser | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Queries & Mutations
  const { data: pendingMembers = [], isLoading } =
    usePendingReviewsQuery(activeTownId);
  const reviewMutation = useReviewMemberMutation();

  if (!isOpen) return null;

  const handleStartApprove = (member: IUser) => {
    setApprovingMember(member);
    setRejectingMember(null);
    setActionError(null);
  };

  const handleConfirmApproval = async (editedData: {
    fullName: string;
    townId: string;
    phoneNumber: string;
    email?: string;
    gender: 'MALE' | 'FEMALE';
    dateOfBirth: string;
    grantAppAccess: boolean;
    reviewNotes?: string;
  }) => {
    if (!approvingMember) return;
    setActionError(null);

    try {
      await reviewMutation.mutateAsync({
        memberId: approvingMember.id,
        dto: {
          action: 'APPROVE',
          fullName: editedData.fullName.trim() || undefined,
          phoneNumber: editedData.phoneNumber.trim() || undefined,
          email: editedData.email?.trim() || undefined,
          homeTownId: editedData.townId || undefined,
          gender: editedData.gender,
          dateOfBirth: editedData.dateOfBirth || undefined,
          grantAppAccess: editedData.grantAppAccess,
          notes: editedData.reviewNotes?.trim()
            ? editedData.reviewNotes.trim()
            : undefined,
        },
      });

      setApprovingMember(null);
    } catch (err: any) {
      throw new Error(
        err?.message ||
          t('members:intake.approveError', 'Failed to approve candidate.'),
      );
    }
  };

  const handleConfirmRejection = async () => {
    if (!rejectingMember) return;
    setActionError(null);

    try {
      await reviewMutation.mutateAsync({
        memberId: rejectingMember.id,
        dto: {
          action: 'REJECT',
          notes: reviewNotes.trim() ? reviewNotes.trim() : undefined,
        },
      });

      setRejectingMember(null);
      setReviewNotes('');
    } catch (err: any) {
      setActionError(
        err?.message ||
          t('members:intake.rejectError', 'Failed to reject submission.'),
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-[760px] my-auto bg-white rounded-xl border border-[#e8e1dd] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="p-6 pb-4 flex items-start justify-between border-b border-[#f4ece9] bg-gradient-to-r from-white via-white to-[#faf2ee]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-[#fff2ee] border border-[#ffdbcf] flex items-center justify-center text-[#b85028] shrink-0 shadow-2xs">
              <ShieldCheck size={24} weight="duotone" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#1e1b19]">
                  {t('members:intake.modalTitle', 'Review Intake Submissions')}
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#faf2ee] text-[#b85028] border border-[#e8e1dd]">
                  {t('members:intake.pendingCount', {
                    count: pendingMembers.length,
                    defaultValue: `${pendingMembers.length} Pending`,
                  })}
                </span>
              </div>
              <p className="text-xs text-[#8a726a]">
                {t('members:intake.modalSubtitle', {
                  town: activeTownName,
                  defaultValue: `Applicants who entered their details via invitation link for ${activeTownName}. Review & approve before accepting into the directory.`,
                })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd] flex items-center justify-center text-[#8a726a] hover:text-[#1e1b19] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          {actionError && (
            <div className="p-3.5 rounded-lg bg-[#ffdad6] border border-[#ffb4a8] text-[#ba1a1a] text-xs font-semibold flex items-center gap-2">
              <Warning size={18} className="shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-12 text-center text-xs text-[#8a726a] flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-[#b85028]/30 border-t-[#b85028] rounded-full animate-spin" />
              <span>
                {t(
                  'members:intake.checking',
                  'Checking pending submissions...',
                )}
              </span>
            </div>
          ) : pendingMembers.length === 0 ? (
            <div className="py-14 text-center text-xs text-[#8a726a] flex flex-col items-center gap-3 border border-dashed border-[#e8e1dd] rounded-xl p-8 bg-[#fdfcfb]">
              <div className="w-12 h-12 rounded-full bg-[#c2e9ca]/40 text-[#2c4e37] flex items-center justify-center">
                <CheckCircle size={28} weight="fill" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#1e1b19]">
                  {t(
                    'members:intake.allCaughtUpTitle',
                    'No Submissions Pending Review',
                  )}
                </p>
                <p className="text-[#8a726a] max-w-sm">
                  {t('members:intake.allCaughtUpDesc', {
                    town: activeTownName,
                    defaultValue: `All prospective members who registered through your intake invitation links for ${activeTownName} have been processed and admitted into the community directory.`,
                  })}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pendingMembers.map((member) => {
                const age = calculateAge(member.dateOfBirth);

                return (
                  <div
                    key={member.id}
                    className="p-4 rounded-xl border border-[#e8e1dd] bg-white shadow-2xs hover:border-[#b85028]/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    {/* Member Info */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      <UserAvatar
                        name={member.fullName}
                        avatarUrl={member.avatarUrl}
                        size="md"
                        className="shrink-0"
                      />
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-[#1e1b19]">
                            {member.fullName}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStartApprove(member)}
                            className="p-1 -ml-1 rounded text-[#8a726a] hover:text-[#2c4e37] hover:bg-[#eaf4ec] transition-colors cursor-pointer"
                            title={t(
                              'members:intake.editProfileTooltip',
                              'Edit candidate details before approving',
                            )}
                          >
                            <PencilSimple size={13} weight="bold" />
                          </button>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#fff2ee] text-[#b85028] border border-[#ffdbcf]">
                            {t(
                              'members:intake.pendingReview',
                              'Pending Review',
                            )}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#faf2ee] text-[#57423b]">
                            {member.gender === 'FEMALE'
                              ? t('members:intake.filterFemale', 'Female')
                              : t('members:intake.filterMale', 'Male')}{' '}
                            • {age} {t('members:intake.yearsOld', 'yrs')}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[#8a726a] flex-wrap">
                          <span className="flex items-center gap-1 font-mono text-[#57423b]">
                            <Phone size={13} />
                            {formatCameroonPhone(member.phoneNumber)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={13} />
                            {t('members:intake.dob', 'DOB:')}{' '}
                            {new Date(member.dateOfBirth).toLocaleDateString()}
                          </span>
                          {member.createdAt && (
                            <span className="flex items-center gap-1 text-[11px] text-[#8a726a]/80">
                              <Clock size={12} />
                              {t('members:intake.submitted', 'Submitted:')}{' '}
                              {new Date(member.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {member.intakeNote && (
                          <div className="mt-1 px-2.5 py-1 rounded bg-[#faf2ee] border border-[#e8e1dd] text-[11px] text-[#57423b]">
                            <strong>
                              {t('members:intake.applicantNote', 'Note:')}
                            </strong>{' '}
                            {member.intakeNote}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingMember(member);
                          setApprovingMember(null);
                          setReviewNotes('');
                        }}
                        className="px-3 py-1.5 rounded-md border border-[#ffb4a8] bg-white hover:bg-[#ffdad6] text-[#ba1a1a] text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <X size={14} weight="bold" />
                        <span>{t('members:intake.reject', 'Reject')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartApprove(member)}
                        className="px-3.5 py-1.5 rounded-md bg-[#2c4e37] hover:bg-[#223d2b] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <PencilSimple size={14} weight="bold" />
                        <span>
                          {t('members:intake.editAndApprove', 'Edit & Approve')}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* REJECTION CONFIRMATION DRAWER */}
          {rejectingMember && (
            <div className="mt-2 p-4 rounded-xl bg-[#ffdad6]/40 border border-[#ffb4a8] flex flex-col gap-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#ba1a1a] flex items-center gap-1.5">
                  <XCircle size={16} weight="fill" />
                  {t('members:intake.rejectHeader', {
                    name: rejectingMember.fullName,
                    defaultValue: `Reject Submission for "${rejectingMember.fullName}"`,
                  })}
                </span>
                <button
                  type="button"
                  onClick={() => setRejectingMember(null)}
                  className="text-[#8a726a] hover:text-[#1e1b19] cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <input
                type="text"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={t(
                  'members:intake.rejectNotesPlaceholder',
                  'Reason for rejection (e.g. Invalid phone number, duplicate)',
                )}
                className="h-9 px-3 rounded-md bg-white border border-[#ffb4a8] text-xs text-[#1e1b19] outline-none"
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRejectingMember(null)}
                  className="px-3 py-1.5 rounded text-xs font-semibold text-[#8a726a] hover:bg-black/5 cursor-pointer"
                >
                  {t('members:intake.cancel', 'Cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRejection}
                  disabled={reviewMutation.isPending}
                  className="px-4 py-1.5 rounded bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {reviewMutation.isPending
                    ? t('members:intake.rejecting', 'Rejecting...')
                    : t('members:intake.confirmRejection', 'Confirm Rejection')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DEDICATED CREATIVE MODAL FOR CANDIDATE REVIEW & EDITING */}
      <EditApproveIntakeModal
        isOpen={Boolean(approvingMember)}
        candidate={approvingMember}
        availableTowns={availableTowns}
        isSubmitting={reviewMutation.isPending}
        onClose={() => setApprovingMember(null)}
        onConfirm={handleConfirmApproval}
      />
    </div>
  );
};

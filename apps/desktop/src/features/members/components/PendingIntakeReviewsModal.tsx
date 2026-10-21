import {
  usePendingReviewsQuery,
  useReviewMemberMutation,
} from '@jrs/client-core';
import { calculateAge, type IUser } from '@jrs/shared';
import {
  Calendar,
  Check,
  CheckCircle,
  Clock,
  Key,
  Phone,
  ShieldCheck,
  Warning,
  X,
  XCircle,
} from '@phosphor-icons/react';
import type React from 'react';
import { useState } from 'react';
import { UserAvatar } from '../../../components';

interface PendingIntakeReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTownId?: string;
  activeTownName: string;
}

export const PendingIntakeReviewsModal: React.FC<
  PendingIntakeReviewsModalProps
> = ({ isOpen, onClose, activeTownId, activeTownName }) => {
  // Selected member for approve / reject confirmation
  const [approvingMember, setApprovingMember] = useState<IUser | null>(null);
  const [rejectingMember, setRejectingMember] = useState<IUser | null>(null);

  // Approval Options
  const [grantAppAccess, setGrantAppAccess] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Queries & Mutations
  const { data: pendingMembers = [], isLoading } =
    usePendingReviewsQuery(activeTownId);
  const reviewMutation = useReviewMemberMutation();

  if (!isOpen) return null;

  const handleConfirmApproval = async () => {
    if (!approvingMember) return;
    setActionError(null);

    try {
      await reviewMutation.mutateAsync({
        memberId: approvingMember.id,
        dto: {
          action: 'APPROVE',
          grantAppAccess,
          notes: reviewNotes.trim() ? reviewNotes.trim() : undefined,
        },
      });

      setApprovingMember(null);
      setGrantAppAccess(false);
      setReviewNotes('');
    } catch (err: any) {
      setActionError(err?.message || 'Failed to approve member.');
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
      setActionError(err?.message || 'Failed to reject submission.');
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
                  Review Intake Submissions
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#faf2ee] text-[#b85028] border border-[#e8e1dd]">
                  {pendingMembers.length} Pending
                </span>
              </div>
              <p className="text-xs text-[#8a726a]">
                Applicants who entered their details via invitation link for{' '}
                {activeTownName}. Review & approve before accepting into the
                directory.
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
              <span>Checking pending submissions...</span>
            </div>
          ) : pendingMembers.length === 0 ? (
            <div className="py-14 text-center text-xs text-[#8a726a] flex flex-col items-center gap-3 border border-dashed border-[#e8e1dd] rounded-xl p-8 bg-[#fdfcfb]">
              <div className="w-12 h-12 rounded-full bg-[#c2e9ca]/40 text-[#2c4e37] flex items-center justify-center">
                <CheckCircle size={28} weight="fill" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#1e1b19]">
                  No Submissions Pending Review
                </p>
                <p className="text-[#8a726a] max-w-sm">
                  All prospective members who submitted through your intake
                  links have been processed.
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
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#fff2ee] text-[#b85028] border border-[#ffdbcf]">
                            Pending Review
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#faf2ee] text-[#57423b]">
                            {member.gender === 'FEMALE' ? 'Female' : 'Male'} •{' '}
                            {age} yrs
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[#8a726a] flex-wrap">
                          <span className="flex items-center gap-1 font-mono text-[#57423b]">
                            <Phone size={13} />
                            {member.phoneNumber}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={13} />
                            DOB:{' '}
                            {new Date(member.dateOfBirth).toLocaleDateString()}
                          </span>
                          {member.createdAt && (
                            <span className="flex items-center gap-1 text-[11px] text-[#8a726a]/80">
                              <Clock size={12} />
                              Submitted:{' '}
                              {new Date(member.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {member.intakeNote && (
                          <div className="mt-1 px-2.5 py-1 rounded bg-[#faf2ee] border border-[#e8e1dd] text-[11px] text-[#57423b]">
                            <strong>Note:</strong> {member.intakeNote}
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
                        <span>Reject</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setApprovingMember(member);
                          setRejectingMember(null);
                          setGrantAppAccess(false); // DEFAULT FALSE as requested
                          setReviewNotes('');
                        }}
                        className="px-3.5 py-1.5 rounded-md bg-[#2c4e37] hover:bg-[#223d2b] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Check size={14} weight="bold" />
                        <span>Approve</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* APPROVAL CONFIRMATION DRAWER / SUBPANEL */}
          {approvingMember && (
            <div className="mt-2 p-4 rounded-xl bg-[#c2e9ca]/20 border border-[#a9d0b2] flex flex-col gap-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#2c4e37] flex items-center gap-1.5">
                  <CheckCircle size={16} weight="fill" />
                  Approve "{approvingMember.fullName}" for Fellowship Directory
                </span>
                <button
                  type="button"
                  onClick={() => setApprovingMember(null)}
                  className="text-[#8a726a] hover:text-[#1e1b19] cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Security policy notice */}
              <div className="p-3 rounded-lg bg-white border border-[#a9d0b2] flex items-start gap-2.5 text-xs text-[#57423b]">
                <Key size={16} className="text-[#b85028] shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <label className="flex items-center gap-2 cursor-pointer font-bold select-none">
                    <input
                      type="checkbox"
                      checked={grantAppAccess}
                      onChange={(e) => setGrantAppAccess(e.target.checked)}
                      className="w-4 h-4 rounded text-[#b85028] accent-[#b85028]"
                    />
                    <span>Grant application access (Default: Unchecked)</span>
                  </label>
                  <p className="text-[11px] text-[#8a726a] leading-tight">
                    By default, members who register through intake links are
                    recorded in the directory only and cannot log into the JRS
                    app.
                  </p>
                </div>
              </div>

              <input
                type="text"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Optional verification note (e.g. Verified via WhatsApp)"
                className="h-9 px-3 rounded-md bg-white border border-[#a9d0b2] text-xs text-[#1e1b19] outline-none"
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setApprovingMember(null)}
                  className="px-3 py-1.5 rounded text-xs font-semibold text-[#8a726a] hover:bg-black/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApproval}
                  disabled={reviewMutation.isPending}
                  className="px-4 py-1.5 rounded bg-[#2c4e37] hover:bg-[#223d2b] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {reviewMutation.isPending
                    ? 'Approving...'
                    : 'Confirm Approval'}
                </button>
              </div>
            </div>
          )}

          {/* REJECTION CONFIRMATION DRAWER */}
          {rejectingMember && (
            <div className="mt-2 p-4 rounded-xl bg-[#ffdad6]/40 border border-[#ffb4a8] flex flex-col gap-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#ba1a1a] flex items-center gap-1.5">
                  <XCircle size={16} weight="fill" />
                  Reject Submission for "{rejectingMember.fullName}"
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
                placeholder="Reason for rejection (e.g. Invalid phone number, duplicate)"
                className="h-9 px-3 rounded-md bg-white border border-[#ffb4a8] text-xs text-[#1e1b19] outline-none"
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRejectingMember(null)}
                  className="px-3 py-1.5 rounded text-xs font-semibold text-[#8a726a] hover:bg-black/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRejection}
                  disabled={reviewMutation.isPending}
                  className="px-4 py-1.5 rounded bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {reviewMutation.isPending
                    ? 'Rejecting...'
                    : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

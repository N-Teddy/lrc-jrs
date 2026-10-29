import {
  usePendingReviewsQuery,
  useReviewMemberMutation,
  useTownContext,
  useTranslation,
} from '@jrs/client-core';
import type { IUser } from '@jrs/shared';
import {
  ArrowsClockwise,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  Key,
  Link,
  MagnifyingGlass,
  PencilSimple,
  Phone,
  UserCheck,
  Warning,
  WhatsappLogo,
  X,
  XCircle,
} from '@phosphor-icons/react';
import type React from 'react';
import { useMemo, useState } from 'react';
import { UserAvatar } from '../../../components';
import {
  calculateAge,
  formatCameroonPhone,
  getCleanDigitsForWhatsApp,
} from '../utils/member-ui.utils';

export interface IntakeReviewsTabProps {
  activeTownId?: string;
  activeTownName: string;
  onOpenIntakeLinksModal?: () => void;
}

export const IntakeReviewsTab: React.FC<IntakeReviewsTabProps> = ({
  activeTownId,
  activeTownName,
  onOpenIntakeLinksModal,
}) => {
  const { t } = useTranslation();
  const { canWrite, availableTowns } = useTownContext();

  // Query & Mutation
  const {
    data: pendingMembers = [],
    isLoading,
    isRefetching,
    refetch,
  } = usePendingReviewsQuery(activeTownId);
  const reviewMutation = useReviewMemberMutation();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'MALE' | 'FEMALE'>(
    'ALL',
  );
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST'>('NEWEST');

  // Confirmation Drawer State
  const [approvingMember, setApprovingMember] = useState<IUser | null>(null);
  const [rejectingMember, setRejectingMember] = useState<IUser | null>(null);
  const [grantAppAccess, setGrantAppAccess] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'info';
    text: string;
  } | null>(null);

  // Editable candidate fields for reviewer
  const [editFullName, setEditFullName] = useState('');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTownId, setEditTownId] = useState('');
  const [editGender, setEditGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [editDateOfBirth, setEditDateOfBirth] = useState('');

  // Filtered & Sorted Members
  const filteredMembers = useMemo(() => {
    let result = [...pendingMembers];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((m) => {
        const nameMatch = m.fullName.toLowerCase().includes(q);
        const phoneMatch = m.phoneNumber?.toLowerCase().includes(q);
        const noteMatch = m.intakeNote?.toLowerCase().includes(q);
        return nameMatch || phoneMatch || noteMatch;
      });
    }

    // 2. Gender Filter
    if (genderFilter !== 'ALL') {
      result = result.filter((m) => m.gender === genderFilter);
    }

    // 3. Sort Order
    result.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortOrder === 'NEWEST' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [pendingMembers, searchQuery, genderFilter, sortOrder]);

  // Actions
  const handleStartApprove = (member: IUser) => {
    setApprovingMember(member);
    setRejectingMember(null);
    setEditFullName(member.fullName || '');
    setEditPhoneNumber(member.phoneNumber || '');
    setEditEmail(member.email || '');
    const townIdStr =
      typeof member.homeTownId === 'object' && member.homeTownId !== null
        ? (member.homeTownId as any)._id?.toString() ||
          (member.homeTownId as any).id
        : member.homeTownId?.toString() || activeTownId || '';
    setEditTownId(townIdStr);
    setEditGender(member.gender || 'MALE');
    setEditDateOfBirth(
      member.dateOfBirth
        ? new Date(member.dateOfBirth).toISOString().split('T')[0]
        : '',
    );
    setGrantAppAccess(false);
    setReviewNotes('');
    setActionError(null);
  };

  const handleStartReject = (member: IUser) => {
    setRejectingMember(member);
    setApprovingMember(null);
    setReviewNotes('');
    setActionError(null);
  };

  const handleCancelAction = () => {
    setApprovingMember(null);
    setRejectingMember(null);
    setReviewNotes('');
    setActionError(null);
  };

  const handleConfirmApproval = async () => {
    if (!approvingMember) return;
    setActionError(null);

    const targetName = editFullName.trim() || approvingMember.fullName;
    try {
      await reviewMutation.mutateAsync({
        memberId: approvingMember.id,
        dto: {
          action: 'APPROVE',
          fullName: editFullName.trim() || undefined,
          phoneNumber: editPhoneNumber.trim() || undefined,
          email: editEmail.trim() || undefined,
          homeTownId: editTownId || undefined,
          gender: editGender,
          dateOfBirth: editDateOfBirth || undefined,
          grantAppAccess,
          notes: reviewNotes.trim() ? reviewNotes.trim() : undefined,
        },
      });

      setApprovingMember(null);
      setGrantAppAccess(false);
      setReviewNotes('');
      setFeedbackMessage({
        type: 'success',
        text: t('members:intake.approveSuccess', {
          name: targetName,
          defaultValue: `Successfully approved "${targetName}" into Community Directory.`,
        }),
      });
      setTimeout(() => setFeedbackMessage(null), 5000);
    } catch (err: any) {
      setActionError(
        err?.message ||
          t('members:intake.approveError', 'Failed to approve member.'),
      );
    }
  };

  const handleConfirmRejection = async () => {
    if (!rejectingMember) return;
    setActionError(null);

    const targetName = rejectingMember.fullName;
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
      setFeedbackMessage({
        type: 'info',
        text: t('members:intake.rejectSuccess', {
          name: targetName,
          defaultValue: `Rejected intake submission for "${targetName}".`,
        }),
      });
      setTimeout(() => setFeedbackMessage(null), 5000);
    } catch (err: any) {
      setActionError(
        err?.message ||
          t('members:intake.rejectError', 'Failed to reject submission.'),
      );
    }
  };

  return (
    <div className="w-full flex flex-col gap-5 animate-in fade-in duration-150">
      {/* 1. Review Queue Overview Hero Card */}
      <div className="bg-gradient-to-r from-white via-white to-[#faf2ee] rounded-xl border border-[#e8e1dd] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#fff2ee] border border-[#ffdbcf] flex items-center justify-center text-[#b85028] shrink-0 shadow-2xs">
            <UserCheck size={26} weight="duotone" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-[#1e1b19] tracking-tight">
                {t('members:intake.title', 'Intake Registration Review Queue')}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#faf2ee] text-[#b85028] border border-[#e8e1dd]">
                {t('members:intake.awaitingVerification', {
                  count: pendingMembers.length,
                  defaultValue: `${pendingMembers.length} Awaiting Verification`,
                })}
              </span>
            </div>
            <p className="text-xs text-[#8a726a] max-w-2xl mt-0.5">
              {t('members:intake.subtitle', {
                town: activeTownName,
                defaultValue: `Prospective members who registered via self-onboarding links for ${activeTownName}. Review their credentials and approve them into the active community directory.`,
              })}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
          {onOpenIntakeLinksModal && (
            <button
              type="button"
              onClick={onOpenIntakeLinksModal}
              className="h-9 px-3.5 rounded-md bg-[#faf2ee] hover:bg-[#f4ece9] text-[#57423b] border border-[#e8e1dd] text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              title="Manage and copy member invitation links"
            >
              <Link size={16} weight="bold" />
              <span>
                {t('members:intake.manageLinks', 'Manage Intake Links')}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="w-9 h-9 rounded-md bg-white hover:bg-[#faf2ee] border border-[#e8e1dd] text-[#8a726a] hover:text-[#1e1b19] flex items-center justify-center transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            title="Refresh review submissions list"
          >
            <ArrowsClockwise
              size={16}
              weight="bold"
              className={isRefetching ? 'animate-spin text-[#b85028]' : ''}
            />
          </button>
        </div>
      </div>

      {/* 2. Global Feedback / Action Error Notifications */}
      {actionError && (
        <div className="p-4 rounded-xl bg-[#ffdad6] border border-[#ffb4a8] text-[#ba1a1a] text-xs font-semibold flex items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <Warning size={20} weight="fill" className="shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="p-1 hover:bg-[#ffb4a8]/30 rounded text-[#ba1a1a] cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-150 ${
            feedbackMessage.type === 'success'
              ? 'bg-[#c2e9ca]/30 border-[#a9d0b2] text-[#2c4e37]'
              : 'bg-[#faf2ee] border-[#e8e1dd] text-[#57423b]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle size={20} weight="fill" className="shrink-0" />
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="p-1 hover:bg-black/5 rounded cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* 3. Filter & Search Toolbar */}
      <div className="bg-white rounded-xl border border-[#e8e1dd] shadow-xs p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex items-center gap-2.5 px-3.5 h-9 rounded-md bg-[#faf2ee] border border-[#e8e1dd] focus-within:ring-2 focus-within:ring-[#b85028]/20 focus-within:border-[#b85028] focus-within:bg-white transition-all w-full sm:w-80 md:w-96">
          <MagnifyingGlass
            size={16}
            className="text-[#8a726a] shrink-0"
            weight="bold"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t(
              'members:intake.searchPlaceholder',
              'Search applicants by name, phone, or note...',
            )}
            className="bg-transparent text-xs text-[#1e1b19] placeholder:text-[#8a726a] outline-none w-full pr-6"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 text-[#8a726a] hover:text-[#1e1b19] p-0.5 cursor-pointer"
              title="Clear search"
            >
              <X size={14} weight="bold" />
            </button>
          )}
        </div>

        {/* Gender & Sort Controls */}
        <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
          {/* Gender Filter Pills */}
          <div className="flex items-center p-1 bg-[#faf2ee] rounded-md border border-[#e8e1dd] text-xs font-semibold text-[#8a726a]">
            <button
              type="button"
              onClick={() => setGenderFilter('ALL')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                genderFilter === 'ALL'
                  ? 'bg-white text-[#b85028] shadow-xs font-bold'
                  : 'hover:text-[#1e1b19]'
              }`}
            >
              {t('members:intake.filterAll', 'All')}
            </button>
            <button
              type="button"
              onClick={() => setGenderFilter('MALE')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                genderFilter === 'MALE'
                  ? 'bg-white text-[#b85028] shadow-xs font-bold'
                  : 'hover:text-[#1e1b19]'
              }`}
            >
              {t('members:intake.filterMale', 'Male')}
            </button>
            <button
              type="button"
              onClick={() => setGenderFilter('FEMALE')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                genderFilter === 'FEMALE'
                  ? 'bg-white text-[#b85028] shadow-xs font-bold'
                  : 'hover:text-[#1e1b19]'
              }`}
            >
              {t('members:intake.filterFemale', 'Female')}
            </button>
          </div>

          {/* Sort Order Selector */}
          <div className="flex items-center p-1 bg-[#faf2ee] rounded-md border border-[#e8e1dd] text-xs font-semibold text-[#8a726a]">
            <button
              type="button"
              onClick={() => setSortOrder('NEWEST')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                sortOrder === 'NEWEST'
                  ? 'bg-white text-[#b85028] shadow-xs font-bold'
                  : 'hover:text-[#1e1b19]'
              }`}
            >
              {t('members:intake.sortNewest', 'Newest')}
            </button>
            <button
              type="button"
              onClick={() => setSortOrder('OLDEST')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                sortOrder === 'OLDEST'
                  ? 'bg-white text-[#b85028] shadow-xs font-bold'
                  : 'hover:text-[#1e1b19]'
              }`}
            >
              {t('members:intake.sortOldest', 'Oldest')}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Submissions List View */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-[#8a726a] flex flex-col items-center gap-3 bg-white rounded-xl border border-[#e8e1dd] p-8 shadow-xs">
          <div className="w-7 h-7 border-2 border-[#b85028]/30 border-t-[#b85028] rounded-full animate-spin" />
          <span className="font-semibold text-[#57423b]">
            {t('members:intake.loading', 'Loading intake submissions...')}
          </span>
        </div>
      ) : pendingMembers.length === 0 ? (
        /* Empty State: Zero pending reviews */
        <div className="bg-white rounded-xl border border-[#e8e1dd] p-12 text-center flex flex-col items-center shadow-xs">
          <div className="w-14 h-14 rounded-full bg-[#c2e9ca]/40 text-[#2c4e37] flex items-center justify-center mb-3.5 shadow-2xs">
            <CheckCircle size={32} weight="fill" />
          </div>
          <h3 className="text-base font-bold text-[#1e1b19] mb-1">
            {t(
              'members:intake.allCaughtUpTitle',
              'All Caught Up! No Submissions Pending Review',
            )}
          </h3>
          <p className="text-xs text-[#8a726a] max-w-md mb-6 leading-relaxed">
            {t('members:intake.allCaughtUpDesc', {
              town: activeTownName,
              defaultValue: `All prospective members who registered through your intake invitation links for ${activeTownName} have been processed and admitted into the community directory.`,
            })}
          </p>
          {onOpenIntakeLinksModal && (
            <button
              type="button"
              onClick={onOpenIntakeLinksModal}
              className="px-4 py-2 rounded-md bg-[#faf2ee] hover:bg-[#f4ece9] text-xs font-bold text-[#57423b] border border-[#e8e1dd] transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
            >
              <Link size={16} weight="bold" />
              <span>
                {t('members:intake.shareLinks', 'Share & Manage Intake Links')}
              </span>
            </button>
          )}
        </div>
      ) : filteredMembers.length === 0 ? (
        /* Empty State: Search filter has no matches */
        <div className="bg-white rounded-xl border border-[#e8e1dd] p-10 text-center flex flex-col items-center shadow-xs">
          <div className="w-12 h-12 rounded-lg bg-[#faf2ee] text-[#8a726a] flex items-center justify-center mb-3">
            <MagnifyingGlass size={24} weight="bold" />
          </div>
          <h3 className="text-sm font-bold text-[#1e1b19] mb-1">
            {t(
              'members:intake.noMatchesTitle',
              'No submissions matched your criteria',
            )}
          </h3>
          <p className="text-xs text-[#8a726a] max-w-sm mb-4">
            {t(
              'members:intake.noMatchesDesc',
              'Try adjusting your search query or reset the gender filter.',
            )}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setGenderFilter('ALL');
            }}
            className="px-3.5 py-1.5 rounded-md bg-[#faf2ee] hover:bg-[#f4ece9] text-xs font-bold text-[#1e1b19] border border-[#e8e1dd] transition-colors cursor-pointer"
          >
            {t('members:intake.clearFilters', 'Clear Filters')}
          </button>
        </div>
      ) : (
        /* Review Submissions Cards */
        <div className="flex flex-col gap-3.5">
          {filteredMembers.map((member) => {
            const age = calculateAge(member.dateOfBirth);
            const formattedPhone = formatCameroonPhone(member.phoneNumber);
            const cleanDigits = getCleanDigitsForWhatsApp(member.phoneNumber);
            const isApproving = approvingMember?.id === member.id;
            const isRejecting = rejectingMember?.id === member.id;

            return (
              <div
                key={member.id}
                className="p-5 rounded-xl border border-[#e8e1dd] bg-white shadow-2xs hover:border-[#b85028]/30 transition-all flex flex-col gap-3.5"
              >
                {/* Main Applicant Info & Action Buttons */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {/* Avatar & Identification */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <UserAvatar
                      name={member.fullName}
                      avatarUrl={member.avatarUrl}
                      size="lg"
                      className="shrink-0"
                    />
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-[#1e1b19]">
                          {member.fullName}
                        </span>
                        {canWrite && (
                          <button
                            type="button"
                            onClick={() => handleStartApprove(member)}
                            className="p-1 rounded text-[#8a726a] hover:text-[#b85028] hover:bg-[#faf2ee] transition-colors cursor-pointer"
                            title={t(
                              'members:intake.editCandidateDetails',
                              'Edit candidate details before approving',
                            )}
                            aria-label="Edit candidate details"
                          >
                            <PencilSimple size={13} weight="bold" />
                          </button>
                        )}
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#fff2ee] text-[#b85028] border border-[#ffdbcf]">
                          {t('members:intake.pendingReview', 'Pending Review')}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#faf2ee] text-[#57423b] border border-[#e8e1dd]">
                          {member.gender === 'FEMALE'
                            ? t('members:intake.filterFemale', 'Female')
                            : t('members:intake.filterMale', 'Male')}
                          {age !== null
                            ? ` • ${age} ${t('members:intake.yearsOld', 'yrs')}`
                            : ''}
                        </span>
                      </div>

                      {/* Contact & Date Demographics Strip */}
                      <div className="flex items-center gap-3.5 text-xs text-[#8a726a] flex-wrap mt-0.5">
                        {member.phoneNumber && (
                          <div className="flex items-center gap-1.5 font-mono text-[#57423b]">
                            <Phone size={13} className="text-[#8a726a]" />
                            <span>{formattedPhone}</span>
                            {cleanDigits && (
                              <a
                                href={`https://wa.me/${cleanDigits}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[#25d366] hover:text-[#128c7e] ml-1 font-sans text-[11px] font-semibold cursor-pointer"
                                title="Open WhatsApp chat to verify applicant"
                              >
                                <WhatsappLogo size={14} weight="fill" />
                                <span>WhatsApp</span>
                              </a>
                            )}
                          </div>
                        )}

                        {member.dateOfBirth && (
                          <span className="flex items-center gap-1">
                            <Calendar size={13} />
                            {t('members:intake.dob', 'DOB:')}{' '}
                            {new Date(member.dateOfBirth).toLocaleDateString()}
                          </span>
                        )}

                        {member.createdAt && (
                          <span className="flex items-center gap-1 text-[11px] text-[#8a726a]">
                            <Clock size={12} />
                            {t('members:intake.submitted', 'Submitted:')}{' '}
                            {new Date(member.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Primary Review Action Buttons */}
                  {canWrite ? (
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleStartReject(member)}
                        className={`px-3 py-1.5 rounded-md border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isRejecting
                            ? 'bg-[#ba1a1a] text-white border-[#ba1a1a]'
                            : 'border-[#ffb4a8] bg-white hover:bg-[#ffdad6] text-[#ba1a1a]'
                        }`}
                      >
                        <X size={14} weight="bold" />
                        <span>{t('members:intake.reject', 'Reject')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartApprove(member)}
                        className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                          isApproving
                            ? 'bg-[#1b3123] text-white border border-[#1b3123]'
                            : 'bg-[#2c4e37] hover:bg-[#223d2b] text-white'
                        }`}
                        title="Edit candidate profile, change town, grant app access, and approve"
                      >
                        <PencilSimple size={14} weight="bold" />
                        <span>
                          {t('members:intake.editAndApprove', 'Edit & Approve')}
                        </span>
                      </button>
                    </div>
                  ) : (
                    <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-[#faf2ee] text-[#8a726a] border border-[#e8e1dd] self-end sm:self-center">
                      {t('members:intake.readOnlyHub', 'Read-Only Hub')}
                    </span>
                  )}
                </div>

                {/* Intake Note Callout (if submitted by prospective member) */}
                {member.intakeNote && (
                  <div className="px-3.5 py-2 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] text-xs text-[#57423b] flex items-start gap-2">
                    <span className="font-bold text-[#b85028] shrink-0">
                      {t('members:intake.applicantNote', 'Applicant Note:')}
                    </span>
                    <span className="italic">"{member.intakeNote}"</span>
                  </div>
                )}

                {/* APPROVAL CONFIRMATION INLINE DRAWER */}
                {isApproving && (
                  <div className="p-4.5 rounded-xl bg-[#f4faf5] border border-[#a9d0b2] flex flex-col gap-3.5 animate-in fade-in slide-in-from-top-1 duration-150 mt-1">
                    <div className="flex items-center justify-between border-b border-[#c2e9ca] pb-2.5">
                      <span className="text-xs font-bold text-[#2c4e37] flex items-center gap-1.5">
                        <PencilSimple size={16} weight="bold" />
                        {t('members:intake.reviewAndApproveTitle', {
                          name: member.fullName,
                          defaultValue: `Review & Edit Candidate Details: "${member.fullName}"`,
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={handleCancelAction}
                        className="text-[#8a726a] hover:text-[#1e1b19] cursor-pointer p-1 rounded hover:bg-black/5"
                        aria-label="Cancel"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    {/* Editable candidate information grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                      {/* Full Name */}
                      <label className="block text-[11px] font-bold text-[#2c4e37]">
                        <span className="block mb-1">
                          {t('members:intake.editFullName', 'Full Name')} *
                        </span>
                        <input
                          type="text"
                          value={editFullName}
                          onChange={(e) => setEditFullName(e.target.value)}
                          placeholder="Candidate full name"
                          className="w-full h-9 px-3 rounded-md bg-white border border-[#a9d0b2] text-xs font-normal text-[#1e1b19] placeholder:text-[#8a726a] outline-none focus:border-[#2c4e37] focus:ring-1 focus:ring-[#2c4e37]"
                        />
                      </label>

                      {/* Community Town / Hub */}
                      <label className="block text-[11px] font-bold text-[#2c4e37]">
                        <span className="block mb-1">
                          {t('members:intake.editTown', 'Community Hub / Town')}{' '}
                          *
                        </span>
                        <select
                          value={editTownId}
                          onChange={(e) => setEditTownId(e.target.value)}
                          className="w-full h-9 px-3 rounded-md bg-white border border-[#a9d0b2] text-xs font-normal text-[#1e1b19] outline-none focus:border-[#2c4e37] focus:ring-1 focus:ring-[#2c4e37] cursor-pointer"
                        >
                          {availableTowns.map((town) => (
                            <option key={town.id} value={town.id}>
                              {town.name} ({town.code})
                            </option>
                          ))}
                        </select>
                      </label>

                      {/* Phone Number */}
                      <label className="block text-[11px] font-bold text-[#2c4e37]">
                        <span className="block mb-1">
                          {t('members:intake.editPhone', 'Phone Number')} *
                        </span>
                        <input
                          type="text"
                          value={editPhoneNumber}
                          onChange={(e) => setEditPhoneNumber(e.target.value)}
                          placeholder="6XXXXXXXX"
                          className="w-full h-9 px-3 rounded-md bg-white border border-[#a9d0b2] text-xs font-normal text-[#1e1b19] placeholder:text-[#8a726a] outline-none focus:border-[#2c4e37] focus:ring-1 focus:ring-[#2c4e37]"
                        />
                      </label>

                      {/* Email */}
                      <label className="block text-[11px] font-bold text-[#2c4e37]">
                        <span className="block mb-1">
                          {t('members:intake.editEmail', 'Email Address')}
                        </span>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          placeholder="name@example.com (optional)"
                          className="w-full h-9 px-3 rounded-md bg-white border border-[#a9d0b2] text-xs font-normal text-[#1e1b19] placeholder:text-[#8a726a] outline-none focus:border-[#2c4e37] focus:ring-1 focus:ring-[#2c4e37]"
                        />
                      </label>

                      {/* Gender */}
                      <label className="block text-[11px] font-bold text-[#2c4e37]">
                        <span className="block mb-1">
                          {t('members:intake.editGender', 'Gender')} *
                        </span>
                        <select
                          value={editGender}
                          onChange={(e) =>
                            setEditGender(e.target.value as 'MALE' | 'FEMALE')
                          }
                          className="w-full h-9 px-3 rounded-md bg-white border border-[#a9d0b2] text-xs font-normal text-[#1e1b19] outline-none focus:border-[#2c4e37] focus:ring-1 focus:ring-[#2c4e37] cursor-pointer"
                        >
                          <option value="MALE">
                            {t('members:intake.filterMale', 'Male')}
                          </option>
                          <option value="FEMALE">
                            {t('members:intake.filterFemale', 'Female')}
                          </option>
                        </select>
                      </label>

                      {/* Date of Birth */}
                      <label className="block text-[11px] font-bold text-[#2c4e37]">
                        <span className="block mb-1">
                          {t('members:intake.editDob', 'Date of Birth')} *
                        </span>
                        <input
                          type="date"
                          value={editDateOfBirth}
                          onChange={(e) => setEditDateOfBirth(e.target.value)}
                          max={new Date().toISOString().split('T')[0]}
                          className="w-full h-9 px-3 rounded-md bg-white border border-[#a9d0b2] text-xs font-normal text-[#1e1b19] outline-none focus:border-[#2c4e37] focus:ring-1 focus:ring-[#2c4e37]"
                        />
                      </label>
                    </div>

                    {/* Security policy notice */}
                    <div className="p-3 rounded-lg bg-white border border-[#a9d0b2] flex items-start gap-2.5 text-xs text-[#57423b]">
                      <Key
                        size={16}
                        className="text-[#b85028] shrink-0 mt-0.5"
                      />
                      <div className="flex-1 space-y-1">
                        <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-[#1e1b19]">
                          <input
                            type="checkbox"
                            checked={grantAppAccess}
                            onChange={(e) =>
                              setGrantAppAccess(e.target.checked)
                            }
                            className="w-4 h-4 rounded text-[#b85028] accent-[#b85028] cursor-pointer"
                          />
                          <span>
                            {t(
                              'members:intake.grantAccessLabel',
                              'Grant application access (Default: Unchecked)',
                            )}
                          </span>
                        </label>
                        <p className="text-[11px] text-[#8a726a] leading-tight">
                          {t(
                            'members:intake.grantAccessDesc',
                            'By default, members who register through intake links are recorded in the directory only and cannot log into the JRS portal without explicit administrator authorization.',
                          )}
                        </p>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder={t(
                        'members:intake.notesPlaceholder',
                        'Optional verification note (e.g. Verified via WhatsApp call)',
                      )}
                      className="h-9 px-3 rounded-md bg-white border border-[#a9d0b2] text-xs text-[#1e1b19] placeholder:text-[#8a726a] outline-none focus:border-[#2c4e37] focus:ring-1 focus:ring-[#2c4e37]"
                    />

                    <div className="flex items-center justify-end gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={handleCancelAction}
                        className="px-3 py-1.5 rounded text-xs font-semibold text-[#8a726a] hover:bg-black/5 cursor-pointer"
                      >
                        {t('members:intake.cancel', 'Cancel')}
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmApproval}
                        disabled={
                          reviewMutation.isPending ||
                          !editFullName.trim() ||
                          !editPhoneNumber.trim()
                        }
                        className="px-4 py-1.5 rounded-md bg-[#2c4e37] hover:bg-[#223d2b] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
                      >
                        {reviewMutation.isPending ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            <span>
                              {t('members:intake.approving', 'Approving...')}
                            </span>
                          </>
                        ) : (
                          <>
                            <Check size={14} weight="bold" />
                            <span>
                              {t(
                                'members:intake.confirmApproval',
                                'Confirm Approval & Save Changes',
                              )}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* REJECTION CONFIRMATION INLINE DRAWER */}
                {isRejecting && (
                  <div className="p-4 rounded-xl bg-[#ffdad6]/40 border border-[#ffb4a8] flex flex-col gap-3.5 animate-in fade-in slide-in-from-top-1 duration-150 mt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#ba1a1a] flex items-center gap-1.5">
                        <XCircle size={16} weight="fill" />
                        {t('members:intake.rejectHeader', {
                          name: member.fullName,
                          defaultValue: `Reject Intake Submission for "${member.fullName}"`,
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={handleCancelAction}
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
                        'Reason for rejection (e.g. Duplicate entry, unreachable phone number)',
                      )}
                      className="h-9 px-3 rounded-md bg-white border border-[#ffb4a8] text-xs text-[#1e1b19] placeholder:text-[#8a726a] outline-none"
                    />

                    <div className="flex items-center justify-end gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={handleCancelAction}
                        className="px-3 py-1.5 rounded text-xs font-semibold text-[#8a726a] hover:bg-black/5 cursor-pointer"
                      >
                        {t('members:intake.cancel', 'Cancel')}
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmRejection}
                        disabled={reviewMutation.isPending}
                        className="px-4 py-1.5 rounded-md bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
                      >
                        {reviewMutation.isPending ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            <span>
                              {t('members:intake.rejecting', 'Rejecting...')}
                            </span>
                          </>
                        ) : (
                          <>
                            <X size={14} weight="bold" />
                            <span>
                              {t(
                                'members:intake.confirmRejection',
                                'Confirm Rejection',
                              )}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

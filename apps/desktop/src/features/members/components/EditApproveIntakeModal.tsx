import { useTranslation } from '@jrs/client-core';
import type { ITown, IUser } from '@jrs/shared';
import {
  Check,
  EnvelopeSimple,
  GenderFemale,
  GenderMale,
  Key,
  User,
  Warning,
  X,
} from '@phosphor-icons/react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  CustomSelect,
  DatePicker,
  type SelectOption,
  UserAvatar,
} from '../../../components';
import {
  calculateAge,
  formatCameroonPhoneInput,
} from '../utils/member-ui.utils';

export interface EditApproveIntakeModalProps {
  isOpen: boolean;
  candidate: IUser | null;
  availableTowns: ITown[];
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: (data: {
    fullName: string;
    townId: string;
    phoneNumber: string;
    email?: string;
    gender: 'MALE' | 'FEMALE';
    dateOfBirth: string;
    grantAppAccess: boolean;
    reviewNotes?: string;
  }) => Promise<void> | void;
}

export const EditApproveIntakeModal: React.FC<EditApproveIntakeModalProps> = ({
  isOpen,
  candidate,
  availableTowns,
  isSubmitting = false,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();

  const [fullName, setFullName] = useState('');
  const [townId, setTownId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [grantAppAccess, setGrantAppAccess] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Sync form state whenever candidate changes
  useEffect(() => {
    if (candidate) {
      setFullName(candidate.fullName || '');
      setPhoneNumber(formatCameroonPhoneInput(candidate.phoneNumber || ''));
      setEmail(candidate.email || '');
      setGender(candidate.gender || 'MALE');
      setDateOfBirth(
        candidate.dateOfBirth
          ? new Date(candidate.dateOfBirth).toISOString().split('T')[0]
          : '',
      );

      const candidateTownId =
        typeof candidate.homeTownId === 'object' &&
        candidate.homeTownId !== null
          ? (candidate.homeTownId as any)._id?.toString() ||
            (candidate.homeTownId as any).id
          : candidate.homeTownId?.toString() || '';

      setTownId(candidateTownId || (availableTowns[0]?.id ?? ''));
      setGrantAppAccess(false);
      setReviewNotes('');
      setFormError(null);
    }
  }, [candidate, availableTowns]);

  const townOptions: SelectOption[] = useMemo(() => {
    return availableTowns.map((town) => ({
      value: town.id,
      label: `${town.name} (${town.code})`,
    }));
  }, [availableTowns]);

  if (!isOpen || !candidate) return null;

  const calculatedAge = dateOfBirth ? calculateAge(dateOfBirth) : null;
  const todayStr = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim()) {
      setFormError(
        t('members:intake.errors.fullNameRequired', 'Full Name is required'),
      );
      return;
    }
    if (!phoneNumber.trim()) {
      setFormError(
        t('members:intake.errors.phoneRequired', 'Phone Number is required'),
      );
      return;
    }
    if (!townId) {
      setFormError(
        t(
          'members:intake.errors.townRequired',
          'Please select a community town',
        ),
      );
      return;
    }

    try {
      await onConfirm({
        fullName: fullName.trim(),
        townId,
        phoneNumber: phoneNumber.trim(),
        email: email.trim() || undefined,
        gender,
        dateOfBirth: dateOfBirth || candidate.dateOfBirth || '',
        grantAppAccess,
        reviewNotes: reviewNotes.trim() || undefined,
      });
    } catch (err: any) {
      setFormError(err?.message || 'Failed to approve candidate.');
    }
  };

  const selectedTown = availableTowns.find((town) => town.id === townId);

  return (
    <div className="fixed inset-0 z-50 bg-[#23201e]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-[680px] my-auto bg-white rounded-xl border border-[#e8e1dd] shadow-2xl flex flex-col overflow-hidden max-h-[92vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-approve-intake-title"
      >
        {/* Header - App Theme */}
        <div className="p-6 pb-4 flex items-start justify-between border-b border-[#f4ece9] shrink-0">
          <div className="flex items-center gap-3.5">
            <UserAvatar
              name={fullName || candidate.fullName}
              avatarUrl={candidate.avatarUrl}
              size="lg"
              className="ring-2 ring-[#ffdbcf] shadow-xs shrink-0"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#faf2ee] text-[#b85028] border border-[#ffdbcf]">
                  {t(
                    'members:intake.reviewModalBadge',
                    'Intake Review & Enrollment',
                  )}
                </span>
                {candidate.createdAt && (
                  <span className="text-[11px] text-[#8a726a]">
                    {t('members:intake.submitted', 'Submitted:')}{' '}
                    {new Date(candidate.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <h2
                id="edit-approve-intake-title"
                className="text-lg font-bold text-[#1e1b19] mt-0.5"
              >
                {t('members:intake.editProfileTitle', {
                  name: candidate.fullName,
                  defaultValue: `Review & Edit: ${candidate.fullName}`,
                })}
              </h2>
              <p className="text-xs text-[#8a726a]">
                {t(
                  'members:intake.editProfileSubtitle',
                  'Adjust profile details, reassign town if needed, and confirm admittance into the directory.',
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd] flex items-center justify-center text-[#8a726a] hover:text-[#1e1b19] transition-colors cursor-pointer shrink-0"
            aria-label={t('common:close', 'Close')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto flex-1 p-6 space-y-5"
        >
          {formError && (
            <div className="p-3.5 rounded-lg bg-[#ffdad6] border border-[#ffb4a8] text-[#ba1a1a] text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
              <Warning size={18} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Section 1: Candidate Identity */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#b85028]" />
              <span className="text-xs font-bold text-[#8a726a] uppercase tracking-wider">
                {t('members:intake.sectionIdentity', 'Identity & Demographics')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Full Name */}
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label
                  htmlFor="intake-full-name"
                  className="text-xs font-bold text-[#1e1b19]"
                >
                  {t('members:intake.editFullName', 'Full Name')}{' '}
                  <span className="text-[#b85028]">*</span>
                </label>
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a726a]"
                  />
                  <input
                    id="intake-full-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Candidate full name"
                    required
                    className="w-full h-10 pl-9 pr-3.5 rounded-md border border-[#ded5d0] bg-white text-xs font-medium text-[#1e1b19] placeholder:text-[#8a726a] outline-none focus:border-[#b85028] focus:ring-1 focus:ring-[#b85028] transition-all"
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-[#1e1b19]">
                  {t('members:intake.editGender', 'Gender')}{' '}
                  <span className="text-[#b85028]">*</span>
                </span>
                <div className="grid grid-cols-2 gap-2 h-10">
                  <button
                    type="button"
                    onClick={() => setGender('MALE')}
                    className={`flex items-center justify-center gap-2 rounded-md border text-xs font-bold transition-all cursor-pointer ${
                      gender === 'MALE'
                        ? 'bg-[#fff2ee] border-[#b85028] text-[#b85028] shadow-xs'
                        : 'bg-[#faf2ee] border-[#e8e1dd] text-[#57423b] hover:bg-[#f4ece9]'
                    }`}
                  >
                    <GenderMale size={16} weight="bold" />
                    <span>{t('members:intake.filterMale', 'Male')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('FEMALE')}
                    className={`flex items-center justify-center gap-2 rounded-md border text-xs font-bold transition-all cursor-pointer ${
                      gender === 'FEMALE'
                        ? 'bg-[#fff2ee] border-[#b85028] text-[#b85028] shadow-xs'
                        : 'bg-[#faf2ee] border-[#e8e1dd] text-[#57423b] hover:bg-[#f4ece9]'
                    }`}
                  >
                    <GenderFemale size={16} weight="bold" />
                    <span>{t('members:intake.filterFemale', 'Female')}</span>
                  </button>
                </div>
              </div>

              {/* Date of Birth with Custom DatePicker & Age Pill */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="intake-dob"
                    className="text-xs font-bold text-[#1e1b19]"
                  >
                    {t('members:intake.editDob', 'Date of Birth')}{' '}
                    <span className="text-[#b85028]">*</span>
                  </label>
                  {calculatedAge !== null && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#faf2ee] text-[#b85028] border border-[#ffdbcf]">
                      {calculatedAge} {t('members:intake.yearsOld', 'yrs old')}
                    </span>
                  )}
                </div>
                <DatePicker
                  id="intake-dob"
                  value={dateOfBirth}
                  onChange={(val) => setDateOfBirth(val)}
                  maxDate={todayStr}
                  placeholder={t(
                    'members:modal.selectBirthDate',
                    'Select birth date',
                  )}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Hub Assignment & Contact */}
          <div className="flex flex-col gap-3 pt-3 border-t border-[#f4ece9]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#b85028]" />
              <span className="text-xs font-bold text-[#8a726a] uppercase tracking-wider">
                {t(
                  'members:intake.sectionAssignment',
                  'Town Assignment & Contact',
                )}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Community Town Custom Select */}
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label
                  htmlFor="intake-town-id"
                  className="text-xs font-bold text-[#1e1b19]"
                >
                  {t('members:intake.editTown', 'Town')}{' '}
                  <span className="text-[#b85028]">*</span>
                </label>
                <CustomSelect
                  id="intake-town-id"
                  value={townId}
                  onChange={(val) => setTownId(val)}
                  options={townOptions}
                  variant="form"
                  placeholder={t(
                    'members:intake.selectTownPlaceholder',
                    'Select Town...',
                  )}
                />
              </div>

              {/* Phone Number with 6xx xx xx xx Formatter & Country Prefix */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="intake-phone"
                  className="text-xs font-bold text-[#1e1b19]"
                >
                  {t('members:intake.editPhone', 'WhatsApp Phone Number')}{' '}
                  <span className="text-[#b85028]">*</span>
                </label>
                <div className="flex items-center h-10 w-full bg-white rounded-md border border-[#ded5d0] focus-within:border-[#b85028] focus-within:ring-1 focus-within:ring-[#b85028] transition-all overflow-hidden">
                  <div className="px-3 border-r border-[#e8e1dd] bg-[#faf2ee] h-full flex items-center gap-1.5 shrink-0 select-none">
                    <span className="text-xs font-bold text-[#57423b]">
                      🇨🇲 +237
                    </span>
                  </div>
                  <input
                    id="intake-phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) =>
                      setPhoneNumber(formatCameroonPhoneInput(e.target.value))
                    }
                    placeholder="6xx xx xx xx"
                    required
                    className="flex-1 h-full px-3 text-xs font-mono font-medium text-[#1e1b19] outline-none bg-transparent placeholder:text-[#8a726a]"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="intake-email"
                  className="text-xs font-bold text-[#1e1b19]"
                >
                  {t('members:intake.editEmail', 'Email Address')}{' '}
                  <span className="text-[#8a726a] font-normal text-[11px]">
                    (Optional)
                  </span>
                </label>
                <div className="relative">
                  <EnvelopeSimple
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a726a]"
                  />
                  <input
                    id="intake-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full h-10 pl-9 pr-3.5 rounded-md border border-[#ded5d0] bg-white text-xs font-medium text-[#1e1b19] placeholder:text-[#8a726a] outline-none focus:border-[#b85028] focus:ring-1 focus:ring-[#b85028] transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Applicant Note Callout (if submitted by candidate) */}
          {candidate.intakeNote && (
            <div className="p-3.5 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] text-xs text-[#57423b] flex items-start gap-2.5">
              <span className="font-bold text-[#b85028] shrink-0">
                {t('members:intake.applicantNote', 'Applicant Note:')}
              </span>
              <p className="italic text-[#1e1b19]">"{candidate.intakeNote}"</p>
            </div>
          )}

          {/* Section 3: Access & Verification */}
          <div className="flex flex-col gap-3 pt-3 border-t border-[#f4ece9]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#b85028]" />
              <span className="text-xs font-bold text-[#8a726a] uppercase tracking-wider">
                {t('members:intake.sectionAccess', 'Security, Access & Notes')}
              </span>
            </div>

            {/* Grant App Access Interactive Toggle Card */}
            <div
              onClick={() => setGrantAppAccess(!grantAppAccess)}
              className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-start justify-between gap-3 select-none ${
                grantAppAccess
                  ? 'bg-[#fff2ee] border-[#b85028]/50 ring-1 ring-[#b85028]/30'
                  : 'bg-[#faf2ee] border-[#e8e1dd] hover:border-[#b85028]/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    grantAppAccess
                      ? 'bg-[#b85028] text-white'
                      : 'bg-[#e8e1dd] text-[#8a726a]'
                  }`}
                >
                  <Key size={18} weight="bold" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1e1b19]">
                      {t('members:intake.grantAccessTitle', 'Grant App Access')}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        grantAppAccess
                          ? 'bg-[#b85028] text-white'
                          : 'bg-[#e8e1dd] text-[#8a726a]'
                      }`}
                    >
                      {grantAppAccess
                        ? t('common:enabled', 'ENABLED')
                        : t('common:disabled', 'OFF')}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8a726a] mt-0.5 leading-relaxed">
                    {t(
                      'members:intake.grantAccessDesc',
                      'By default, prospective members are enrolled into the directory only without web credentials. Check to issue login privileges.',
                    )}
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <div
                className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 shrink-0 ${
                  grantAppAccess ? 'bg-[#b85028]' : 'bg-[#ded5d0]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    grantAppAccess ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>

            {/* Review Notes */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="intake-review-notes"
                className="text-xs font-bold text-[#1e1b19]"
              >
                {t(
                  'members:intake.reviewNotesLabel',
                  'Verification / Audit Note',
                )}{' '}
                <span className="text-[#8a726a] font-normal text-[11px]">
                  (Optional)
                </span>
              </label>
              <input
                id="intake-review-notes"
                type="text"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={t(
                  'members:intake.notesPlaceholder',
                  'e.g. Identity verified via WhatsApp call with candidate',
                )}
                className="w-full h-10 px-3.5 rounded-md border border-[#ded5d0] bg-white text-xs text-[#1e1b19] placeholder:text-[#8a726a] outline-none focus:border-[#b85028] focus:ring-1 focus:ring-[#b85028] transition-all"
              />
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-4 border-t border-[#f4ece9] flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-[#8a726a]">
              {selectedTown
                ? `${t('members:intake.enrollingInto', 'Enrolling candidate into')}: `
                : ''}
              <strong className="text-[#b85028]">
                {selectedTown?.name || 'Selected Town'}
              </strong>
            </span>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-md bg-white border border-[#e8e1dd] text-xs font-bold text-[#57423b] hover:bg-[#f4ece9] transition-colors cursor-pointer"
              >
                {t('common:cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting || !fullName.trim() || !phoneNumber.trim()
                }
                className="px-5 py-2.5 rounded-lg bg-[#b85028] hover:bg-[#983912] text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>
                      {t(
                        'members:intake.approving',
                        'Approving & Enrolling...',
                      )}
                    </span>
                  </>
                ) : (
                  <>
                    <Check size={16} weight="bold" />
                    <span>
                      {t(
                        'members:intake.confirmApprove',
                        'Confirm & Enroll Member',
                      )}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

import { useTranslation } from '@jrs/client-core';
import { type ICreateMemberDto, UserRole } from '@jrs/shared';
import {
  CheckCircle,
  IdentificationBadge,
  Key,
  MapPin,
  Warning,
  X,
} from '@phosphor-icons/react';
import type React from 'react';
import { useState } from 'react';
import { calculateAge, getAgeCategory } from '../utils/member-ui.utils';

interface RegisterMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: ICreateMemberDto) => Promise<void>;
  activeTownName: string;
  activeTownCode: string;
  activePcCount: number;
  isSubmitting: boolean;
}

export const RegisterMemberModal: React.FC<RegisterMemberModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  activeTownName,
  activeTownCode,
  activePcCount,
  isSubmitting,
}) => {
  const { t } = useTranslation();

  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.MEMBER);
  const [hasAppAccess, setHasAppAccess] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const age = calculateAge(dateOfBirth);
  const ageCat = getAgeCategory(age);
  const isPcQuotaFull = activePcCount >= 2;

  const handlePhoneChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 9);
    setPhoneDigits(cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Full name is required.');
      return;
    }
    if (!dateOfBirth) {
      setErrorMsg('Date of birth is required.');
      return;
    }
    if (phoneDigits.length < 9) {
      setErrorMsg('Please enter a valid 9-digit Cameroonian telephone number.');
      return;
    }

    if (role === UserRole.PC && isPcQuotaFull) {
      setErrorMsg('The PC quota for this hub is full (maximum 2 active PCs).');
      return;
    }

    try {
      await onSubmit({
        fullName: fullName.trim(),
        dateOfBirth,
        phoneNumber: `+237${phoneDigits}`,
        email: email.trim() ? email.trim() : undefined,
        role,
        hasAppAccess,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to register member.',
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#23201e]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-[560px] my-auto bg-white rounded-3xl border border-[#e8e1dd] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 flex items-start justify-between border-b border-[#f4ece9]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#fff2ee] border border-[#ffdbcf] flex items-center justify-center text-[#b85028] shrink-0">
              <IdentificationBadge size={24} weight="duotone" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-[#1e1b19]">
                {t('members:modal.registerTitle')}
              </h2>
              <p className="text-xs text-[#8a726a]">
                {t('members:modal.registerSubtitle', { hub: activeTownName })}
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

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 flex flex-col gap-5 max-h-[calc(88vh-130px)] overflow-y-auto"
        >
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-[#ffdad6] border border-[#ffb4a8] text-[#ba1a1a] text-xs font-semibold flex items-center gap-2">
              <Warning size={18} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* SECTION 1: IDENTITY */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#b85028]" />
              <span className="text-xs font-bold text-[#8a726a] uppercase tracking-wider">
                {t('members:modal.sectionIdentity')}
              </span>
            </div>

            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="reg-fullName"
                className="text-xs font-bold text-[#1e1b19]"
              >
                {t('members:modal.fullName')}{' '}
                <span className="text-[#b85028]">*</span>
              </label>
              <input
                id="reg-fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('members:modal.fullNamePlaceholder')}
                className="w-full bg-[#faf2ee] focus:bg-white text-sm text-[#1e1b19] px-4 py-2.5 rounded-xl border border-[#e8e1dd] focus:border-[#b85028] outline-none transition-all"
              />
            </div>

            {/* DOB & Live Age Feedback */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="reg-dob"
                className="text-xs font-bold text-[#1e1b19]"
              >
                {t('members:modal.dob')}{' '}
                <span className="text-[#b85028]">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  id="reg-dob"
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full bg-[#faf2ee] focus:bg-white text-sm text-[#1e1b19] px-4 py-2.5 rounded-xl border border-[#e8e1dd] focus:border-[#b85028] outline-none transition-all"
                />
              </div>

              {/* Real-time Age Badge */}
              {age !== null && (
                <div
                  className={`mt-1 self-start inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                    ageCat === 'ELIGIBLE_JR'
                      ? 'bg-[#c2e9ca] text-[#2c4e37] border-[#a9d0b2]'
                      : ageCat === 'UNDERAGE'
                        ? 'bg-[#ffdad6] text-[#ba1a1a] border-[#ffb4a8]'
                        : 'bg-[#ffdbcf] text-[#812901] border-[#ffb59c]'
                  }`}
                >
                  {ageCat === 'ELIGIBLE_JR' ? (
                    <CheckCircle size={15} weight="fill" />
                  ) : (
                    <Warning size={15} weight="fill" />
                  )}
                  <span>
                    {ageCat === 'ELIGIBLE_JR'
                      ? t('members:modal.ageBadgeEligible', { age })
                      : ageCat === 'UNDERAGE'
                        ? t('members:modal.ageBadgeUnder', { age })
                        : t('members:modal.ageBadgeSenior', { age })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: CONTACT INFORMATION */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#b85028]" />
              <span className="text-xs font-bold text-[#8a726a] uppercase tracking-wider">
                {t('members:modal.sectionContact')}
              </span>
            </div>

            {/* Cameroon Phone with Flag Prefix */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="reg-phone"
                className="text-xs font-bold text-[#1e1b19]"
              >
                {t('members:modal.phoneLabel')}{' '}
                <span className="text-[#b85028]">*</span>
              </label>
              <div className="flex items-center rounded-xl border border-[#e8e1dd] overflow-hidden bg-[#faf2ee] focus-within:bg-white focus-within:border-[#b85028] transition-all">
                <div className="flex items-center gap-1.5 px-3 py-2.5 bg-[#f4ece9] border-r border-[#e8e1dd] text-[#1e1b19] select-none shrink-0 font-semibold text-xs">
                  <span role="img" aria-label="Cameroon">
                    🇨🇲
                  </span>
                  <span>+237</span>
                </div>
                <input
                  id="reg-phone"
                  type="tel"
                  required
                  value={phoneDigits}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="693 08 71 59"
                  className="w-full bg-transparent text-sm font-mono text-[#1e1b19] px-3.5 py-2.5 outline-none"
                />
              </div>
              <p className="text-[11px] text-[#8a726a]">
                {t('members:modal.phoneHelper')}
              </p>
            </div>

            {/* Email Address (Optional) */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="reg-email"
                className="text-xs font-bold text-[#1e1b19]"
              >
                {t('members:modal.emailLabel')}{' '}
                <span className="text-[#8a726a] font-normal">
                  {t('members:modal.emailOptional')}
                </span>
              </label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.cm"
                className="w-full bg-[#faf2ee] focus:bg-white text-sm text-[#1e1b19] px-4 py-2.5 rounded-xl border border-[#e8e1dd] focus:border-[#b85028] outline-none transition-all"
              />
            </div>
          </div>

          {/* SECTION 3: ROLE & SCOPE */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#b85028]" />
                <span className="text-xs font-bold text-[#8a726a] uppercase tracking-wider">
                  {t('members:modal.sectionRole')}
                </span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#faf2ee] border border-[#e8e1dd] text-[11px] font-bold text-[#57423b]">
                <MapPin size={12} className="text-[#b85028]" />
                <span>
                  {activeTownName} ({activeTownCode})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* JR Member Card */}
              <label
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  role === UserRole.MEMBER
                    ? 'bg-[#fff2ee] border-[#b85028] shadow-xs'
                    : 'bg-[#faf2ee] border-[#e8e1dd] hover:bg-[#f4ece9]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#1e1b19]">
                    JR Member
                  </span>
                  <input
                    type="radio"
                    name="fellowshipRole"
                    value={UserRole.MEMBER}
                    checked={role === UserRole.MEMBER}
                    onChange={() => setRole(UserRole.MEMBER)}
                    className="accent-[#b85028]"
                  />
                </div>
                <p className="text-[11px] text-[#57423b] leading-tight">
                  {t('members:modal.jrMemberDesc')}
                </p>
              </label>

              {/* PC Card */}
              <label
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isPcQuotaFull
                    ? 'opacity-60 bg-[#faf2ee] border-[#e8e1dd] cursor-not-allowed'
                    : role === UserRole.PC
                      ? 'bg-[#fff2ee] border-[#b85028] shadow-xs cursor-pointer'
                      : 'bg-[#faf2ee] border-[#e8e1dd] hover:bg-[#f4ece9] cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#1e1b19]">
                      Contact Person (PC)
                    </span>
                    {isPcQuotaFull && (
                      <span className="px-1.5 py-0.2 rounded bg-[#ffdbcf] text-[#812901] text-[9px] font-bold">
                        Full
                      </span>
                    )}
                  </div>
                  <input
                    type="radio"
                    name="fellowshipRole"
                    value={UserRole.PC}
                    disabled={isPcQuotaFull}
                    checked={role === UserRole.PC}
                    onChange={() => setRole(UserRole.PC)}
                    className="accent-[#b85028]"
                  />
                </div>
                <p className="text-[11px] text-[#57423b] leading-tight">
                  {isPcQuotaFull
                    ? t('members:modal.quotaAlert')
                    : t('members:modal.pcDesc')}
                </p>
              </label>
            </div>
          </div>

          {/* SECTION 4: PORTAL ACCESS & CREDENTIALS */}
          <div className="p-4 rounded-2xl bg-[#faf2ee] border border-[#e8e1dd] flex flex-col gap-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasAppAccess}
                onChange={(e) => setHasAppAccess(e.target.checked)}
                className="mt-0.5 accent-[#b85028] w-4 h-4 rounded"
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1e1b19]">
                  <Key size={14} className="text-[#b85028]" />
                  <span>{t('members:modal.sectionAccess')}</span>
                </div>
                <p className="text-[11px] text-[#57423b] mt-1 leading-relaxed">
                  {t('members:modal.accessHelper')}
                </p>
              </div>
            </label>
          </div>

          {/* Submit / Cancel Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#f4ece9]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-[#e8e1dd] text-xs font-bold text-[#57423b] hover:bg-[#faf2ee] transition-colors cursor-pointer"
            >
              {t('common:cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#b85028] hover:bg-[#a44520] text-white rounded-xl text-xs font-bold shadow-xs active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>{t('members:modal.submitting')}</span>
              ) : (
                <span>{t('members:registerMember')}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

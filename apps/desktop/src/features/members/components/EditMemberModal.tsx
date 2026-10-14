import { useTranslation } from '@jrs/client-core';
import { type IUpdateMemberDto, type IUser, UserRole } from '@jrs/shared';
import {
  CheckCircle,
  PencilSimple,
  Trash,
  UploadSimple,
  Warning,
  X,
} from '@phosphor-icons/react';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CustomSelect,
  type SelectOption,
  UserAvatar,
} from '../../../components';
import { DatePicker, MonthYearPicker } from '../../../components/DatePicker';
import { calculateAge, getAgeCategory } from '../utils/member-ui.utils';

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: IUser | null;
  onSubmit: (id: string, dto: IUpdateMemberDto | FormData) => Promise<void>;
  isSubmitting: boolean;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({
  isOpen,
  onClose,
  member,
  onSubmit,
  isSubmitting,
}) => {
  const { t } = useTranslation();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [integrationDate, setIntegrationDate] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.MEMBER);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const roleOptions: SelectOption<UserRole>[] = [
    {
      value: UserRole.MEMBER,
      label: t('roles:member'),
      description: t('members:modal.jrMemberDesc'),
    },
    {
      value: UserRole.PC,
      label: t('roles:pc'),
      description: t('members:modal.pcDesc'),
    },
    {
      value: UserRole.AP,
      label: t('roles:ap'),
      description: t('members:modal.apDesc'),
    },
  ];

  const initialValues = useMemo(() => {
    if (!member) return null;
    const digits = (member.phoneNumber || '').replace(/\D/g, '');
    const localDigits = digits.startsWith('237') ? digits.slice(3) : digits;
    const dob = member.dateOfBirth
      ? new Date(member.dateOfBirth).toISOString().split('T')[0]
      : '';
    return {
      fullName: member.fullName || '',
      gender: (member.gender as 'MALE' | 'FEMALE') || 'MALE',
      dateOfBirth: dob,
      integrationDate: member.integrationDate || '',
      phoneDigits: localDigits,
      email: member.email || '',
      role: (member.role as UserRole) || UserRole.MEMBER,
      avatarUrl: member.avatarUrl || null,
    };
  }, [member]);

  useEffect(() => {
    if (initialValues) {
      setFullName(initialValues.fullName);
      setGender(initialValues.gender);
      setDateOfBirth(initialValues.dateOfBirth);
      setIntegrationDate(initialValues.integrationDate);
      setPhoneDigits(initialValues.phoneDigits);
      setEmail(initialValues.email);
      setRole(initialValues.role);
      setAvatarPreview(initialValues.avatarUrl);
      setAvatarFile(null);
      setErrorMsg(null);
    }
  }, [initialValues]);

  const isDirty = useMemo(() => {
    if (!initialValues) return false;
    return (
      fullName.trim() !== initialValues.fullName ||
      gender !== initialValues.gender ||
      dateOfBirth !== initialValues.dateOfBirth ||
      integrationDate !== initialValues.integrationDate ||
      phoneDigits !== initialValues.phoneDigits ||
      email.trim() !== initialValues.email ||
      role !== initialValues.role ||
      Boolean(avatarFile)
    );
  }, [
    initialValues,
    fullName,
    gender,
    dateOfBirth,
    integrationDate,
    phoneDigits,
    email,
    role,
    avatarFile,
  ]);

  if (!isOpen || !member) return null;

  const age = calculateAge(dateOfBirth);
  const ageCat = getAgeCategory(age);

  const handlePhoneChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 9);
    setPhoneDigits(cleaned);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Image size must be less than 5MB');
        return;
      }
      setAvatarFile(file);
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(member.avatarUrl || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty) return;
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

    try {
      if (avatarFile) {
        const formData = new FormData();
        formData.append('fullName', fullName.trim());
        formData.append('gender', gender);
        formData.append('dateOfBirth', dateOfBirth);
        if (integrationDate)
          formData.append('integrationDate', integrationDate);
        formData.append('phoneNumber', `+237${phoneDigits}`);
        if (email.trim()) formData.append('email', email.trim());
        formData.append('role', role);
        formData.append('avatar', avatarFile);
        await onSubmit(member.id, formData);
      } else {
        await onSubmit(member.id, {
          fullName: fullName.trim(),
          gender,
          dateOfBirth,
          integrationDate: integrationDate || undefined,
          phoneNumber: `+237${phoneDigits}`,
          email: email.trim() ? email.trim() : undefined,
          role,
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to update member.',
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#23201e]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-[680px] my-auto bg-white rounded-3xl border border-[#e8e1dd] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 flex items-start justify-between border-b border-[#f4ece9]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#fff2ee] border border-[#ffdbcf] flex items-center justify-center text-[#b85028] shrink-0">
              <PencilSimple size={24} weight="duotone" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-[#1e1b19]">
                {t('members:modal.editTitle')}
              </h2>
              <p className="text-xs text-[#8a726a]">
                {t('members:modal.editSubtitle')}
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

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 flex flex-col gap-4 max-h-[calc(88vh-110px)] overflow-y-auto"
        >
          {errorMsg && (
            <div className="p-3.5 rounded-lg bg-[#ffdad6] border border-[#ffb4a8] text-[#ba1a1a] text-xs font-semibold flex items-center gap-2">
              <Warning size={18} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Avatar Upload Banner */}
          <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-[#faf2ee]/80 border border-[#e8e1dd]">
            <div className="relative group shrink-0">
              <div className="w-16 h-16 rounded-2xl border border-[#d1c4bf] bg-white flex items-center justify-center overflow-hidden shadow-2xs">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserAvatar
                    avatarUrl={member.avatarUrl}
                    name={fullName || member.fullName}
                    size="xl"
                  />
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#1e1b19]">
                  Member Profile Picture
                </span>
                {avatarFile && (
                  <span className="text-[10px] font-bold text-[#2c4e37] bg-[#c2e9ca] px-2 py-0.2 rounded-full">
                    New Photo Selected
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#8a726a] leading-tight">
                {avatarFile
                  ? 'New photo will be uploaded and applied when saved.'
                  : `Change photo or leave as is. If gender is updated, avatar will adapt to ${gender === 'FEMALE' ? 'female' : 'male'}.`}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="edit-avatar-input"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-md bg-white border border-[#e8e1dd] hover:bg-[#fff2ee] hover:border-[#b85028] text-[#1e1b19] hover:text-[#b85028] text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <UploadSimple size={13} weight="bold" />
                  <span>
                    {avatarFile ? 'Change Photo' : 'Upload New Photo'}
                  </span>
                </button>
                {avatarFile && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="px-2.5 py-1 rounded-md bg-[#ffdad6] hover:bg-[#ffb4a8] text-[#ba1a1a] text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Trash size={13} weight="bold" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Row 1: Full Name & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="edit-fullName"
                className="text-xs font-bold text-[#1e1b19]"
              >
                {t('members:modal.fullName')}{' '}
                <span className="text-[#b85028]">*</span>
              </label>
              <input
                id="edit-fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-10 w-full bg-[#faf2ee] focus:bg-white text-xs text-[#1e1b19] px-3.5 rounded-lg border border-[#e8e1dd] focus:border-[#b85028] outline-none transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-[#1e1b19]">
                Gender <span className="text-[#b85028]">*</span>
              </span>
              <div className="grid grid-cols-2 gap-2 h-10">
                <button
                  type="button"
                  onClick={() => setGender('MALE')}
                  className={`flex items-center justify-center gap-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    gender === 'MALE'
                      ? 'bg-[#fff2ee] text-[#b85028] border-[#b85028] shadow-2xs'
                      : 'bg-[#faf2ee] text-[#8a726a] border-[#e8e1dd] hover:bg-[#f4ece9]'
                  }`}
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => setGender('FEMALE')}
                  className={`flex items-center justify-center gap-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    gender === 'FEMALE'
                      ? 'bg-[#fff2ee] text-[#b85028] border-[#b85028] shadow-2xs'
                      : 'bg-[#faf2ee] text-[#8a726a] border-[#e8e1dd] hover:bg-[#f4ece9]'
                  }`}
                >
                  Female
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: DOB & Integration Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="edit-dob"
                className="text-xs font-bold text-[#1e1b19]"
              >
                {t('members:modal.dob')}{' '}
                <span className="text-[#b85028]">*</span>
              </label>
              <DatePicker
                id="edit-dob"
                value={dateOfBirth}
                onChange={setDateOfBirth}
                placeholder="Select date of birth"
              />
              {age !== null && (
                <div
                  className={`mt-1 self-start inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all border ${
                    ageCat === 'ELIGIBLE_JR'
                      ? 'bg-[#c2e9ca] text-[#2c4e37] border-[#a9d0b2]'
                      : ageCat === 'UNDERAGE'
                        ? 'bg-[#ffdad6] text-[#ba1a1a] border-[#ffb4a8]'
                        : 'bg-[#ffdbcf] text-[#812901] border-[#ffb59c]'
                  }`}
                >
                  {ageCat === 'ELIGIBLE_JR' ? (
                    <CheckCircle size={13} weight="fill" />
                  ) : (
                    <Warning size={13} weight="fill" />
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

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="edit-integration"
                className="text-xs font-bold text-[#1e1b19]"
              >
                Integration Date{' '}
                <span className="text-[#8a726a] font-normal">
                  (Month & Year)
                </span>
              </label>
              <MonthYearPicker
                id="edit-integration"
                value={integrationDate}
                onChange={setIntegrationDate}
                placeholder="Select integration month"
              />
            </div>
          </div>

          {/* Row 3: Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="edit-phone"
                className="text-xs font-bold text-[#1e1b19]"
              >
                {t('members:modal.phoneLabel')}{' '}
                <span className="text-[#b85028]">*</span>
              </label>
              <div className="h-10 flex items-center rounded-lg border border-[#e8e1dd] overflow-hidden bg-[#faf2ee] focus-within:bg-white focus-within:border-[#b85028] transition-all">
                <div className="h-full flex items-center gap-1.5 px-3 bg-[#f4ece9] border-r border-[#e8e1dd] text-[#1e1b19] select-none shrink-0 font-semibold text-xs">
                  <span role="img" aria-label="Cameroon">
                    🇨🇲
                  </span>
                  <span>+237</span>
                </div>
                <input
                  id="edit-phone"
                  type="tel"
                  required
                  value={phoneDigits}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="693 08 71 59"
                  className="w-full h-full bg-transparent text-xs font-mono text-[#1e1b19] px-3.5 outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="edit-email"
                className="text-xs font-bold text-[#1e1b19]"
              >
                {t('members:modal.emailLabel')}{' '}
                <span className="text-[#8a726a] font-normal">
                  {t('members:modal.emailOptional')}
                </span>
              </label>
              <input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.cm"
                className="h-10 w-full bg-[#faf2ee] focus:bg-white text-xs text-[#1e1b19] px-3.5 rounded-lg border border-[#e8e1dd] focus:border-[#b85028] outline-none transition-all"
              />
            </div>
          </div>

          {/* Row 4: Role */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="edit-role"
              className="text-xs font-bold text-[#1e1b19]"
            >
              Role
            </label>
            <CustomSelect<UserRole>
              id="edit-role"
              value={role}
              onChange={(val) => setRole(val)}
              options={roleOptions}
              variant="form"
              size="md"
              className="w-full"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#f4ece9]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-[#e8e1dd] text-xs font-bold text-[#57423b] hover:bg-[#faf2ee] transition-colors cursor-pointer"
            >
              {t('common:cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="px-5 py-2 bg-[#b85028] hover:bg-[#a44520] text-white rounded-lg text-xs font-bold shadow-xs active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <span>{t('members:modal.saving')}</span>
              ) : (
                <span>{t('members:modal.saveChanges')}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

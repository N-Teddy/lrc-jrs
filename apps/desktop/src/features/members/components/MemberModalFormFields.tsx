import { useTranslation } from '@jrs/client-core';
import { UserRole } from '@jrs/shared';
import { Trash, UploadSimple } from '@phosphor-icons/react';
import type React from 'react';
import {
  CustomSelect,
  type SelectOption,
  UserAvatar,
} from '../../../components';
import { DatePicker, MonthYearPicker } from '../../../components/DatePicker';
import { calculateAge, getAgeCategory } from '../utils/member-ui.utils';

export interface MemberModalFormData {
  fullName: string;
  gender: 'MALE' | 'FEMALE';
  dateOfBirth: string;
  integrationDate: string;
  phoneDigits: string;
  email: string;
  role: UserRole;
  avatarFile: File | null;
  avatarPreview: string | null;
}

export interface MemberModalFormFieldsProps {
  formData: MemberModalFormData;
  onChange: <K extends keyof MemberModalFormData>(
    field: K,
    val: MemberModalFormData[K],
  ) => void;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAvatar: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  roleOptions?: SelectOption<UserRole>[];
  hideRoleSelect?: boolean;
  isCreate?: boolean;
  defaultAvatarUrl?: string | null;
}

export const MemberModalFormFields: React.FC<MemberModalFormFieldsProps> = ({
  formData,
  onChange,
  onAvatarChange,
  onRemoveAvatar,
  fileInputRef,
  roleOptions,
  hideRoleSelect = false,
  isCreate = false,
  defaultAvatarUrl = null,
}) => {
  const { t } = useTranslation();
  const age = calculateAge(formData.dateOfBirth);
  const ageCat = getAgeCategory(age);

  return (
    <>
      {/* Avatar Upload Banner */}
      <div className="flex items-center gap-4 p-3.5 rounded-xl bg-[#faf2ee]/80 border border-[#e8e1dd]">
        <div className="relative group shrink-0">
          <div className="w-16 h-16 rounded-xl border border-[#d1c4bf] bg-white flex items-center justify-center overflow-hidden shadow-2xs">
            {formData.avatarPreview ? (
              <img
                src={formData.avatarPreview}
                alt="Avatar preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <UserAvatar
                avatarUrl={defaultAvatarUrl}
                name={formData.fullName || 'Member'}
                size="xl"
              />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#1e1b19]">
              {t('members:modal.avatarTitle', 'Member Profile Picture')}
            </span>
            {formData.avatarFile && (
              <span className="text-[10px] font-bold text-[#2c4e37] bg-[#c2e9ca] px-2 py-0.2 rounded-full">
                {t('members:modal.avatarNewSelected', 'New Photo Selected')}
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#8a726a] leading-tight">
            {formData.avatarFile
              ? t(
                  'members:modal.avatarNewDesc',
                  'New photo will be uploaded and applied when saved.',
                )
              : t(
                  'members:modal.avatarDesc',
                  'Change photo or leave as is. If gender is updated, avatar will adapt.',
                )}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={onAvatarChange}
              className="hidden"
              id="member-avatar-input"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 rounded-md bg-white border border-[#e8e1dd] hover:bg-[#fff2ee] hover:border-[#b85028] text-[#1e1b19] hover:text-[#b85028] text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <UploadSimple size={13} weight="bold" />
              <span>
                {formData.avatarFile
                  ? t('members:modal.avatarChange', 'Change Photo')
                  : isCreate
                    ? t('members:modal.avatarUpload', 'Upload Photo')
                    : t('members:modal.avatarUploadNew', 'Upload New Photo')}
              </span>
            </button>
            {formData.avatarFile && (
              <button
                type="button"
                onClick={onRemoveAvatar}
                className="px-2.5 py-1 rounded-md bg-[#ffdad6] hover:bg-[#ffb4a8] text-[#ba1a1a] text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Trash size={13} weight="bold" />
                <span>{t('members:modal.avatarReset', 'Reset')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Row 1: Full Name & Gender */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="member-fullName"
            className="text-xs font-bold text-[#1e1b19]"
          >
            {t('members:modal.fullName')}{' '}
            <span className="text-[#b85028]">*</span>
          </label>
          <input
            id="member-fullName"
            type="text"
            required
            value={formData.fullName}
            onChange={(e) => onChange('fullName', e.target.value)}
            className="h-10 w-full bg-[#faf2ee] focus:bg-white text-xs text-[#1e1b19] px-3.5 rounded-md border border-[#e8e1dd] focus:border-[#b85028] outline-none transition-all"
            placeholder="e.g. John Doe"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-[#1e1b19]">
            {t('members:modal.gender', 'Gender')}{' '}
            <span className="text-[#b85028]">*</span>
          </span>
          <div className="grid grid-cols-2 gap-2 h-10">
            <button
              type="button"
              onClick={() => onChange('gender', 'MALE')}
              className={`flex items-center justify-center gap-2 rounded-md text-xs font-bold border transition-all cursor-pointer ${
                formData.gender === 'MALE'
                  ? 'bg-[#fff2ee] text-[#b85028] border-[#b85028] shadow-2xs'
                  : 'bg-[#faf2ee] text-[#8a726a] border-[#e8e1dd] hover:bg-[#f4ece9]'
              }`}
            >
              {t('members:modal.male', 'Male')}
            </button>
            <button
              type="button"
              onClick={() => onChange('gender', 'FEMALE')}
              className={`flex items-center justify-center gap-2 rounded-md text-xs font-bold border transition-all cursor-pointer ${
                formData.gender === 'FEMALE'
                  ? 'bg-[#fff2ee] text-[#b85028] border-[#b85028] shadow-2xs'
                  : 'bg-[#faf2ee] text-[#8a726a] border-[#e8e1dd] hover:bg-[#f4ece9]'
              }`}
            >
              {t('members:modal.female', 'Female')}
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Date of Birth & Integration Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="member-dob"
              className="text-xs font-bold text-[#1e1b19]"
            >
              {t('members:modal.dob', 'Date of Birth')}{' '}
              <span className="text-[#b85028]">*</span>
            </label>
            {age !== null && (
              <span className="text-[10px] font-bold text-[#b85028] bg-[#fff2ee] px-2 py-0.5 rounded-full border border-[#ffdbcf]">
                {age} yrs • {ageCat}
              </span>
            )}
          </div>
          <MonthYearPicker
            id="member-dob"
            value={formData.dateOfBirth}
            onChange={(val) => onChange('dateOfBirth', val)}
            maxDate={new Date().toISOString().split('T')[0]}
            placeholder={t('members:modal.selectDob', 'Select date of birth')}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="member-integrationDate"
            className="text-xs font-bold text-[#1e1b19]"
          >
            {t(
              'members:modal.integrationDateOptional',
              'Integration Date (Optional)',
            )}
          </label>
          <DatePicker
            id="member-integrationDate"
            value={formData.integrationDate}
            onChange={(val) => onChange('integrationDate', val)}
            placeholder={t(
              'members:modal.selectIntegrationDate',
              'Select integration date',
            )}
          />
        </div>
      </div>

      {/* Row 3: Phone Number & Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="member-phone"
            className="text-xs font-bold text-[#1e1b19]"
          >
            {t(
              'members:modal.phoneNumber',
              'Phone Number (WhatsApp Preferred)',
            )}{' '}
            <span className="text-[#b85028]">*</span>
          </label>
          <div className="flex items-center h-10 w-full bg-[#faf2ee] rounded-md border border-[#e8e1dd] focus-within:border-[#b85028] focus-within:bg-white transition-all overflow-hidden">
            <div className="px-3 border-r border-[#e8e1dd] bg-[#f4ece9] h-full flex items-center gap-1.5 shrink-0 select-none">
              <span className="text-xs font-bold text-[#57423b]">🇨🇲 +237</span>
            </div>
            <input
              id="member-phone"
              type="tel"
              required
              value={formData.phoneDigits}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\D/g, '').slice(0, 9);
                onChange('phoneDigits', cleaned);
              }}
              placeholder="6xx xxx xxx"
              className="flex-1 h-full px-3 text-xs text-[#1e1b19] outline-none bg-transparent"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="member-email"
            className="text-xs font-bold text-[#1e1b19]"
          >
            {t(
              'members:modal.emailAddressOptional',
              'Email Address (Optional)',
            )}
          </label>
          <input
            id="member-email"
            type="email"
            value={formData.email}
            onChange={(e) => onChange('email', e.target.value)}
            placeholder="member@example.com"
            className="h-10 w-full bg-[#faf2ee] focus:bg-white text-xs text-[#1e1b19] px-3.5 rounded-md border border-[#e8e1dd] focus:border-[#b85028] outline-none transition-all"
          />
        </div>
      </div>

      {/* Row 4: Fellowship Role */}
      {!hideRoleSelect && roleOptions && (
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="member-role"
            className="text-xs font-bold text-[#1e1b19]"
          >
            {t('members:modal.role')} <span className="text-[#b85028]">*</span>
          </label>
          <CustomSelect<UserRole>
            options={roleOptions}
            value={formData.role}
            onChange={(val) => onChange('role', val)}
            variant="form"
            size="md"
            className="w-full"
          />
        </div>
      )}
    </>
  );
};

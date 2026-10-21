import { avataaars } from '@dicebear/collection';
import { createAvatar } from '@dicebear/core';
import { calculateAge, isJrAgeEligible } from '@jrs/shared';
import {
  ArrowClockwise,
  CheckCircle,
  ShieldCheck,
  UploadSimple,
  User,
} from '@phosphor-icons/react';
import React, { useId, useMemo, useState } from 'react';
import { useTranslation } from '../i18n';
import { DatePicker } from './DatePicker';

export interface IntakeFormData {
  fullName: string;
  phoneNumber: string;
  email: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE';
  integrationDate?: string;
  intakeNote?: string;
  avatarUrl: string;
  avatarFile: File | null;
}

interface IntakeFormProps {
  townName: string;
  townCode: string;
  onSubmit: (data: IntakeFormData) => Promise<void>;
  isLoading: boolean;
}

export const IntakeForm: React.FC<IntakeFormProps> = ({
  townName,
  townCode,
  onSubmit,
  isLoading,
}) => {
  const { t } = useTranslation();
  const formId = useId();

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');

  // Avatar State
  const [avatarMode, setAvatarMode] = useState<'dicebear' | 'upload'>(
    'dicebear',
  );
  const [avatarSeed, setAvatarSeed] = useState(() =>
    Math.random().toString(36).substring(2, 9),
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarImgError, setAvatarImgError] = useState(false);

  // Active Dicebear SVG data URI (generated 100% offline without remote network requests)
  const dicebearUrl = useMemo(() => {
    try {
      const seed = fullName.trim()
        ? `${fullName.trim()}_${avatarSeed}`
        : avatarSeed;
      const avatar = createAvatar(avataaars, {
        seed,
        backgroundColor: [
          'b6e3f4',
          'c0aede',
          'd1d4f9',
          'ffd5dc',
          'ffdfbf',
          'd1f4e0',
        ],
      });
      return avatar.toDataUri();
    } catch {
      return '';
    }
  }, [fullName, avatarSeed]);

  // Age & JR Eligibility Calculation
  const computedAge = useMemo(() => {
    if (!dateOfBirth) return null;
    return calculateAge(dateOfBirth);
  }, [dateOfBirth]);

  const isJr = useMemo(() => {
    if (!dateOfBirth) return false;
    return isJrAgeEligible(dateOfBirth);
  }, [dateOfBirth]);

  // Format Cameroon Phone Number
  const handlePhoneChange = (val: string) => {
    const cleaned = val.replace(/[^\d+]/g, '');
    setPhoneNumber(cleaned);
  };

  // Avatar Shuffle
  const shuffleAvatar = () => {
    setAvatarSeed(Math.random().toString(36).substring(2, 9));
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarMode('dicebear');
    setAvatarImgError(false);
  };

  // File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarMode('upload');
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    }
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data: IntakeFormData = {
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email.trim(),
      dateOfBirth,
      gender,
      integrationDate: '',
      intakeNote: '',
      avatarUrl:
        avatarMode === 'dicebear' && !avatarImgError
          ? dicebearUrl
          : avatarPreview || '',
      avatarFile: avatarMode === 'upload' ? avatarFile : null,
    };

    await onSubmit(data);
  };

  // Validation
  const isPhoneValid = phoneNumber.replace(/\D/g, '').length >= 9;
  const isNameValid = fullName.trim().length >= 3;
  const isDobValid = Boolean(
    dateOfBirth && computedAge !== null && computedAge > 0,
  );
  const isFormValid = isNameValid && isPhoneValid && isDobValid;

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      className="w-full max-w-xl mx-auto bg-white rounded-xl border border-[#e8e1dd] p-5 sm:p-7 shadow-xs space-y-5 text-left"
    >
      {/* 1. Avatar Picker Section */}
      <div className="flex flex-col items-center justify-center pt-1 pb-3 text-center border-b border-[#f4ece9]">
        <div className="relative group mb-3">
          <div className="w-24 h-24 rounded-full border-2 border-[#faf2ee] ring-2 ring-[#b85028]/20 bg-[#faf2ee] overflow-hidden shadow-xs flex items-center justify-center">
            {avatarMode === 'upload' && avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Uploaded portrait"
                className="w-full h-full object-cover"
              />
            ) : avatarImgError || !dicebearUrl ? (
              <div className="w-full h-full flex items-center justify-center bg-[#faf2ee] text-[#b85028] font-bold text-xl uppercase select-none">
                {fullName.trim() ? (
                  fullName
                    .trim()
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join('')
                ) : (
                  <User weight="bold" className="w-8 h-8 text-[#b85028]/70" />
                )}
              </div>
            ) : (
              <img
                src={dicebearUrl}
                alt="Generated avatar"
                onError={() => setAvatarImgError(true)}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={shuffleAvatar}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#e8e1dd] bg-[#faf2ee] hover:bg-[#f4ece9] text-[#57423b] text-xs font-semibold transition-colors cursor-pointer"
            title={t('form.randomize')}
          >
            <ArrowClockwise
              weight="bold"
              className="w-3.5 h-3.5 text-[#b85028]"
            />
            <span>{t('form.randomize')}</span>
          </button>

          <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#e8e1dd] bg-[#faf2ee] hover:bg-[#f4ece9] text-[#57423b] text-xs font-semibold transition-colors cursor-pointer">
            <UploadSimple
              weight="bold"
              className="w-3.5 h-3.5 text-[#57423b]"
            />
            <span>{t('form.uploadPhoto')}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>
      </div>

      {/* 2. Personal Information */}
      <div className="space-y-3.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#8a726a]">
          {t('form.personalInfo')}
        </h3>

        {/* Full Name */}
        <div>
          <label
            htmlFor={`${formId}-fullName`}
            className="block text-xs font-semibold text-[#1e1b19] mb-1"
          >
            {t('form.fullName')} <span className="text-[#b85028]">*</span>
          </label>
          <div className="relative">
            <input
              id={`${formId}-fullName`}
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t('form.fullNamePlaceholder')}
              className="w-full h-10 px-3.5 rounded-md border border-[#e8e1dd] bg-[#faf2ee] hover:bg-[#f4ece9] focus:bg-white focus:border-[#b85028] focus:ring-2 focus:ring-[#b85028]/20 outline-hidden text-xs text-[#1e1b19] placeholder:text-[#8a726a] transition-all"
            />
          </div>
        </div>

        {/* Gender Selection */}
        <div>
          <span className="block text-xs font-semibold text-[#1e1b19] mb-1">
            {t('form.gender')} <span className="text-[#b85028]">*</span>
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setGender('MALE')}
              className={`h-10 rounded-md border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                gender === 'MALE'
                  ? 'bg-white border-[#b85028] text-[#b85028] ring-2 ring-[#b85028]/20 shadow-xs'
                  : 'bg-[#faf2ee] hover:bg-[#f4ece9] border-[#e8e1dd] text-[#57423b]'
              }`}
            >
              <span>{t('form.male')}</span>
              {gender === 'MALE' && (
                <CheckCircle weight="fill" className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setGender('FEMALE')}
              className={`h-10 rounded-md border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                gender === 'FEMALE'
                  ? 'bg-white border-[#b85028] text-[#b85028] ring-2 ring-[#b85028]/20 shadow-xs'
                  : 'bg-[#faf2ee] hover:bg-[#f4ece9] border-[#e8e1dd] text-[#57423b]'
              }`}
            >
              <span>{t('form.female')}</span>
              {gender === 'FEMALE' && (
                <CheckCircle weight="fill" className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Date of Birth via Custom DatePicker */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="block text-xs font-semibold text-[#1e1b19]">
              {t('form.dateOfBirth')} <span className="text-[#b85028]">*</span>
            </span>
            {computedAge !== null && (
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                  isJr
                    ? 'bg-[#edf3ee] text-[#2c4e37]'
                    : 'bg-amber-50 text-amber-900'
                }`}
              >
                {t('form.yearsOld', { count: computedAge })}
              </span>
            )}
          </div>
          <DatePicker
            value={dateOfBirth}
            onChange={setDateOfBirth}
            placeholder={t('form.selectDateOfBirth')}
            maxDate={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      {/* 3. Contact Details */}
      <div className="space-y-3.5 pt-2 border-t border-[#f4ece9]">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#8a726a]">
          {t('form.contactDetails')}
        </h3>

        {/* Cameroon Phone Number */}
        <div>
          <label
            htmlFor={`${formId}-phoneNumber`}
            className="block text-xs font-semibold text-[#1e1b19] mb-1"
          >
            {t('form.phoneNumber')} <span className="text-[#b85028]">*</span>
          </label>
          <div className="relative flex rounded-md border border-[#e8e1dd] bg-[#faf2ee] focus-within:bg-white focus-within:border-[#b85028] focus-within:ring-2 focus-within:ring-[#b85028]/20 transition-all overflow-hidden h-10">
            <div className="inline-flex items-center gap-1.5 px-3 bg-[#faf2ee] border-r border-[#e8e1dd] text-xs font-semibold text-[#1e1b19] shrink-0 select-none">
              <span>🇨🇲</span>
              <span>+237</span>
            </div>
            <input
              id={`${formId}-phoneNumber`}
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="671 23 45 67"
              className="w-full px-3 text-xs text-[#1e1b19] placeholder:text-[#8a726a] bg-transparent outline-none"
            />
          </div>
          <p className="text-[11px] text-[#8a726a] mt-1">
            {t('form.phoneHelper')}
          </p>
        </div>

        {/* Optional Email */}
        <div>
          <label
            htmlFor={`${formId}-email`}
            className="block text-xs font-semibold text-[#1e1b19] mb-1"
          >
            {t('form.email')}{' '}
            <span className="text-[#8a726a] font-normal">
              ({t('form.optional')})
            </span>
          </label>
          <div className="relative">
            <input
              id={`${formId}-email`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('form.emailPlaceholder')}
              className="w-full h-10 px-3.5 rounded-md border border-[#e8e1dd] bg-[#faf2ee] hover:bg-[#f4ece9] focus:bg-white focus:border-[#b85028] focus:ring-2 focus:ring-[#b85028]/20 outline-hidden text-xs text-[#1e1b19] placeholder:text-[#8a726a] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Target Town Badge */}
      <div className="p-3 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] flex items-center justify-between text-xs text-[#57423b]">
        <span>{t('form.location')}</span>
        <strong className="text-[#1e1b19] font-bold">
          {townName} ({townCode})
        </strong>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={!isFormValid || isLoading}
          className={`w-full h-11 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
            isFormValid && !isLoading
              ? 'bg-[#b85028] hover:bg-[#a44520] active:scale-[0.99] text-white'
              : 'bg-[#e8e1dd] text-[#8a726a] cursor-not-allowed shadow-none'
          }`}
        >
          {isLoading ? (
            <>
              <ArrowClockwise weight="bold" className="w-4 h-4 animate-spin" />
              <span>{t('form.submitting')}</span>
            </>
          ) : (
            <>
              <ShieldCheck weight="bold" className="w-4 h-4" />
              <span>{t('form.submit')}</span>
            </>
          )}
        </button>
        <p className="text-[11px] text-[#8a726a] text-center mt-2.5">
          🔒 {t('form.securityNotice')}
        </p>
      </div>
    </form>
  );
};

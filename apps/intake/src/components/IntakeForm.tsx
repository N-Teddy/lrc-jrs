import type { IRegistrationLinkPublicInfo } from '@jrs/shared';
import { calculateAge, isJrAgeEligible } from '@jrs/shared';
import {
  ArrowRight,
  CalendarBlank,
  Camera,
  CaretDown,
  CaretLeft,
  CheckCircle,
  CircleNotch,
  Clock,
  EnvelopeSimple,
  MapPin,
  PaperPlaneTilt,
  PencilSimple,
  Phone,
  User,
  WhatsappLogo,
} from '@phosphor-icons/react';
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { LanguageToggle, useTranslation } from '../i18n';
import { DatePicker } from './DatePicker';

export interface IntakeFormData {
  fullName: string;
  phoneNumber: string;
  email: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE';
  homeTownId?: string;
  integrationDate?: string;
  intakeNote?: string;
  avatarUrl: string;
  avatarFile: File | null;
}

interface IntakeFormProps {
  linkInfo?: IRegistrationLinkPublicInfo | null;
  townName: string;
  townCode: string;
  onSubmit: (data: IntakeFormData) => Promise<void>;
  isLoading: boolean;
}

export const IntakeForm: React.FC<IntakeFormProps> = ({
  linkInfo,
  townName,
  townCode,
  onSubmit,
  isLoading,
}) => {
  const { t } = useTranslation();
  const formId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available Towns
  const availableTowns = useMemo(() => {
    if (linkInfo?.availableTowns && linkInfo.availableTowns.length > 0) {
      return linkInfo.availableTowns;
    }
    if (linkInfo?.town) {
      return [linkInfo.town];
    }
    return [];
  }, [linkInfo?.availableTowns, linkInfo?.town]);

  const [selectedTownId, setSelectedTownId] = useState<string>(
    linkInfo?.town?.id || '',
  );

  useEffect(() => {
    if (!selectedTownId && linkInfo?.town?.id) {
      setSelectedTownId(linkInfo.town.id);
    }
  }, [linkInfo?.town?.id, selectedTownId]);

  const activeTown = useMemo(() => {
    return (
      availableTowns.find((t) => t.id === selectedTownId) ||
      linkInfo?.town || {
        id: '',
        name: townName,
        code: townCode,
      }
    );
  }, [availableTowns, selectedTownId, linkInfo?.town, townName, townCode]);

  // 3-Step Native Mobile Flow:
  // 1 = Profile (Identity & Birth Date)
  // 2 = Contact (Phone & Email)
  // 3 = Review & Confirmation (Member Card)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');

  // Avatar State (backend handles default avatar generation automatically)
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Age & Eligibility
  const computedAge = useMemo(() => {
    if (!dateOfBirth) return null;
    return calculateAge(dateOfBirth);
  }, [dateOfBirth]);

  const isJr = useMemo(() => {
    if (!dateOfBirth) return false;
    return isJrAgeEligible(dateOfBirth);
  }, [dateOfBirth]);

  // Expiration format helper
  const expiryLabel = useMemo(() => {
    if (!linkInfo?.expiresAt) return '';
    const expiryDate = new Date(linkInfo.expiresAt);
    const now = new Date();
    const diffHours = Math.max(
      0,
      Math.round((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60)),
    );
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays > 1) {
      return t('header.validForDays', { count: diffDays });
    } else if (diffHours > 1) {
      return t('header.validForHours', { count: diffHours });
    }
    return t('header.expiresSoon');
  }, [linkInfo?.expiresAt, t]);

  // Phone sanitizer
  const handlePhoneChange = (val: string) => {
    const cleaned = val.replace(/[^\d+]/g, '');
    setPhoneNumber(cleaned);
  };

  // Avatar Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    }
  };

  const handleRemovePhoto = () => {
    setAvatarFile(null);
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Validation
  const isNameValid = fullName.trim().length >= 3;
  const isDobValid = Boolean(
    dateOfBirth && computedAge !== null && computedAge > 0,
  );
  const isTownValid = Boolean(selectedTownId || linkInfo?.town?.id);
  const isStep1Valid = isNameValid && isDobValid && isTownValid;

  const isPhoneValid = phoneNumber.replace(/\D/g, '').length >= 9;
  const isStep2Valid = isPhoneValid;
  const isAllValid = isStep1Valid && isStep2Valid;

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllValid || isLoading) return;

    const data: IntakeFormData = {
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email.trim(),
      dateOfBirth,
      gender,
      homeTownId: selectedTownId || undefined,
      integrationDate: '',
      intakeNote: '',
      avatarUrl: '', // empty: backend generates default avatar automatically
      avatarFile,
    };

    await onSubmit(data);
  };

  // Initials for avatar placeholder
  const initials = useMemo(() => {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [fullName]);

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      className="w-full max-w-md mx-auto bg-white rounded-3xl border border-[#E8E1DD] shadow-[0_12px_36px_rgba(35,32,30,0.08)] overflow-hidden flex flex-col justify-between text-left min-h-[580px] sm:min-h-[640px]"
    >
      {/* ============================================================ */}
      {/* NATIVE MOBILE APP TOP BAR & STEP PROGRESS                    */}
      {/* ============================================================ */}
      <div className="shrink-0 bg-white border-b border-[#F4ECE9]">
        {/* Top Header Row */}
        <div className="px-4.5 pt-3.5 pb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as 1 | 2)}
                className="w-11 h-11 -my-1.5 rounded-full bg-[#FAF7F2] hover:bg-[#F3EFEA] flex items-center justify-center text-[#23201E] transition-all cursor-pointer"
                aria-label="Back"
              >
                <CaretLeft size={18} weight="bold" />
              </button>
            ) : (
              <div className="flex items-center gap-1.5 pl-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B85028]" />
                <span className="text-xs font-black tracking-tight text-[#23201E] uppercase">
                  LRC JRS
                </span>
              </div>
            )}

            {/* Town Tag */}
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF7F2] border border-[#E8E0D7] text-[11px] font-semibold text-[#5C554F]">
              <MapPin size={11} weight="fill" className="text-[#B85028]" />
              <span>
                {activeTown.name} ({activeTown.code})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageToggle />
          </div>
        </div>

        {/* Expiry Ribbon */}
        {expiryLabel && (
          <div className="px-4.5 pb-2 flex items-center justify-between text-[11px]">
            <span className="text-[#8C847C] font-medium truncate pr-2">
              {linkInfo?.title || t('header.title')}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-900 font-semibold text-[10px] shrink-0">
              <Clock size={11} weight="bold" className="text-amber-700" />
              <span>{expiryLabel}</span>
            </span>
          </div>
        )}

        {/* 3-Segment Progress Bar */}
        <div className="px-4.5 pb-2.5">
          <div className="flex items-center justify-between text-[11px] mb-1.5 font-bold text-[#8C847C]">
            <span className="text-[#23201E]">
              {currentStep === 1
                ? t('form.step1Title')
                : currentStep === 2
                  ? t('form.step2Title')
                  : t('form.step3Title')}
            </span>
            <span>{t('form.step', { current: currentStep, total: 3 })}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 h-1.5">
            <div
              className={`rounded-full transition-all duration-300 ${
                currentStep >= 1 ? 'bg-[#B85028]' : 'bg-[#EADFD7]'
              }`}
            />
            <div
              className={`rounded-full transition-all duration-300 ${
                currentStep >= 2 ? 'bg-[#B85028]' : 'bg-[#EADFD7]'
              }`}
            />
            <div
              className={`rounded-full transition-all duration-300 ${
                currentStep === 3 ? 'bg-[#B85028]' : 'bg-[#EADFD7]'
              }`}
            />
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SCREEN 1: PROFILE (Avatar, Name, Gender, Date of Birth)      */}
      {/* ============================================================ */}
      {currentStep === 1 && (
        <div className="flex-1 flex flex-col justify-between p-5 animate-in fade-in duration-150">
          <div className="space-y-4">
            {/* Screen Header */}
            <div>
              <h2 className="text-lg font-bold text-[#23201E] tracking-tight">
                {t('form.step1Title')}
              </h2>
              <p className="text-xs text-[#5C554F] mt-0.5">
                {t('form.step1Subtitle')}
              </p>
            </div>

            {/* Centered Avatar Picker */}
            <div className="flex flex-col items-center justify-center py-1">
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-full border-2 border-dashed border-[#DCD4C8] hover:border-[#B85028] bg-[#FAF7F2] hover:bg-[#FFF2EE] flex items-center justify-center transition-all cursor-pointer overflow-hidden shadow-2xs"
                  title={t('form.choosePhoto')}
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Portrait"
                      className="w-full h-full object-cover"
                    />
                  ) : initials ? (
                    <span className="font-bold text-lg text-[#B85028] tracking-wider select-none">
                      {initials}
                    </span>
                  ) : (
                    <User
                      weight="bold"
                      className="w-8 h-8 text-[#A89F95] group-hover:text-[#B85028] transition-colors"
                    />
                  )}
                </button>

                {/* Camera overlay badge */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#B85028] text-white flex items-center justify-center shadow-xs hover:bg-[#A44520] transition-transform active:scale-90 cursor-pointer"
                  aria-label={t('form.choosePhoto')}
                >
                  <Camera weight="bold" className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-[#B85028] hover:underline cursor-pointer"
                >
                  {avatarPreview
                    ? t('form.changePhoto')
                    : t('form.choosePhoto')}
                </button>
                {avatarPreview && (
                  <>
                    <span className="text-[#DCD4C8]">•</span>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="text-xs font-medium text-red-600 hover:text-red-700 cursor-pointer"
                    >
                      {t('form.removePhoto')}
                    </button>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Full Name */}
            <div>
              <label
                htmlFor={`${formId}-fullName`}
                className="block text-xs font-bold text-[#23201E] mb-1.5"
              >
                {t('form.fullName')} <span className="text-[#B85028]">*</span>
              </label>
              <input
                id={`${formId}-fullName`}
                type="text"
                required
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('form.fullNamePlaceholder')}
                className="w-full h-11 px-3.5 rounded-xl border border-[#E0D7CE] bg-white hover:border-[#C8BEB4] focus:border-[#B85028] focus:ring-3 focus:ring-[#B85028]/12 outline-hidden text-xs sm:text-sm text-[#23201E] placeholder:text-[#A89F95] transition-all"
              />
            </div>

            {/* Gender Selector */}
            <div>
              <span className="block text-xs font-bold text-[#23201E] mb-1.5">
                {t('form.gender')} <span className="text-[#B85028]">*</span>
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setGender('MALE')}
                  className={`h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    gender === 'MALE'
                      ? 'bg-white border-2 border-[#B85028] text-[#B85028] shadow-xs'
                      : 'bg-[#FAF7F2] hover:bg-[#F3EFEA] border border-[#E6DFD5] text-[#5C554F]'
                  }`}
                >
                  <span>{t('form.male')}</span>
                  {gender === 'MALE' && (
                    <CheckCircle
                      weight="fill"
                      className="w-4 h-4 text-[#B85028]"
                    />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setGender('FEMALE')}
                  className={`h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    gender === 'FEMALE'
                      ? 'bg-white border-2 border-[#B85028] text-[#B85028] shadow-xs'
                      : 'bg-[#FAF7F2] hover:bg-[#F3EFEA] border border-[#E6DFD5] text-[#5C554F]'
                  }`}
                >
                  <span>{t('form.female')}</span>
                  {gender === 'FEMALE' && (
                    <CheckCircle
                      weight="fill"
                      className="w-4 h-4 text-[#B85028]"
                    />
                  )}
                </button>
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="block text-xs font-bold text-[#23201E]">
                  {t('form.dateOfBirth')}{' '}
                  <span className="text-[#B85028]">*</span>
                </span>
                {computedAge !== null && (
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                      isJr
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-900 border border-amber-200'
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

            {/* Community Town / Hub Selection */}
            {availableTowns.length > 0 && (
              <div>
                <label
                  htmlFor={`${formId}-town`}
                  className="block text-xs font-bold text-[#23201E] mb-1.5"
                >
                  {t('form.town')} <span className="text-[#B85028]">*</span>
                </label>
                <div className="relative">
                  <select
                    id={`${formId}-town`}
                    value={selectedTownId}
                    onChange={(e) => setSelectedTownId(e.target.value)}
                    className="w-full h-11 px-3.5 pr-9 rounded-xl border border-[#E0D7CE] bg-white hover:border-[#C8BEB4] focus:border-[#B85028] focus:ring-3 focus:ring-[#B85028]/12 outline-hidden text-xs sm:text-sm text-[#23201E] transition-all appearance-none cursor-pointer"
                  >
                    {availableTowns.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.code})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#5C554F]">
                    <CaretDown size={14} weight="bold" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Thumb CTA Bar */}
          <div className="pt-4 mt-2">
            <button
              type="button"
              disabled={!isStep1Valid}
              onClick={() => isStep1Valid && setCurrentStep(2)}
              className={`w-full h-12 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
                isStep1Valid
                  ? 'bg-[#B85028] hover:bg-[#A44520] active:scale-[0.99] text-white shadow-sm'
                  : 'bg-[#EAE4DC] text-[#A89F95] cursor-not-allowed shadow-none'
              }`}
            >
              <span>{t('form.next')}</span>
              <ArrowRight weight="bold" className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SCREEN 2: CONTACT (Phone, Email) - NO SUMMARY CARD HERE      */}
      {/* ============================================================ */}
      {currentStep === 2 && (
        <div className="flex-1 flex flex-col justify-between p-5 animate-in fade-in duration-150">
          <div className="space-y-4">
            {/* Screen Header */}
            <div>
              <h2 className="text-lg font-bold text-[#23201E] tracking-tight">
                {t('form.step2Title')}
              </h2>
              <p className="text-xs text-[#5C554F] mt-0.5">
                {t('form.step2Subtitle')}
              </p>
            </div>

            {/* Cameroon Phone Number */}
            <div>
              <label
                htmlFor={`${formId}-phoneNumber`}
                className="block text-xs font-bold text-[#23201E] mb-1.5"
              >
                {t('form.phoneNumber')}{' '}
                <span className="text-[#B85028]">*</span>
              </label>
              <div className="relative flex rounded-xl border border-[#E0D7CE] bg-white hover:border-[#C8BEB4] focus-within:border-[#B85028] focus-within:ring-3 focus-within:ring-[#B85028]/12 transition-all overflow-hidden h-11">
                <div className="inline-flex items-center gap-1.5 px-3.5 bg-[#FAF7F2] border-r border-[#E0D7CE] text-xs font-bold text-[#23201E] shrink-0 select-none">
                  <span>🇨🇲</span>
                  <span>+237</span>
                </div>
                <input
                  id={`${formId}-phoneNumber`}
                  type="tel"
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  value={phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="671 23 45 67"
                  className="w-full px-3.5 text-xs sm:text-sm text-[#23201E] placeholder:text-[#A89F95] bg-transparent outline-none"
                />
              </div>
              <p className="text-[11px] text-[#8C847C] mt-1.5 flex items-center gap-1">
                <WhatsappLogo
                  size={13}
                  weight="fill"
                  className="text-emerald-600"
                />
                <span>{t('form.phoneHelper')}</span>
              </p>
            </div>

            {/* Email (Optional) */}
            <div>
              <label
                htmlFor={`${formId}-email`}
                className="block text-xs font-bold text-[#23201E] mb-1.5"
              >
                {t('form.email')}{' '}
                <span className="text-[#8C847C] font-normal">
                  ({t('form.optional')})
                </span>
              </label>
              <input
                id={`${formId}-email`}
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('form.emailPlaceholder')}
                className="w-full h-11 px-3.5 rounded-xl border border-[#E0D7CE] bg-white hover:border-[#C8BEB4] focus:border-[#B85028] focus:ring-3 focus:ring-[#B85028]/12 outline-hidden text-xs sm:text-sm text-[#23201E] placeholder:text-[#A89F95] transition-all"
              />
            </div>
          </div>

          {/* Bottom Thumb CTA Bar */}
          <div className="pt-4 mt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="h-12 px-4 rounded-xl border border-[#E6DFD5] bg-[#FAF7F2] hover:bg-[#F3EFEA] text-[#23201E] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <CaretLeft size={16} weight="bold" />
              <span>{t('form.back')}</span>
            </button>

            <button
              type="button"
              disabled={!isStep2Valid}
              onClick={() => isStep2Valid && setCurrentStep(3)}
              className={`flex-1 h-12 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
                isStep2Valid
                  ? 'bg-[#B85028] hover:bg-[#A44520] active:scale-[0.99] text-white shadow-sm'
                  : 'bg-[#EAE4DC] text-[#A89F95] cursor-not-allowed shadow-none'
              }`}
            >
              <span>{t('form.next')}</span>
              <ArrowRight weight="bold" className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SCREEN 3: DEDICATED REVIEW & CONFIRMATION SCREEN             */}
      {/* ============================================================ */}
      {currentStep === 3 && (
        <div className="flex-1 flex flex-col justify-between p-5 animate-in fade-in duration-150">
          <div className="space-y-4">
            {/* Screen Header */}
            <div>
              <h2 className="text-lg font-bold text-[#23201E] tracking-tight">
                {t('form.step3Title')}
              </h2>
              <p className="text-xs text-[#5C554F] mt-0.5">
                {t('form.reviewDesc')}
              </p>
            </div>

            {/* Mobile Member ID Profile Card */}
            <div className="bg-[#FAF7F2] border border-[#E8E0D7] rounded-2xl p-4 space-y-3.5 shadow-2xs">
              {/* Member Card Top: Avatar + Name + Tags */}
              <div className="flex items-center gap-3.5 pb-3 border-b border-[#EAE2D9]">
                <div className="w-14 h-14 rounded-full border-2 border-white ring-2 ring-[#B85028]/25 bg-white overflow-hidden shadow-2xs flex items-center justify-center shrink-0">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Portrait"
                      className="w-full h-full object-cover"
                    />
                  ) : initials ? (
                    <span className="font-bold text-base text-[#B85028] select-none">
                      {initials}
                    </span>
                  ) : (
                    <User weight="bold" className="w-6 h-6 text-[#A89F95]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-extrabold text-[#23201E] truncate">
                    {fullName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-[#B85028] border border-[#E8E0D7]">
                      {gender === 'MALE' ? t('form.male') : t('form.female')}
                    </span>
                    {computedAge !== null && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white text-[#5C554F] border border-[#E8E0D7]">
                        {t('form.yearsOld', { count: computedAge })}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="p-1.5 rounded-lg text-[#8C847C] hover:text-[#B85028] hover:bg-white transition-colors cursor-pointer"
                  title={t('form.edit')}
                >
                  <PencilSimple size={16} weight="bold" />
                </button>
              </div>

              {/* Detail Items */}
              <div className="space-y-2 text-xs">
                {/* Phone */}
                <div className="flex items-center justify-between text-[#23201E]">
                  <span className="text-[#8C847C] flex items-center gap-1.5">
                    <Phone size={14} weight="bold" />
                    <span>{t('form.phoneNumber')}</span>
                  </span>
                  <span className="font-semibold">+237 {phoneNumber}</span>
                </div>

                {/* Email */}
                {email && (
                  <div className="flex items-center justify-between text-[#23201E]">
                    <span className="text-[#8C847C] flex items-center gap-1.5">
                      <EnvelopeSimple size={14} weight="bold" />
                      <span>{t('form.email')}</span>
                    </span>
                    <span className="font-semibold truncate max-w-[180px]">
                      {email}
                    </span>
                  </div>
                )}

                {/* Date of Birth */}
                <div className="flex items-center justify-between text-[#23201E]">
                  <span className="text-[#8C847C] flex items-center gap-1.5">
                    <CalendarBlank size={14} weight="bold" />
                    <span>{t('form.dateOfBirth')}</span>
                  </span>
                  <span className="font-semibold">{dateOfBirth}</span>
                </div>

                {/* Location */}
                <div className="flex items-center justify-between text-[#23201E] pt-1.5 border-t border-[#EAE2D9]">
                  <span className="text-[#8C847C] flex items-center gap-1.5">
                    <MapPin size={14} weight="bold" />
                    <span>{t('form.location')}</span>
                  </span>
                  <strong className="font-bold text-[#B85028]">
                    {activeTown.name} ({activeTown.code})
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Thumb CTA Bar */}
          <div className="pt-4 mt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              disabled={isLoading}
              className="h-12 px-4 rounded-xl border border-[#E6DFD5] bg-[#FAF7F2] hover:bg-[#F3EFEA] text-[#23201E] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              <CaretLeft size={16} weight="bold" />
              <span>{t('form.back')}</span>
            </button>

            <button
              type="submit"
              disabled={!isAllValid || isLoading}
              className={`flex-1 h-12 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
                isAllValid && !isLoading
                  ? 'bg-[#B85028] hover:bg-[#A44520] active:scale-[0.99] text-white shadow-sm'
                  : 'bg-[#EAE4DC] text-[#A89F95] cursor-not-allowed shadow-none'
              }`}
            >
              {isLoading ? (
                <>
                  <CircleNotch weight="bold" className="w-4 h-4 animate-spin" />
                  <span>{t('form.submitting')}</span>
                </>
              ) : (
                <>
                  <PaperPlaneTilt weight="bold" className="w-4 h-4" />
                  <span>{t('form.confirmSubmit')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </form>
  );
};

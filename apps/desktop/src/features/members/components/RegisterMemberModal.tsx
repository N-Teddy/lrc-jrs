import { useTranslation } from '@jrs/client-core';
import {
  type ICreateMemberDto,
  MAX_ACTIVE_PCS_PER_TOWN,
  UserRole,
} from '@jrs/shared';
import {
  IdentificationBadge,
  Key,
  MapPin,
  Warning,
  X,
} from '@phosphor-icons/react';
import type React from 'react';
import { useRef, useState } from 'react';
import {
  type MemberModalFormData,
  MemberModalFormFields,
} from './MemberModalFormFields';

interface RegisterMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: ICreateMemberDto | FormData) => Promise<void>;
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState<MemberModalFormData>({
    fullName: '',
    gender: 'MALE',
    dateOfBirth: '',
    integrationDate: '',
    phoneDigits: '',
    email: '',
    role: UserRole.MEMBER,
    avatarFile: null,
    avatarPreview: null,
  });

  const [hasAppAccess, setHasAppAccess] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isPcQuotaFull = activePcCount >= MAX_ACTIVE_PCS_PER_TOWN;

  const handleFieldChange = <K extends keyof MemberModalFormData>(
    field: K,
    val: MemberModalFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Image size must be less than 5MB');
        return;
      }
      const url = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        avatarFile: file,
        avatarPreview: url,
      }));
    }
  };

  const handleRemoveAvatar = () => {
    if (formData.avatarPreview) {
      URL.revokeObjectURL(formData.avatarPreview);
    }
    setFormData((prev) => ({
      ...prev,
      avatarFile: null,
      avatarPreview: null,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.fullName.trim()) {
      setErrorMsg('Full name is required.');
      return;
    }
    if (!formData.dateOfBirth) {
      setErrorMsg('Date of birth is required.');
      return;
    }
    if (formData.phoneDigits.length < 9) {
      setErrorMsg('Please enter a valid 9-digit Cameroonian telephone number.');
      return;
    }

    if (formData.role === UserRole.PC && isPcQuotaFull) {
      setErrorMsg('The PC quota for this hub is full (maximum 2 active PCs).');
      return;
    }

    try {
      if (formData.avatarFile) {
        const payload = new FormData();
        payload.append('fullName', formData.fullName.trim());
        payload.append('gender', formData.gender);
        payload.append('dateOfBirth', formData.dateOfBirth);
        const cleanDigits = formData.phoneDigits.replace(/\D/g, '');
        if (formData.integrationDate)
          payload.append('integrationDate', formData.integrationDate);
        payload.append('phoneNumber', `+237${cleanDigits}`);
        if (formData.email.trim())
          payload.append('email', formData.email.trim());
        payload.append('role', formData.role);
        payload.append('hasAppAccess', String(hasAppAccess));
        payload.append('avatar', formData.avatarFile);
        await onSubmit(payload);
      } else {
        const cleanDigits = formData.phoneDigits.replace(/\D/g, '');
        await onSubmit({
          fullName: formData.fullName.trim(),
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth,
          integrationDate: formData.integrationDate || undefined,
          phoneNumber: `+237${cleanDigits}`,
          email: formData.email.trim() ? formData.email.trim() : undefined,
          role: formData.role,
          hasAppAccess,
        });
      }
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
      <div className="relative w-full max-w-[680px] my-auto bg-white rounded-xl border border-[#e8e1dd] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 flex items-start justify-between border-b border-[#f4ece9]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-[#fff2ee] border border-[#ffdbcf] flex items-center justify-center text-[#b85028] shrink-0">
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

          <MemberModalFormFields
            formData={formData}
            onChange={handleFieldChange}
            onAvatarChange={handleAvatarChange}
            onRemoveAvatar={handleRemoveAvatar}
            fileInputRef={fileInputRef}
            hideRoleSelect={true}
            isCreate={true}
          />

          {/* SECTION 2: ROLE & SCOPE */}
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
                className={`p-3.5 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                  formData.role === UserRole.MEMBER
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
                    checked={formData.role === UserRole.MEMBER}
                    onChange={() => handleFieldChange('role', UserRole.MEMBER)}
                    className="accent-[#b85028]"
                  />
                </div>
                <p className="text-[11px] text-[#57423b] leading-tight">
                  {t('members:modal.jrMemberDesc')}
                </p>
              </label>

              {/* PC Card */}
              <label
                className={`p-3.5 rounded-lg border transition-all flex flex-col justify-between ${
                  isPcQuotaFull
                    ? 'opacity-60 bg-[#faf2ee] border-[#e8e1dd] cursor-not-allowed'
                    : formData.role === UserRole.PC
                      ? 'bg-[#fff2ee] border-[#b85028] shadow-xs cursor-pointer'
                      : 'bg-[#faf2ee] border-[#e8e1dd] hover:bg-[#f4ece9] cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#1e1b19]">PC</span>
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
                    checked={formData.role === UserRole.PC}
                    onChange={() => handleFieldChange('role', UserRole.PC)}
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

          {/* SECTION 3: PORTAL ACCESS & CREDENTIALS */}
          <div className="p-3.5 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] flex flex-col gap-2">
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
                <p className="text-[11px] text-[#57423b] mt-0.5 leading-relaxed">
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
              className="px-4 py-2 rounded-md border border-[#e8e1dd] text-xs font-bold text-[#57423b] hover:bg-[#faf2ee] transition-colors cursor-pointer"
            >
              {t('common:cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#b85028] hover:bg-[#a44520] text-white rounded-md text-xs font-bold shadow-xs active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
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

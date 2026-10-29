import { useTranslation } from '@jrs/client-core';
import { type IUpdateMemberDto, type IUser, UserRole } from '@jrs/shared';
import { PencilSimple, Warning, X } from '@phosphor-icons/react';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { SelectOption } from '../../../components';
import {
  type MemberModalFormData,
  MemberModalFormFields,
} from './MemberModalFormFields';

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
      setFormData({
        fullName: initialValues.fullName,
        gender: initialValues.gender,
        dateOfBirth: initialValues.dateOfBirth,
        integrationDate: initialValues.integrationDate,
        phoneDigits: initialValues.phoneDigits,
        email: initialValues.email,
        role: initialValues.role,
        avatarFile: null,
        avatarPreview: initialValues.avatarUrl,
      });
      setErrorMsg(null);
    }
  }, [initialValues]);

  const isDirty = useMemo(() => {
    if (!initialValues) return false;
    return (
      formData.fullName.trim() !== initialValues.fullName ||
      formData.gender !== initialValues.gender ||
      formData.dateOfBirth !== initialValues.dateOfBirth ||
      formData.integrationDate !== initialValues.integrationDate ||
      formData.phoneDigits !== initialValues.phoneDigits ||
      formData.email.trim() !== initialValues.email ||
      formData.role !== initialValues.role ||
      Boolean(formData.avatarFile)
    );
  }, [initialValues, formData]);

  if (!isOpen || !member) return null;

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
    setFormData((prev) => ({
      ...prev,
      avatarFile: null,
      avatarPreview: member.avatarUrl || null,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty) return;
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
        payload.append('avatar', formData.avatarFile);
        await onSubmit(member.id, payload);
      } else {
        const cleanDigits = formData.phoneDigits.replace(/\D/g, '');
        await onSubmit(member.id, {
          fullName: formData.fullName.trim(),
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth,
          integrationDate: formData.integrationDate || undefined,
          phoneNumber: `+237${cleanDigits}`,
          email: formData.email.trim() ? formData.email.trim() : undefined,
          role: formData.role,
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
      <div className="relative w-full max-w-[680px] my-auto bg-white rounded-xl border border-[#e8e1dd] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 flex items-start justify-between border-b border-[#f4ece9]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-[#fff2ee] border border-[#ffdbcf] flex items-center justify-center text-[#b85028] shrink-0">
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

          <MemberModalFormFields
            formData={formData}
            onChange={handleFieldChange}
            onAvatarChange={handleAvatarChange}
            onRemoveAvatar={handleRemoveAvatar}
            fileInputRef={fileInputRef}
            roleOptions={roleOptions}
            isCreate={false}
            defaultAvatarUrl={member.avatarUrl}
          />

          {/* Actions */}
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
              disabled={isSubmitting || !isDirty}
              className="px-5 py-2 bg-[#b85028] hover:bg-[#a44520] text-white rounded-md text-xs font-bold shadow-xs active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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

import {
  useMemberDetailQuery,
  useTownContext,
  useTownsQuery,
  useTranslation,
} from '@jrs/client-core';
import type { IUser } from '@jrs/shared';
import {
  ArrowLeft,
  ArrowRight,
  ArrowsLeftRight,
  Buildings,
  CalendarCheck,
  Certificate,
  ChatCircleText,
  CheckCircle,
  Copy,
  Crown,
  IdentificationCard,
  Key,
  MapPin,
  PencilSimple,
  ShieldCheck,
  Sparkle,
  Swap,
  Trash,
  User,
} from '@phosphor-icons/react';
import type React from 'react';
import { useMemo, useState } from 'react';
import { MemberDetailSkeleton, UserAvatar } from '../../../components';
import { ChangeTownPcModal } from '../../access/components/ChangeTownPcModal';
import {
  calculateAge,
  formatCameroonPhone,
  getCleanDigitsForWhatsApp,
  getRoleDisplayInfo,
} from '../utils/member-ui.utils';
import { MemberAttendanceHistoryTab } from './MemberAttendanceHistoryTab';
import { TransferTownModal } from './TransferTownModal';

interface MemberDetailPageProps {
  memberId: string;
  onBack: () => void;
  onEdit: (member: IUser) => void;
  onManageAccess: (member: IUser) => void;
  onDelete?: (member: IUser) => void;
  isCurrentUserAp: boolean;
  initialTab?: 'identity' | 'transfers' | 'attendance' | 'access';
}

export const MemberDetailPage: React.FC<MemberDetailPageProps> = ({
  memberId,
  onBack,
  onEdit,
  onManageAccess,
  onDelete,
  isCurrentUserAp,
  initialTab,
}) => {
  const { t } = useTranslation();
  const { activeTown, canWrite } = useTownContext();
  const { data: member, isLoading, error } = useMemberDetailQuery(memberId);
  const { data: towns = [] } = useTownsQuery();

  const [activeDetailTab, setActiveDetailTab] = useState<
    'identity' | 'transfers' | 'attendance' | 'access'
  >(initialTab ?? 'identity');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isChangePcOpen, setIsChangePcOpen] = useState(false);

  const townsMap = useMemo(() => new Map(towns.map((t) => [t.id, t])), [towns]);

  if (isLoading) {
    return <MemberDetailSkeleton />;
  }

  if (error || !member) {
    return (
      <div className="bg-white rounded-xl border border-[#e8e1dd] p-12 text-center flex flex-col items-center">
        <div className="w-14 h-14 rounded-lg bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center mb-4">
          <User size={28} />
        </div>
        <h3 className="text-lg font-bold text-[#1e1b19] mb-2">
          Member Not Found
        </h3>
        <p className="text-xs text-[#8a726a] mb-6">
          The requested member could not be retrieved from the active registry.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-md bg-[#faf2ee] hover:bg-[#f4ece9] text-xs font-bold text-[#1e1b19] transition-colors cursor-pointer"
        >
          {t('members:detail.backToMembers')}
        </button>
      </div>
    );
  }

  const age = calculateAge(member.dateOfBirth);
  const roleInfo = getRoleDisplayInfo(member.role);
  const formattedPhone = formatCameroonPhone(member.phoneNumber);
  const cleanDigits = getCleanDigitsForWhatsApp(member.phoneNumber);
  const isEligibleJr = member.isJr ?? (age !== null && age >= 18 && age <= 30);
  const hasAppAccess = member.account?.hasAppAccess ?? false;
  const isRevoked = member.account?.isAccessRevoked ?? false;

  const handleCopyEmail = () => {
    if (member.email) {
      navigator.clipboard.writeText(member.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 1500);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Breadcrumb Bar */}
      <div className="flex items-center gap-2 text-xs text-[#8a726a]">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 font-bold text-[#b85028] hover:underline cursor-pointer"
        >
          <ArrowLeft size={16} weight="bold" />
          <span>{t('members:detail.backToMembers')}</span>
        </button>
        <span>/</span>
        <span className="font-semibold text-[#1e1b19] truncate">
          {member.fullName}
        </span>
      </div>

      {/* 2. Hero Profile Card */}
      <section className="bg-white rounded-xl border border-[#e8e1dd] p-6 sm:p-8 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <UserAvatar
            avatarUrl={member.avatarUrl}
            name={member.fullName}
            size="2xl"
          />
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#1e1b19] tracking-tight">
                {member.fullName}
              </h1>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${roleInfo.badgeBg} ${roleInfo.badgeText} ${roleInfo.border}`}
              >
                {roleInfo.label}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#f4ece9] text-[#57423b] text-xs font-mono font-bold">
                {member.homeTown?.code ?? activeTown?.code ?? 'HUB'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#8a726a]">
              {age !== null && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold ${
                    isEligibleJr
                      ? 'bg-[#c2e9ca] text-[#2c4e37]'
                      : 'bg-[#faf2ee] text-[#8a726a]'
                  }`}
                >
                  <span>{age} yrs</span>
                  {isEligibleJr && <span>· Eligible Youth</span>}
                </span>
              )}
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin size={14} className="text-[#b85028]" />
                <span>
                  {member.homeTown?.name ?? activeTown?.name ?? 'Assigned Hub'}
                </span>
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-[#486b52] font-semibold">
                <CheckCircle size={14} weight="fill" />
                <span>{t('members:detail.statusActive')}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons & Contact Shortcuts */}
        <div className="flex flex-wrap items-center gap-3">
          {/* WhatsApp Direct */}
          {member.isWhatsappVerified && (
            <a
              href={`https://wa.me/${cleanDigits}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-[#c2e9ca] hover:bg-[#a9d0b2] text-[#2c4e37] text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <ChatCircleText size={18} weight="fill" />
              <span>WhatsApp</span>
            </a>
          )}

          {/* Edit Profile */}
          {canWrite && (
            <button
              type="button"
              onClick={() => onEdit(member)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-white hover:bg-[#faf2ee] border border-[#e8e1dd] text-[#1e1b19] text-xs font-bold transition-colors cursor-pointer"
            >
              <PencilSimple size={16} />
              <span>{t('common:edit')}</span>
            </button>
          )}

          {/* Transfer Hub */}
          {canWrite && (
            <button
              type="button"
              onClick={() => setIsTransferModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-white hover:bg-[#faf2ee] border border-[#e8e1dd] text-[#1e1b19] text-xs font-bold transition-colors cursor-pointer"
            >
              <ArrowsLeftRight
                size={16}
                weight="bold"
                className="text-[#b85028]"
              />
              <span>Transfer Hub</span>
            </button>
          )}

          {/* Manage Access */}
          {canWrite && (
            <button
              type="button"
              onClick={() => onManageAccess(member)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-[#fff2ee] hover:bg-[#ffdbcf] border border-[#ffb59c] text-[#b85028] text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <Key size={16} weight="bold" />
              <span>{t('members:table.manageAccess')}</span>
            </button>
          )}

          {/* Deactivate (AP Only & canWrite) */}
          {canWrite && isCurrentUserAp && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(member)}
              title={t('members:table.deactivateMember')}
              className="w-9 h-9 rounded-md hover:bg-[#ffdad6] text-[#8a726a] hover:text-[#ba1a1a] flex items-center justify-center transition-colors cursor-pointer"
            >
              <Trash size={18} />
            </button>
          )}
        </div>
      </section>

      {/* 3. Detail Tabs Strip */}
      <div className="flex items-center justify-center gap-1.5 p-1 rounded-lg bg-[#faf2ee] w-fit mx-auto border border-[#e8e1dd]">
        <button
          type="button"
          onClick={() => setActiveDetailTab('identity')}
          className={`flex items-center justify-center min-w-[140px] gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeDetailTab === 'identity'
              ? 'bg-white text-[#b85028] shadow-xs border border-[#e8e1dd]'
              : 'text-[#8a726a] hover:text-[#57423b] hover:bg-[#f4ece9] border border-transparent'
          }`}
        >
          <IdentificationCard
            size={18}
            weight={activeDetailTab === 'identity' ? 'fill' : 'regular'}
          />
          <span>{t('members:detail.tabIdentity')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveDetailTab('transfers')}
          className={`flex items-center justify-center min-w-[140px] gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeDetailTab === 'transfers'
              ? 'bg-white text-[#b85028] shadow-xs border border-[#e8e1dd]'
              : 'text-[#8a726a] hover:text-[#57423b] hover:bg-[#f4ece9] border border-transparent'
          }`}
        >
          <Swap
            size={18}
            weight={activeDetailTab === 'transfers' ? 'bold' : 'regular'}
          />
          <span>{t('members:detail.tabRegistry')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveDetailTab('attendance')}
          className={`flex items-center justify-center min-w-[140px] gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeDetailTab === 'attendance'
              ? 'bg-white text-[#b85028] shadow-xs border border-[#e8e1dd]'
              : 'text-[#8a726a] hover:text-[#57423b] hover:bg-[#f4ece9] border border-transparent'
          }`}
        >
          <CalendarCheck
            size={18}
            weight={activeDetailTab === 'attendance' ? 'bold' : 'regular'}
          />
          <span>{t('members:detail.tabAttendance')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveDetailTab('access')}
          className={`flex items-center justify-center min-w-[140px] gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeDetailTab === 'access'
              ? 'bg-white text-[#b85028] shadow-xs border border-[#e8e1dd]'
              : 'text-[#8a726a] hover:text-[#57423b] hover:bg-[#f4ece9] border border-transparent'
          }`}
        >
          <ShieldCheck
            size={18}
            weight={activeDetailTab === 'access' ? 'fill' : 'regular'}
          />
          <span>Access & Account</span>
        </button>
      </div>

      {/* 4. Tab 1: Personal Identity & Credentials */}
      {activeDetailTab === 'identity' && (
        <div
          className={`grid grid-cols-1 ${hasAppAccess ? 'lg:grid-cols-3' : ''} gap-6`}
        >
          {/* Identity & Official Status */}
          <div
            className={`${hasAppAccess ? 'lg:col-span-2' : 'w-full'} flex flex-col gap-6`}
          >
            <div className="bg-white rounded-xl border border-[#e8e1dd] p-6 shadow-xs flex flex-col gap-5">
              <h3 className="text-sm font-bold text-[#1e1b19] uppercase tracking-wider text-[#8a726a]">
                Identity & Demographic Credentials
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] flex flex-col gap-1">
                  <span className="text-[#8a726a] font-medium">Full Name</span>
                  <span className="font-bold text-[#1e1b19] text-sm">
                    {member.fullName}
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] flex flex-col gap-1">
                  <span className="text-[#8a726a] font-medium">Gender</span>
                  <span className="font-bold text-[#1e1b19] text-sm">
                    {member.gender
                      ? member.gender.charAt(0) +
                        member.gender.slice(1).toLowerCase()
                      : 'Not recorded'}
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] flex flex-col gap-1">
                  <span className="text-[#8a726a] font-medium">
                    Date of Birth
                  </span>
                  <span className="font-bold text-[#1e1b19] text-sm">
                    {member.dateOfBirth
                      ? new Date(member.dateOfBirth).toLocaleDateString(
                          'en-GB',
                          {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          },
                        )
                      : 'Not recorded'}
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] flex flex-col gap-1">
                  <span className="text-[#8a726a] font-medium">
                    Integration Date
                  </span>
                  <span className="font-bold text-[#1e1b19] text-sm">
                    {member.integrationDate
                      ? new Date(member.integrationDate).toLocaleDateString(
                          'en-GB',
                          {
                            month: 'long',
                            year: 'numeric',
                          },
                        )
                      : 'Not recorded'}
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] flex flex-col gap-1">
                  <span className="text-[#8a726a] font-medium">
                    Phone (WhatsApp Line)
                  </span>
                  <span className="font-mono font-bold text-[#1e1b19] text-sm">
                    {formattedPhone || '—'}
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] flex flex-col gap-1">
                  <span className="text-[#8a726a] font-medium">
                    Email Address
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#1e1b19] truncate">
                      {member.email || 'None'}
                    </span>
                    {member.email && (
                      <button
                        type="button"
                        onClick={handleCopyEmail}
                        className="text-[#8a726a] hover:text-[#b85028] transition-colors cursor-pointer"
                        title={
                          copiedEmail
                            ? 'Copied!'
                            : t('members:detail.copyEmail')
                        }
                      >
                        <Copy size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Transfer & Community Notes */}
              <div className="p-4 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] flex flex-col gap-2">
                <span className="text-xs font-bold text-[#1e1b19]">
                  Official Community Standing
                </span>
                <p className="text-xs text-[#57423b] leading-relaxed">
                  Member registered in good standing under Inter-Hub Youth
                  Community guidelines. Eligible for community circles, regional
                  gatherings, and program cohorts.
                </p>
              </div>
            </div>
          </div>

          {/* Account Portal Credentials Side Card (Only for members with app access) */}
          {hasAppAccess && (
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-xl border border-[#e8e1dd] p-6 shadow-xs flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={20} className="text-[#b85028]" />
                  <h3 className="text-sm font-bold text-[#1e1b19]">
                    {t('members:detail.credentials')}
                  </h3>
                </div>

                <div className="flex flex-col gap-3 text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-[#f4ece9]">
                    <span className="text-[#8a726a]">Portal Account</span>
                    <span
                      className={`font-bold ${
                        hasAppAccess && !isRevoked
                          ? 'text-[#486b52]'
                          : 'text-[#8a726a]'
                      }`}
                    >
                      {hasAppAccess && !isRevoked
                        ? t('members:detail.granted')
                        : t('members:detail.notGranted')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-[#f4ece9]">
                    <span className="text-[#8a726a]">Account Status</span>
                    <span
                      className={`font-bold ${
                        isRevoked
                          ? 'text-[#ba1a1a]'
                          : hasAppAccess
                            ? 'text-[#486b52]'
                            : 'text-[#8a726a]'
                      }`}
                    >
                      {isRevoked
                        ? 'Suspended'
                        : hasAppAccess
                          ? 'Active'
                          : 'Offline Only'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-[#f4ece9]">
                    <span className="text-[#8a726a]">
                      {t('members:detail.registeredOn')}
                    </span>
                    <span className="font-medium text-[#1e1b19]">
                      {member.createdAt
                        ? new Date(member.createdAt).toLocaleDateString('en-GB')
                        : '—'}
                    </span>
                  </div>
                </div>

                {canWrite && (
                  <button
                    type="button"
                    onClick={() => onManageAccess(member)}
                    className="w-full mt-2 py-2.5 px-4 rounded-md bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd] text-[#b85028] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Key size={16} />
                    <span>{t('members:table.manageAccess')}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Tab 2: Town Registry & Relocation Records */}
      {activeDetailTab === 'transfers' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          {/* Official Hub Registry Passport Header Card */}
          <div className="relative bg-gradient-to-br from-white via-[#fffaf7] to-white rounded-xl border-2 border-[#ffdbcf]/70 p-6 sm:p-8 shadow-sm overflow-hidden flex flex-col gap-6">
            {/* Background Subtle Watermark */}
            <div className="absolute -right-8 -bottom-8 pointer-events-none opacity-[0.04] text-[#b85028]">
              <Certificate size={220} weight="fill" />
            </div>

            {/* Passport Top Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#f4ece9] relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-lg bg-[#fff2ee] border border-[#ffdbcf] text-[#b85028] flex items-center justify-center shrink-0 shadow-2xs">
                  <Certificate size={24} weight="duotone" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-[#1e1b19] tracking-tight">
                      Official Hub Registry & Passport
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#ffdbcf]/60 text-[#812901] border border-[#ffb59c]/50">
                      Registry Index
                    </span>
                  </div>
                  <p className="text-xs text-[#8a726a] mt-0.5">
                    Official administrative jurisdiction and inter-city
                    relocation ledger across Cameroon.
                  </p>
                </div>
              </div>

              {canWrite && (
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(true)}
                  className="px-4 py-2.5 rounded-md bg-[#b85028] hover:bg-[#9c421f] text-white text-xs font-bold transition-all flex items-center gap-2 shadow-2xs cursor-pointer self-start sm:self-auto shrink-0"
                >
                  <ArrowsLeftRight size={16} weight="bold" />
                  <span>Transfer Member Hub</span>
                </button>
              )}
            </div>

            {/* Official Dual Pillars: Current Resident Hub <-> Origin Hub */}
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 items-center relative z-10">
              {/* Pillar 1: Current Resident Hub (3 cols) */}
              <div className="lg:col-span-3 p-5 rounded-lg bg-white border border-[#c2e9ca] shadow-2xs flex flex-col justify-between gap-3 relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#486b52]" />
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#eef7f0] text-[#2c4e37] border border-[#c2e9ca]">
                    <span className="w-2 h-2 rounded-full bg-[#486b52] animate-pulse" />
                    Active Jurisdiction
                  </span>
                  <span className="text-sm font-mono font-black text-[#486b52] bg-[#eef7f0] px-2.5 py-0.5 rounded-md border border-[#c2e9ca]">
                    {member.homeTown?.code ?? activeTown?.code ?? 'HUB'}
                  </span>
                </div>

                <div>
                  <h4 className="text-xl font-black text-[#1e1b19] tracking-tight">
                    {member.homeTown?.name ??
                      activeTown?.name ??
                      'Assigned Hub'}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-[#8a726a] mt-1">
                    <Buildings size={14} className="text-[#486b52]" />
                    <span>Official Current Hub in Cameroon</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#f4ece9] flex items-center justify-between text-[11px] text-[#57423b]">
                  <span className="font-medium">Jurisdiction Status:</span>
                  <span className="font-bold text-[#2c4e37]">
                    Active Roll Member
                  </span>
                </div>
              </div>

              {/* Central Journey Indicator (1 col) */}
              <div className="lg:col-span-1 flex flex-col items-center justify-center gap-1.5 py-2">
                <div className="w-10 h-10 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] text-[#b85028] flex items-center justify-center shadow-2xs">
                  <ArrowsLeftRight size={18} weight="bold" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#8a726a] text-center">
                  {member.transferHistory && member.transferHistory.length > 0
                    ? `${member.transferHistory.length} ${member.transferHistory.length === 1 ? 'Relocation' : 'Relocations'}`
                    : 'Native Seat'}
                </span>
              </div>

              {/* Pillar 2: Origin Hub / Origin Hub (3 cols) */}
              <div className="lg:col-span-3 p-5 rounded-lg bg-white border border-[#ffdbcf] shadow-2xs flex flex-col justify-between gap-3 relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#b85028]" />
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#fff2ee] text-[#812901] border border-[#ffdbcf]">
                    <Sparkle
                      size={12}
                      weight="fill"
                      className="text-[#b85028]"
                    />
                    Origin Hub
                  </span>
                  <span className="text-sm font-mono font-black text-[#b85028] bg-[#fff2ee] px-2.5 py-0.5 rounded-md border border-[#ffdbcf]">
                    {member.transferHistory && member.transferHistory.length > 0
                      ? townsMap.get(member.transferHistory[0].fromTownId)
                          ?.code || 'HUB'
                      : (member.homeTown?.code ?? activeTown?.code ?? 'HUB')}
                  </span>
                </div>

                <div>
                  <h4 className="text-xl font-black text-[#1e1b19] tracking-tight">
                    {member.transferHistory && member.transferHistory.length > 0
                      ? townsMap.get(member.transferHistory[0].fromTownId)
                          ?.name || 'Origin Hub'
                      : (member.homeTown?.name ??
                        activeTown?.name ??
                        'Origin Hub')}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-[#8a726a] mt-1">
                    <ShieldCheck size={14} className="text-[#b85028]" />
                    <span>Original Community Inception</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#f4ece9] flex items-center justify-between text-[11px] text-[#57423b]">
                  <span className="font-medium">Inscribed On:</span>
                  <span className="font-bold text-[#1e1b19]">
                    {member.createdAt
                      ? new Date(member.createdAt).toLocaleDateString('en-GB')
                      : 'Initial Roll'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Chronological Relocation Ledger */}
          <div className="bg-white rounded-xl border border-[#e8e1dd] p-6 sm:p-8 shadow-xs flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#f4ece9]">
              <div>
                <h3 className="text-base font-bold text-[#1e1b19]">
                  Transfer Ledger & Hub Endorsements
                </h3>
                <p className="text-xs text-[#8a726a] mt-0.5">
                  Complete chronological audit record of community transfers,
                  inter-city relocations, and administrative authorizations.
                </p>
              </div>

              <span className="text-xs font-bold text-[#8a726a] px-3 py-1 rounded-full bg-[#faf2ee] border border-[#e8e1dd] self-start sm:self-auto">
                {(member.transferHistory?.length || 0) + 1} Historical Events
              </span>
            </div>

            {/* Illustrated Timeline */}
            <div className="relative pl-6 before:content-[''] before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#e8e1dd] flex flex-col gap-6">
              {/* Dynamic Transfer History Events (most recent first) */}
              {member.transferHistory && member.transferHistory.length > 0 ? (
                [...member.transferHistory].reverse().map((record, idx) => {
                  const fromTown = townsMap.get(record.fromTownId);
                  const toTown = townsMap.get(record.toTownId);
                  const transferIndex = member.transferHistory.length - idx;

                  return (
                    <div
                      key={`${record.transferredAt}-${idx}`}
                      className="relative flex items-start gap-4"
                    >
                      <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-[#b85028] text-white flex items-center justify-center ring-4 ring-white shadow-xs">
                        <ArrowsLeftRight size={11} weight="bold" />
                      </div>
                      <div className="p-5 rounded-lg bg-white border border-[#e8e1dd] hover:border-[#b85028]/40 shadow-2xs hover:shadow-xs transition-all flex-1 flex flex-col gap-3 group">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#fff2ee] text-[#b85028] border border-[#ffdbcf]">
                              Relocation #{transferIndex}
                            </span>
                            <div className="flex items-center gap-2 font-bold text-sm text-[#1e1b19]">
                              <span>{fromTown?.name || 'Previous Hub'}</span>
                              <span className="text-xs font-mono text-[#8a726a]">
                                ({fromTown?.code || '—'})
                              </span>
                              <ArrowRight
                                size={14}
                                weight="bold"
                                className="text-[#b85028]"
                              />
                              <span>{toTown?.name || 'New Hub'}</span>
                              <span className="text-xs font-mono text-[#8a726a]">
                                ({toTown?.code || '—'})
                              </span>
                            </div>
                          </div>

                          <span className="text-xs font-bold text-[#8a726a] shrink-0">
                            {record.transferredAt
                              ? new Date(
                                  record.transferredAt,
                                ).toLocaleDateString('en-GB')
                              : 'Recent'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-[#8a726a]">
                          <ShieldCheck
                            size={16}
                            weight="bold"
                            className="text-[#486b52]"
                          />
                          <span>
                            Authorized by{' '}
                            <strong className="text-[#1e1b19] font-bold">
                              {record.transferredBy}
                            </strong>
                          </span>
                        </div>

                        {record.reason && (
                          <div className="p-3 rounded-md bg-[#faf2ee]/60 border border-[#f4ece9] text-xs text-[#57423b] leading-relaxed">
                            <span className="font-bold text-[#812901] block mb-0.5">
                              Transfer Notes:
                            </span>
                            {record.reason}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                /* Uninterrupted Native Residency Callout if 0 transfers */
                <div className="relative flex items-start gap-4">
                  <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-[#486b52] text-white flex items-center justify-center ring-4 ring-white shadow-xs">
                    <ShieldCheck size={13} weight="bold" />
                  </div>
                  <div className="p-4 rounded-lg bg-[#eef7f0]/60 border border-[#c2e9ca] flex-1 flex flex-col gap-1">
                    <span className="text-xs font-bold text-[#2c4e37]">
                      Unbroken Native Hub Residency
                    </span>
                    <p className="text-xs text-[#57423b]">
                      This member has remained in continuous, uninterrupted
                      engagement with their primary hub since enrollment. No
                      inter-hub relocations have taken place.
                    </p>
                  </div>
                </div>
              )}

              {/* Base Event: Initial Enrollment */}
              <div className="relative flex items-start gap-4">
                <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-[#486b52] text-white flex items-center justify-center ring-4 ring-white shadow-xs">
                  <CheckCircle size={14} weight="fill" />
                </div>
                <div className="p-5 rounded-lg bg-[#faf2ee]/70 border border-[#e8e1dd] flex-1 flex flex-col gap-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs font-bold text-[#1e1b19]">
                      Official Inception & First Enrollment at{' '}
                      {member.transferHistory &&
                      member.transferHistory.length > 0
                        ? townsMap.get(member.transferHistory[0].fromTownId)
                            ?.name || 'Active Hub'
                        : (member.homeTown?.name ?? 'Active Hub')}
                    </span>
                    <span className="text-xs font-semibold text-[#8a726a]">
                      {member.createdAt
                        ? new Date(member.createdAt).toLocaleDateString('en-GB')
                        : 'Active'}
                    </span>
                  </div>
                  <p className="text-xs text-[#57423b] leading-relaxed">
                    Formally registered into the Cameroon Youth Community roll
                    under active coordination and administrative supervision.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Tab 3: Attendance & Gatherings History */}
      {activeDetailTab === 'attendance' && (
        <MemberAttendanceHistoryTab member={member} />
      )}

      {/* 7. Tab 4: Account Access & Security */}
      {activeDetailTab === 'access' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Account Credentials & Status */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="bg-white rounded-xl border border-[#e8e1dd] p-6 shadow-xs flex flex-col gap-5">
                <div className="flex items-center justify-between pb-4 border-b border-[#f4ece9]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#fff2ee] border border-[#ffdbcf] text-[#b85028] flex items-center justify-center">
                      <Key size={22} weight="duotone" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1e1b19]">
                        Portal Account & Credentials
                      </h3>
                      <p className="text-xs text-[#8a726a]">
                        Manage application login permissions, security state,
                        and temporary passwords.
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      isRevoked
                        ? 'bg-[#ffdad6] text-[#ba1a1a]'
                        : hasAppAccess
                          ? 'bg-[#c2e9ca] text-[#2c4e37]'
                          : 'bg-[#faf2ee] text-[#8a726a]'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isRevoked
                          ? 'bg-[#ba1a1a]'
                          : hasAppAccess
                            ? 'bg-[#486b52]'
                            : 'bg-[#8a726a]'
                      }`}
                    />
                    {isRevoked
                      ? 'Access Suspended'
                      : hasAppAccess
                        ? 'Active App Access'
                        : 'Offline Only (No Login)'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] flex flex-col gap-1">
                    <span className="text-[#8a726a] font-medium">
                      Login Identifier (Phone)
                    </span>
                    <span className="font-mono font-bold text-[#1e1b19] text-sm">
                      {formatCameroonPhone(member.phoneNumber)}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] flex flex-col gap-1">
                    <span className="text-[#8a726a] font-medium">
                      Notification Email
                    </span>
                    <span className="font-bold text-[#1e1b19] text-sm truncate">
                      {member.email || 'None configured'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] flex flex-col gap-1">
                    <span className="text-[#8a726a] font-medium">
                      Assigned Role
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${roleInfo.badgeBg} ${roleInfo.badgeText} ${roleInfo.border}`}
                      >
                        {roleInfo.label}
                      </span>
                      {member.isActivePC && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#ffdbcf] text-[#812901]">
                          <Crown size={12} weight="fill" />
                          Active PC
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] flex flex-col gap-1">
                    <span className="text-[#8a726a] font-medium">
                      Credential Status
                    </span>
                    <span className="font-bold text-[#1e1b19] text-sm">
                      {member.isTemporaryPassword
                        ? 'Temporary Password (Pending update)'
                        : hasAppAccess
                          ? 'Permanent Password Set'
                          : 'No Credentials Issued'}
                    </span>
                  </div>
                </div>

                {canWrite && (
                  <div className="flex items-center gap-3 pt-3 border-t border-[#f4ece9]">
                    <button
                      type="button"
                      onClick={() => onManageAccess(member)}
                      className="flex-1 py-2.5 px-4 rounded-md bg-[#b85028] hover:bg-[#a44520] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Key size={16} />
                      <span>Manage Platform Access & Credentials</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Leadership Role Card */}
              {member.role === 'PC' && (
                <div className="bg-[#fff8f5] rounded-xl border border-[#ffdbcf] p-6 shadow-xs flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#fff2ee] border border-[#ffdbcf] text-[#b85028] flex items-center justify-center">
                        <Crown size={22} weight="fill" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#1e1b19]">
                          Program Coordinator (PC) Leadership
                        </h4>
                        <p className="text-xs text-[#8a726a]">
                          {member.fullName} currently serves as Contact Person
                          for {member.homeTown?.name || 'Assigned Town'}.
                        </p>
                      </div>
                    </div>
                    {canWrite && (
                      <button
                        type="button"
                        onClick={() => setIsChangePcOpen(true)}
                        className="py-2 px-3.5 rounded-md bg-white border border-[#ffb59c] text-[#b85028] hover:bg-[#fff2ee] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
                      >
                        <ArrowsLeftRight size={15} weight="bold" />
                        <span>Transfer PC Leadership</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Read Scopes & Permissions Side Column */}
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-xl border border-[#e8e1dd] p-5 shadow-xs flex flex-col gap-4">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={20} className="text-[#b85028]" />
                  <h4 className="text-xs font-bold text-[#1e1b19] uppercase tracking-wider">
                    Cross-Hub Read Scopes
                  </h4>
                </div>
                <p className="text-xs text-[#8a726a] leading-relaxed">
                  External community hubs this member is permitted to inspect in
                  read-only mode.
                </p>

                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#f4ece9]">
                  {member.account?.allowedReadTownIds &&
                  member.account.allowedReadTownIds.length > 0 ? (
                    member.account.allowedReadTownIds.map((id) => {
                      const town = towns.find((t) => t.id === id);
                      return (
                        <span
                          key={id}
                          className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#faf2ee] text-[#57423b] border border-[#e8e1dd]"
                        >
                          {town?.name || id}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-xs text-[#8a726a] italic">
                      Home hub only ({member.homeTown?.name || 'Local'})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Town Modal */}
      <TransferTownModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        member={member}
      />

      {/* Change Town PC Modal */}
      <ChangeTownPcModal
        isOpen={isChangePcOpen}
        onClose={() => setIsChangePcOpen(false)}
        targetTownId={member.homeTownId}
        targetOutgoingPc={member}
      />
    </div>
  );
};

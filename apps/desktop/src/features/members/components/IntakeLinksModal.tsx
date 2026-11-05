import {
  useCreateRegistrationLinkMutation,
  useDeactivateRegistrationLinkMutation,
  useRegistrationLinksQuery,
  useTranslation,
} from '@jrs/client-core';
import type { IRegistrationLink } from '@jrs/shared';
import {
  ArrowSquareOut,
  Check,
  Clock,
  Copy,
  DeviceMobile,
  Link,
  Plus,
  ShareNetwork,
  ShieldCheck,
  Trash,
  Warning,
  WhatsappLogo,
  X,
} from '@phosphor-icons/react';
import { openUrl } from '@tauri-apps/plugin-opener';
import type React from 'react';
import { useState } from 'react';
import emptyLinksSvg from '../../../assets/illustrations/empty-links.svg';
import { EmptyState } from '../../../components';

interface IntakeLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTownId?: string;
  activeTownName: string;
  activeTownCode: string;
}

export const IntakeLinksModal: React.FC<IntakeLinksModalProps> = ({
  isOpen,
  onClose,
  activeTownId,
  activeTownName,
  activeTownCode,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState(`Intake - ${activeTownName}`);
  const [expiresInHours, setExpiresInHours] = useState<number>(72); // 3 days default
  const [customMessage, setCustomMessage] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [createdSuccessLink, setCreatedSuccessLink] =
    useState<IRegistrationLink | null>(null);

  // Queries & Mutations
  const { data: links = [], isLoading: isLinksLoading } =
    useRegistrationLinksQuery(activeTownId);
  const createLinkMutation = useCreateRegistrationLinkMutation();
  const deactivateLinkMutation = useDeactivateRegistrationLinkMutation();

  if (!isOpen) return null;

  // Helper to open link in system browser via Tauri or window.open
  const handleOpenExternalLink = async (targetUrl: string) => {
    try {
      await openUrl(targetUrl);
    } catch {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Compute intake base url from configured environment or runtime origin
  const getIntakeBaseUrl = () => {
    const envUrl = (
      import.meta.env.VITE_INTAKE_URL as string | undefined
    )?.trim();
    if (envUrl) {
      return envUrl.replace(/\/+$/, '');
    }

    if (typeof window !== 'undefined' && window.location) {
      const { hostname } = window.location;
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.includes('tauri.localhost')
      ) {
        return 'http://localhost:5174';
      }
    }

    return 'http://localhost:5174';
  };

  const getPublicLinkUrl = (token: string) => {
    return `${getIntakeBaseUrl()}/r/${token}`;
  };

  const handleCopyLink = async (token: string) => {
    const url = getPublicLinkUrl(token);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2500);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2500);
    }
  };

  const handleShareWhatsApp = async (link: IRegistrationLink) => {
    const url = getPublicLinkUrl(link.token);
    const message = `Bonjour ! Voici le lien officiel pour soumettre votre inscription auprès de la communauté LRC (${activeTownName}) :\n\n${url}\n\nCe lien est valide pour une durée limitée. Merci de renseigner vos coordonnées.`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    await handleOpenExternalLink(whatsappUrl);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError(
        t(
          'members:intakeLinks.titleRequiredError',
          'Please enter a descriptive title for this intake link.',
        ),
      );
      return;
    }

    try {
      const res = await createLinkMutation.mutateAsync({
        title: title.trim(),
        homeTownId: activeTownId,
        expiresInHours,
        customMessage: customMessage.trim() ? customMessage.trim() : undefined,
      });

      setCreatedSuccessLink(res);
      setActiveTab('list');
      // Reset form
      setTitle(`Intake - ${activeTownName}`);
      setCustomMessage('');
    } catch (err: any) {
      setFormError(
        err?.message ||
          t(
            'members:intakeLinks.generateError',
            'Failed to generate self-entry link. Please try again.',
          ),
      );
    }
  };

  const handleDeactivate = async (linkId: string) => {
    if (
      !window.confirm(
        t(
          'members:intakeLinks.deactivateConfirm',
          'Are you sure you want to deactivate this self-entry link immediately? Anyone attempting to use it will no longer be able to submit their information.',
        ),
      )
    ) {
      return;
    }

    try {
      await deactivateLinkMutation.mutateAsync(linkId);
    } catch (err: any) {
      alert(
        err?.message ||
          t(
            'members:intakeLinks.deactivateError',
            'Failed to deactivate link.',
          ),
      );
    }
  };

  const titlePresets = [
    `Intake - ${activeTownName}`,
    `Youth Gathering - ${activeTownName}`,
    `Community Outreach - ${activeTownName}`,
    `New Inhabitants Intake`,
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1e1b19]/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl my-auto bg-white rounded-xl border border-[#e8e1dd] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 flex items-start justify-between border-b border-[#f4ece9] bg-gradient-to-r from-white via-white to-[#faf2ee] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-[#fff2ee] border border-[#ffdbcf] flex items-center justify-center text-[#b85028] shrink-0 shadow-2xs">
              <Link size={24} weight="duotone" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-[#1e1b19]">
                  {t(
                    'members:intakeLinks.modalTitle',
                    'Member Self-Entry Links',
                  )}
                </h2>
                <span className="px-2 py-0.5 rounded-xs text-[10px] font-mono font-bold bg-[#faf2ee] text-[#b85028] border border-[#e8e1dd]">
                  {activeTownName} ({activeTownCode})
                </span>
              </div>
              <p className="text-xs text-[#8a726a] mt-0.5">
                {t('members:intakeLinks.modalSubtitle', {
                  town: activeTownName,
                  code: activeTownCode,
                  defaultValue: `Generate shareable, expiring invitation links so prospective youth can enter their own information into ${activeTownName} (${activeTownCode}).`,
                })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-md bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd] flex items-center justify-center text-[#8a726a] hover:text-[#1e1b19] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-2 flex items-center gap-2 border-b border-[#f4ece9] bg-[#fdfbf9] shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('create');
              setCreatedSuccessLink(null);
            }}
            className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'border-[#b85028] text-[#b85028]'
                : 'border-transparent text-[#8a726a] hover:text-[#57423b]'
            }`}
          >
            <Plus size={15} weight="bold" />
            <span>
              {t('members:intakeLinks.tabGenerate', 'Create New Link')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'border-[#b85028] text-[#b85028]'
                : 'border-transparent text-[#8a726a] hover:text-[#57423b]'
            }`}
          >
            <ShareNetwork size={15} weight="bold" />
            <span>
              {t('members:intakeLinks.tabActiveLinks', {
                count: links.length,
                defaultValue: `Active & Past Links (${links.length})`,
              })}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          {activeTab === 'create' ? (
            <form onSubmit={handleCreate} className="flex flex-col gap-5">
              {formError && (
                <div className="p-3.5 rounded-lg bg-[#ffdad6] border border-[#ffb4a8] text-[#ba1a1a] text-xs font-semibold flex items-center gap-2">
                  <Warning size={18} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Informational Policy Banner (Warm Branded Redesign) */}
              <div className="p-4 rounded-xl bg-[#fff8f5] border border-[#ffdbcf] text-xs flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#fff2ee] border border-[#ffd8cb] text-[#b85028] flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} weight="duotone" />
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-[#b85028]">
                    {t(
                      'members:intakeLinks.policyTitle',
                      'Intake Review Queue Protection',
                    )}
                  </p>
                  <p className="text-[11px] text-[#8a726a] leading-relaxed">
                    {t(
                      'members:intakeLinks.policyDesc',
                      "Registrations submitted via this public intake link do not grant instant application access. Each submission is safely staged in your hub's review queue for coordinator verification.",
                    )}
                  </p>
                </div>
              </div>

              {/* Link Title / Occasion */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="intake-link-title"
                    className="text-xs font-bold text-[#57423b]"
                  >
                    {t(
                      'members:intakeLinks.campaignTitleLabel',
                      'Link Title / Occasion',
                    )}{' '}
                    <span className="text-[#b85028]">*</span>
                  </label>
                  <span className="text-[10px] text-[#8a726a]">
                    Used to identify submissions in the review queue
                  </span>
                </div>

                <input
                  id="intake-link-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t(
                    'members:intakeLinks.campaignTitlePlaceholder',
                    'e.g. Monthly Youth Gathering, Community Outreach, Intake Reception',
                  )}
                  className="h-10 px-3.5 rounded-lg bg-[#faf2ee] focus:bg-white border border-[#e8e1dd] focus:border-[#b85028] focus:ring-2 focus:ring-[#b85028]/20 text-xs text-[#1e1b19] outline-none transition-all font-medium"
                  required
                />

                {/* Quick Title Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] font-bold text-[#8a726a] mr-1">
                    Presets:
                  </span>
                  {titlePresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTitle(preset)}
                      className={`px-2 py-0.5 rounded-xs text-[10px] font-medium border transition-all cursor-pointer ${
                        title === preset
                          ? 'bg-[#fff2ee] text-[#b85028] border-[#b85028] font-bold'
                          : 'bg-white text-[#8a726a] border-[#e8e1dd] hover:bg-[#faf2ee]'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expiration Hours Preset Cards */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#57423b]">
                    {t(
                      'members:intakeLinks.linkLifespanLabel',
                      'Link Expiration & Lifespan',
                    )}{' '}
                    <span className="text-[#b85028]">*</span>
                  </span>
                  <span className="text-[10px] text-[#8a726a]">
                    Link automatically deactivates after expiration
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    {
                      label: t('members:intakeLinks.preset24h', '24 Hours'),
                      hours: 24,
                      desc: 'Quick Outreach',
                    },
                    {
                      label: t('members:intakeLinks.preset3d', '3 Days'),
                      hours: 72,
                      desc: 'Recommended (72h)',
                      recommended: true,
                    },
                    {
                      label: t('members:intakeLinks.preset7d', '7 Days'),
                      hours: 168,
                      desc: 'Weekly Window',
                    },
                    {
                      label: t('members:intakeLinks.preset30d', '30 Days'),
                      hours: 720,
                      desc: 'Extended Month',
                    },
                  ].map((preset) => {
                    const isSelected = expiresInHours === preset.hours;
                    return (
                      <button
                        key={preset.hours}
                        type="button"
                        onClick={() => setExpiresInHours(preset.hours)}
                        className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 relative ${
                          isSelected
                            ? 'bg-[#fff8f5] border-[#b85028] shadow-2xs ring-1 ring-[#b85028]/20'
                            : 'bg-white border-[#e8e1dd] hover:bg-[#faf2ee]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold ${
                              isSelected ? 'text-[#b85028]' : 'text-[#1e1b19]'
                            }`}
                          >
                            {preset.label}
                          </span>
                          <Clock
                            size={14}
                            weight={isSelected ? 'fill' : 'regular'}
                            className={
                              isSelected ? 'text-[#b85028]' : 'text-[#8a726a]'
                            }
                          />
                        </div>
                        <span className="text-[10px] text-[#8a726a]">
                          {preset.desc}
                        </span>
                        {preset.recommended && (
                          <span className="absolute -top-2 -right-1 px-1.5 py-0.2 rounded-xs text-[9px] font-bold bg-[#b85028] text-white shadow-2xs">
                            Rec
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Welcome Greeting Message */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="intake-link-custom-message"
                  className="text-xs font-bold text-[#57423b] flex items-center justify-between"
                >
                  <span>
                    {t(
                      'members:intakeLinks.customMessageLabel',
                      'Custom Greeting on Intake Page (Optional)',
                    )}
                  </span>
                  <span className="text-[10px] text-[#8a726a] font-normal">
                    Displayed at the top of the mobile registration form
                  </span>
                </label>
                <textarea
                  id="intake-link-custom-message"
                  rows={2}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder={t(
                    'members:intakeLinks.customMessagePlaceholder',
                    'e.g. Bienvenue à la jeunesse LRC ! Merci de renseigner votre profil pour nous permettre de faire votre suivi.',
                  )}
                  className="p-3 rounded-lg bg-[#faf2ee] focus:bg-white border border-[#e8e1dd] focus:border-[#b85028] focus:ring-2 focus:ring-[#b85028]/20 text-xs text-[#1e1b19] outline-none transition-all resize-none"
                />
              </div>

              {/* Creative Recipient Preview Card */}
              <div className="p-3.5 rounded-xl bg-[#faf2ee] border border-[#e8e1dd] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider flex items-center gap-1.5">
                    <DeviceMobile size={14} className="text-[#b85028]" />
                    Recipient Live View Mockup
                  </span>
                  <span className="text-[10px] text-[#8a726a]">
                    Self-entry web portal
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-white border border-[#e8e1dd] flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#b85028] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      JR
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#1e1b19] truncate">
                        {title || `Intake - ${activeTownName}`}
                      </div>
                      <div className="text-[11px] text-[#8a726a] truncate">
                        {customMessage ||
                          `Bienvenue à la communauté LRC (${activeTownName})`}
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-xs text-[10px] font-bold bg-[#edf3ee] text-[#2c4e37] border border-[#c2e9ca] shrink-0">
                    Open Intake
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#f4ece9]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-md border border-[#e8e1dd] text-xs font-bold text-[#8a726a] hover:text-[#57423b] hover:bg-[#faf2ee] transition-all cursor-pointer"
                >
                  {t('common:cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createLinkMutation.isPending}
                  className="px-5 py-2 rounded-md bg-[#b85028] hover:bg-[#a44520] text-white text-xs font-bold shadow-xs active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <Plus size={16} weight="bold" />
                  <span>
                    {createLinkMutation.isPending
                      ? t(
                          'members:intakeLinks.generating',
                          'Generating Link...',
                        )
                      : t(
                          'members:intakeLinks.generateButton',
                          'Generate Invitation Link',
                        )}
                  </span>
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-4">
              {/* If newly created link */}
              {createdSuccessLink && (
                <div className="p-4 rounded-xl bg-[#c2e9ca]/40 border border-[#a9d0b2] flex flex-col gap-2.5">
                  <div className="flex items-center gap-2 text-[#2c4e37] font-bold text-xs">
                    <Check size={18} weight="bold" />
                    <span>
                      {t(
                        'members:intakeLinks.linkCreatedTitle',
                        'Invitation Link Generated Successfully!',
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-[#a9d0b2]">
                    <input
                      type="text"
                      readOnly
                      value={getPublicLinkUrl(createdSuccessLink.token)}
                      className="flex-1 text-xs text-[#1e1b19] outline-none select-all bg-transparent font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyLink(createdSuccessLink.token)}
                      className="px-3 py-1.5 rounded-md bg-[#b85028] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-[#a44520] transition-colors"
                    >
                      {copiedToken === createdSuccessLink.token ? (
                        <>
                          <Check size={14} weight="bold" />
                          <span>
                            {t('members:intakeLinks.copied', 'Copied')}
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} weight="bold" />
                          <span>
                            {t('members:intakeLinks.copyLink', 'Copy')}
                          </span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareWhatsApp(createdSuccessLink)}
                      className="px-3 py-1.5 rounded-md bg-[#25D366] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-[#20ba5a] transition-colors"
                    >
                      <WhatsappLogo size={15} weight="fill" />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenExternalLink(
                          getPublicLinkUrl(createdSuccessLink.token),
                        )
                      }
                      className="px-2.5 py-1.5 rounded-md bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd] text-[#8a726a] hover:text-[#1e1b19] text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title={t(
                        'members:intakeLinks.previewTitle',
                        'Preview Intake Form in Browser',
                      )}
                    >
                      <ArrowSquareOut size={15} />
                      <span>{t('members:intakeLinks.preview', 'Preview')}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Links Table / List */}
              {isLinksLoading ? (
                <div className="py-12 flex items-center justify-center text-xs text-[#8a726a]">
                  Loading links...
                </div>
              ) : links.length === 0 ? (
                <EmptyState
                  imageSrc={emptyLinksSvg}
                  title="No Intake Links Yet"
                  description="Generate a shareable intake link to invite prospective youth to submit their registration profiles."
                  primaryAction={{
                    label: 'Create First Link',
                    onClick: () => setActiveTab('create'),
                  }}
                  className="py-12"
                />
              ) : (
                <div className="flex flex-col gap-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {links.map((link) => {
                    const isExpired =
                      !link.isActive || new Date(link.expiresAt) < new Date();
                    const isCopied = copiedToken === link.token;
                    return (
                      <div
                        key={link.id}
                        className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                          isExpired
                            ? 'bg-[#faf2ee]/50 border-[#e8e1dd] opacity-75'
                            : 'bg-white border-[#e8e1dd] hover:border-[#b85028]/40 shadow-2xs'
                        }`}
                      >
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-[#1e1b19] truncate">
                              {link.title}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-xs text-[10px] font-bold ${
                                isExpired
                                  ? 'bg-[#ffdad6] text-[#ba1a1a] border border-[#ffb4a8]'
                                  : 'bg-[#c2e9ca] text-[#2c4e37] border border-[#a9d0b2]'
                              }`}
                            >
                              {isExpired ? 'Expired' : 'Active'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-[#8a726a] flex-wrap">
                            <span>
                              Expires:{' '}
                              {new Date(link.expiresAt).toLocaleDateString()}
                            </span>
                            <span>•</span>
                            <span>{link.usageCount ?? 0} submissions</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                          {!isExpired && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleCopyLink(link.token)}
                                className="px-2.5 py-1.5 rounded-md bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd] text-xs font-bold text-[#57423b] flex items-center gap-1 cursor-pointer transition-colors"
                                title="Copy link"
                              >
                                {isCopied ? (
                                  <Check size={13} className="text-[#2c4e37]" />
                                ) : (
                                  <Copy size={13} />
                                )}
                                <span>{isCopied ? 'Copied' : 'Copy'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleShareWhatsApp(link)}
                                className="px-2.5 py-1.5 rounded-md bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#128C7E] text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                title="Share via WhatsApp"
                              >
                                <WhatsappLogo size={14} weight="fill" />
                                <span>Share</span>
                              </button>
                            </>
                          )}
                          {!isExpired && (
                            <button
                              type="button"
                              onClick={() => handleDeactivate(link.id)}
                              className="p-1.5 rounded-md hover:bg-[#ffdad6] text-[#8a726a] hover:text-[#ba1a1a] cursor-pointer transition-colors"
                              title="Deactivate link"
                            >
                              <Trash size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import {
  ErrorService,
  toast,
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
  Hash,
  Link,
  Plus,
  ShareNetwork,
  ShieldCheck,
  Trash,
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
  const [copiedItem, setCopiedItem] = useState<{
    id: string;
    type: 'link' | 'code';
  } | null>(null);

  // Form State
  const [expiresInHours, setExpiresInHours] = useState<number>(72); // 3 days default
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

  const handleCopyLink = async (token: string, id: string = token) => {
    const url = getPublicLinkUrl(token);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopiedItem({ id, type: 'link' });
    setTimeout(() => setCopiedItem(null), 2500);
  };

  const handleCopyCode = async (token: string, id: string = token) => {
    try {
      await navigator.clipboard.writeText(token);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = token;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopiedItem({ id, type: 'code' });
    setTimeout(() => setCopiedItem(null), 2500);
  };

  const handleShareWhatsApp = async (link: IRegistrationLink) => {
    const url = getPublicLinkUrl(link.token);
    const message = `Bonjour ! Voici le lien officiel pour soumettre votre inscription auprès de la communauté LRC (${activeTownName}) :\n\n${url}\n\nCode d'invitation: ${link.token}\n\nCe lien est valide pour une durée limitée. Merci de renseigner vos coordonnées.`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    await handleOpenExternalLink(whatsappUrl);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await createLinkMutation.mutateAsync({
        homeTownId: activeTownId,
        expiresInHours,
      });

      setCreatedSuccessLink(res);
      toast.success(
        t(
          'members:intakeLinks.generateSuccess',
          'Registration link generated successfully.',
        ),
      );
      setActiveTab('list');
    } catch (err: any) {
      ErrorService.handle(err);
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
                  defaultValue: `Generate shareable, expiring invitation links so prospective youth can enter their own information into ${activeTownName}.`,
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

        {/* Centralized & Redesigned Tab Switcher */}
        <div className="px-6 py-2.5 flex items-center justify-center border-b border-[#f4ece9] bg-[#fdfbf9] shrink-0">
          <div className="inline-flex items-center p-1 bg-[#faf2ee] rounded-lg border border-[#e8e1dd]/80">
            <button
              type="button"
              onClick={() => {
                setActiveTab('create');
                setCreatedSuccessLink(null);
              }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-white text-[#b85028] shadow-xs'
                  : 'text-[#8a726a] hover:text-[#57423b]'
              }`}
            >
              <Plus size={14} weight="bold" />
              <span>
                {t('members:intakeLinks.tabGenerate', 'Create New Link')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-white text-[#b85028] shadow-xs'
                  : 'text-[#8a726a] hover:text-[#57423b]'
              }`}
            >
              <ShareNetwork size={14} weight="bold" />
              <span>
                {t('members:intakeLinks.tabActiveLinks', {
                  count: links.length,
                  defaultValue: `Active & Past Links (${links.length})`,
                })}
              </span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          {activeTab === 'create' ? (
            <form onSubmit={handleCreate} className="flex flex-col gap-5 py-1">
              {/* Compact Information Note */}
              <div className="px-3.5 py-2.5 rounded-lg bg-[#fff8f5] border border-[#ffdbcf] text-xs flex items-center gap-2.5 text-[#57423b]">
                <ShieldCheck
                  size={18}
                  weight="duotone"
                  className="text-[#b85028] shrink-0"
                />
                <span className="text-[11px] leading-relaxed">
                  {t(
                    'members:intakeLinks.policyDescCompact',
                    'Registrations submitted via this link will safely appear in your review queue for approval before gaining community directory status.',
                  )}
                </span>
              </div>

              {/* Expiration Hours Preset Cards */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#57423b]">
                    {t(
                      'members:intakeLinks.linkLifespanLabel',
                      'Link Lifespan & Expiration',
                    )}
                  </span>
                  <span className="text-[10px] text-[#8a726a]">
                    Automatically deactivates after expiration
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

              {/* Submit Button */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#f4ece9]">
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
                  <div className="flex flex-wrap items-center gap-2 p-2 bg-white rounded-lg border border-[#a9d0b2]">
                    <div className="flex items-center gap-2 flex-1 min-w-[180px] px-1 font-mono text-xs">
                      <span className="text-[#8a726a]">Code:</span>
                      <span className="font-bold text-[#1e1b19] select-all">
                        {createdSuccessLink.token}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyLink(createdSuccessLink.token, 'new-link')
                      }
                      className="px-3 py-1.5 rounded-md bg-[#b85028] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-[#a44520] transition-colors"
                    >
                      {copiedItem?.id === 'new-link' &&
                      copiedItem?.type === 'link' ? (
                        <>
                          <Check size={14} weight="bold" />
                          <span>
                            {t('members:intakeLinks.copiedLink', 'Copied Link')}
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} weight="bold" />
                          <span>
                            {t('members:intakeLinks.copyLink', 'Copy Link')}
                          </span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyCode(createdSuccessLink.token, 'new-code')
                      }
                      className="px-3 py-1.5 rounded-md bg-white border border-[#e8e1dd] text-[#57423b] text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-[#faf2ee] transition-colors"
                    >
                      {copiedItem?.id === 'new-code' &&
                      copiedItem?.type === 'code' ? (
                        <>
                          <Check
                            size={14}
                            weight="bold"
                            className="text-[#2c4e37]"
                          />
                          <span>
                            {t('members:intakeLinks.copiedCode', 'Copied Code')}
                          </span>
                        </>
                      ) : (
                        <>
                          <Hash size={14} weight="bold" />
                          <span>
                            {t('members:intakeLinks.copyCode', 'Copy Code')}
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
                            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-[#faf2ee] text-[#1e1b19] border border-[#e8e1dd] select-all">
                              {link.token}
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
                          <div className="flex items-center gap-2 text-[11px] text-[#8a726a] flex-wrap mt-0.5">
                            <span>
                              Expires:{' '}
                              {new Date(link.expiresAt).toLocaleDateString()}
                            </span>
                            <span>•</span>
                            <span>{link.usageCount ?? 0} submissions</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto flex-wrap">
                          {!isExpired && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyLink(link.token, link.id)
                                }
                                className="px-2.5 py-1.5 rounded-md bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd] text-xs font-bold text-[#57423b] flex items-center gap-1 cursor-pointer transition-colors"
                                title="Copy invitation link"
                              >
                                {copiedItem?.id === link.id &&
                                copiedItem?.type === 'link' ? (
                                  <Check size={13} className="text-[#2c4e37]" />
                                ) : (
                                  <Copy size={13} />
                                )}
                                <span>
                                  {copiedItem?.id === link.id &&
                                  copiedItem?.type === 'link'
                                    ? 'Copied Link'
                                    : 'Copy Link'}
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyCode(link.token, link.id)
                                }
                                className="px-2.5 py-1.5 rounded-md bg-white hover:bg-[#faf2ee] border border-[#e8e1dd] text-xs font-bold text-[#57423b] flex items-center gap-1 cursor-pointer transition-colors"
                                title="Copy invitation code"
                              >
                                {copiedItem?.id === link.id &&
                                copiedItem?.type === 'code' ? (
                                  <Check size={13} className="text-[#2c4e37]" />
                                ) : (
                                  <Hash size={13} />
                                )}
                                <span>
                                  {copiedItem?.id === link.id &&
                                  copiedItem?.type === 'code'
                                    ? 'Copied Code'
                                    : 'Copy Code'}
                                </span>
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

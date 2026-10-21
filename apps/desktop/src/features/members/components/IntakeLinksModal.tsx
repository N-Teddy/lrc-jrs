import {
  useCreateRegistrationLinkMutation,
  useDeactivateRegistrationLinkMutation,
  useRegistrationLinksQuery,
} from '@jrs/client-core';
import type { IRegistrationLink } from '@jrs/shared';
import {
  ArrowSquareOut,
  Check,
  Clock,
  Copy,
  Link,
  Plus,
  ShareNetwork,
  Trash,
  Warning,
  WhatsappLogo,
  X,
} from '@phosphor-icons/react';
import { openUrl } from '@tauri-apps/plugin-opener';
import type React from 'react';
import { useState } from 'react';

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
    // 1. Explicitly configured intake URL from environment
    const envUrl = (
      import.meta.env.VITE_INTAKE_URL as string | undefined
    )?.trim();
    if (envUrl) {
      return envUrl.replace(/\/+$/, '');
    }

    // 2. Local development fallback
    if (typeof window !== 'undefined' && window.location) {
      const { hostname } = window.location;
      // In dev or desktop webview localhost, point directly to the intake web server
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.includes('tauri.localhost')
      ) {
        return 'http://localhost:5174';
      }
    }

    // 3. Default fallback for local dev
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
      // fallback
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
    const message = `Bonjour ! Voici le lien officiel pour soumettre votre inscription auprès de la jeunesse LRC (${activeTownName}) :\n\n${url}\n\nCe lien est valide pour une durée limitée. Merci de renseigner vos coordonnées.`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    await handleOpenExternalLink(whatsappUrl);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Please enter a descriptive title for this intake link.');
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
          'Failed to generate registration link. Please try again.',
      );
    }
  };

  const handleDeactivate = async (linkId: string) => {
    if (
      !window.confirm(
        'Are you sure you want to deactivate this registration link immediately? Anyone attempting to use it will no longer be able to submit their information.',
      )
    ) {
      return;
    }

    try {
      await deactivateLinkMutation.mutateAsync(linkId);
    } catch (err: any) {
      alert(err?.message || 'Failed to deactivate link.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-[700px] my-auto bg-white rounded-xl border border-[#e8e1dd] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="p-6 pb-4 flex items-start justify-between border-b border-[#f4ece9] bg-gradient-to-r from-white via-white to-[#faf2ee]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-[#fff2ee] border border-[#ffdbcf] flex items-center justify-center text-[#b85028] shrink-0 shadow-2xs">
              <Link size={24} weight="duotone" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#1e1b19]">
                  Member Intake Links
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#faf2ee] text-[#b85028] border border-[#e8e1dd]">
                  {activeTownName} ({activeTownCode})
                </span>
              </div>
              <p className="text-xs text-[#8a726a]">
                Generate shareable, expiring invitation links so prospective
                youth can enter their own information
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

        {/* Tab Switcher */}
        <div className="px-6 pt-3 flex items-center gap-2 border-b border-[#f4ece9] bg-[#fdfbf9]">
          <button
            type="button"
            onClick={() => {
              setActiveTab('create');
              setCreatedSuccessLink(null);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 border-b-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'border-[#b85028] text-[#b85028]'
                : 'border-transparent text-[#8a726a] hover:text-[#57423b]'
            }`}
          >
            <Plus size={15} weight="bold" />
            <span>Create New Link</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-3.5 py-2 border-b-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'border-[#b85028] text-[#b85028]'
                : 'border-transparent text-[#8a726a] hover:text-[#57423b]'
            }`}
          >
            <ShareNetwork size={15} weight="bold" />
            <span>Active & Past Links ({links.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'create' ? (
            <form onSubmit={handleCreate} className="flex flex-col gap-5">
              {formError && (
                <div className="p-3.5 rounded-lg bg-[#ffdad6] border border-[#ffb4a8] text-[#ba1a1a] text-xs font-semibold flex items-center gap-2">
                  <Warning size={18} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Informational Policy Banner */}
              <div className="p-3.5 rounded-lg bg-[#f0f6ff] border border-[#d0e2ff] text-[#0043ce] text-xs flex items-start gap-2.5">
                <Clock size={18} className="shrink-0 mt-0.5" weight="fill" />
                <div className="space-y-0.5">
                  <p className="font-bold">Security & Review Policy</p>
                  <p className="text-[11px] text-[#0043ce]/90 leading-relaxed">
                    Members registered via public intake links{' '}
                    <strong>will not have application access</strong> by
                    default. Each submission will be placed in your town's
                    review queue for leadership verification before acceptance.
                  </p>
                </div>
              </div>

              {/* Title Input */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="intake-link-title"
                  className="text-xs font-bold text-[#57423b]"
                >
                  Link Title / Occasion{' '}
                  <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  id="intake-link-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sunday Service Intake, Youth Camp 2026, New Converts"
                  className="h-10 px-3.5 rounded-md bg-[#faf2ee] border border-[#e8e1dd] text-xs text-[#1e1b19] outline-none focus:bg-white focus:border-[#b85028] transition-all"
                  required
                />
              </div>

              {/* Expiration Hours Preset */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-[#57423b]">
                  Link Expiration <span className="text-[#ba1a1a]">*</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: '24 Hours', hours: 24 },
                    { label: '3 Days (72h)', hours: 72 },
                    { label: '7 Days', hours: 168 },
                    { label: '30 Days', hours: 720 },
                  ].map((preset) => (
                    <button
                      key={preset.hours}
                      type="button"
                      onClick={() => setExpiresInHours(preset.hours)}
                      className={`h-9 px-3 rounded-md text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        expiresInHours === preset.hours
                          ? 'bg-[#b85028] text-white border-[#b85028] shadow-xs'
                          : 'bg-[#faf2ee] text-[#57423b] border-[#e8e1dd] hover:bg-[#f4ece9]'
                      }`}
                    >
                      <Clock
                        size={14}
                        weight={
                          expiresInHours === preset.hours ? 'fill' : 'regular'
                        }
                      />
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Welcome Message (Optional) */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="intake-link-custom-message"
                  className="text-xs font-bold text-[#57423b] flex items-center justify-between"
                >
                  <span>Custom Greeting on Intake Page (Optional)</span>
                </label>
                <textarea
                  id="intake-link-custom-message"
                  rows={2}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="e.g. Bienvenue à la jeunesse LRC ! Merci de renseigner votre profil pour nous permettre de faire votre suivi."
                  className="p-3 rounded-md bg-[#faf2ee] border border-[#e8e1dd] text-xs text-[#1e1b19] outline-none focus:bg-white focus:border-[#b85028] transition-all resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#f4ece9]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-md border border-[#e8e1dd] text-xs font-bold text-[#8a726a] hover:text-[#57423b] hover:bg-[#faf2ee] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLinkMutation.isPending}
                  className="px-5 py-2 rounded-md bg-[#b85028] hover:bg-[#a44520] text-white text-xs font-bold shadow-xs active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <Plus size={16} weight="bold" />
                  <span>
                    {createLinkMutation.isPending
                      ? 'Generating Link...'
                      : 'Generate Invitation Link'}
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
                    <span>Invitation Link Generated Successfully!</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-[#a9d0b2]">
                    <input
                      type="text"
                      readOnly
                      value={getPublicLinkUrl(createdSuccessLink.token)}
                      className="flex-1 text-xs text-[#1e1b19] outline-none select-all bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyLink(createdSuccessLink.token)}
                      className="px-3 py-1.5 rounded bg-[#b85028] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-[#a44520] transition-colors"
                    >
                      {copiedToken === createdSuccessLink.token ? (
                        <>
                          <Check size={14} weight="bold" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} weight="bold" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareWhatsApp(createdSuccessLink)}
                      className="px-3 py-1.5 rounded bg-[#25D366] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-[#20ba5a] transition-colors"
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
                      className="px-2.5 py-1.5 rounded bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd] text-[#8a726a] hover:text-[#1e1b19] text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Preview Intake Form in Browser"
                    >
                      <ArrowSquareOut size={15} />
                      <span>Preview</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Links List */}
              {isLinksLoading ? (
                <div className="py-12 text-center text-xs text-[#8a726a] flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-[#b85028]/30 border-t-[#b85028] rounded-full animate-spin" />
                  <span>Loading links...</span>
                </div>
              ) : links.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#8a726a] flex flex-col items-center gap-2 border border-dashed border-[#e8e1dd] rounded-xl p-8">
                  <Link size={32} className="text-[#8a726a]/50" />
                  <p className="font-bold text-[#57423b]">
                    No invitation links yet
                  </p>
                  <p className="max-w-xs text-[#8a726a]">
                    Click "Create New Link" above to generate a shareable member
                    registration link.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {links.map((link) => {
                    const isExpired =
                      new Date() > new Date(link.expiresAt) || !link.isActive;
                    const url = getPublicLinkUrl(link.token);
                    const isCopied = copiedToken === link.token;

                    return (
                      <div
                        key={link.id}
                        className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isExpired
                            ? 'bg-[#fcfbf9] border-[#e8e1dd]/70 opacity-70'
                            : 'bg-white border-[#e8e1dd] shadow-2xs hover:border-[#b85028]/40'
                        }`}
                      >
                        {/* Left Info */}
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-[#1e1b19] truncate">
                              {link.title}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isExpired
                                  ? 'bg-[#f4ece9] text-[#8a726a]'
                                  : 'bg-[#c2e9ca] text-[#2c4e37]'
                              }`}
                            >
                              {isExpired ? 'Expired / Inactive' : 'Active'}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#faf2ee] text-[#57423b] border border-[#e8e1dd]">
                              {link.usageCount}{' '}
                              {link.usageCount === 1
                                ? 'submission'
                                : 'submissions'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-[#8a726a]">
                            <span className="flex items-center gap-1">
                              <Clock size={13} />
                              Expires:{' '}
                              {new Date(link.expiresAt).toLocaleDateString()}{' '}
                              {new Date(link.expiresAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span className="font-mono text-[#b85028] bg-[#fff2ee] px-1.5 py-0.5 rounded text-[10px]">
                              {link.token}
                            </span>
                          </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleCopyLink(link.token)}
                            className="h-8 px-2.5 rounded-md border border-[#e8e1dd] bg-[#faf2ee] hover:bg-[#f4ece9] text-[#57423b] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Copy public link"
                          >
                            {isCopied ? (
                              <>
                                <Check
                                  size={14}
                                  className="text-[#2c4e37]"
                                  weight="bold"
                                />
                                <span className="text-[#2c4e37]">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy size={14} />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleShareWhatsApp(link)}
                            disabled={isExpired}
                            className="h-8 px-2.5 rounded-md bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
                            title="Share on WhatsApp"
                          >
                            <WhatsappLogo size={15} weight="fill" />
                            <span>WhatsApp</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenExternalLink(url)}
                            className="h-8 w-8 rounded-md border border-[#e8e1dd] bg-[#faf2ee] hover:bg-[#f4ece9] text-[#8a726a] hover:text-[#1e1b19] flex items-center justify-center transition-colors cursor-pointer"
                            title="Preview Intake Form in Browser"
                          >
                            <ArrowSquareOut size={15} />
                          </button>

                          {!isExpired && (
                            <button
                              type="button"
                              onClick={() => handleDeactivate(link.id)}
                              className="h-8 w-8 rounded-md border border-[#ffb4a8]/50 bg-white hover:bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center transition-colors cursor-pointer"
                              title="Deactivate link immediately"
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
